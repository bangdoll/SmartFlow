-- Remove duplicate public read access and make bookmark auth checks init-plan safe.
-- These changes preserve the existing public news feed and per-user bookmark rules.

DROP POLICY IF EXISTS "Allow public read access for news_items" ON public.news_items;

-- Keep public click tracking available without granting a SECURITY DEFINER
-- function broad write access to the news table.
CREATE OR REPLACE FUNCTION public.increment_news_click(news_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.news_items
  SET click_count = click_count + 1
  WHERE id = news_id;
$$;

REVOKE UPDATE ON TABLE public.news_items FROM PUBLIC, anon, authenticated;
GRANT UPDATE (click_count) ON TABLE public.news_items TO anon, authenticated;
GRANT UPDATE ON TABLE public.news_items TO service_role;

DROP POLICY IF EXISTS "Public can increment news clicks" ON public.news_items;
CREATE POLICY "Public can increment news clicks"
  ON public.news_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

GRANT EXECUTE ON FUNCTION public.increment_news_click(uuid) TO anon, authenticated, service_role;

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
