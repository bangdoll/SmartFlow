-- Add English columns for weekly_trends i18n support
ALTER TABLE weekly_trends
ADD COLUMN IF NOT EXISTS title_en text,
ADD COLUMN IF NOT EXISTS core_message_en text,
ADD COLUMN IF NOT EXISTS persona_advice_en jsonb,
ADD COLUMN IF NOT EXISTS week_end_date date;

-- Comment: These fields store English translations for i18n support
COMMENT ON COLUMN weekly_trends.title_en IS 'English translation of weekly title';
COMMENT ON COLUMN weekly_trends.core_message_en IS 'English translation of core message';
COMMENT ON COLUMN weekly_trends.persona_advice_en IS 'English translation of persona advice';
