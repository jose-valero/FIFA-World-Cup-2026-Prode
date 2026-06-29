-- ============================================================
-- Fix round_of_32: kickoff_at + team assignments
--
-- Source of truth: ESPN scoreboard (fifa.world).
-- All kickoff_at values corrected to match ESPN exact UTC times.
-- Team assignments for IDs 79 and 82 corrected (SQL sync CTE
-- produced a valid but wrong permutation for best_third slots;
-- ESPN confirms MEX vs ECU and BEL vs SEN, not MEX vs SEN / BEL vs ECU).
-- ============================================================

-- Matches already correct in DB (no change needed):
--   73 RSA vs CAN: 2026-06-28T19:00:00+00  ESPN 760486 ✓
--   86 ARG vs CPV: 2026-07-03T22:00:00+00  ESPN 760500 ✓

UPDATE public.matches SET kickoff_at = '2026-06-29T20:30:00+00'
WHERE id = '74' AND stage = 'round_of_32'; -- GER vs PAR

UPDATE public.matches SET kickoff_at = '2026-06-30T01:00:00+00'
WHERE id = '75' AND stage = 'round_of_32'; -- NED vs MAR

UPDATE public.matches SET kickoff_at = '2026-06-29T17:00:00+00'
WHERE id = '76' AND stage = 'round_of_32'; -- BRA vs JPN

UPDATE public.matches SET kickoff_at = '2026-06-30T21:00:00+00'
WHERE id = '77' AND stage = 'round_of_32'; -- FRA vs SWE

UPDATE public.matches SET kickoff_at = '2026-06-30T17:00:00+00'
WHERE id = '78' AND stage = 'round_of_32'; -- CIV vs NOR

-- ID 79: also fix team (SEN→ECU per ESPN 760491 MEX vs ECU)
UPDATE public.matches
SET
  kickoff_at     = '2026-07-01T01:00:00+00',
  away_team_id   = 'b15bc13a-be18-46c8-bb6c-6260ee310bc1',
  away_team      = 'Ecuador',
  away_team_code = 'ECU'
WHERE id = '79' AND stage = 'round_of_32';

UPDATE public.matches SET kickoff_at = '2026-07-01T16:00:00+00'
WHERE id = '80' AND stage = 'round_of_32'; -- ENG vs COD

UPDATE public.matches SET kickoff_at = '2026-07-02T00:00:00+00'
WHERE id = '81' AND stage = 'round_of_32'; -- USA vs BIH

-- ID 82: also fix team (ECU→SEN per ESPN 760493 BEL vs SEN)
UPDATE public.matches
SET
  kickoff_at     = '2026-07-01T20:00:00+00',
  away_team_id   = '0d9b8a0a-106f-475b-93ac-30b08b593c30',
  away_team      = 'Senegal',
  away_team_code = 'SEN'
WHERE id = '82' AND stage = 'round_of_32';

UPDATE public.matches SET kickoff_at = '2026-07-02T23:00:00+00'
WHERE id = '83' AND stage = 'round_of_32'; -- POR vs CRO

UPDATE public.matches SET kickoff_at = '2026-07-02T19:00:00+00'
WHERE id = '84' AND stage = 'round_of_32'; -- ESP vs AUT

UPDATE public.matches SET kickoff_at = '2026-07-03T03:00:00+00'
WHERE id = '85' AND stage = 'round_of_32'; -- SUI vs ALG

UPDATE public.matches SET kickoff_at = '2026-07-04T01:30:00+00'
WHERE id = '87' AND stage = 'round_of_32'; -- COL vs GHA

UPDATE public.matches SET kickoff_at = '2026-07-03T18:00:00+00'
WHERE id = '88' AND stage = 'round_of_32'; -- AUS vs EGY
