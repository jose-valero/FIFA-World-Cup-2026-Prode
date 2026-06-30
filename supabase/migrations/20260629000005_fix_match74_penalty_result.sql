-- Hotfix: match 74 (GER vs PAR) quedó en status=live porque ESPN usa STATUS_FINAL_PEN
-- que no estaba mapeado en el backend sync. Corregimos el resultado final:
-- Alemania 1 - Paraguay 1 (tiempo reglamentario + prórroga)
-- Penales: Alemania 3 - Paraguay 4 (Paraguay avanza)

UPDATE public.matches
SET
  status               = 'finished',
  official_home_score  = 1,
  official_away_score  = 1,
  penalty_home_score   = 3,
  penalty_away_score   = 4
WHERE id = '74';

-- Propagar el ganador al siguiente cruce (match 89 home slot = Paraguay)
SELECT public.sync_qualified_teams_into_knockout();
