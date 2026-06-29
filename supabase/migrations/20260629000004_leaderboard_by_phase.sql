-- ============================================================
-- get_leaderboard_by_phase(phase text)
--
-- Same scoring logic as get_leaderboard() but restricted to
-- a single stage group:
--   phase = 'group_stage'  → only group_stage matches
--   phase = 'knockout'     → all non-group_stage matches
--
-- Returns the same LeaderboardRow shape so the frontend can
-- reuse all existing components without any type changes.
-- The existing get_leaderboard() is NOT modified.
-- ============================================================

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
    -- Pre-filter predictions to the requested phase.
    -- Using a CTE JOIN (not LEFT JOIN) intentionally: a prediction
    -- that has no match row or whose match belongs to the wrong
    -- phase simply doesn't appear and contributes 0 to every user.
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

      -- base points (5 exact / 3 sign) + knockout bonus when applicable
      coalesce(sum(
        case
          when pp.official_home_score is null
            or pp.official_away_score is null             then 0
          when pp.home_score = pp.official_home_score
           and pp.away_score = pp.official_away_score     then 5
          when (
            case
              when pp.home_score > pp.away_score then 'home'
              when pp.home_score < pp.away_score then 'away'
              else 'draw'
            end
          ) = (
            case
              when pp.official_home_score > pp.official_away_score then 'home'
              when pp.official_home_score < pp.official_away_score then 'away'
              else 'draw'
            end
          )                                               then 3
          else                                                 0
        end
        +
        -- knockout bonus: +2 for predicting penalties, +1 for correct winner
        case
          when pp.stage = 'group_stage'                                         then 0
          when pp.home_score is null or pp.away_score is null                   then 0
          when pp.home_score <> pp.away_score                                   then 0  -- no pronosticó empate
          when pp.knockout_tiebreak is null                                     then 0  -- no completó tiebreak
          when pp.official_home_score is null or pp.official_away_score is null then 0
          when pp.official_home_score <> pp.official_away_score                 then 0  -- oficial no fue empate
          when pp.penalty_home_score is null                                    then 0  -- penales no registrados
          when pp.knockout_tiebreak <> 'penalties'                              then 0  -- pronosticó ET
          else 2 + case
            when pp.knockout_winner = (
              case when pp.penalty_home_score > pp.penalty_away_score then 'home' else 'away' end
            ) then 1
            else 0
          end
        end
      ), 0) as total_points,

      coalesce(sum(
        case
          when pp.home_score = pp.official_home_score
           and pp.away_score = pp.official_away_score
          then 1 else 0
        end
      ), 0) as exact_hits,

      coalesce(sum(
        case
          when pp.official_home_score is null
            or pp.official_away_score is null then 0
          when (
            case
              when pp.home_score > pp.away_score then 'home'
              when pp.home_score < pp.away_score then 'away'
              else 'draw'
            end
          ) = (
            case
              when pp.official_home_score > pp.official_away_score then 'home'
              when pp.official_home_score < pp.official_away_score then 'away'
              else 'draw'
            end
          ) then 1
          else 0
        end
      ), 0) as outcome_hits,

      coalesce(sum(
        case
          when pp.official_home_score is not null
           and pp.official_away_score is not null
          then 1 else 0
        end
      ), 0) as scored_predictions

    from public.profiles p
    left join phase_predictions pp on pp.user_id = p.id
    group by p.id, p.display_name, p.is_disabled
  )
  select
    agg.user_id,
    agg.display_name,
    agg.total_points,
    agg.exact_hits,
    agg.outcome_hits,
    agg.scored_predictions,
    agg.is_disabled
  from aggregated agg
  order by
    case when agg.is_disabled then 1 else 0 end asc,
    agg.total_points       desc,
    agg.exact_hits         desc,
    agg.display_name       asc;
$$;
