ALTER TABLE news_items
  ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_news_items_click_count
  ON news_items(click_count DESC);

CREATE OR REPLACE FUNCTION increment_news_click(news_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.news_items
  SET click_count = click_count + 1
  WHERE id = news_id;
$$;

GRANT EXECUTE ON FUNCTION increment_news_click(uuid) TO anon, authenticated, service_role;
