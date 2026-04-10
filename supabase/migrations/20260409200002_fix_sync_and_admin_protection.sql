-- ============================================================
-- FIX 1: sync_qualified_teams_into_knockout
-- Reemplaza el primer bloque UPDATE que usaba FULL JOIN ON FALSE.
-- Ese join producía hasta 48 rows candidatas por partido, haciendo
-- el UPDATE no-determinístico según el estándar SQL (aunque en la
-- práctica producía el resultado correcto porque los valores del SET
-- no provenían de las tablas joineadas).
-- El nuevo UPDATE es directo, determinístico y más eficiente.
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
  -- Captura el estado previo de todos los partidos de knockout
  -- para detectar cambios al final y decidir qué invalidar.
  create temp table tmp_previous_knockout_state on commit drop as
  select
    m.id,
    m.home_team_id as prev_home_team_id,
    m.away_team_id as prev_away_team_id
  from public.matches m
  where m.stage <> 'group_stage';

  -- Fase 1: reset de todos los partidos de knockout a estado placeholder.
  -- Limpia team_ids y pone códigos descriptivos (ej: "2A", "W73", "3ABCDF").
  -- Reemplaza el anterior FULL JOIN ON FALSE que era no-determinístico.
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

  -- Fase 2: calcular clasificaciones de grupos finalizados.
  create temp table tmp_group_rankings on commit drop as
  with finished_group_codes as (
    select
      m.group_code
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
      t.code as team_code,
      t.name as team_name,
      m.official_home_score as goals_for,
      m.official_away_score as goals_against
    from public.matches m
    join finished_group_codes f
      on f.group_code = m.group_code
    join public.teams t
      on t.id = m.home_team_id
    where m.stage = 'group_stage'
      and m.status = 'finished'
      and m.official_home_score is not null
      and m.official_away_score is not null

    union all

    select
      m.group_code,
      m.away_team_id as team_id,
      t.code as team_code,
      t.name as team_name,
      m.official_away_score as goals_for,
      m.official_home_score as goals_against
    from public.matches m
    join finished_group_codes f
      on f.group_code = m.group_code
    join public.teams t
      on t.id = m.away_team_id
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
      count(*) as played,
      sum(case when goals_for > goals_against then 1 else 0 end) as wins,
      sum(case when goals_for = goals_against then 1 else 0 end) as draws,
      sum(case when goals_for < goals_against then 1 else 0 end) as losses,
      sum(goals_for) as goals_for,
      sum(goals_against) as goals_against,
      sum(goals_for - goals_against) as goal_difference,
      sum(
        case
          when goals_for > goals_against then 3
          when goals_for = goals_against then 1
          else 0
        end
      ) as points
    from team_match_rows
    group by group_code, team_id
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
        a.points desc,
        a.goal_difference desc,
        a.goals_for desc,
        a.team_name asc
    ) as rank_in_group
  from aggregates a;

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

  -- Fase 3: poblar equipos según posición en el grupo (1°, 2°, 3°).
  update public.matches m
  set
    home_team_id = r.team_id,
    home_team_code = r.team_code,
    home_team = r.team_name
  from tmp_group_rankings r
  where m.stage <> 'group_stage'
    and m.home_source_type = 'group_position'
    and m.home_source_group_code = r.group_code
    and m.home_source_group_rank = r.rank_in_group;

  get diagnostics v_group_home_updates = row_count;

  update public.matches m
  set
    away_team_id = r.team_id,
    away_team_code = r.team_code,
    away_team = r.team_name
  from tmp_group_rankings r
  where m.stage <> 'group_stage'
    and m.away_source_type = 'group_position'
    and m.away_source_group_code = r.group_code
    and m.away_source_group_rank = r.rank_in_group;

  get diagnostics v_group_away_updates = row_count;

  -- Fase 4: asignar los 8 mejores terceros a sus slots (solo cuando
  -- la fase de grupos está completa).
  if v_group_stage_complete then
    create temp table tmp_third_place_teams on commit drop as
    select
      r.group_code,
      r.team_id,
      r.team_code,
      r.team_name,
      r.points,
      r.goal_difference,
      r.goals_for
    from tmp_group_rankings r
    where r.rank_in_group = 3
    order by
      r.points desc,
      r.goal_difference desc,
      r.goals_for desc,
      r.team_name asc
    limit 8;

    create temp table tmp_best_third_slot_sets on commit drop as
    select distinct
      m.home_source_group_set as group_set
    from public.matches m
    where m.home_source_type = 'best_third_place'
      and m.home_source_group_set is not null

    union

    select distinct
      m.away_source_group_set as group_set
    from public.matches m
    where m.away_source_type = 'best_third_place'
      and m.away_source_group_set is not null;

    with slot_candidates as (
      select
        s.group_set,
        t.group_code,
        t.team_id,
        t.team_code,
        t.team_name
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
        select
          sc.group_set,
          count(*) as candidate_count
        from slot_candidates sc
        group by sc.group_set
      ) x
    ),
    recursive_assign as (
      select
        1 as depth,
        array[os.group_set]::text[] as used_slots,
        array[sc.group_code]::text[] as used_groups,
        jsonb_build_object(
          os.group_set,
          jsonb_build_object(
            'group_code', sc.group_code,
            'team_id', sc.team_id,
            'team_code', sc.team_code,
            'team_name', sc.team_name
          )
        ) as assignment
      from ordered_slots os
      join slot_candidates sc
        on sc.group_set = os.group_set
      where os.ord = 1

      union all

      select
        ra.depth + 1,
        ra.used_slots || os.group_set,
        ra.used_groups || sc.group_code,
        ra.assignment || jsonb_build_object(
          os.group_set,
          jsonb_build_object(
            'group_code', sc.group_code,
            'team_id', sc.team_id,
            'team_code', sc.team_code,
            'team_name', sc.team_name
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
    limit 1;

    if v_best_third_assignment is null then
      v_best_third_assignment := '{}'::jsonb;
    end if;

    create temp table tmp_best_third_assignment on commit drop as
    select
      e.key as group_set,
      (e.value ->> 'group_code')::text as group_code,
      (e.value ->> 'team_id')::uuid as team_id,
      (e.value ->> 'team_code')::text as team_code,
      (e.value ->> 'team_name')::text as team_name
    from jsonb_each(v_best_third_assignment) e;

    update public.matches m
    set
      home_team_id = a.team_id,
      home_team_code = a.team_code,
      home_team = a.team_name
    from tmp_best_third_assignment a
    where m.home_source_type = 'best_third_place'
      and m.home_source_group_set = a.group_set;

    get diagnostics v_third_home_updates = row_count;

    update public.matches m
    set
      away_team_id = a.team_id,
      away_team_code = a.team_code,
      away_team = a.team_name
    from tmp_best_third_assignment a
    where m.away_source_type = 'best_third_place'
      and m.away_source_group_set = a.group_set;

    get diagnostics v_third_away_updates = row_count;
  end if;

  -- Fase 5: propagar ganadores de partidos de knockout finalizados.
  -- Solo propaga si los equipos del partido fuente son estables
  -- (no cambiaron en esta misma ejecución del sync).
  update public.matches m
  set
    home_team_id = case
      when sm.official_home_score > sm.official_away_score then sm.home_team_id
      else sm.away_team_id
    end,
    home_team_code = case
      when sm.official_home_score > sm.official_away_score then sm.home_team_code
      else sm.away_team_code
    end,
    home_team = case
      when sm.official_home_score > sm.official_away_score then sm.home_team
      else sm.away_team
    end
  from public.matches sm
  left join tmp_previous_knockout_state ps
    on ps.id = sm.id
  where m.home_source_type = 'match_winner'
    and m.home_source_match_id = sm.id
    and sm.status = 'finished'
    and sm.official_home_score is not null
    and sm.official_away_score is not null
    and sm.official_home_score <> sm.official_away_score
    and sm.home_team_id is not null
    and sm.away_team_id is not null
    and not (
      sm.home_team_id is distinct from ps.prev_home_team_id
      or sm.away_team_id is distinct from ps.prev_away_team_id
    );

  get diagnostics v_winner_home_updates = row_count;

  update public.matches m
  set
    away_team_id = case
      when sm.official_home_score > sm.official_away_score then sm.home_team_id
      else sm.away_team_id
    end,
    away_team_code = case
      when sm.official_home_score > sm.official_away_score then sm.home_team_code
      else sm.away_team_code
    end,
    away_team = case
      when sm.official_home_score > sm.official_away_score then sm.home_team
      else sm.away_team
    end
  from public.matches sm
  left join tmp_previous_knockout_state ps
    on ps.id = sm.id
  where m.away_source_type = 'match_winner'
    and m.away_source_match_id = sm.id
    and sm.status = 'finished'
    and sm.official_home_score is not null
    and sm.official_away_score is not null
    and sm.official_home_score <> sm.official_away_score
    and sm.home_team_id is not null
    and sm.away_team_id is not null
    and not (
      sm.home_team_id is distinct from ps.prev_home_team_id
      or sm.away_team_id is distinct from ps.prev_away_team_id
    );

  get diagnostics v_winner_away_updates = row_count;

  -- Fase 6: propagar perdedores (para el partido por el 3° puesto).
  update public.matches m
  set
    home_team_id = case
      when sm.official_home_score < sm.official_away_score then sm.home_team_id
      else sm.away_team_id
    end,
    home_team_code = case
      when sm.official_home_score < sm.official_away_score then sm.home_team_code
      else sm.away_team_code
    end,
    home_team = case
      when sm.official_home_score < sm.official_away_score then sm.home_team
      else sm.away_team
    end
  from public.matches sm
  left join tmp_previous_knockout_state ps
    on ps.id = sm.id
  where m.home_source_type = 'match_loser'
    and m.home_source_match_id = sm.id
    and sm.status = 'finished'
    and sm.official_home_score is not null
    and sm.official_away_score is not null
    and sm.official_home_score <> sm.official_away_score
    and sm.home_team_id is not null
    and sm.away_team_id is not null
    and not (
      sm.home_team_id is distinct from ps.prev_home_team_id
      or sm.away_team_id is distinct from ps.prev_away_team_id
    );

  get diagnostics v_loser_home_updates = row_count;

  update public.matches m
  set
    away_team_id = case
      when sm.official_home_score < sm.official_away_score then sm.home_team_id
      else sm.away_team_id
    end,
    away_team_code = case
      when sm.official_home_score < sm.official_away_score then sm.home_team_code
      else sm.away_team_code
    end,
    away_team = case
      when sm.official_home_score < sm.official_away_score then sm.home_team
      else sm.away_team
    end
  from public.matches sm
  left join tmp_previous_knockout_state ps
    on ps.id = sm.id
  where m.away_source_type = 'match_loser'
    and m.away_source_match_id = sm.id
    and sm.status = 'finished'
    and sm.official_home_score is not null
    and sm.official_away_score is not null
    and sm.official_home_score <> sm.official_away_score
    and sm.home_team_id is not null
    and sm.away_team_id is not null
    and not (
      sm.home_team_id is distinct from ps.prev_home_team_id
      or sm.away_team_id is distinct from ps.prev_away_team_id
    );

  get diagnostics v_loser_away_updates = row_count;

  -- Fase 7: invalidar partidos de knockout cuyos equipos cambiaron
  -- o quedaron incompletos. Los resetea a 'scheduled' con scores null.
  update public.matches m
  set
    status = 'scheduled',
    official_home_score = null,
    official_away_score = null
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
    'group_stage_complete', v_group_stage_complete,
    'best_third_assignment_found', v_best_third_assignment <> '{}'::jsonb,
    'updated_group_position_home', v_group_home_updates,
    'updated_group_position_away', v_group_away_updates,
    'updated_best_third_home', v_third_home_updates,
    'updated_best_third_away', v_third_away_updates,
    'updated_match_winner_home', v_winner_home_updates,
    'updated_match_winner_away', v_winner_away_updates,
    'updated_match_loser_home', v_loser_home_updates,
    'updated_match_loser_away', v_loser_away_updates,
    'invalidated_knockout_matches', v_invalidated_matches
  );
end;
$$;


-- ============================================================
-- FIX 2: admin_set_participant_disabled
-- Agrega protección para que un admin no pueda deshabilitar
-- a otro admin. Antes solo protegía la auto-modificación.
-- ============================================================

CREATE OR REPLACE FUNCTION "public"."admin_set_participant_disabled"(
  "p_user_id" uuid,
  "p_is_disabled" boolean
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $$
begin
  -- El caller debe ser admin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  ) then
    raise exception 'No autorizado';
  end if;

  -- No se puede modificar la propia cuenta
  if p_user_id = auth.uid() then
    raise exception 'No puedes modificar tu propia cuenta';
  end if;

  -- No se puede modificar a otro admin
  if exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.is_admin = true
  ) then
    raise exception 'No puedes modificar la cuenta de otro administrador';
  end if;

  update public.profiles
  set
    is_disabled = p_is_disabled,
    updated_at = now()
  where id = p_user_id;
end;
$$;
