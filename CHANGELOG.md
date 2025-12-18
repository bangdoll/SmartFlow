# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-12-17

### Added (新增)
- **E2E 自動化測試 (End-to-End Testing)**:
  - 導入 Playwright 測試框架。
  - 新增 `e2e/navigation.spec.ts`：覆蓋首頁、新聞詳細頁、標籤頁與靜態頁面的關鍵路徑導航測試。
  - 新增 `e2e/localization.spec.ts`：驗證語言切換功能、URL 狀態持久化以及介面即時翻譯。
- **嚴格英文模式 (Strict English Mode)**:
  - 在 `NewsFeed` 中整合自動批次翻譯 (`useBatchTranslation`)。
  - 新增載入狀態 (Skeleton Loading)：在英文翻譯尚未準備好時顯示加載動畫，杜絕中文後備內容 (Fallback) 出現在英文介面中。
- **焦點模式頭條 (Focus Mode Header)**:
  - 首頁在焦點模式下現在會根據語言正確顯示「Top 5 AI News Today」或「今天最重要的 5 則」。

### Changed (優化/變更)
- **導航優化 (Navigation)**:
  - 將所有標籤 (Tag) 連結從 `next/link` 改為標準 `<a>` 標籤 (Hard Navigation)，解決了切換標籤時狀態殘留的問題，並提升 SEO 與測試穩定性。
- **UI/UX**:
  - 優化新聞卡片中的「閱讀完整分析」按鈕：統一了中英文按鈕樣式與行為。
  - 修正了 E2E 測試中的 Accessibility Locator 問題，提升測試腳本的穩定性。

### Fixed (修復)
- **翻譯缺失**: 補齊了焦點模式 (Focus Mode) 下缺少的英文翻譯字串。
- **Hydration Mismatch**: 修正了部分日期與動態內容在伺服器/客戶端渲染不一致的問題。
