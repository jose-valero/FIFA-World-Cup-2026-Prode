-- ============================================================
-- FIX: sync_qualified_teams_into_knockout — alineación con frontend
--
-- Cambios respecto a 20260409200002:
--
-- Fase 2 — tmp_group_rankings:
--   Agrega CTE h2h_stats que computa puntos/DG/GF head-to-head
--   para equipos empatados en (pts, DG, GF) dentro del mismo grupo.
--   Orden final: pts → DG → GF → h2h_pts → h2h_dg → h2h_gf → wins → name
--   Esto alinea la SQL con sortGroupRows() del frontend.
--
-- Fase 4 — tmp_third_place_teams:
--   Agrega wins como cuarto criterio de desempate (coincide con
--   sortCrossGroupRows() del frontend). Agrega columna best_third_rank
--   numerada para que el constraint-satisfaction sea determinista.
--
-- Fase 4 — asignación de terceros:
--   El CTE recursivo acumula total_rank y el SELECT final ordena por él,
--   garantizando que LIMIT 1 siempre elija el mismo resultado.
--
-- Criterios ausentes por falta de datos (limitación conocida):
--   - Disciplina / fair play (no hay feed de tarjetas)
--   - FIFA ranking pre-torneo (no hay columna en teams)
--   - Re-aplicación recursiva de H2H para subsets de 3+ equipos
--   Fallback final: team_name asc (determinístico, no FIFA)
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."sync_qualified_teams_into_knockout"()
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
declare
  v_group_stage_complete boolean := false;
  v_best_third_assignment jsonb := '{}'::jsonb;

  v_group_home_updates integer := 0;
  v_group_away_updates integer := 0;
  v_third_home_updates integer := 0;
  v_third_away_updates integer := 0;
  v_winner_home_updates integer := 0;
  v_winner_away_updates integer := 0;
  v_loser_home_updates integer := 0;
  v_loser_away_updates integer := 0;
  v_invalidated_matches integer := 0;
begin
  -- Captura el estado previo de todos los partidos de knockout.
  create temp table tmp_previous_knockout_state on commit drop as
  select
    m.id,
    m.home_team_id as prev_home_team_id,
    m.away_team_id as prev_away_team_id
  from public.matches m
  where m.stage <> 'group_stage';

  -- ── Fase 1: reset a placeholders ──────────────────────────────────────────
  update public.matches m
  set
    home_team_id = null,
    home_team_code = case m.home_source_type
      when 'group_position'   then m.home_source_group_rank::text || m.home_source_group_code
      when 'best_third_place' then '3' || m.home_source_group_set
      when 'match_winner'     then 'W' || m.home_source_match_id
      when 'match_loser'      then 'L' || m.home_source_match_id
      else null
    end,
    home_team = case m.home_source_type
      when 'group_position'   then m.home_source_group_rank::text || m.home_source_group_code
      when 'best_third_place' then '3' || m.home_source_group_set
      when 'match_winner'     then 'W' || m.home_source_match_id
      when 'match_loser'      then 'L' || m.home_source_match_id
      else null
    end,
    away_team_id = null,
    away_team_code = case m.away_source_type
      when 'group_position'   then m.away_source_group_rank::text || m.away_source_group_code
      when 'best_third_place' then '3' || m.away_source_group_set
      when 'match_winner'     then 'W' || m.away_source_match_id
      when 'match_loser'      then 'L' || m.away_source_match_id
      else null
    end,
    away_team = case m.away_source_type
      when 'group_position'   then m.away_source_group_rank::text || m.away_source_group_code
      when 'best_third_place' then '3' || m.away_source_group_set
      when 'match_winner'     then 'W' || m.away_source_match_id
      when 'match_loser'      then 'L' || m.away_source_match_id
      else null
    end
  where m.stage <> 'group_stage';

  -- ── Fase 2: ranking de grupos (con H2H) ───────────────────────────────────
  -- Orden: pts → DG → GF → h2h_pts → h2h_dg → h2h_gf → wins → name
  -- H2H solo aplica a equipos empatados en (pts, DG, GF) dentro del grupo.
  -- Equipos sin pares empatados reciben h2h = 0 (LEFT JOIN → COALESCE).
  create temp table tmp_group_rankings on commit drop as
  with finished_group_codes as (
    select m.group_code
    from public.matches m
    where m.stage = 'group_stage'
      and m.group_code is not null
    group by m.group_code
    having count(*) > 0
       and bool_and(m.status = 'finished')
  ),
  team_match_rows as (
    select
      m.group_code,
      m.home_team_id as team_id,
      t.code         as team_code,
      t.name         as team_name,
      m.official_home_score as goals_for,
      m.official_away_score as goals_against
    from public.matches m
    join finished_group_codes f on f.group_code = m.group_code
    join public.teams t on t.id = m.home_team_id
    where m.stage = 'group_stage'
      and m.status = 'finished'
      and m.official_home_score is not null
      and m.official_away_score is not null

    union all

    select
      m.group_code,
      m.away_team_id as team_id,
      t.code         as team_code,
      t.name         as team_name,
      m.official_away_score as goals_for,
      m.official_home_score as goals_against
    from public.matches m
    join finished_group_codes f on f.group_code = m.group_code
    join public.teams t on t.id = m.away_team_id
    where m.stage = 'group_stage'
      and m.status = 'finished'
      and m.official_home_score is not null
      and m.official_away_score is not null
  ),
  aggregates as (
    select
      group_code,
      team_id,
      max(team_code) as team_code,
      max(team_name) as team_name,
      count(*)       as played,
      sum(case when goals_for > goals_against then 1 else 0 end) as wins,
      sum(case when goals_for = goals_against then 1 else 0 end) as draws,
      sum(case when goals_for < goals_against then 1 else 0 end) as losses,
      sum(goals_for)                                              as goals_for,
      sum(goals_against)                                          as goals_against,
      sum(goals_for - goals_against)                             as goal_difference,
      sum(case
        when goals_for > goals_against then 3
        when goals_for = goals_against then 1
        else 0
      end) as points
    from team_match_rows
    group by group_code, team_id
  ),
  -- H2H stats entre equipos empatados en (pts, DG, GF) dentro del mismo grupo.
  -- Para cada equipo A, suma stats de los partidos contra peers con mismas métricas.
  h2h_stats as (
    select
      a.group_code,
      a.team_id,
      coalesce(sum(
        case
          when m.home_team_id = a.team_id then
            case
              when m.official_home_score > m.official_away_score then 3
              when m.official_home_score = m.official_away_score then 1
              else 0
            end
          else -- a es away
            case
              when m.official_away_score > m.official_home_score then 3
              when m.official_home_score = m.official_away_score then 1
              else 0
            end
        end
      ), 0) as h2h_points,
      coalesce(sum(
        case
          when m.home_team_id = a.team_id
            then m.official_home_score - m.official_away_score
          else
            m.official_away_score - m.official_home_score
        end
      ), 0) as h2h_gd,
      coalesce(sum(
        case
          when m.home_team_id = a.team_id then m.official_home_score
          else m.official_away_score
        end
      ), 0) as h2h_gf
    from aggregates a
    -- solo peers empatados en (pts, DG, GF) dentro del mismo grupo
    join aggregates peer
      on peer.group_code     = a.group_code
      and peer.team_id       <> a.team_id
      and peer.points        = a.points
      and peer.goal_difference = a.goal_difference
      and peer.goals_for     = a.goals_for
    -- partidos donde ambos son a y peer
    join public.matches m
      on m.stage  = 'group_stage'
      and m.status = 'finished'
      and m.official_home_score is not null
      and m.official_away_score is not null
      and (
        (m.home_team_id = a.team_id and m.away_team_id = peer.team_id)
        or
        (m.away_team_id = a.team_id and m.home_team_id = peer.team_id)
      )
    group by a.group_code, a.team_id
  )
  select
    a.group_code,
    a.team_id,
    a.team_code,
    a.team_name,
    a.played,
    a.wins,
    a.draws,
    a.losses,
    a.goals_for,
    a.goals_against,
    a.goal_difference,
    a.points,
    row_number() over (
      partition by a.group_code
      order by
        a.points           desc,
        a.goal_difference  desc,
        a.goals_for        desc,
        coalesce(h.h2h_points, 0) desc,
        coalesce(h.h2h_gd,     0) desc,
        coalesce(h.h2h_gf,     0) desc,
        a.wins             desc,
        a.team_name        asc   -- fallback determinístico (no FIFA)
    ) as rank_in_group
  from aggregates a
  left join h2h_stats h
    on h.group_code = a.group_code
    and h.team_id  = a.team_id;

  select coalesce(bool_and(group_finished), false)
  into v_group_stage_complete
  from (
    select
      m.group_code,
      bool_and(m.status = 'finished') as group_finished
    from public.matches m
    where m.stage = 'group_stage'
      and m.group_code is not null
    group by m.group_code
  ) s;

  -- ── Fase 3: poblar por posición de grupo ──────────────────────────────────
  update public.matches m
  set
    home_team_id   = r.team_id,
    home_team_code = r.team_code,
    home_team      = r.team_name
  from tmp_group_rankings r
  where m.stage <> 'group_stage'
    and m.home_source_type       = 'group_position'
    and m.home_source_group_code = r.group_code
    and m.home_source_group_rank = r.rank_in_group;

  get diagnostics v_group_home_updates = row_count;

  update public.matches m
  set
    away_team_id   = r.team_id,
    away_team_code = r.team_code,
    away_team      = r.team_name
  from tmp_group_rankings r
  where m.stage <> 'group_stage'
    and m.away_source_type       = 'group_position'
    and m.away_source_group_code = r.group_code
    and m.away_source_group_rank = r.rank_in_group;

  get diagnostics v_group_away_updates = row_count;

  -- ── Fase 4: mejores terceros ───────────────────────────────────────────────
  if v_group_stage_complete then

    -- Orden: pts → DG → GF → wins → name (alineado con sortCrossGroupRows).
    -- best_third_rank: posición 1-8 usada para determinismo en la asignación.
    create temp table tmp_third_place_teams on commit drop as
    select
      r.group_code,
      r.team_id,
      r.team_code,
      r.team_name,
      r.points,
      r.goal_difference,
      r.goals_for,
      r.wins,
      row_number() over (
        order by
          r.points          desc,
          r.goal_difference desc,
          r.goals_for       desc,
          r.wins            desc,
          r.team_name       asc
      ) as best_third_rank
    from tmp_group_rankings r
    where r.rank_in_group = 3
    order by
      r.points          desc,
      r.goal_difference desc,
      r.goals_for       desc,
      r.wins            desc,
      r.team_name       asc
    limit 8;

    create temp table tmp_best_third_slot_sets on commit drop as
    select distinct m.home_source_group_set as group_set
    from public.matches m
    where m.home_source_type = 'best_third_place'
      and m.home_source_group_set is not null

    union

    select distinct m.away_source_group_set as group_set
    from public.matches m
    where m.away_source_type = 'best_third_place'
      and m.away_source_group_set is not null;

    -- Constraint-satisfaction determinista.
    -- slot_candidates incluye best_third_rank para ordenar la exploración.
    -- total_rank acumula la suma de ranks usados; ORDER BY total_rank ASC
    -- garantiza que LIMIT 1 siempre elija la asignación con los mejores equipos.
    with slot_candidates as (
      select
        s.group_set,
        t.group_code,
        t.team_id,
        t.team_code,
        t.team_name,
        t.best_third_rank
      from tmp_best_third_slot_sets s
      join tmp_third_place_teams t
        on position(t.group_code in s.group_set) > 0
    ),
    ordered_slots as (
      select
        x.group_set,
        row_number() over (
          order by x.candidate_count asc, x.group_set asc
        ) as ord
      from (
        select sc.group_set, count(*) as candidate_count
        from slot_candidates sc
        group by sc.group_set
      ) x
    ),
    recursive_assign as (
      -- Base: todos los candidatos del slot más restringido (ord=1).
      -- best_third_rank como semilla de total_rank para ordenar resultados.
      select
        1 as depth,
        array[os.group_set]::text[]  as used_slots,
        array[sc.group_code]::text[] as used_groups,
        sc.best_third_rank::bigint   as total_rank,
        jsonb_build_object(
          os.group_set,
          jsonb_build_object(
            'group_code', sc.group_code,
            'team_id',    sc.team_id,
            'team_code',  sc.team_code,
            'team_name',  sc.team_name
          )
        ) as assignment
      from ordered_slots os
      join slot_candidates sc on sc.group_set = os.group_set
      where os.ord = 1

      union all

      select
        ra.depth + 1,
        ra.used_slots  || os.group_set,
        ra.used_groups || sc.group_code,
        ra.total_rank  + sc.best_third_rank,
        ra.assignment  || jsonb_build_object(
          os.group_set,
          jsonb_build_object(
            'group_code', sc.group_code,
            'team_id',    sc.team_id,
            'team_code',  sc.team_code,
            'team_name',  sc.team_name
          )
        )
      from recursive_assign ra
      join ordered_slots os
        on os.ord = ra.depth + 1
      join slot_candidates sc
        on sc.group_set = os.group_set
      where not sc.group_code = any(ra.used_groups)
    )
    select ra.assignment
    into v_best_third_assignment
    from recursive_assign ra
    where ra.depth = (select count(*) from ordered_slots)
    order by ra.total_rank asc   -- determinismo: prefiere equipos mejor rankeados
    limit 1;

    if v_best_third_assignment is null then
      v_best_third_assignment := '{}'::jsonb;
    end if;

    create temp table tmp_best_third_assignment on commit drop as
    select
      e.key                        as group_set,
      (e.value ->> 'group_code')   as group_code,
      (e.value ->> 'team_id')::uuid as team_id,
      (e.value ->> 'team_code')    as team_code,
      (e.value ->> 'team_name')    as team_name
    from jsonb_each(v_best_third_assignment) e;

    update public.matches m
    set
      home_team_id   = a.team_id,
      home_team_code = a.team_code,
      home_team      = a.team_name
    from tmp_best_third_assignment a
    where m.home_source_type      = 'best_third_place'
      and m.home_source_group_set = a.group_set;

    get diagnostics v_third_home_updates = row_count;

    update public.matches m
    set
      away_team_id   = a.team_id,
      away_team_code = a.team_code,
      away_team      = a.team_name
    from tmp_best_third_assignment a
    where m.away_source_type      = 'best_third_place'
      and m.away_source_group_set = a.group_set;

    get diagnostics v_third_away_updates = row_count;
  end if;

  -- ── Fase 5: propagar ganadores de knockout ────────────────────────────────
  update public.matches m
  set
    home_team_id   = case when sm.official_home_score > sm.official_away_score then sm.home_team_id   else sm.away_team_id   end,
    home_team_code = case when sm.official_home_score > sm.official_away_score then sm.home_team_code else sm.away_team_code end,
    home_team      = case when sm.official_home_score > sm.official_away_score then sm.home_team      else sm.away_team      end
  from public.matches sm
  left join tmp_previous_knockout_state ps on ps.id = sm.id
  where m.home_source_type    = 'match_winner'
    and m.home_source_match_id = sm.id
    and sm.status              = 'finished'
    and sm.official_home_score is not null
    and sm.official_away_score is not null
    and sm.official_home_score <> sm.official_away_score
    and sm.home_team_id        is not null
    and sm.away_team_id        is not null
    and not (
      sm.home_team_id is distinct from ps.prev_home_team_id
      or sm.away_team_id is distinct from ps.prev_away_team_id
    );

  get diagnostics v_winner_home_updates = row_count;

  update public.matches m
  set
    away_team_id   = case when sm.official_home_score > sm.official_away_score then sm.home_team_id   else sm.away_team_id   end,
    away_team_code = case when sm.official_home_score > sm.official_away_score then sm.home_team_code else sm.away_team_code end,
    away_team      = case when sm.official_home_score > sm.official_away_score then sm.home_team      else sm.away_team      end
  from public.matches sm
  left join tmp_previous_knockout_state ps on ps.id = sm.id
  where m.away_source_type    = 'match_winner'
    and m.away_source_match_id = sm.id
    and sm.status              = 'finished'
    and sm.official_home_score is not null
    and sm.official_away_score is not null
    and sm.official_home_score <> sm.official_away_score
    and sm.home_team_id        is not null
    and sm.away_team_id        is not null
    and not (
      sm.home_team_id is distinct from ps.prev_home_team_id
      or sm.away_team_id is distinct from ps.prev_away_team_id
    );

  get diagnostics v_winner_away_updates = row_count;

  -- ── Fase 6: propagar perdedores (3er puesto) ─────────────────────────────
  update public.matches m
  set
    home_team_id   = case when sm.official_home_score < sm.official_away_score then sm.home_team_id   else sm.away_team_id   end,
    home_team_code = case when sm.official_home_score < sm.official_away_score then sm.home_team_code else sm.away_team_code end,
    home_team      = case when sm.official_home_score < sm.official_away_score then sm.home_team      else sm.away_team      end
  from public.matches sm
  left join tmp_previous_knockout_state ps on ps.id = sm.id
  where m.home_source_type    = 'match_loser'
    and m.home_source_match_id = sm.id
    and sm.status              = 'finished'
    and sm.official_home_score is not null
    and sm.official_away_score is not null
    and sm.official_home_score <> sm.official_away_score
    and sm.home_team_id        is not null
    and sm.away_team_id        is not null
    and not (
      sm.home_team_id is distinct from ps.prev_home_team_id
      or sm.away_team_id is distinct from ps.prev_away_team_id
    );

  get diagnostics v_loser_home_updates = row_count;

  update public.matches m
  set
    away_team_id   = case when sm.official_home_score < sm.official_away_score then sm.home_team_id   else sm.away_team_id   end,
    away_team_code = case when sm.official_home_score < sm.official_away_score then sm.home_team_code else sm.away_team_code end,
    away_team      = case when sm.official_home_score < sm.official_away_score then sm.home_team      else sm.away_team      end
  from public.matches sm
  left join tmp_previous_knockout_state ps on ps.id = sm.id
  where m.away_source_type    = 'match_loser'
    and m.away_source_match_id = sm.id
    and sm.status              = 'finished'
    and sm.official_home_score is not null
    and sm.official_away_score is not null
    and sm.official_home_score <> sm.official_away_score
    and sm.home_team_id        is not null
    and sm.away_team_id        is not null
    and not (
      sm.home_team_id is distinct from ps.prev_home_team_id
      or sm.away_team_id is distinct from ps.prev_away_team_id
    );

  get diagnostics v_loser_away_updates = row_count;

  -- ── Fase 7: invalidar partidos con equipos cambiados o incompletos ────────
  update public.matches m
  set
    status               = 'scheduled',
    official_home_score  = null,
    official_away_score  = null
  from tmp_previous_knockout_state ps
  where m.id = ps.id
    and (
      m.home_team_id is null
      or m.away_team_id is null
      or m.home_team_id is distinct from ps.prev_home_team_id
      or m.away_team_id is distinct from ps.prev_away_team_id
    )
    and (
      m.status is distinct from 'scheduled'
      or m.official_home_score is not null
      or m.official_away_score is not null
    );

  get diagnostics v_invalidated_matches = row_count;

  return jsonb_build_object(
    'group_stage_complete',       v_group_stage_complete,
    'best_third_assignment_found', v_best_third_assignment <> '{}'::jsonb,
    'updated_group_position_home', v_group_home_updates,
    'updated_group_position_away', v_group_away_updates,
    'updated_best_third_home',     v_third_home_updates,
    'updated_best_third_away',     v_third_away_updates,
    'updated_match_winner_home',   v_winner_home_updates,
    'updated_match_winner_away',   v_winner_away_updates,
    'updated_match_loser_home',    v_loser_home_updates,
    'updated_match_loser_away',    v_loser_away_updates,
    'invalidated_knockout_matches', v_invalidated_matches
  );
end;
$$;
