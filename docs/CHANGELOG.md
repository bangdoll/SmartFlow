# 變更日誌 (Changelog)

本檔案記錄此專案自建立以來的所有重要變更。

---

## [2025-12-23]

### 新增 (Added)
- **週報頁面 `/weekly`**: 全新週報頁面，展示過去 7 天的 AI 新聞與決策風險分析，整合 `weekly_trends` 資料，支援中英雙語。
- **手機版漢堡選單**: 行動裝置導覽改為滑出式選單，包含趨勢、週報、歷史、收藏、教學等完整入口。

### 修復 (Fixed)
- **漢堡選單關閉按鈕**: 修復選單關閉按鈕 (X) 無法點擊的問題，增加 `z-index` 與 `pointer-events` 確保可點擊。
- **週報趨勢時區問題**: 修正每週一趨勢分析未執行的問題，改用 `Asia/Taipei` 時區判斷星期，而非 UTC。

---

## [2025-12-22]

### 優化/變更 (Changed)
- **語言切換效能**: 移除 `LanguageToggle` 元件中的 `useTransition`，語言切換現在**瞬間生效**，不再等待批次翻譯 API 完成，大幅提升操作流暢度。

### 修復 (Fixed)
- **Header 導覽修復**: 修復首頁「我的收藏」連結無法點擊的問題，將 `next/link` 替換為原生 `<a>` 標籤，避免 Next.js 客戶端路由失效的邊界情況。
- **書籤卡片整卡點擊**: 重構 `BookmarkCard` 元件，使用 `Link` 包裹整個卡片區域，確保點擊任何位置都能正確導航至新聞詳情頁，同時保持刪除按鈕的獨立功能。

---

## [2025-12-21]

### 優化/變更 (Changed)
- **書籤卡片體驗**: 重構 `BookmarkCard` 點擊機制，改用程式化導航取代 Stretched Link，解決部分區域無法點擊的死角，並防止誤觸標籤或移除按鈕。
- **行動端 Header**: 優化 Header 響應式佈局，解決 iPhone SE 等小尺寸裝置上語言切換與搜尋按鈕溢出畫面的問題。
- **會話保持 (Session Persistence)**: 強化 Supabase Auth 設定，啟用 `persistSession` 並優化 Middleware 排除規則，確保 iOS PWA 模式下登入狀態不遺失。

### 修復 (Fixed)
- **收藏頁面在地化**: 修復 `/bookmarks` 頁面標題 (My Bookmarks / 我的收藏) 與空狀態提示未隨語言切換更新的問題。
- **翻譯遺失**: 補齊部分歷史新聞 (如 "Former Splunk Exec") 缺失的繁體中文標題與摘要。

## [2025-12-20]

### 新增 (Added)
- **會員系統 (User Authentication)**: 整合 Supabase Auth，支援 Google 與 Facebook 一鍵登入/註冊。
- **跨裝置收藏同步 (Cloud Bookmarks)**: 用戶登入後，收藏的新聞會自動同步至雲端資料庫，實現跨裝置無縫閱讀。
- **行動版註冊入口**: 針對手機介面優化，新增專屬的圓形人像圖示按鈕，方便行動用戶快速登入。

### 優化/變更 (Changed)
- **註冊引導優化**: 將 Header 按鈕文字由「Log In」改為更具邀請性的「Sign Up (免費註冊)」。
- **資料庫關聯**: 完善 `user_bookmarks` 資料表結構，建立與 `news_items` 的完整關聯 (Foreign Key) 與 RLS 安全策略。

### 修復 (Fixed)
- **SEO 標題修復**: 解決網站標題顯示為 "Untitled" 的問題，補齊 OpenGraph 與 Metadata 設定。
- **資料庫型別錯誤**: 修正收藏功能因 UUID 型別不匹配導致的寫入錯誤。

---

## [2025-12-19]

### 新增 (Added)
- **Vercel Analytics 整合**: 導入全站分析功能，即時追蹤訪客流量、來源與行為。
- **英文版結構化摘要**: 英文新聞摘要現在採用與中文版一致的專業格式：
- **骨架屏體驗 (Skeleton Screens)**: 全面導入骨架屏加載效果，優化翻譯與資料讀取時的視覺體驗。
- **全站健康檢查 (Health Check)**: 新增資料庫完整性與前端視覺巡檢工具，確保系統穩定運行。
  - 🧠 Plain English (白話解讀)
  - ⚠️ Why You Should Care (對你的影響)
  - ✅ No Action Needed (不需行動)
  - 💡 Key Takeaway (關鍵影響)
  - 📊 Opportunities / Challenges 表格
  - 🗣️ Water Cooler Talk (社交話題)
  - 👔 For Decision Makers (給決策者)

### 優化/變更 (Changed)
- **摘要生成優化**: 改進 LLM 摘要生成流程：
  - 新增 `fetchArticleContent` 函數，自動抓取原文網頁內容
  - LLM 現在根據完整文章內容生成摘要，大幅提升摘要品質與準確性
- **「趨勢」頁面更新日期**: 將更新日期從「每週日」改為「每週一」
- **Archive 頁面快取優化**: 將快取時間從 1 小時縮短至 5 分鐘

### 修復 (Fixed)
- **中文版摘要顯示**: 修正 `summary_zh` 缺失時無法正確 fallback 到英文摘要的問題
- **摘要缺失修復**: 修復特定新聞因 LLM 偶發性錯誤導致的摘要缺失問題，並建立自動化批量修復機制。
- **INP 效能優化**: 解決語言切換按鈕 (Language Toggle) 的 Interaction to Next Paint (INP) 高延遲問題，使用 React Transition API 確保 UI 響應流暢。
- **歷史新聞翻譯**: 重新生成所有 300+ 則歷史新聞的繁體中文標題與摘要

---

## [2025-12-18]

### 新增 (Added)
- **效能優化**: 首頁改用 ISR (增量靜態再生)，大幅降低資料庫負載
- **流量增長引擎**: 強化標籤頁面 SEO，新增 Canonical URL 與 Breadcrumb 結構化資料

### 修復 (Fixed)
- **新手指南連結失效**: 修正首頁置頂「新手指南」卡片無法點擊的問題

---

## [2025-12-17]

### 新增 (Added)
- **E2E 自動化測試**: 導入 Playwright 測試框架，覆蓋核心導航與多語言切換場景
- **嚴格英文模式**: 整合自動批次翻譯與 Skeleton Loading，杜絕中文後備內容
- **焦點模式頭條**: 首頁在焦點模式下正確顯示雙語標題

### 優化/變更 (Changed)
- **導航優化**: 將標籤連結改為標準 `<a>` 標籤，解決狀態殘留問題

### 修復 (Fixed)
- **翻譯缺失**: 補齊焦點模式下缺少的英文翻譯字串
- **Hydration Mismatch**: 修正日期與動態內容在伺服器/客戶端渲染不一致的問題

---

## [2025-12-16]

### 新增 (Added)
- **嚴格全英文模式**: 實作零中文 Fallback 的英文介面
- **批次背景翻譯**: Cron Job 抓取新聞時立即進行背景翻譯

### 優化/變更 (Changed)
- **全站介面翻譯**: Header、Footer、教學頁面、訂閱介面完全中英文化

---

## [2025-12-14]

### 新增 (Added)
- **短網址系統**: 實作 8 碼短連結 (如 `/news/AbCdEf12`)
- **SEO 結構化資料**: 新增 JSON-LD 支援 (WebSite, NewsArticle)

### 優化/變更 (Changed)
- **分享文字簡化**: X (Twitter) 分享文字更簡潔

---

## [2025-12-12]

### 新增 (Added)
- **PWA 支援**: 可加入手機主畫面，擁有原生 App icon
- **下拉更新**: 手機下拉即可觸發爬蟲並獲取最新新聞
- **無限捲動**: 滑動至底部自動載入歷史新聞
- **即時爬蟲觸發**: Pull-to-Refresh 時觸發 On-Demand Scraper

### 優化/變更 (Changed)
- **Archive 頁面**: 只顯示 24 小時前的歷史新聞
- **品牌更新**: Logo 更新為 Flow 波浪風格

---

## [2025-12-11]

### 新增 (Added)
- **雙語切換**: 新增英文/繁體中文語言切換功能
- **Markdown 表格渲染**: 支援 AI 摘要中的表格美化顯示
- **ChatBox Markdown**: AI 對話支援 Markdown 格式渲染

### 優化/變更 (Changed)
- **行動版優化**: Header、搜尋、切換按鈕針對手機優化佈局
- **時區統一**: 全站使用 Asia/Taipei 時區

### 修復 (Fixed)
- **Chat 按鈕點擊**: 修正建議按鈕無法點擊的問題

---

## [2025-12-10]

### 新增 (Added)
- **AI 導讀助手 (Chat)**: 每則新聞內建互動式 AI 聊天機器人
- **搜尋功能**: 全站關鍵字搜尋（標題與摘要）
- **趨勢儀表板**: `/trends` 頁面視覺化呈現 AI 關鍵字流行趨勢
- **新聞詳細頁**: 實作獨立新聞頁面與動態 OG 圖片
- **RSS Feed**: 提供標準 `/feed.xml` 訂閱源
- **社群自動發布**: 支援自動發布至 X (Twitter)
- **熱門新聞區塊**: 首頁新增 HotNewsSection 組件

### 優化/變更 (Changed)
- **爬蟲優化**: 
  - 新增 Hacker News、Reddit r/artificial、Ars Technica 來源
  - 新增 Google News RSS 爬蟲
  - 改用 RSS Feed 提升抓取穩定性
  - 平行請求優化，防止 Timeout
- **LLM Prompt 優化**: 新增利弊分析表格與關鍵影響摘要
- **分頁 API**: 實作新聞分頁與「載入更多」功能

### 修復 (Fixed)
- **SEO 完善**: 新增 sitemap、robots.txt、metadata

---

## [2025-12-09]

### 新增 (Added)
- **新聞標題翻譯**: 自動將英文標題翻譯為繁體中文
- **電子報簽名**: 加入 Coach 簽名與網站連結
- **Footer 致謝**: 加入開發者致謝資訊

### 優化/變更 (Changed)
- **UI 風格**: 實作 Glassmorphism 玻璃擬態設計
- **品牌更新**: 更新 Logo 設計（多次迭代至黑白風格）

---

## [2025-12-08]

### 新增 (Added)
- **深色模式**: 支援系統/淺色/深色三種主題切換
- **Cron Jobs 遷移**: 將排程任務遷移至 GitHub Actions

### 修復 (Fixed)
- **Tailwind 深色模式**: 修正 Tailwind v4 與 next-themes 的 class-based 設定

---

## [2025-12-07]

### 新增 (Added)
- **專案初始設定**: 完成基礎架構與電子報功能
- **品牌重塑**: 專案更名為 Smart Flow (智流)

---

## [2025-11-28]

### 新增 (Added)
- **專案建立**: 使用 Create Next App 初始化專案
