-- ============================================================
-- Fix: Round of 16 kickoff times — todos los matches 89-96
--
-- Fuente oficial: FIFA World Cup 2026 Match Schedule (01/04/2026)
-- Todos los horarios en Eastern Time (ET = UTC-4 en verano)
--
-- Situación detectada en matches 89 y 90 (July 4):
--
--   Match 90 (CAN vs MAR / W73 vs W75):
--     kickoff_at en DB: 2026-07-04 22:00:00+00  (18:00 ET) ← incorrecto
--     kickoff_at oficial: 13:00 ET = 17:00 UTC
--     Efecto: getEffectiveMatchStatus = "scheduled" aunque el partido
--     ya terminó → scroller mostraba "Pendiente" y lo ponía detrás
--
--   Match 89 (PAR vs FRA / W74 vs W77):
--     kickoff_at en DB: 2026-07-04 19:00:00+00  (15:00 ET) ← incorrecto
--     kickoff_at oficial: 17:00 ET = 21:00 UTC
--     Efecto: getEffectiveMatchStatus = "live" aunque el partido aún
--     no había empezado → scroller mostraba "EN VIVO" incorrectamente
--
-- Los matches 91-96 se corrigen en forma preventiva desde el PDF
-- oficial para evitar el mismo problema en días siguientes.
-- Verificar contra ESPN una vez que los equipos sean conocidos.
--
-- Schedule R16 (fuente PDF):
--   90  W73  v W75  Sat July 4   13:00 ET = 17:00 UTC
--   89  W74  v W77  Sat July 4   17:00 ET = 21:00 UTC
--   91  W76  v W78  Sun July 5   16:00 ET = 20:00 UTC
--   92  W79  v W80  Sun July 5   20:00 ET = Mon 00:00 UTC
--   93  W83  v W84  Mon July 6   15:00 ET = 19:00 UTC
--   94  W81  v W82  Mon July 6   20:00 ET = Tue 00:00 UTC
--   95  W86  v W88  Tue July 7   12:00 ET = 16:00 UTC
--   96  W85  v W87  Tue July 7   16:00 ET = 20:00 UTC
-- ============================================================

-- July 4 — confirmados incorrectos por el usuario

-- Match 90: CAN vs MAR — 13:00 ET = 17:00 UTC
UPDATE public.matches
SET kickoff_at = '2026-07-04 17:00:00+00'
WHERE id = '90'
  AND stage = 'round_of_16';

-- Match 89: PAR vs FRA — 17:00 ET = 21:00 UTC
UPDATE public.matches
SET kickoff_at = '2026-07-04 21:00:00+00'
WHERE id = '89'
  AND stage = 'round_of_16';

-- July 5 — preventivo desde PDF

-- Match 91: W76 vs W78 — 16:00 ET = 20:00 UTC
UPDATE public.matches
SET kickoff_at = '2026-07-05 20:00:00+00'
WHERE id = '91'
  AND stage = 'round_of_16';

-- Match 92: W79 vs W80 — 20:00 ET = 00:00 UTC del día siguiente
UPDATE public.matches
SET kickoff_at = '2026-07-06 00:00:00+00'
WHERE id = '92'
  AND stage = 'round_of_16';

-- July 6 — preventivo desde PDF

-- Match 93: W83 vs W84 — 15:00 ET = 19:00 UTC
UPDATE public.matches
SET kickoff_at = '2026-07-06 19:00:00+00'
WHERE id = '93'
  AND stage = 'round_of_16';

-- Match 94: W81 vs W82 — 20:00 ET = 00:00 UTC del día siguiente
UPDATE public.matches
SET kickoff_at = '2026-07-07 00:00:00+00'
WHERE id = '94'
  AND stage = 'round_of_16';

-- July 7 — preventivo desde PDF

-- Match 95: W86 vs W88 — 12:00 ET = 16:00 UTC
UPDATE public.matches
SET kickoff_at = '2026-07-07 16:00:00+00'
WHERE id = '95'
  AND stage = 'round_of_16';

-- Match 96: W85 vs W87 — 16:00 ET = 20:00 UTC
UPDATE public.matches
SET kickoff_at = '2026-07-07 20:00:00+00'
WHERE id = '96'
  AND stage = 'round_of_16';
