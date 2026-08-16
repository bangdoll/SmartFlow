-- Fix type mismatch between user_bookmarks.news_id (text) and news_items.id (uuid)

-- This migration can run before the table-creation migration on a fresh
-- project, so guard it. Never delete bookmark data to make a type change.
DO $$
BEGIN
  IF to_regclass('public.user_bookmarks') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_bookmarks'
        AND column_name = 'news_id'
        AND data_type = 'text'
    ) THEN
      ALTER TABLE public.user_bookmarks
        ALTER COLUMN news_id TYPE uuid USING news_id::uuid;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_bookmarks_news'
    ) THEN
      ALTER TABLE public.user_bookmarks
        ADD CONSTRAINT fk_user_bookmarks_news
        FOREIGN KEY (news_id) REFERENCES public.news_items(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
