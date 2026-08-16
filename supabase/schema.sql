-- 啟用 UUID 擴充功能
create extension if not exists "uuid-ossp";

-- 新聞資料表 (News Items)
-- 儲存從各大來源擷取的新聞及其摘要
create table if not exists news_items (
  id uuid primary key default uuid_generate_v4(),
  original_url text unique not null, -- 原始連結，作為唯一識別
  title text not null,               -- 新聞標題
  title_en text,                     -- 英文標題 (翻譯生成)
  source text not null,              -- 來源網站 (如 TechCrunch)
  published_at timestamp with time zone not null, -- 發布時間
  summary_en text,                   -- 英文摘要 (LLM 生成)
  summary_zh text,                   -- 中文摘要 (LLM 生成)
  audio_url text,                    -- 中文語音連結 (預設)
  audio_url_en text,                 -- 英文語音連結 (新增)
  tags text[],                       -- 標籤
  slug text,
  click_count integer not null default 0,
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
create index if not exists idx_news_items_click_count on news_items(click_count desc);
create index if not exists idx_news_items_slug on news_items(slug);
create index if not exists idx_subscribers_email on subscribers(email);

create or replace function increment_news_click(news_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.news_items
  set click_count = click_count + 1
  where id = news_id;
$$;

grant execute on function increment_news_click(uuid) to anon, authenticated, service_role;

-- 設定 Row Level Security (RLS)
-- 為了安全起見，預設啟用 RLS，但因為我們主要透過 Server 端 API 存取 (使用 Service Role Key)，
-- 這裡可以先設定為允許讀取，寫入則限制。
-- 注意：實際部署時應根據需求調整 Policy。

alter table news_items enable row level security;
alter table subscribers enable row level security;
alter table newsletter_logs enable row level security;

-- 開放公開讀取新聞 (供前端顯示)
create policy "Public items are viewable by everyone"
  on news_items for select
  using (true);

-- 使用者書籤
create table if not exists user_bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  news_id uuid references news_items(id) on delete cascade not null,
  slug text,
  created_at timestamp with time zone default now() not null,
  unique(user_id, news_id)
);

alter table user_bookmarks enable row level security;

create policy "Users can view own bookmarks"
  on user_bookmarks for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own bookmarks"
  on user_bookmarks for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own bookmarks"
  on user_bookmarks for delete
  using ((select auth.uid()) = user_id);

create index if not exists idx_user_bookmarks_user_id on user_bookmarks(user_id);
create index if not exists idx_user_bookmarks_news_id on user_bookmarks(news_id);

-- 訂閱者只能透過 API 新增 (這裡暫不開放直接 Client 端寫入，除非有 Auth)
-- 為了簡單起見，假設所有寫入操作都通過後端 API (使用 Service Role)。
