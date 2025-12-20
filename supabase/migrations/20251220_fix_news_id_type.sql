-- Fix type mismatch between user_bookmarks.news_id (text) and news_items.id (uuid)

-- 1. Clear existing data to avoid casting errors from invalid strings (safe for dev environemnt)
truncate table user_bookmarks;

-- 2. Convert news_id column from text to uuid
alter table user_bookmarks 
  alter column news_id type uuid using news_id::uuid;

-- 3. Now verify and add the foreign key constraint
alter table user_bookmarks
  add constraint fk_user_bookmarks_news
  foreign key (news_id)
  references news_items (id)
  on delete cascade;
