-- ============================================================
-- Fix: Match 82 (BEL vs SEN, ESPN event 760493)
--
-- Bug raíz: STATUS_FINAL_AET no estaba mapeado en el backend Go,
-- por lo que el sync emitía OmitReason y saltaba el partido.
-- El partido quedó frozen en status=live, official_home/away=2-2.
--
-- Datos verificados con ESPN summary endpoint (event 760493):
--   linescores home (BEL): ['0','2','0','1']  → H1=0, H2=2, ET1=0, ET2=1
--   linescores away (SEN): ['1','1','0','0']  → H1=1, H2=1, ET1=0, ET2=0
--
--   regulation_home_score = H1+H2 = 0+2 = 2  (BEL a los 90min)
--   regulation_away_score = H1+H2 = 1+1 = 2  (SEN a los 90min)
--   official_home_score   = 3                 (BEL tras prórroga)
--   official_away_score   = 2                 (SEN tras prórroga)
--   knockout_resolution   = 'extra_time'
--
-- El Go backend fue corregido agregando STATUS_FINAL_AET al mapper.
-- Este migration corrige manualmente el estado actual de producción.
-- ============================================================

UPDATE public.matches
SET
  status                = 'finished',
  official_home_score   = 3,
  official_away_score   = 2,
  regulation_home_score = 2,
  regulation_away_score = 2,
  knockout_resolution   = 'extra_time'
WHERE id = '82';

-- Propagar BEL como ganador al siguiente cruce (away slot que apunta a W82)
SELECT public.sync_qualified_teams_into_knockout();
