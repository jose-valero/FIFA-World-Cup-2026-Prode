-- ============================================================
-- Fix: kickoff_at para partidos 75 y 76 del round_of_32
--
-- Estos partidos estaban un día después del correcto en la DB.
-- El horario real es el 28 de junio, no el 29.
-- La jornada tiene 4 partidos (doble cartelera):
--   ID 73 (RSA vs CAN) y ID 75 (NED vs MAR) a las 19:00 UTC
--   ID 74 (GER vs PAR) y ID 76 (BRA vs JPN) a las 22:00 UTC
-- ============================================================

UPDATE public.matches SET kickoff_at = '2026-06-28T19:00:00+00'
WHERE id = '75' AND stage = 'round_of_32';

UPDATE public.matches SET kickoff_at = '2026-06-28T22:00:00+00'
WHERE id = '76' AND stage = 'round_of_32';
