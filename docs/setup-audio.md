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
