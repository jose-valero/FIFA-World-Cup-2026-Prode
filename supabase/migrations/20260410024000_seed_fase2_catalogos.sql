-- ============================================================
-- Seed Fase 2: Catálogos base (grupos, estadios, equipos)
-- Fuente: FIFA World Cup 2026 Match Schedule — 1 April 2026
-- ============================================================
-- CONFIRMADO DEL PDF:
--   - Composición de los 12 grupos (A–L) con 48 selecciones
--   - Códigos FIFA de las 48 selecciones
--   - 16 ciudades sede (11 USA, 3 MEX, 2 CAN)
-- PROVISIONAL (conocimiento general, no del PDF):
--   - Nombres de estadios (venues.name)
--   - Timezone por venue
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. GROUPS (A–L)
--    Fuente: sección "legend" del PDF
-- ─────────────────────────────────────────────────────────────
insert into public.groups (code, name, display_order) values
  ('A', 'Grupo A',  1),
  ('B', 'Grupo B',  2),
  ('C', 'Grupo C',  3),
  ('D', 'Grupo D',  4),
  ('E', 'Grupo E',  5),
  ('F', 'Grupo F',  6),
  ('G', 'Grupo G',  7),
  ('H', 'Grupo H',  8),
  ('I', 'Grupo I',  9),
  ('J', 'Grupo J', 10),
  ('K', 'Grupo K', 11),
  ('L', 'Grupo L', 12)
on conflict (code) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 2. VENUES (16 sedes)
--    Ciudades: columnas del grid del PDF
--    Estadios: PROVISIONAL — nombres oficiales WC2026 (no están en el PDF)
--    country: 'USA' por defecto; override para CAN y MEX
-- ─────────────────────────────────────────────────────────────
insert into public.venues (name, city, country, timezone) values
  -- UNITED STATES (11 ciudades)
  ('MetLife Stadium',         'New York New Jersey', 'USA',    'America/New_York'),    -- PROVISIONAL: nombre
  ('Lincoln Financial Field', 'Philadelphia',        'USA',    'America/New_York'),    -- PROVISIONAL: nombre
  ('Hard Rock Stadium',       'Miami',               'USA',    'America/New_York'),    -- PROVISIONAL: nombre
  ('Gillette Stadium',        'Boston',              'USA',    'America/New_York'),    -- PROVISIONAL: nombre
  ('Mercedes-Benz Stadium',   'Atlanta',             'USA',    'America/New_York'),    -- PROVISIONAL: nombre
  ('NRG Stadium',             'Houston',             'USA',    'America/Chicago'),     -- PROVISIONAL: nombre
  ('AT&T Stadium',            'Dallas',              'USA',    'America/Chicago'),     -- PROVISIONAL: nombre
  ('Arrowhead Stadium',       'Kansas City',         'USA',    'America/Chicago'),     -- PROVISIONAL: nombre
  ('Levi''s Stadium',         'San Francisco Bay',   'USA',    'America/Los_Angeles'), -- PROVISIONAL: nombre
  ('SoFi Stadium',            'Los Angeles',         'USA',    'America/Los_Angeles'), -- PROVISIONAL: nombre
  ('Lumen Field',             'Seattle',             'USA',    'America/Los_Angeles'), -- PROVISIONAL: nombre
  -- CANADA (2 ciudades)
  ('BC Place',                'Vancouver',           'Canada', 'America/Vancouver'),   -- PROVISIONAL: nombre
  ('BMO Field',               'Toronto',             'Canada', 'America/Toronto'),     -- PROVISIONAL: nombre y venue
  -- MEXICO (3 ciudades)
  ('Estadio Azteca',          'Mexico City',         'Mexico', 'America/Mexico_City'), -- PROVISIONAL: nombre
  ('Estadio BBVA',            'Monterrey',           'Mexico', 'America/Mexico_City'), -- PROVISIONAL: nombre
  ('Estadio Akron',           'Guadalajara',         'Mexico', 'America/Mexico_City')  -- PROVISIONAL: nombre
on conflict (name, city, country) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 3. TEAMS (48 selecciones)
--    Fuente: sección "legend" del PDF (nombres y códigos FIFA)
-- ─────────────────────────────────────────────────────────────
insert into public.teams (code, name, short_name) values
  -- GRUPO A
  ('MEX', 'Mexico',               'Mexico'),
  ('RSA', 'South Africa',         'South Africa'),
  ('KOR', 'Korea Republic',       'Korea'),
  ('CZE', 'Czechia',              'Czechia'),
  -- GRUPO B
  ('CAN', 'Canada',               'Canada'),
  ('BIH', 'Bosnia & Herzegovina', 'Bosnia'),
  ('QAT', 'Qatar',                'Qatar'),
  ('SUI', 'Switzerland',          'Switzerland'),
  -- GRUPO C
  ('BRA', 'Brazil',               'Brazil'),
  ('MAR', 'Morocco',              'Morocco'),
  ('HAI', 'Haiti',                'Haiti'),
  ('SCO', 'Scotland',             'Scotland'),
  -- GRUPO D
  ('USA', 'United States',        'USA'),
  ('PAR', 'Paraguay',             'Paraguay'),
  ('AUS', 'Australia',            'Australia'),
  ('TUR', 'Türkiye',              'Türkiye'),
  -- GRUPO E
  ('GER', 'Germany',              'Germany'),
  ('CUW', 'Curaçao',              'Curaçao'),
  ('CIV', 'Côte d''Ivoire',       'Côte d''Ivoire'),
  ('ECU', 'Ecuador',              'Ecuador'),
  -- GRUPO F
  ('NED', 'Netherlands',          'Netherlands'),
  ('JPN', 'Japan',                'Japan'),
  ('SWE', 'Sweden',               'Sweden'),
  ('TUN', 'Tunisia',              'Tunisia'),
  -- GRUPO G
  ('BEL', 'Belgium',              'Belgium'),
  ('EGY', 'Egypt',                'Egypt'),
  ('IRN', 'IR Iran',              'Iran'),
  ('NZL', 'New Zealand',          'New Zealand'),
  -- GRUPO H
  ('ESP', 'Spain',                'Spain'),
  ('CPV', 'Cabo Verde',           'Cabo Verde'),
  ('KSA', 'Saudi Arabia',         'Saudi Arabia'),
  ('URU', 'Uruguay',              'Uruguay'),
  -- GRUPO I
  ('FRA', 'France',               'France'),
  ('SEN', 'Senegal',              'Senegal'),
  ('IRQ', 'Iraq',                 'Iraq'),
  ('NOR', 'Norway',               'Norway'),
  -- GRUPO J
  ('ARG', 'Argentina',            'Argentina'),
  ('ALG', 'Algeria',              'Algeria'),
  ('AUT', 'Austria',              'Austria'),
  ('JOR', 'Jordan',               'Jordan'),
  -- GRUPO K
  ('POR', 'Portugal',             'Portugal'),
  ('COD', 'Congo DR',             'Congo DR'),
  ('UZB', 'Uzbekistan',           'Uzbekistan'),
  ('COL', 'Colombia',             'Colombia'),
  -- GRUPO L
  ('ENG', 'England',              'England'),
  ('CRO', 'Croatia',              'Croatia'),
  ('GHA', 'Ghana',                'Ghana'),
  ('PAN', 'Panama',               'Panama')
on conflict (code) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 4. GROUP_TEAMS (48 entradas, un equipo por grupo)
--    Fuente: sección "legend" del PDF
--    ON CONFLICT DO NOTHING cubre tanto (group_code, team_id)
--    como el unique (team_id) en caso de re-ejecución.
-- ─────────────────────────────────────────────────────────────
insert into public.group_teams (group_code, team_id)
select 'A', id from public.teams where code in ('MEX', 'RSA', 'KOR', 'CZE')
union all
select 'B', id from public.teams where code in ('CAN', 'BIH', 'QAT', 'SUI')
union all
select 'C', id from public.teams where code in ('BRA', 'MAR', 'HAI', 'SCO')
union all
select 'D', id from public.teams where code in ('USA', 'PAR', 'AUS', 'TUR')
union all
select 'E', id from public.teams where code in ('GER', 'CUW', 'CIV', 'ECU')
union all
select 'F', id from public.teams where code in ('NED', 'JPN', 'SWE', 'TUN')
union all
select 'G', id from public.teams where code in ('BEL', 'EGY', 'IRN', 'NZL')
union all
select 'H', id from public.teams where code in ('ESP', 'CPV', 'KSA', 'URU')
union all
select 'I', id from public.teams where code in ('FRA', 'SEN', 'IRQ', 'NOR')
union all
select 'J', id from public.teams where code in ('ARG', 'ALG', 'AUT', 'JOR')
union all
select 'K', id from public.teams where code in ('POR', 'COD', 'UZB', 'COL')
union all
select 'L', id from public.teams where code in ('ENG', 'CRO', 'GHA', 'PAN')
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────
-- 5. APP_SETTINGS (fila global)
--    Prerequisito para que can_manage_prediction() funcione.
-- ─────────────────────────────────────────────────────────────
insert into public.app_settings (key, predictions_open, predictions_close_at, audits_visible)
values ('global', true, null, false)
on conflict (key) do nothing;
