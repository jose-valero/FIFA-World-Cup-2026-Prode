-- ============================================================
-- Agrega marcador de reglamento y método de resolución para
-- partidos de knockout. Necesario para:
--   1. Puntuar correctamente cuando hubo prórroga (ET):
--      - official_home/away_score = marcador final del partido (después de ET)
--      - regulation_home/away_score = marcador al final de los 90 minutos
--   2. Aplicar el bonus de tiebreak (ET o penales) de forma correcta.
--
-- Para grupos: ambas columnas permanecen NULL (official_* es suficiente).
-- Para knockout en reglamento: regulation = official (mismo valor, se rellena explícitamente).
-- Para knockout en ET: regulation = marcador 90min ≠ official (ET final).
-- Para knockout en penales: regulation = official = empate.
-- ============================================================

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS regulation_home_score integer,
  ADD COLUMN IF NOT EXISTS regulation_away_score integer,
  ADD COLUMN IF NOT EXISTS knockout_resolution   text
    CHECK (knockout_resolution IN ('regulation', 'extra_time', 'penalties'));

-- ── Backfill de los 5 partidos round_of_32 ya terminados ──────────────────
-- Verificado con ESPN summary endpoint (linescores count):
--   2 períodos = victoria en reglamento
--   5 períodos = penales (períodos 1+2=reg, 3+4=ET goles=0, 5=penales)

-- Match 73: RSA 0-1 CAN  │ linescores: h=[0,0] a=[0,1]  → reglamento
UPDATE public.matches SET regulation_home_score=0, regulation_away_score=1, knockout_resolution='regulation' WHERE id='73';

-- Match 74: GER 1-1 PAR  │ linescores: h=[0,1,0,0,3] a=[1,0,0,0,4] → penales
UPDATE public.matches SET regulation_home_score=1, regulation_away_score=1, knockout_resolution='penalties' WHERE id='74';

-- Match 76: BRA 2-1 JPN  │ linescores: h=[0,2] a=[1,0]  → reglamento
UPDATE public.matches SET regulation_home_score=2, regulation_away_score=1, knockout_resolution='regulation' WHERE id='76';

-- Match 77: FRA 3-0 SWE  │ linescores: h=[1,2] a=[0,0]  → reglamento
UPDATE public.matches SET regulation_home_score=3, regulation_away_score=0, knockout_resolution='regulation' WHERE id='77';

-- Match 78: CIV 1-2 NOR  │ linescores: h=[0,1] a=[1,1]  → reglamento
UPDATE public.matches SET regulation_home_score=1, regulation_away_score=2, knockout_resolution='regulation' WHERE id='78';

-- ── get_leaderboard() actualizado ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION "public"."get_leaderboard"()
RETURNS TABLE(
  "user_id"            uuid,
  "display_name"       text,
  "total_points"       bigint,
  "exact_hits"         bigint,
  "outcome_hits"       bigint,
  "scored_predictions" bigint,
  "is_disabled"        boolean
)
LANGUAGE "sql" SECURITY DEFINER
SET "search_path" TO ''
AS $$
  -- comp_home / comp_away: marcador de comparación para el usuario.
  --   Grupos: official_home_score (regulation_home_score siempre NULL en grupos).
  --   Knockout: regulation_home_score (90min) cuando está disponible;
  --             cae a official_home_score mientras no se rellene.
  select
    p.id as user_id,
    p.display_name,

    coalesce(sum(
      -- puntos base (exacto=5, signo=3)
      case
        when coalesce(m.regulation_home_score, m.official_home_score) is null
          or coalesce(m.regulation_away_score, m.official_away_score) is null then 0
        when pr.home_score = coalesce(m.regulation_home_score, m.official_home_score)
         and pr.away_score = coalesce(m.regulation_away_score, m.official_away_score) then 5
        when (
          case when pr.home_score > pr.away_score then 'home'
               when pr.home_score < pr.away_score then 'away'
               else 'draw' end
        ) = (
          case when coalesce(m.regulation_home_score, m.official_home_score) > coalesce(m.regulation_away_score, m.official_away_score) then 'home'
               when coalesce(m.regulation_home_score, m.official_home_score) < coalesce(m.regulation_away_score, m.official_away_score) then 'away'
               else 'draw' end
        ) then 3
        else 0
      end
      +
      -- bonus knockout (+2 método, +1 ganador)
      case
        when m.stage = 'group_stage'                      then 0
        when m.knockout_resolution is null                then 0  -- partido no terminado o no registrado
        when m.regulation_home_score is null              then 0
        when m.regulation_home_score <> m.regulation_away_score then 0  -- no fue empate en 90min
        when pr.home_score is null or pr.away_score is null then 0
        when pr.home_score <> pr.away_score               then 0  -- usuario no pronosticó empate
        when pr.knockout_tiebreak is null                 then 0  -- usuario no completó tiebreak
        when pr.knockout_tiebreak <> m.knockout_resolution then 0  -- método incorrecto
        -- acertó el método (+2) + posible ganador (+1)
        else 2 + case
          when m.knockout_resolution = 'penalties' then
            case when pr.knockout_winner = (
              case when m.penalty_home_score > m.penalty_away_score then 'home' else 'away' end
            ) then 1 else 0 end
          when m.knockout_resolution = 'extra_time' then
            case when pr.knockout_winner = (
              case when m.official_home_score > m.official_away_score then 'home' else 'away' end
            ) then 1 else 0 end
          else 0
        end
      end
    ), 0) as total_points,

    coalesce(sum(
      case
        when pr.home_score = coalesce(m.regulation_home_score, m.official_home_score)
         and pr.away_score = coalesce(m.regulation_away_score, m.official_away_score)
        then 1 else 0
      end
    ), 0) as exact_hits,

    coalesce(sum(
      case
        when coalesce(m.regulation_home_score, m.official_home_score) is null
          or coalesce(m.regulation_away_score, m.official_away_score) is null then 0
        when (
          case when pr.home_score > pr.away_score then 'home'
               when pr.home_score < pr.away_score then 'away'
               else 'draw' end
        ) = (
          case when coalesce(m.regulation_home_score, m.official_home_score) > coalesce(m.regulation_away_score, m.official_away_score) then 'home'
               when coalesce(m.regulation_home_score, m.official_home_score) < coalesce(m.regulation_away_score, m.official_away_score) then 'away'
               else 'draw' end
        ) then 1 else 0
      end
    ), 0) as outcome_hits,

    coalesce(sum(
      case
        when m.official_home_score is not null
         and m.official_away_score is not null then 1 else 0
      end
    ), 0) as scored_predictions,

    coalesce(p.is_disabled, false) as is_disabled

  from public.profiles p
  left join public.predictions pr on pr.user_id = p.id
  left join public.matches m on m.id = pr.match_id
  group by p.id, p.display_name, p.is_disabled
  order by
    case when coalesce(p.is_disabled, false) then 1 else 0 end asc,
    coalesce(sum(
      case
        when coalesce(m.regulation_home_score, m.official_home_score) is null
          or coalesce(m.regulation_away_score, m.official_away_score) is null then 0
        when pr.home_score = coalesce(m.regulation_home_score, m.official_home_score)
         and pr.away_score = coalesce(m.regulation_away_score, m.official_away_score) then 5
        when (
          case when pr.home_score > pr.away_score then 'home'
               when pr.home_score < pr.away_score then 'away'
               else 'draw' end
        ) = (
          case when coalesce(m.regulation_home_score, m.official_home_score) > coalesce(m.regulation_away_score, m.official_away_score) then 'home'
               when coalesce(m.regulation_home_score, m.official_home_score) < coalesce(m.regulation_away_score, m.official_away_score) then 'away'
               else 'draw' end
        ) then 3
        else 0
      end
      +
      case
        when m.stage = 'group_stage'                      then 0
        when m.knockout_resolution is null                then 0
        when m.regulation_home_score is null              then 0
        when m.regulation_home_score <> m.regulation_away_score then 0
        when pr.home_score is null or pr.away_score is null then 0
        when pr.home_score <> pr.away_score               then 0
        when pr.knockout_tiebreak is null                 then 0
        when pr.knockout_tiebreak <> m.knockout_resolution then 0
        else 2 + case
          when m.knockout_resolution = 'penalties' then
            case when pr.knockout_winner = (
              case when m.penalty_home_score > m.penalty_away_score then 'home' else 'away' end
            ) then 1 else 0 end
          when m.knockout_resolution = 'extra_time' then
            case when pr.knockout_winner = (
              case when m.official_home_score > m.official_away_score then 'home' else 'away' end
            ) then 1 else 0 end
          else 0
        end
      end
    ), 0) desc,
    coalesce(sum(
      case
        when pr.home_score = coalesce(m.regulation_home_score, m.official_home_score)
         and pr.away_score = coalesce(m.regulation_away_score, m.official_away_score)
        then 1 else 0
      end
    ), 0) desc,
    p.display_name asc;
$$;

-- ── get_leaderboard_by_phase() actualizado ────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_leaderboard_by_phase(phase text)
RETURNS TABLE(
  "user_id"            uuid,
  "display_name"       text,
  "total_points"       bigint,
  "exact_hits"         bigint,
  "outcome_hits"       bigint,
  "scored_predictions" bigint,
  "is_disabled"        boolean
)
LANGUAGE sql SECURITY DEFINER
SET search_path TO ''
AS $$
  with phase_predictions as (
    select
      pr.user_id,
      pr.home_score,
      pr.away_score,
      pr.knockout_tiebreak,
      pr.knockout_winner,
      m.official_home_score,
      m.official_away_score,
      m.penalty_home_score,
      m.penalty_away_score,
      m.regulation_home_score,
      m.regulation_away_score,
      m.knockout_resolution,
      m.stage
    from public.predictions pr
    join public.matches m on m.id = pr.match_id
    where
      (phase = 'group_stage' and m.stage = 'group_stage')
      or
      (phase = 'knockout'    and m.stage <> 'group_stage')
  ),
  aggregated as (
    select
      p.id            as user_id,
      p.display_name,
      coalesce(p.is_disabled, false) as is_disabled,

      coalesce(sum(
        case
          when coalesce(pp.regulation_home_score, pp.official_home_score) is null
            or coalesce(pp.regulation_away_score, pp.official_away_score) is null then 0
          when pp.home_score = coalesce(pp.regulation_home_score, pp.official_home_score)
           and pp.away_score = coalesce(pp.regulation_away_score, pp.official_away_score) then 5
          when (
            case when pp.home_score > pp.away_score then 'home'
                 when pp.home_score < pp.away_score then 'away'
                 else 'draw' end
          ) = (
            case when coalesce(pp.regulation_home_score, pp.official_home_score) > coalesce(pp.regulation_away_score, pp.official_away_score) then 'home'
                 when coalesce(pp.regulation_home_score, pp.official_home_score) < coalesce(pp.regulation_away_score, pp.official_away_score) then 'away'
                 else 'draw' end
          ) then 3
          else 0
        end
        +
        case
          when pp.stage = 'group_stage'                      then 0
          when pp.knockout_resolution is null                then 0
          when pp.regulation_home_score is null              then 0
          when pp.regulation_home_score <> pp.regulation_away_score then 0
          when pp.home_score is null or pp.away_score is null then 0
          when pp.home_score <> pp.away_score                then 0
          when pp.knockout_tiebreak is null                  then 0
          when pp.knockout_tiebreak <> pp.knockout_resolution then 0
          else 2 + case
            when pp.knockout_resolution = 'penalties' then
              case when pp.knockout_winner = (
                case when pp.penalty_home_score > pp.penalty_away_score then 'home' else 'away' end
              ) then 1 else 0 end
            when pp.knockout_resolution = 'extra_time' then
              case when pp.knockout_winner = (
                case when pp.official_home_score > pp.official_away_score then 'home' else 'away' end
              ) then 1 else 0 end
            else 0
          end
        end
      ), 0) as total_points,

      coalesce(sum(
        case
          when pp.home_score = coalesce(pp.regulation_home_score, pp.official_home_score)
           and pp.away_score = coalesce(pp.regulation_away_score, pp.official_away_score)
          then 1 else 0
        end
      ), 0) as exact_hits,

      coalesce(sum(
        case
          when coalesce(pp.regulation_home_score, pp.official_home_score) is null
            or coalesce(pp.regulation_away_score, pp.official_away_score) is null then 0
          when (
            case when pp.home_score > pp.away_score then 'home'
                 when pp.home_score < pp.away_score then 'away'
                 else 'draw' end
          ) = (
            case when coalesce(pp.regulation_home_score, pp.official_home_score) > coalesce(pp.regulation_away_score, pp.official_away_score) then 'home'
                 when coalesce(pp.regulation_home_score, pp.official_home_score) < coalesce(pp.regulation_away_score, pp.official_away_score) then 'away'
                 else 'draw' end
          ) then 1 else 0
        end
      ), 0) as outcome_hits,

      coalesce(sum(
        case
          when pp.official_home_score is not null
           and pp.official_away_score is not null then 1 else 0
        end
      ), 0) as scored_predictions

    from public.profiles p
    left join phase_predictions pp on pp.user_id = p.id
    group by p.id, p.display_name, p.is_disabled
  )
  select
    agg.user_id, agg.display_name, agg.total_points,
    agg.exact_hits, agg.outcome_hits, agg.scored_predictions, agg.is_disabled
  from aggregated agg
  order by
    case when agg.is_disabled then 1 else 0 end asc,
    agg.total_points  desc,
    agg.exact_hits    desc,
    agg.display_name  asc;
$$;
