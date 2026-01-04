
# 🚀 Product Hunt Launch Checklist for SmartFlow

這份清單專為 **SmartFlow** 量身打造，結合了新聞聚合、自動化 AI 分析與雙語特色。目標是在 Product Hunt (PH) 發布當天進入 **Top 5**，獲取大量且長尾的優質流量。

---

## 📅 前期準備 (T-Minus 2 Weeks)
*現在開始累積勢能，不要等到發布當天才開始。*

### 1. 核心素材準備 (Assets)
PH 非重視視覺吸引力，SmartFlow 的設計風格（Glassmorphism）是一大優勢。
- [x] **動態 Logo (GIF)**: 已生成於 `public/logo-animation.gif`。讓您的 Logo 動起來（例如 Flow 線條波動），作為頭像 (Avatar)，非常吸睛。
- [x] **Gallery Images (3-5 張)**: 已生成 4 張高品質宣傳圖（Cover, Bilingual, Mental Models, Mobile）。
    - **封面圖 (1270x760)**: 標題大字 "SmartFlow"，副標 "Daily AI News, Analyzed by Mental Models"。展示手機與電腦的雙光風格 mockup。
    - **特色圖 1**: 展示「嚴格雙語切換」與「AI 語音導讀」。
    - **特色圖 2**: 展示「週報分析」中的查理·芒格思維模型（這很對 PH 用戶胃口）。
    - **特色圖 3**:「行動版體驗」Pull-to-refresh 與 PWA 安裝。
- [x] **Demo Video (60秒內)**:
    - **腳本**: 已生成於 `product_hunt_kit/DEMO_VIDEO_SCRIPT.md`。
    - 錄製螢幕操作，配上輕快背景音樂。
    - 腳本：打開網頁 -> 切換語言 -> 下拉更新新聞 -> 點進詳細頁 -> 聽 AI 導讀 -> 展示週報分析。
    - *重點：不要說話，用字幕說明即可，節奏要快。*

### 2. 文案撰寫 (Copywriting)
- [x] **Name**: SmartFlow
- [x] **Tagline (60字元)**: "All your AI news in one place, analyzed with mental models. 🧠" (強調「一站式」與「思維模型」)
- [x] **Description (260字元)**: "Automated AI news aggregator that scrapes top sources daily. Features instant bilingual support, AI audio summaries, and weekly trend analysis powered by Charlie Munger's mental models. Stay smart, effortlessly."
- [x] **Maker's Comment (第一則留言)**: 已撰寫於 `product_hunt_kit/COPYWRITING.md`。
    - 介紹自己為什麼做這個（例如：資訊焦慮、英文閱讀門檻）。
    - 提到這是一個 Open Source 專案（如果是的話，PH 社群超愛開源）。
    - 邀請大家反饋，並承諾全天在線回答。

### 3. 設定預告頁 (Coming Soon Page)
- [ ] 在 Product Hunt 建立 "Coming Soon" 頁面（需 2 週前）。
- [ ] 目標：收集 50-100 個 "Notify me" 訂閱。這些人在發布當天會直接轉化為第一波 Upvotes。

---

## ⚡ 發布日 (Launch Day)
*Product Hunt 的「一天」是指 **太平洋時間 (PST) 00:01 到 23:59**。換算成台灣時間是 **下午 15:01 開始** (冬令時間) 或 **16:01** (夏令時間)。*

### 黃金前 4 小時 (16:00 - 20:00 TPE)
*目標：在前 4 小時衝進首頁前 10 名，這樣美國人起床時才會第一眼看到你。*

- [ ] **16:01 準時發布**: 這個時間發布能獲得完整的 24 小時曝光。
- [ ] **發送電子報**: 利用您現有的 User Base (`resend`)，寄信告訴現有訂閱者：「我們上 PH 了！如果你喜歡 SmartFlow，請來支持我們。」
    - *注意：不要直接說 "Upvote me"，PH 會降權。請說 "Check us out and let us know what you think!"*
- [ ] **社群擴散**:
    - **X (Twitter)**: 發布 Demo 影片，Tag `@ProductHunt`。
    - **LinkedIn**: 寫一篇關於「如何用 Next.js + AI SDK 打造自動化新聞站」的技術文，附上 PH 連結。
    - **Indie Hackers / Reddit**: 去 `r/SideProject`, `r/Nextjs` 分享您的作品。

### 中場維護 (20:00 - 08:00 TPE)
- [ ] **即時回覆評論**: 這是最重要的。每一個留言都要回覆。字數多一點，態度誠懇。
- [ ] **監控數據**: 觀察 `GA4` 的即時流量，確保伺服器 (`Supabase`, `Vercel`) 撐得住。

---

## 📈 發布後 (Post-Launch)
*長尾效應比當天排名更重要。*

- [ ] **在網站加上 Badge**: 如果獲得 "Top Product of the Day" 或前 5 名，務必在網站 Footer 或 Header 加上徽章，能大幅提升信任度。
- [ ] **發布更新日誌**: 在 `CHANGELOG.md` 紀錄 Launch Day 的里程碑。
- [ ] **轉化流量**: 發布後一週是流量高峰，確保您的「訂閱電子報」入口非常顯眼。

---

## 🛠 給 SmartFlow 的專屬武器 (Secret Weapons)

1.  **強調 "Charlie Munger Mental Models"**:
    *   這在科技圈是個很酷的關鍵字。在 PH 的 Gallery Image 中，特別做一張圖展示此功能。
2.  **強調 "Strict Bilingual"**:
    *   這對非英語系國家的用戶（歐洲、南美、亞洲）非常有吸引力，因為市面上大多工具只有英文。
3.  **Hacker News 效應**:
    *   在發布 PH 的同時，也可以把文章貼到 Hacker News 的 `Show HN` 板塊。如果運氣好兩個都爆了，您的伺服器可能會掛掉（這是好事）。

---

### ✅ 下一步行動
您想先準備 **Gallery Images (宣傳圖)** 還是 **Demo Video (演示影片)**？我可以協助您生成宣傳圖的文案或影片的詳細分鏡腳本。
