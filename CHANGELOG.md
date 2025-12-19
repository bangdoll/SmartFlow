# 變更日誌 (Changelog)

本檔案記錄此專案的所有重要變更。

## [2025-12-19]

### 新增 (Added)
- **英文版結構化摘要**: 英文新聞摘要現在採用與中文版一致的專業格式：
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
- **Archive 頁面快取優化**: 將快取時間從 1 小時縮短至 5 分鐘，確保新聞更新更即時

### 修復 (Fixed)
- **中文版摘要顯示**: 修正中文版新聞頁面在 `summary_zh` 缺失時無法正確 fallback 到英文摘要的問題
- **歷史新聞翻譯**: 重新生成所有 300+ 則歷史新聞的繁體中文標題與摘要，確保全站內容一致性
- **臨時修復端點**: 新增 `/api/cron/regenerate` 用於批次重新生成舊新聞摘要（可於確認完成後刪除）

---

## [2025-12-18]

### 新增 (Added)
- **效能優化 (Performance Optimization)**:
  - 首頁改用 ISR (增量靜態再生)，每 5 分鐘重新驗證一次，大幅降低資料庫負載並加速頁面載入。
  - 優化資料庫查詢，改為僅選取必要欄位取代 `SELECT *`。
- **流量增長引擎 (Programmatic SEO)**:
  - 強化 `/tags/[tag]` 標籤頁面的 SEO：新增 Canonical URL 與 Breadcrumb 結構化資料 (JSON-LD)。
  - Sitemap 自動涵蓋所有標籤頁面。

### 修復 (Fixed)
- **新手指南連結失效**: 修正首頁置頂「新手指南」卡片無法點擊的問題。
  - 原因：背景網格覆蓋層缺少 `pointer-events-none`。
  - 解法：將 `PinnedGuideCard` 的 `next/link` 改為標準 `<a>` 標籤 (Hard Navigation)。

---

## [2025-12-17]

### 新增 (Added)
- **E2E 自動化測試 (End-to-End Testing)**:
  - 導入 Playwright 測試框架。
  - 新增 `e2e/navigation.spec.ts`：覆蓋首頁、新聞詳細頁、標籤頁與靜態頁面的關鍵路徑導航測試。
  - 新增 `e2e/localization.spec.ts`：驗證語言切換功能、URL 狀態持久化以及介面即時翻譯。
- **嚴格英文模式 (Strict English Mode)**:
  - 在 `NewsFeed` 中整合自動批次翻譯 (`useBatchTranslation`)。
  - 新增載入狀態 (Skeleton Loading)：在英文翻譯尚未準備好時顯示加載動畫，杜絕中文後備內容 (Fallback) 出現在英文介面中。
- **焦點模式頭條 (Focus Mode Header)**:
  - 首頁在焦點模式下現在會根據語言正確顯示「Top 5 AI News Today」或「今天最重要的 5 則」。

### 優化/變更 (Changed)
- **導航優化 (Navigation)**:
  - 將所有標籤 (Tag) 連結從 `next/link` 改為標準 `<a>` 標籤 (Hard Navigation)，解決了切換標籤時狀態殘留的問題，並提升 SEO 與測試穩定性。
- **UI/UX**:
  - 優化新聞卡片中的「閱讀完整分析」按鈕：統一了中英文按鈕樣式與行為。
  - 修正了 E2E 測試中的 Accessibility Locator 問題，提升測試腳本的穩定性。

### 修復 (Fixed)
- **翻譯缺失**: 補齊了焦點模式 (Focus Mode) 下缺少的英文翻譯字串。
- **Hydration Mismatch**: 修正了部分日期與動態內容在伺服器/客戶端渲染不一致的問題。
