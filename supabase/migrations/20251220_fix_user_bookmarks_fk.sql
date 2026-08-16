-- Fix missing foreign key for news_id
-- This allows Supabase to correctly join user_bookmarks with news_items

DO $$
BEGIN
  IF to_regclass('public.user_bookmarks') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_bookmarks_news'
    ) THEN
    ALTER TABLE public.user_bookmarks
      ADD CONSTRAINT fk_user_bookmarks_news
      FOREIGN KEY (news_id) REFERENCES public.news_items(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Verify the relationship implies many-to-one
comment on constraint fk_user_bookmarks_news on user_bookmarks is 
  '@foreignKey (news_id) references news_items (id)';
