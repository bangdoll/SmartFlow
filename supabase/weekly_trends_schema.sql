
-- 每週趨勢分析表 (Weekly Trends)
-- 儲存 LLM 自動生成的每週趨勢分析報告
create table if not exists weekly_trends (
  id uuid primary key default uuid_generate_v4(),
  week_start_date date not null unique,        -- 該週開始日期 (通常是週一)
  title text not null,                         -- 本週定調標題 (如：AI 進入現實摩擦期)
  core_message text not null,                  -- 本週核心一句話詳細說明
  trends jsonb not null,                       -- 趨勢關鍵字列表 (Array of objects)
  persona_advice jsonb not null,               -- 角色建議 (Object with keys: general, work, boss)
  created_at timestamp with time zone default now()
);

-- RLS Policy
alter table weekly_trends enable row level security;

create policy "Allow public read access for weekly_trends"
  on weekly_trends for select
  using (true);
