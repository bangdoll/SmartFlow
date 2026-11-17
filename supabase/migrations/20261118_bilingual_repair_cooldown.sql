-- Apply before deploying the repair service. NULL means eligible immediately.
-- A conditional UPDATE claims a language for one hour before any AI request.
-- Successful, verified repairs clear the deadline; failed attempts retain it.
alter table public.news_items
    add column if not exists bilingual_zh_retry_after timestamptz,
    add column if not exists bilingual_en_retry_after timestamptz;

comment on column public.news_items.bilingual_zh_retry_after is
    'Chinese repair claim and failed-attempt cooldown; NULL means no active cooldown.';
comment on column public.news_items.bilingual_en_retry_after is
    'English repair claim and failed-attempt cooldown; NULL means no active cooldown.';
