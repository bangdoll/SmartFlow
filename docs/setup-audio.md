# AI 語音功能設定指南

為了啟用 AI 語音播報功能，我們需要設定 Supabase 的儲存空間 (Storage)。

## 設定步驟

1. 前往 **Supabase Dashboard** -> **Storage**。
2. 點擊 **"New Bucket"** 按鈕。
3. Name (名稱) 輸入：`news-audio`
4. 將 **Public bucket** 開關切換為 **ON** (開啟)。
5. 點擊 **Save**。

## 資料庫遷移 (SQL)

請在 **SQL Editor** 中執行以下語法，以支援雙語音訊：

```sql
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS audio_url text;    -- 中文語音
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS audio_url_en text; -- 英文語音
```

## GPT Audio 1.5 遷移候選版（尚未部署）

此候選變更將新音訊的生成改接 OpenAI Chat Completions API，使用
`gpt-audio-1.5`、`alloy` 及 `mp3`。沿用伺服器現有的 `OPENAI_API_KEY`，
不建立新帳戶或金鑰，也不需要新增套件。這份程式尚未進行付費 API 測試或上線。

- 已存在的 `audio_url`／`audio_url_en` 優先回傳，不重新生成或覆寫舊音檔
- 保留中英文字稿整理、英文缺少內容時的補譯、4,000 字輸入上限、
  `news-audio` bucket、語言別 MP3 檔名及現有播放器
- 使用完整回覆的 Base64 音訊，不依賴 OpenAI 暫時的音訊 ID 或到期時間
- 拒絕回覆、未完成／截斷回覆、缺少音訊或逐字稿，以及不合法 Base64、
  超過 20 MiB、非 MP3 或首個音框不完整的內容，都回傳既有的 503 錯誤且不寫入音訊快取
- 音訊生成單次逾時 45 秒、關閉 SDK 自動重試，不自動退回其他模型
- 上傳失敗不寫入快取；上傳成功但資料庫 URL 寫入失敗時，維持原本回傳
  可播放 URL 的行為。這種情況下後續請求仍可能再次生成，未新增跨請求去重機制

### 離線驗證

`npm run test:unit` 包含 TTS route 與 narration adapter 的模擬測試；
OpenAI、Supabase 及 Storage 均替換為測試實作。真實 OpenAI SDK 的相容性測試
只使用覆寫的記憶體 fetch，音訊樣本為本機合成的短靜音，沒有網路或付費 API 呼叫。
另執行 `npm run lint`、`npx tsc --noEmit` 及 `npm run build`。

### 上線前仍需確認

這是生成式語音模型。忠實朗讀提示、提供者逐字稿與 MP3 結構檢查都不能證明
實際語音完全逐字、沒有錯唸或改寫。取得付費測試的金額上限與明確許可後，
需測試中英文、姓名、數字、技術詞、長文章、截斷、延遲、音質及實際費用，
再取得發布許可。音訊輸出單價為每百萬 audio tokens 64 美元，另計文字輸入
與輸出；原本 `tts-1` 是每百萬字元 15 美元，計費單位不同，不能保證同價或更便宜。
保留原有的字數上限也不代表每篇都能在單次輸出或時間上限內完成。

官方參考（2026-10-02 核對）：

- [GPT Audio 1.5 模型與價格](https://developers.openai.com/api/docs/models/gpt-audio-1.5)
- [Chat Completions 音訊](https://developers.openai.com/api/docs/guides/audio-chat-completions)
- [MP3、alloy、Base64、逐字稿及完成狀態格式](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)
- [原 TTS-1 計價](https://developers.openai.com/api/docs/models/tts-1)
