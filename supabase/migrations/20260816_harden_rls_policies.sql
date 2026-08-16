-- Remove duplicate public read access and make bookmark auth checks init-plan safe.
-- These changes preserve the existing public news feed and per-user bookmark rules.

DROP POLICY IF EXISTS "Allow public read access for news_items" ON public.news_items;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can view own bookmarks"
  ON public.user_bookmarks FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can insert own bookmarks"
  ON public.user_bookmarks FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can delete own bookmarks"
  ON public.user_bookmarks FOR DELETE
  USING ((SELECT auth.uid()) = user_id);
