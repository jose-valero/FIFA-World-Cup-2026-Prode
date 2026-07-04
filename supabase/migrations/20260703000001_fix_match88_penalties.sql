-- ============================================================
-- Fix: Match 88 (AUS vs EGY, ESPN event 760499)
--
-- Bug raíz: STATUS_FINAL_PEN no estaba mapeado en el backend Go
-- desplegado en producción. El sync emitía OmitReason y saltaba
-- el partido en cada ciclo, dejándolo frozen en live + 1-1.
--
-- El fix genérico ya está en el código Go local (STATUS_FINAL_PEN
-- añadido a mapESPNStatus). Este migration corrige el estado actual
-- de producción mientras el backend se despliega.
--
-- Datos verificados con ESPN summary endpoint (event 760499):
--   status: STATUS_FINAL_PEN
--   linescores home (AUS): ['0','1','0','0','2']
--     H1=0, H2=1 → regulation_home = 1
--     ET1=0, ET2=0 → sin goles en prórroga
--     Pen=2
--   linescores away (EGY): ['1','0','0','0','4']
--     H1=1, H2=0 → regulation_away = 1
--     ET1=0, ET2=0 → sin goles en prórroga
--     Pen=4
-- ============================================================

UPDATE public.matches
SET
  status                = 'finished',
  official_home_score   = 1,
  official_away_score   = 1,
  penalty_home_score    = 2,
  penalty_away_score    = 4,
  regulation_home_score = 1,
  regulation_away_score = 1,
  knockout_resolution   = 'penalties'
WHERE id = '88';

-- Propagar EGY como ganador al siguiente cruce (match 95 away slot = W88)
SELECT public.sync_qualified_teams_into_knockout();
