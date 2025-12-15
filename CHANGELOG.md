# Changelog

## [2025-12-15] - 每週趨勢與 UX 優化

### 新增 (Added)
- **每週趨勢自動化 (Weekly Trends Automation)**: 實作透過 `/api/cron/weekly-trends` 自動生成每週報告的功能。
- **趨勢資料庫 (Trends Database)**: 新增 `weekly_trends` 資料表架構，用於儲存歷史洞察數據。
- **手機版導航 (Mobile Navigation)**: 將「趨勢 (Trends)」頁面連結加入手機版選單。
- **長輩友善聊天介面 (Senior Friendly Chat)**: 極大化「清除對話 (Trash)」按鈕，提升手機版大齡使用者的易用性。

### 變更 (Changed)
- **聊天介面大改版 (Chat UI Overhaul)**:
  - 移除 AI 回應中的數字列表，以防止版面跑位。
  - 強制段落行內顯示 (`display: contents`)，修復列表標記對齊問題。
  - 極大化聊天操作按鈕的點擊範圍。
- **內容清理 (Content Cleanup)**: 透過前端過濾器移除了舊摘要中殘留的佔位符文字 (`[Paragraph 1...]`)。

### 修復 (Fixed)
- **Markdown 渲染 (Markdown Rendering)**: 修復了生成列表中過多的空白導致數字與文字錯位的視覺問題。

## [2025-12-15] 閱讀體驗持續優化
- **新聞導覽 (Navigation)**: 在新聞詳細頁底部新增「上一則/下一則」導覽按鈕，並將「閱讀原文」按鈕置中放大，提供更流暢的閱讀動線。

## [2025-12-14] AI 語音導讀、SEO 與體驗優化
- **AI 語音導讀 (TTS)**: 新增新聞語音朗讀功能，整合 OpenAI `tts-1` 模型與 Supabase Storage 做音訊快取，讓使用者能一鍵聆聽新聞摘要。
- **長輩/新手友善優化 (Elderly & Newbie Friendly)**: 
  - **白話歡迎區塊 (Welcome Section)**: 首頁新增「1-2-3 步驟」圖解教學，消除新手焦慮。
  - **置頂新手教學 (Pinned User Guide)**: 新增置頂卡片與專屬教學頁面 (`/guide`)，提供圖文並茂的完整使用指南。
  - **訂閱文案優化**: 將「訂閱」重寫為「每日摘要投遞」，降低使用者心理負擔。
- **Google Analytics 4 (GA4)**: 完成網站流量分析整合，支援即時訪客追蹤與事件紀錄。
- **介面體驗優化**:
  - **視窗增高**: AI 對話視窗高度增加 20%，提供更寬廣的閱讀視野。
  - **排版優化**: 修正 Markdown 段落間距與列表樣式，提升閱讀體驗。
  - **字體加大**: 調整預設字體大小，提升閱讀舒適度。
  - **清除對話**: 新增「清除對話 (Clear Chat)」按鈕，方便重置 AI 問答紀錄。
- **行動版體驗 (Mobile UX)**: 驗證並優化「下拉更新 (Pull-to-Refresh)」手勢，確保手機端能即時觸發爬蟲更新。
- **開發工具 (Dev Tools)**: 
  - 新增 `dev-keep-alive` 腳本，確保開發伺服器穩定運行。
  - 新增系統健康檢查腳本，一鍵驗證環境變數與資料庫連線。
- **Short URLs (短網址)**: 將原先冗長的 UUID 網址 (如 `/news/d3cf...`) 縮短為 8 碼隨機代碼，提升分享便利性。
- **X (Twitter) 分享優化**: 簡化分享的一鍵貼文內容，讓推文更乾淨。
- **文件整理**: 更新 README 與 CHANGELOG，確保文件與程式碼同步。

## [2025-12-12] 行動版體驗 (Mobile UX) 與品牌視覺升級
- **手機版下拉更新 (Pull-to-Refresh)**: 實作原生 Touch 事件監聽，在手機上下拉頁面即可觸發「即時爬蟲」，分析並獲取最新新聞。
- **無限捲動 (Infinite Scroll)**: 實作自動載入機制，滑動至頁面底部時自動載入更多歷史新聞，取代舊版「載入更多」按鈕。
- **PWA 支援 (Progressive Web App)**: 新增 Web Manifest 與應用程式圖示，支援將網站「加入主畫面」，提供原生 App 般的體驗。
- **視覺一致性更新**: 統一網站 Logo、Favicon 與 PWA Icon 為「波浪 (Flow Wave)」設計風格。
- **排程修復**: 修正每日電子報排程，確保於台灣時間早上 8 點 (UTC 0:00) 準時發送。
- **封存頁面 (Archive)**: 定義封存邏輯，封存頁面僅顯示 24 小時以前的新聞。

## [2025-12-11] 國際化與介面細節修正
- **多語言支援 (i18n)**: 全面導入 `useLanguage`，支援繁體中文與英文介面切換 (Footer, ChatBox, NewsFeed)。
- **ChatBox 優化**: 
  - 改善 AI 回應文字排版 (行高、間距)。
  - 支援 Markdown 渲染 (粗體、列表)。
  - 修正行動版對話框寬度與按鈕觸控問題。
  - 將串流邏輯改為原生 fetch 以提升穩定性。
- **搜尋介面優化**: 調整手機版搜尋框尺寸與 Logo 排版，解決畫面擁擠與跑版問題。
- **時區統一**: 全站時間格式統一使用 `Asia/Taipei` (台北時間)。
- **頁面優化**: 移除個別頁面重複的 Footer，統一由 Layout 管理。

## [2025-12-10] V2.0 重大更新：功能與架構完善
- **全站搜尋 (Global Search)**: 實作搜尋頁面與 API，支援標題與摘要關鍵字檢索。
- **趨勢儀表板 (Trends Dashboard)**: 新增 `/trends` 頁面，視覺化呈現每週熱門 AI 關鍵字。
- **AI 導讀頁面 (News Detail w/ Chat)**: 
  - 實作單篇新聞獨立頁面 (`/news/[id]`)。
  - 整合 ChatBox，讓使用者能針對特定新聞進行 AI 提問。
  -動態生成 Open Graph 圖片，提升社群分享吸睛度。
- **RSS Feed**: 實作 `/feed.xml` 生成器，提供標準 RSS 訂閱源。
- **SEO 增強**: 建立 `sitemap.xml` 與 `robots.txt`，並完善全站 Metadata。
- **爬蟲升級**:
  - 新增多個來源 (Google News, Hacker News, Reddit, Ars Technica)。
  - 改用 RSS 作為主要爬取來源以提升穩定性。
  - 優化爬蟲策略，支援多重選擇器與去重。
- **效能優化**: 首頁強制啟用動態渲染 (Dynamic Rendering) 以避免快取過期內容。

## [2025-12-09] 品牌重塑 (Rebranding)
- **視覺改版**: 從 "Sparkles" 風格轉型為 "Smart Flow" 玻璃擬態 (Glassmorphism) 設計。
- **UI 翻新**: 更新 Header 與 Logo 設計，採用更現代的黑白風格。
- **電子報署名**: 在電子報與 Footer 新增開發者署名與連結。

## [2025-12-08] 基礎建設與深色模式
- **深色模式 (Dark Mode)**: 完整支援系統、明亮、深色三種主題切換。
- **自動化遷移**: 將排程任務從 Vercel Cron 遷移至 GitHub Actions，提升控制彈性。

## [2025-12-07] 專案啟動
- 專案初始化 (Next.js 14 + Supabase)。
- 建立基礎資料庫 Schema (新聞、訂閱者)。
- 整合 OpenAI 生成摘要與 Resend 電子報發送功能。
