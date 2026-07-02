-- ============================================================
-- Fix 1: Match 75 (NED vs MAR, ESPN event 760488)
--   Nunca se sincronizó porque STATUS_FINAL_PEN no estaba
--   mapeado en el backend Go hasta el fix de hoy (aún no deployado).
--   Datos verificados con ESPN summary endpoint:
--     linescores h=[0,1,0,0,2] a=[0,1,0,0,3]
--     → regulation 1-1 (períodos 1+2), ET 0-0, penales NED 2 MAR 3
-- ============================================================

UPDATE public.matches
SET
  status               = 'finished',
  official_home_score  = 1,
  official_away_score  = 1,
  penalty_home_score   = 2,
  penalty_away_score   = 3,
  regulation_home_score = 1,
  regulation_away_score = 1,
  knockout_resolution  = 'penalties'
WHERE id = '75';

-- Propagar MAR como ganador al match 90 (away slot de W75)
SELECT public.sync_qualified_teams_into_knockout();

-- ============================================================
-- Fix 2: Restaurar leaderboard_point_adjustments en ambas RPCs.
--
-- Reglas:
--   get_leaderboard()             → aplica TODOS los ajustes
--   get_leaderboard_by_phase('knockout')    → aplica ajustes de fase 'knockout'
--   get_leaderboard_by_phase('group_stage') → aplica ajustes de fase 'group_stage'
--   applies_to_phase IS NULL → se aplica en todas las fases
-- ============================================================

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
  with raw_scores as (
    select
      p.id as user_id,
      p.display_name,
      coalesce(p.is_disabled, false) as is_disabled,

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
          when m.stage = 'group_stage'                           then 0
          when m.knockout_resolution is null                     then 0
          when m.regulation_home_score is null                   then 0
          when m.regulation_home_score <> m.regulation_away_score then 0
          when pr.home_score is null or pr.away_score is null    then 0
          when pr.home_score <> pr.away_score                    then 0
          when pr.knockout_tiebreak is null                      then 0
          when pr.knockout_tiebreak <> m.knockout_resolution     then 0
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
      ), 0) as base_points,

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
      ), 0) as scored_predictions

    from public.profiles p
    left join public.predictions pr on pr.user_id = p.id
    left join public.matches m on m.id = pr.match_id
    group by p.id, p.display_name, p.is_disabled
  ),
  -- Suma de ajustes manuales para este leaderboard (total = todos los ajustes).
  adjustments as (
    select user_id, coalesce(sum(points_delta), 0) as total_delta
    from public.leaderboard_point_adjustments
    group by user_id
  ),
  final as (
    select
      rs.user_id,
      rs.display_name,
      rs.is_disabled,
      (rs.base_points + coalesce(a.total_delta, 0))::bigint as total_points,
      rs.exact_hits,
      rs.outcome_hits,
      rs.scored_predictions
    from raw_scores rs
    left join adjustments a on a.user_id = rs.user_id
  )
  select
    f.user_id, f.display_name, f.total_points,
    f.exact_hits, f.outcome_hits, f.scored_predictions, f.is_disabled
  from final f
  order by
    case when f.is_disabled then 1 else 0 end asc,
    f.total_points    desc,
    f.exact_hits      desc,
    f.display_name    asc;
$$;

-- ── get_leaderboard_by_phase() con ajustes por fase ───────────────────────
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
  raw_scores as (
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
          when pp.stage = 'group_stage'                           then 0
          when pp.knockout_resolution is null                     then 0
          when pp.regulation_home_score is null                   then 0
          when pp.regulation_home_score <> pp.regulation_away_score then 0
          when pp.home_score is null or pp.away_score is null     then 0
          when pp.home_score <> pp.away_score                     then 0
          when pp.knockout_tiebreak is null                       then 0
          when pp.knockout_tiebreak <> pp.knockout_resolution     then 0
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
      ), 0) as base_points,

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
  ),
  -- Ajustes manuales filtrados por fase.
  -- applies_to_phase IS NULL → se aplica en todas las fases.
  adjustments as (
    select user_id, coalesce(sum(points_delta), 0) as total_delta
    from public.leaderboard_point_adjustments
    where applies_to_phase = phase or applies_to_phase is null
    group by user_id
  ),
  final as (
    select
      rs.user_id,
      rs.display_name,
      rs.is_disabled,
      (rs.base_points + coalesce(a.total_delta, 0))::bigint as total_points,
      rs.exact_hits,
      rs.outcome_hits,
      rs.scored_predictions
    from raw_scores rs
    left join adjustments a on a.user_id = rs.user_id
  )
  select
    f.user_id, f.display_name, f.total_points,
    f.exact_hits, f.outcome_hits, f.scored_predictions, f.is_disabled
  from final f
  order by
    case when f.is_disabled then 1 else 0 end asc,
    f.total_points  desc,
    f.exact_hits    desc,
    f.display_name  asc;
$$;
