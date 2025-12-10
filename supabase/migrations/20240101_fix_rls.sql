-- Enable RLS
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access (SELECT) for everyone
CREATE POLICY "Public items are viewable by everyone" 
ON news_items FOR SELECT 
USING (true);

-- Allow service_role (backend) to do everything
CREATE POLICY "Service role can do everything" 
ON news_items FOR ALL 
USING (auth.role() = 'service_role');
