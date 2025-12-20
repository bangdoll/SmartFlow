-- Fix missing foreign key for news_id
-- This allows Supabase to correctly join user_bookmarks with news_items

alter table user_bookmarks
add constraint fk_user_bookmarks_news
foreign key (news_id)
references news_items (id)
on delete cascade;

-- Verify the relationship implies many-to-one
comment on constraint fk_user_bookmarks_news on user_bookmarks is 
  '@foreignKey (news_id) references news_items (id)';
