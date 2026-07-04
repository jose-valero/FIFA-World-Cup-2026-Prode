-- ============================================================
-- Fix: Matches 86 y 87 — stuck at scheduled, never synced
--
-- Causa raíz documentada:
--
--   Match 86 (ARG vs CPV, ESPN event 760500, STATUS_FINAL_AET):
--     El backend Go en producción NO tenía STATUS_FINAL_AET mapeado
--     en mapESPNStatus → el sync emitía OmitReason → el partido nunca
--     se actualizó. Fix local ya aplicado en Go (aún no deployado).
--
--   Match 87 (COL vs GHA, ESPN event 760501, STATUS_FULL_TIME):
--     STATUS_FULL_TIME sí estaba mapeado. El problema fue de timing:
--     el último ciclo de sync que incluyó la fecha 2026-07-03 corrió
--     mientras el partido 88 estaba live (antes del KO de 86 y 87).
--     Una vez que el scheduler dejó de correr, 86 y 87 terminaron sin
--     que ningún ciclo los cubriera.
--
-- Datos verificados con ESPN summary endpoint:
--
--   Event 760500 (ARG vs CPV, STATUS_FINAL_AET):
--     linescores home (ARG): [1, 0, 1, 1]  → H1=1 H2=0 ET1=1 ET2=1
--     linescores away (CPV): [0, 1, 1, 0]  → H1=0 H2=1 ET1=1 ET2=0
--     regulation_home = H1+H2 = 1+0 = 1
--     regulation_away = H1+H2 = 0+1 = 1  (1-1 al 90min)
--     official: ARG 3, CPV 2               (tras prórroga)
--     knockout_resolution = 'extra_time'
--
--   Event 760501 (COL vs GHA, STATUS_FULL_TIME):
--     linescores home (COL): [1, 0]  → H1=1 H2=0
--     linescores away (GHA): [0, 0]  → H1=0 H2=0
--     regulation_home = 1+0 = 1
--     regulation_away = 0+0 = 0  (1-0 al 90min, sin prórroga)
--     official: COL 1, GHA 0
--     knockout_resolution = 'regulation'
-- ============================================================

-- Match 86: ARG 3-2 CPV (1-1 al 90min, gana ARG en prórroga)
UPDATE public.matches
SET
  status                = 'finished',
  official_home_score   = 3,
  official_away_score   = 2,
  regulation_home_score = 1,
  regulation_away_score = 1,
  knockout_resolution   = 'extra_time'
WHERE id = '86';

-- Match 87: COL 1-0 GHA (regulación)
UPDATE public.matches
SET
  status                = 'finished',
  official_home_score   = 1,
  official_away_score   = 0,
  regulation_home_score = 1,
  regulation_away_score = 0,
  knockout_resolution   = 'regulation'
WHERE id = '87';

-- Propagar ganadores a los cruces siguientes
SELECT public.sync_qualified_teams_into_knockout();
