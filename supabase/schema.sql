-- 啟用 UUID 擴充功能
create extension if not exists "uuid-ossp";

-- 新聞資料表 (News Items)
-- 儲存從各大來源擷取的新聞及其摘要
create table if not exists news_items (
  id uuid primary key default uuid_generate_v4(),
  original_url text unique not null, -- 原始連結，作為唯一識別
  title text not null,               -- 新聞標題
  source text not null,              -- 來源網站 (如 TechCrunch)
  published_at timestamp with time zone not null, -- 發布時間
  summary_en text,                   -- 英文摘要 (LLM 生成)
  summary_zh text,                   -- 中文摘要 (LLM 生成)
  tags text[],                       -- 標籤
  created_at timestamp with time zone default now() -- 建立時間
);

-- 訂閱者資料表 (Subscribers)
-- 儲存訂閱電子報的使用者
create table if not exists subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,        -- Email 地址
  subscribed_at timestamp with time zone default now(), -- 訂閱時間
  is_active boolean default true     -- 是否啟用
);

-- 電子報發送紀錄 (Newsletter Logs)
-- 記錄每日電子報發送狀態
create table if not exists newsletter_logs (
  id uuid primary key default uuid_generate_v4(),
  sent_at timestamp with time zone default now(), -- 發送時間
  recipient_count int not null,      -- 接收者數量
  status text not null               -- 狀態: 'success', 'failed'
);

-- 建立索引以加速查詢
create index if not exists idx_news_items_published_at on news_items(published_at);
create index if not exists idx_subscribers_email on subscribers(email);

-- 設定 Row Level Security (RLS)
-- 為了安全起見，預設啟用 RLS，但因為我們主要透過 Server 端 API 存取 (使用 Service Role Key)，
-- 這裡可以先設定為允許讀取，寫入則限制。
-- 注意：實際部署時應根據需求調整 Policy。

alter table news_items enable row level security;
alter table subscribers enable row level security;
alter table newsletter_logs enable row level security;

-- 開放公開讀取新聞 (供前端顯示)
create policy "Allow public read access for news_items"
  on news_items for select
  using (true);

-- 訂閱者只能透過 API 新增 (這裡暫不開放直接 Client 端寫入，除非有 Auth)
-- 為了簡單起見，假設所有寫入操作都通過後端 API (使用 Service Role)。
