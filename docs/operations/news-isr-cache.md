# 新聞頁 ISR 與舊連結相容性

本變更以 `563d0b3d1c6830638998f41171d810ee23ed332b` 為基底，供 PR 審查；未合併、未部署。Node.js 24、鎖定 Next.js 16.0.7。

## 回應與新鮮度

- `/news/<8 碼 ID>`：`generateStaticParams() => []`、`revalidate = 600`，首次按需產生公開 HTML／RSC。metadata 與正文共用同次 React cache；取消原先持續 3600 秒的正文與相鄰新聞資料快取，避免 ISR 重建仍讀到舊資料。僅讀取既有公開欄位。
- 移除 `/news/:id` 外加的一天 CDN TTL／七天 SWR，交由 Next.js ISR 管理；一般安全標頭及其他頁面策略維持原設定。
- UUID／slug 舊網址經既有 proxy 改寫到唯讀動態 `/api/internal/news-alias/[id]`，回傳單一 `Location` 的 HTTP 308，導向短網址；UUID 完全不查 DB，slug 僅查 ID，解析資料快取 600 秒。轉址回應本身為 `private, no-store`，不把別名快取成正文。
- 必須分開解析與正文：本機正式模式測試發現，在同一個 ISR page 內 `permanentRedirect()` 會使 Next.js 16.0.7 回傳重複 `Location`；在該分支呼叫 `connection()` 則導致 static-to-dynamic 500。現行替代設計保留真正的 HTTP 308，沒有改為瀏覽器跳轉。
- 內部解析端點可直接存取，處理同樣的公開別名資料，無寫入、無外站轉址。它及每次舊連結轉址仍可能計入函式呼叫；ISR 主要避免暖正文重新渲染，不能推論所有請求都不計費。
- proxy 保留登入檢查與 token cookie 更新，刷新 cookie 時同時保留 rewrite；匿名請求維持原先不查驗 session 的行為。共享正文不包含登入資料，收藏、語言與登入狀態仍由既有前端元件處理。

600 秒是重新驗證間隔，不是資料最多陳舊 600 秒的保證：時間到期後首次請求可取得舊頁，再背景重建；DB 故障時保留最後成功的暖頁。明確失效後若沒有成功重建，該頁屬冷頁，DB 故障可回 500，不會憑空產生舊頁。不存在的資料回 404；資料庫錯誤必須 throw，不能快取為 404。

## 寫入後失效

統一使用 `src/lib/news-cache.ts`，僅在 DB 回報寫入成功之後執行。

| 寫入入口 | 處理 |
|---|---|
| daily / scrape-workflow、cron/scrape、cron/manual-trigger 新增 | 失效該篇及 slug 解析負快取，另以兩個各最多 3 秒的限量查詢更新緊鄰前後新聞導覽。查詢失敗只記錄錯誤並退回 ISR，不把已提交的新增誤判成需重試的失敗 |
| summarize、auto-fix 中英文、translate、批次翻譯 | 失效該篇 canonical，下一次讀取重建正文、metadata、公開 RSC |
| TTS 成功寫入英文文字／音訊網址 | 每個已成功寫入都失效；後續音訊失敗不漏掉先前文字更新；DB 寫入失敗不清快取 |
| 既有 admin-only reset 真正刪除全部成功 | 全部新聞頁與所有 slug 解析資料失效；驗證沒有呼叫此破壞性端點 |
| click_count RPC | 詳情頁沒有讀取此欄位，不因每次點擊清空正文 |

文字更新可能影響鄰篇的導覽標題；此處鄰篇導覽接受原有頁面的 ISR 退路，未對每次文字寫入增加查詢或全站失效。沒有新增單篇刪除 API。未部署後台、Supabase trigger、排程或外部通知。

一次性 CLI 腳本／外部 DB 寫入仍須在成功後呼叫新的維護端點，否則使用時間到期重新驗證退路。端點不修改 DB：

```http
POST /api/cron/revalidate-news
Authorization: Bearer <ADMIN_SECRET 或 CRON_SECRET>
Content-Type: application/json

{"items":[{"id":"12345678-1234-4234-9234-123456789abc","slug":"old-story"}]}
```

僅接受 1–50 個確切 UUID 與可選的最長 200 字元 slug；拒絕額外欄位、路徑／萬用失效、無憑證請求。端點使用既有維護憑證，無新增公開 purge 權限。slug 改名時以同一 UUID 提交舊、新 slug 各一筆；刪除單篇時帶刪除前 slug，鄰篇導覽接受 ISR 退路或由受信任維護者一併提交受影響 ID。

`revalidatePath` 對 Route Handler 標記下次造訪失效；不會立即預先生成所有頁面，也不更新已經開啟的瀏覽器畫面。alias 使用雜湊 tag，避免使用者輸入超過框架 tag 長度限制；`revalidateTag(..., { expire: 0 })` 清除對應 slug 的解析結果，包含負快取。

## 翻譯重試保護

同一篇文章在同一次元件掛載內最多自動嘗試一次缺欄位翻譯。503、429、連線失敗、空結果及語言切換不重啟無限請求；重新造訪可再嘗試。其他訪客可在 ISR 失效後取得已寫入 DB 的譯文。切換文章使用 article ID 作為元件 key，新 server props 優先於舊 local state。此保護不等同跨訪客去重或平台限流。

## 已完成驗證

執行 `npm run lint`、`npm run test:unit`、`npm run test:cache`，亦由現有必要合併檢查 **Public cache regression** 執行同一組命令。

- lint 通過；71 項單元測試通過。套件的 baseline-browser-mapping 資料日期提示不影響檢查，未因此升級依賴。
- 真正 `next build --webpack`／`next start`、隔離 HTTP fixture，新聞和標籤頁均 MISS → HIT → HIT；各 10 次並行 bot 與 RSC 預取維持 HIT，獨立 render counter 證明暖新聞未再執行 page，也沒有 DB 讀取。
- UUID 無 DB 的單一 308、重複 slug 解析只讀一次、中文 slug、缺資料 404、新增後短 ID 與 slug 負快取恢復、slug 改名後舊解析失效，全部通過。
- 真正呼叫帶測試憑證的維護端點，驗證標題、metadata、英文摘要、音訊網址更新；未授權為 401，非法批次為 400。單元測試另驗證成功／失敗寫入與失效關聯、插入時僅查緊鄰項目、登入 cookie 刷新不丟失 rewrite。
- 時間到期背景重建失敗仍保留暖頁；DB 恢復後可重建。冷新聞／標籤頁 DB 失敗為 500，恢復後為 200。
- 快速到期測試只將隔離副本的 600 秒縮短為 5 秒；生產來源仍為 600 秒。副本只複製明確的來源清單，不讀 `.env`，環境變數僅允許 PATH 與 fixture 測試金鑰；測試不連正式 DB、不執行付費 API。

## 審查與後續正式驗證

`vercel.json` 僅對審查分支 `codex/news-isr-cache` 設定 `git.deploymentEnabled: false`，避免推送／開 PR 觸發 Preview；其他分支及 Cron 保留。參考 [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration)。本 PR 不合併、不部署，不變更 Firewall、限流、封鎖或停站設定。

尚需另行授權部署後，才能驗證 Vercel 平台的 X-Vercel-Cache／Age、實際多區與 HTML／RSC 變體、真實登入瀏覽器導覽／刷新及 cookies、已存在 CDN 回應是否更新，以及相同長度、路由、環境的 Function Invocations 變化。本機 HIT 不是正式站命中率；低重用、各網址只看一次的爬蟲仍會產生冷頁呼叫，不能預先宣稱用量下降比例。
