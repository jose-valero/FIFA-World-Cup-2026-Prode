-- ============================================================
-- Fase 4: predicciones de knockout con tiebreak y ganador final
--
-- 1. Agrega knockout_tiebreak y knockout_winner a predictions.
--    Solo se persisten cuando el partido es knockout y el usuario
--    pronostica empate en los 90 minutos.
--
-- 2. Actualiza get_leaderboard() con bonus knockout:
--    +2 si acierta el método de definición (solo 'penalties' detectable)
--    +1 si además acierta el ganador final del cruce
--
-- Limitación MVP: 'extra_time' como método nunca genera bonus porque
-- cuando ET resuelve el partido ESPN informa un score diferente (no empate).
-- Actualmente solo 'penalties' es detectable via penalty_home/away_score.
-- ============================================================

ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS knockout_tiebreak text,
  ADD COLUMN IF NOT EXISTS knockout_winner   text;

ALTER TABLE public.predictions
  ADD CONSTRAINT chk_knockout_tiebreak_values
    CHECK (knockout_tiebreak IS NULL OR knockout_tiebreak IN ('extra_time', 'penalties')),
  ADD CONSTRAINT chk_knockout_winner_values
    CHECK (knockout_winner IS NULL OR knockout_winner IN ('home', 'away')),
  ADD CONSTRAINT chk_knockout_fields_together
    CHECK ((knockout_tiebreak IS NULL) = (knockout_winner IS NULL));

-- ── get_leaderboard actualizado con bonus knockout ─────────────────────────
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
  select
    p.id as user_id,
    p.display_name,

    -- puntos base (5 exacto, 3 sign) + bonus knockout
    coalesce(sum(
      case
        when m.official_home_score is null or m.official_away_score is null then 0
        when pr.home_score = m.official_home_score
         and pr.away_score = m.official_away_score then 5
        when (
          case
            when pr.home_score > pr.away_score then 'home'
            when pr.home_score < pr.away_score then 'away'
            else 'draw'
          end
        ) = (
          case
            when m.official_home_score > m.official_away_score then 'home'
            when m.official_home_score < m.official_away_score then 'away'
            else 'draw'
          end
        ) then 3
        else 0
      end
      +
      -- bonus knockout: solo cuando usuario pronosticó empate en 90,
      -- el resultado oficial también es empate, y fue a penales
      case
        when m.stage = 'group_stage'                                    then 0
        when pr.home_score is null or pr.away_score is null             then 0
        when pr.home_score <> pr.away_score                             then 0  -- no pronosticó empate
        when pr.knockout_tiebreak is null                               then 0  -- no completó tiebreak
        when m.official_home_score is null or m.official_away_score is null then 0
        when m.official_home_score <> m.official_away_score             then 0  -- oficial no fue empate
        -- oficial fue empate → fue a penales (la única forma de terminar en empate en nuestros datos)
        when m.penalty_home_score is null                               then 0  -- penales no registrados aún
        when pr.knockout_tiebreak <> 'penalties'                        then 0  -- pronosticó ET, oficial fue penales
        -- acertó el método (+2) + posible ganador (+1)
        else 2 + case
          when pr.knockout_winner = (
            case when m.penalty_home_score > m.penalty_away_score then 'home' else 'away' end
          ) then 1
          else 0
        end
      end
    ), 0) as total_points,

    coalesce(sum(
      case
        when pr.home_score = m.official_home_score
         and pr.away_score = m.official_away_score
        then 1 else 0
      end
    ), 0) as exact_hits,

    coalesce(sum(
      case
        when m.official_home_score is null or m.official_away_score is null then 0
        when (
          case
            when pr.home_score > pr.away_score then 'home'
            when pr.home_score < pr.away_score then 'away'
            else 'draw'
          end
        ) = (
          case
            when m.official_home_score > m.official_away_score then 'home'
            when m.official_home_score < m.official_away_score then 'away'
            else 'draw'
          end
        ) then 1
        else 0
      end
    ), 0) as outcome_hits,

    coalesce(sum(
      case
        when m.official_home_score is not null
         and m.official_away_score is not null
        then 1 else 0
      end
    ), 0) as scored_predictions,

    coalesce(p.is_disabled, false) as is_disabled

  from public.profiles p
  left join public.predictions pr
    on pr.user_id = p.id
  left join public.matches m
    on m.id = pr.match_id
  group by p.id, p.display_name, p.is_disabled
  order by
    case when coalesce(p.is_disabled, false) then 1 else 0 end asc,
    coalesce(sum(
      case
        when m.official_home_score is null or m.official_away_score is null then 0
        when pr.home_score = m.official_home_score
         and pr.away_score = m.official_away_score then 5
        when (
          case when pr.home_score > pr.away_score then 'home'
               when pr.home_score < pr.away_score then 'away'
               else 'draw' end
        ) = (
          case when m.official_home_score > m.official_away_score then 'home'
               when m.official_home_score < m.official_away_score then 'away'
               else 'draw' end
        ) then 3
        else 0
      end
      +
      case
        when m.stage = 'group_stage'                                    then 0
        when pr.home_score is null or pr.away_score is null             then 0
        when pr.home_score <> pr.away_score                             then 0
        when pr.knockout_tiebreak is null                               then 0
        when m.official_home_score is null or m.official_away_score is null then 0
        when m.official_home_score <> m.official_away_score             then 0
        when m.penalty_home_score is null                               then 0
        when pr.knockout_tiebreak <> 'penalties'                        then 0
        else 2 + case
          when pr.knockout_winner = (
            case when m.penalty_home_score > m.penalty_away_score then 'home' else 'away' end
          ) then 1 else 0 end
      end
    ), 0) desc,
    coalesce(sum(
      case
        when pr.home_score = m.official_home_score
         and pr.away_score = m.official_away_score then 1 else 0
      end
    ), 0) desc,
    p.display_name asc;
$$;
