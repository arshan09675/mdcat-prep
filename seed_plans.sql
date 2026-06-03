-- ============================================================
--  SEED PLACEHOLDER PLANS  (edit prices/durations later in admin)
--  Safe to run once. Run in Supabase SQL Editor.
-- ============================================================

insert into plans (name, description, price_pkr, duration_days, features, active, position) values
(
  '1 Month Premium',
  'Full access for ~2 months. (Price/duration are placeholders — set in admin.)',
  1500,
  60,
  '["All MCQ practice","All mock tests & past papers","Video lectures","Notes & books (PDF)"]'::jsonb,
  true,
  1
),
(
  'Full Bundle',
  'Complete MDCAT prep for 6 months. (Placeholder — set in admin.)',
  5000,
  180,
  '["Everything in Premium","Priority support","All future content"]'::jsonb,
  true,
  2
);
