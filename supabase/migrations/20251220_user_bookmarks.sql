-- Create bookmarks table
create table if not exists user_bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  news_id text not null, -- references news_item.id which is string
  slug text, -- store slug for easier linking
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, news_id)
);

-- RLS Policies
alter table user_bookmarks enable row level security;

-- Allow users to view their own bookmarks
create policy "Users can view own bookmarks" 
on user_bookmarks for select 
using (auth.uid() = user_id);

-- Allow users to insert their own bookmarks
create policy "Users can insert own bookmarks" 
on user_bookmarks for insert 
with check (auth.uid() = user_id);

-- Allow users to delete their own bookmarks
create policy "Users can delete own bookmarks" 
on user_bookmarks for delete 
using (auth.uid() = user_id);

-- Index for performance
create index idx_user_bookmarks_user_id on user_bookmarks(user_id);
create index idx_user_bookmarks_news_id on user_bookmarks(news_id);
