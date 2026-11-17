# Bilingual repair safeguards (2026-11-18)

Production logged repeated summary-only repairs for two records whose Chinese
titles remained English product names. `fixedCount` incremented after any write,
even when the original selection predicate still classified the record as broken.
Chinese summaries also had inconsistent thresholds: selection required 30
characters, while writes accepted more than 20.

The service now uses the same predicate before translation, on proposed changes,
and on the database's returned row. Chinese text needs at least two CJK characters;
summaries need at least 30 trimmed characters. English text uses the existing
English detector. Only invalid fields are changed. Incomplete translations write
no content and do not increment the repaired count. The Chinese prompt explicitly
requires localized wording even when a headline contains product names.

Each language has a persistent one-hour retry deadline on `news_items`. A
conditional UPDATE claims the record before calling AI, so overlapping daily and
bilingual jobs cannot both translate it. Failed, timed-out, or interrupted attempts
retain the deadline. Successful verified writes clear it. Cooldowns are filtered
before applying the batch limit, leaving slots for other records. Failure to claim
a record prevents the AI call. Logs include record ID, language, issues, changed
fields, remaining issues, and retry time as applicable.

Apply `supabase/migrations/20261118_bilingual_repair_cooldown.sql` before deploying.
It adds two nullable timestamps without changing content or permissions. Existing
25-second cron budgeting, two-item language limits, authentication, and sequential
Chinese-to-English processing remain in place. No additional AI calls are made
within a run to retry invalid responses.

The two observed Chinese titles were corrected by conditional ID + old-title
updates; English titles and both summaries were preserved:

| ID | Before | After |
| --- | --- | --- |
| `2c3b3ace-fe3a-4dc1-a8e7-bf7baa94eace` | MAI Code 2 and Code 2 Flash | MAI Code 2 與 Code 2 Flash 介紹 |
| `a6b88a88-e73b-449b-b0da-5bf50ef1b109` | GPT‑6.2 Astra and Sol | GPT‑6.2 Astra 與 Sol 介紹 |

Validation: the new regression suite failed on the production source, then passed
after the fix. The full socket-free unit run passes 63 tests; TypeScript and
changed-file ESLint pass. The existing real-socket timeout test cannot bind
127.0.0.1 under the local sandbox (EPERM), so it is excluded from that local run.
The real OpenAI SDK cancellation test uses mocked fetch and still runs.

Acceptance: deployment READY; database readback confirms both localized titles;
new production logs use record IDs and no longer report summary-only success for
these records. A subsequent clean cron round should report zero completed repairs
unless new incomplete content arrives. A failure retries after one hour, rather
than every 15-minute round; it is not permanently suppressed.
