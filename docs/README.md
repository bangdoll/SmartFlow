# Global AI Trends Automation Website <!-- Trigger Vercel Deploy --> (全球 AI 趨勢自動化網站)

這是一個全自動化的 AI 新聞聚合與電子報發送系統。每日自動從 TechCrunch 等來源爬取 AI 新聞，使用 OpenAI 生成中英文摘要，並透過 Resend 發送電子報。

## 功能特色

- **自動爬蟲與分析**: 每日定時抓取以下權威來源，並使用 GPT-4o 生成分析：
  - **Tech Media**: TechCrunch, Ars Technica, MIT Technology Review
  - **Social / Community**: Hacker News, Reddit (r/artificial)
  - **Aggregator**: Google News (AI & Tech keywords)
- **AI 導讀助手 (Chat)**: 每則新聞內建互動式 AI 聊天機器人，可深入詢問新聞細節與背景。
- **AI 語音導讀 (Audio)**: 整合 OpenAI TTS，一鍵朗讀新聞標題與摘要，支援語音快取以節省成本。
- **行動版體驗優化**:
  - **Pull-to-Refresh**: 手機下拉即可即時觸發爬蟲，分析並獲取最新新聞。
  - **Infinite Scroll**: 滑動至底部自動載入歷史新聞，閱讀不中斷。
  - **PWA 支援**: 可加入手機主畫面，擁有原生 App icon 與操作體驗。
- **全站搜尋**: 支援標題與摘要的關鍵字搜尋。
- **短網址系統**: 自動生成 8 碼短連結 (如 `/news/AbCdEf12`)，美觀且易於分享。
- **數據儀表板**: `/trends` 頁面視覺化呈現 AI 關鍵字流行趨勢。
- **流量分析 (GA4)**: 完整整合 Google Analytics，追蹤網站即時流量與使用者行為。
- **電子報與 RSS**: 每日 8 點 (GMT+8) 自動發信，並提供標準 `/feed.xml` 訂閱源。
- **社群整合**: 支援自動發布至 X (Twitter)，並動態生成 Open Graph 預覽圖。

## 技術堆疊

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **AI**: OpenAI API (Vercel AI SDK)
- **Email**: Resend
- **Deployment**: Vercel (Cron Jobs)

## 本地開發

1. **複製專案**
   ```bash
   git clone <repository-url>
   cd ai-trends-daily
   npm install
   ```

2. **設定環境變數**
   複製 `.env.example` 為 `.env.local` 並填入 API Keys：
   ```bash
   cp .env.example .env.local
   ```

3. **設定資料庫**
   在 Supabase 建立專案，並至 SQL Editor 執行 `supabase/schema.sql` 中的內容以建立資料表。

4. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

## 部署至 Vercel

1. 將專案推送到 GitHub。
2. 在 Vercel 匯入專案。
3. 在 Vercel Project Settings > Environment Variables 中設定所有環境變數。
4. 部署後，Cron Jobs 會自動設定 (需確保 Vercel 專案有啟用 Cron 功能)。

## API Endpoints (Cron Jobs)

- `GET /api/cron/scrape`: 執行爬蟲與摘要 (需 `Authorization: Bearer <CRON_SECRET>`)
- `GET /api/cron/newsletter`: 發送電子報 (需 `Authorization: Bearer <CRON_SECRET>`)

## 授權

MIT
