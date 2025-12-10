# Global AI Trends Automation Website (全球 AI 趨勢自動化網站)

這是一個全自動化的 AI 新聞聚合與電子報發送系統。每日自動從 TechCrunch 等來源爬取 AI 新聞，使用 OpenAI 生成中英文摘要，並透過 Resend 發送電子報。

## 功能特色

- **自動爬蟲**: 每日定時抓取最新 AI 趨勢。
- **AI 摘要**: 使用 GPT-4o 生成精簡的中英文摘要，並附帶 **「正面影響 vs 挑戰風險」** 分析。
- **熱門追蹤**: 內建新聞點擊熱度統計與 **「本日最熱門」** 置頂排行。
- **數據儀表板**: 新增 `/trends` 頁面，視覺化呈現每週 AI 關鍵字趨勢。
- **社群整合**: 支援自動發布貼文至 Twitter (X)，並動態生成 **Open Graph 預覽圖**。
- **電子報系統**: 每日早上 8 點 (台北時間) 自動發送摘要給訂閱者。
- **現代化 UI**: 響應式設計、深色模式、無限捲動與一鍵分享功能。

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
