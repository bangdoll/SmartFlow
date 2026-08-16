ALTER TABLE news_items
  ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_news_items_click_count
  ON news_items(click_count DESC);

CREATE OR REPLACE FUNCTION increment_news_click(news_id uuid)
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
GRANT EXECUTE ON FUNCTION increment_news_click(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Public can increment news clicks" ON public.news_items;
CREATE POLICY "Public can increment news clicks"
  ON public.news_items FOR UPDATE
  USING (true)
  WITH CHECK (true);
