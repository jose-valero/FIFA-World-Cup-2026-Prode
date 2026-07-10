-- ============================================================
-- Fix: kickoff_at incorrecto para los 4 partidos de cuartos de
-- final (97-100).
--
-- A diferencia de round_of_32 y round_of_16, cuartos nunca tuvo
-- una migración de corrección de fechas dedicada — seguían con el
-- valor original del seed. Esto hacía que el backfill de ESPN IDs
-- no pudiera matchearlos (ventana de ±30 min contra una fecha real
-- que difería en horas/días) y que getEffectiveMatchStatus mostrara
-- estados falsos en el frontend al comparar contra "ahora".
--
-- Acotado a los 4 ids de cuartos, idempotente (siempre fija el
-- mismo valor final, no depende de valor previo).
-- ============================================================

UPDATE public.matches SET kickoff_at = '2026-07-09 19:00:00+00' WHERE id = '97'  AND stage = 'quarterfinals';
UPDATE public.matches SET kickoff_at = '2026-07-10 19:00:00+00' WHERE id = '98'  AND stage = 'quarterfinals';
UPDATE public.matches SET kickoff_at = '2026-07-11 21:00:00+00' WHERE id = '99'  AND stage = 'quarterfinals';
UPDATE public.matches SET kickoff_at = '2026-07-12 01:00:00+00' WHERE id = '100' AND stage = 'quarterfinals';
