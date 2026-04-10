


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."admin_set_participant_disabled"("p_user_id" "uuid", "p_is_disabled" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  ) then
    raise exception 'No autorizado';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'No puedes modificar tu propia cuenta';
  end if;

  update public.profiles
  set
    is_disabled = p_is_disabled,
    updated_at = now()
  where id = p_user_id;
end;
$$;


ALTER FUNCTION "public"."admin_set_participant_disabled"("p_user_id" "uuid", "p_is_disabled" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_prediction"("target_match_id" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and coalesce(p.is_disabled, false) = false
    )
    and coalesce(
      (
        select
          s.predictions_open
          and (s.predictions_close_at is null or now() < s.predictions_close_at)
        from public.app_settings s
        where s.key = 'global'
      ),
      true
    )
    and exists (
      select 1
      from public.matches m
      where m.id = target_match_id
        and m.status = 'scheduled'
    );
$$;


ALTER FUNCTION "public"."can_manage_prediction"("target_match_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_prediction_audit"("p_match_id" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce(
    (
      select s.audits_visible
      from public.app_settings s
      where s.key = 'global'
      limit 1
    ),
    false
  );
$$;


ALTER FUNCTION "public"."can_view_prediction_audit"("p_match_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_view_prediction_audit"("p_match_id" "text") IS 'Retorna true cuando la auditoria global esta habilitada y el partido ya esta live o finished';



CREATE OR REPLACE FUNCTION "public"."get_admin_participants_overview"() RETURNS TABLE("user_id" "uuid", "display_name" "text", "is_admin" boolean, "is_disabled" boolean, "email_confirmed" boolean, "total_points" integer, "exact_hits" integer, "outcome_hits" integer, "scored_predictions" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    p.id as user_id,
    p.display_name,
    p.is_admin,
    coalesce(p.is_disabled, false) as is_disabled,
    coalesce(au.email_confirmed_at is not null, false) as email_confirmed,
    coalesce(lb.total_points, 0)::integer as total_points,
    coalesce(lb.exact_hits, 0)::integer as exact_hits,
    coalesce(lb.outcome_hits, 0)::integer as outcome_hits,
    coalesce(lb.scored_predictions, 0)::integer as scored_predictions
  from public.profiles p
  left join auth.users au
    on au.id = p.id
  left join public.get_leaderboard() lb
    on lb.user_id = p.id
  where exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and me.is_admin = true
  )
  order by
    case when coalesce(p.is_disabled, false) then 1 else 0 end asc,
    coalesce(lb.total_points, 0) desc,
    coalesce(lb.exact_hits, 0) desc,
    p.display_name asc;
$$;


ALTER FUNCTION "public"."get_admin_participants_overview"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_leaderboard"() RETURNS TABLE("user_id" "uuid", "display_name" "text", "total_points" bigint, "exact_hits" bigint, "outcome_hits" bigint, "scored_predictions" bigint, "is_disabled" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    p.id as user_id,
    p.display_name,
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
    ), 0) desc,
    coalesce(sum(
      case
        when pr.home_score = m.official_home_score
         and pr.away_score = m.official_away_score
        then 1 else 0
      end
    ), 0) desc,
    p.display_name asc;
$$;


ALTER FUNCTION "public"."get_leaderboard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1),
      'Usuario'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_match_denormalized_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_group_name text;
  v_home_team_name text;
  v_away_team_name text;
  v_home_team_code text;
  v_away_team_code text;
  v_stadium text;
  v_city text;
begin
  -- 1) Resolver IDs relacionales desde legacy cuando falten

  if new.group_code is null
     and new.stage = 'group_stage'
     and new.group_name is not null
     and btrim(new.group_name) <> '' then
    new.group_code :=
      case
        when regexp_replace(upper(btrim(new.group_name)), '^(GRUPO|GROUP)\s+', '') in
          ('A','B','C','D','E','F','G','H','I','J','K','L')
        then regexp_replace(upper(btrim(new.group_name)), '^(GRUPO|GROUP)\s+', '')
        else null
      end;
  end if;

  if new.venue_id is null
     and new.stadium is not null
     and new.city is not null
     and btrim(new.stadium) <> ''
     and btrim(new.city) <> '' then
    select v.id
    into new.venue_id
    from public.venues v
    where v.name = btrim(new.stadium)
      and v.city = btrim(new.city)
    limit 1;
  end if;

  if new.home_team_id is null then
    if new.home_team_code is not null and btrim(new.home_team_code) <> '' then
      select t.id
      into new.home_team_id
      from public.teams t
      where t.code = upper(btrim(new.home_team_code))
      limit 1;
    elsif new.home_team is not null and btrim(new.home_team) <> '' then
      select t.id
      into new.home_team_id
      from public.teams t
      where t.name = btrim(new.home_team)
      limit 1;
    end if;
  end if;

  if new.away_team_id is null then
    if new.away_team_code is not null and btrim(new.away_team_code) <> '' then
      select t.id
      into new.away_team_id
      from public.teams t
      where t.code = upper(btrim(new.away_team_code))
      limit 1;
    elsif new.away_team is not null and btrim(new.away_team) <> '' then
      select t.id
      into new.away_team_id
      from public.teams t
      where t.name = btrim(new.away_team)
      limit 1;
    end if;
  end if;

  -- 2) Completar legacy desde relaciones reales

  if new.group_code is not null then
    select g.name
    into v_group_name
    from public.groups g
    where g.code = new.group_code;

    if v_group_name is not null then
      new.group_name := v_group_name;
    end if;
  end if;

  if new.venue_id is not null then
    select v.name, v.city
    into v_stadium, v_city
    from public.venues v
    where v.id = new.venue_id;

    if v_stadium is not null then
      new.stadium := v_stadium;
    end if;

    if v_city is not null then
      new.city := v_city;
    end if;
  end if;

  if new.home_team_id is not null then
    select t.name, t.code
    into v_home_team_name, v_home_team_code
    from public.teams t
    where t.id = new.home_team_id;

    if v_home_team_name is not null then
      new.home_team := v_home_team_name;
    end if;

    if v_home_team_code is not null then
      new.home_team_code := v_home_team_code;
    end if;
  end if;

  if new.away_team_id is not null then
    select t.name, t.code
    into v_away_team_name, v_away_team_code
    from public.teams t
    where t.id = new.away_team_id;

    if v_away_team_name is not null then
      new.away_team := v_away_team_name;
    end if;

    if v_away_team_code is not null then
      new.away_team_code := v_away_team_code;
    end if;
  end if;

  -- 3) Si no hay team_id pero sí source_type, rellenar placeholder

  if new.home_team_id is null then
    if new.home_source_type = 'group_position'
       and new.home_source_group_rank is not null
       and new.home_source_group_code is not null then
      new.home_team := new.home_source_group_rank::text || new.home_source_group_code;
    elsif new.home_source_type = 'best_third_place'
       and new.home_source_group_set is not null then
      new.home_team := '3' || new.home_source_group_set;
    elsif new.home_source_type = 'match_winner'
       and new.home_source_match_id is not null then
      new.home_team := 'W' || new.home_source_match_id;
    elsif new.home_source_type = 'match_loser'
       and new.home_source_match_id is not null then
      new.home_team := 'L' || new.home_source_match_id;
    end if;
  end if;

  if new.away_team_id is null then
    if new.away_source_type = 'group_position'
       and new.away_source_group_rank is not null
       and new.away_source_group_code is not null then
      new.away_team := new.away_source_group_rank::text || new.away_source_group_code;
    elsif new.away_source_type = 'best_third_place'
       and new.away_source_group_set is not null then
      new.away_team := '3' || new.away_source_group_set;
    elsif new.away_source_type = 'match_winner'
       and new.away_source_match_id is not null then
      new.away_team := 'W' || new.away_source_match_id;
    elsif new.away_source_type = 'match_loser'
       and new.away_source_match_id is not null then
      new.away_team := 'L' || new.away_source_match_id;
    end if;
  end if;

  -- 4) match_label por defecto en fases no grupales

  if (new.match_label is null or btrim(new.match_label) = '')
     and new.stage <> 'group_stage'
     and new.home_team is not null
     and new.away_team is not null
     and btrim(new.home_team) <> ''
     and btrim(new.away_team) <> '' then
    new.match_label := btrim(new.home_team) || ' vs ' || btrim(new.away_team);
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."sync_match_denormalized_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_qualified_teams_into_knockout"() RETURNS "jsonb"
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
  create temp table tmp_previous_knockout_state on commit drop as
  select
    m.id,
    m.home_team_id as prev_home_team_id,
    m.away_team_id as prev_away_team_id
  from public.matches m
  where m.stage <> 'group_stage';

  update public.matches m
  set
    home_team_id = case
      when m.home_source_type = 'team_id' then t_home.id
      else null
    end,
    home_team_code = case
      when m.home_source_type = 'team_id' then t_home.code
      when m.home_source_type = 'group_position' then concat(m.home_source_group_rank::text, m.home_source_group_code)
      when m.home_source_type = 'best_third_place' then concat('3', m.home_source_group_set)
      when m.home_source_type = 'match_winner' then concat('W', m.home_source_match_id)
      when m.home_source_type = 'match_loser' then concat('L', m.home_source_match_id)
      else null
    end,
    home_team = case
      when m.home_source_type = 'team_id' then t_home.name
      when m.home_source_type = 'group_position' then concat(m.home_source_group_rank::text, m.home_source_group_code)
      when m.home_source_type = 'best_third_place' then concat('3', m.home_source_group_set)
      when m.home_source_type = 'match_winner' then concat('W', m.home_source_match_id)
      when m.home_source_type = 'match_loser' then concat('L', m.home_source_match_id)
      else null
    end,
    away_team_id = case
      when m.away_source_type = 'team_id' then t_away.id
      else null
    end,
    away_team_code = case
      when m.away_source_type = 'team_id' then t_away.code
      when m.away_source_type = 'group_position' then concat(m.away_source_group_rank::text, m.away_source_group_code)
      when m.away_source_type = 'best_third_place' then concat('3', m.away_source_group_set)
      when m.away_source_type = 'match_winner' then concat('W', m.away_source_match_id)
      when m.away_source_type = 'match_loser' then concat('L', m.away_source_match_id)
      else null
    end,
    away_team = case
      when m.away_source_type = 'team_id' then t_away.name
      when m.away_source_type = 'group_position' then concat(m.away_source_group_rank::text, m.away_source_group_code)
      when m.away_source_type = 'best_third_place' then concat('3', m.away_source_group_set)
      when m.away_source_type = 'match_winner' then concat('W', m.away_source_match_id)
      when m.away_source_type = 'match_loser' then concat('L', m.away_source_match_id)
      else null
    end
  from public.teams t_home
  full join public.teams t_away on false
  where m.stage <> 'group_stage'
    and (
      (m.home_source_type = 'team_id' and t_home.id = m.home_source_team_id)
      or m.home_source_type is distinct from 'team_id'
    )
    and (
      (m.away_source_type = 'team_id' and t_away.id = m.away_source_team_id)
      or m.away_source_type is distinct from 'team_id'
    );

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


ALTER FUNCTION "public"."sync_qualified_teams_into_knockout"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" "text" NOT NULL,
    "predictions_open" boolean DEFAULT true NOT NULL,
    "predictions_close_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "audits_visible" boolean DEFAULT false NOT NULL,
    CONSTRAINT "app_settings_key_global_check" CHECK (("key" = 'global'::"text"))
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."app_settings"."audits_visible" IS 'Controla si los usuarios autenticados pueden ver auditorias de pronosticos ajenos para partidos live o finished';



CREATE TABLE IF NOT EXISTS "public"."group_teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_code" "text" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "seed" smallint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "group_teams_seed_valid_check" CHECK ((("seed" IS NULL) OR (("seed" >= 1) AND ("seed" <= 4))))
);


ALTER TABLE "public"."group_teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "display_order" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "groups_code_not_blank_check" CHECK (("btrim"("code") <> ''::"text")),
    CONSTRAINT "groups_code_upper_check" CHECK (("code" = "upper"("code"))),
    CONSTRAINT "groups_code_valid_check" CHECK (("code" = ANY (ARRAY['A'::"text", 'B'::"text", 'C'::"text", 'D'::"text", 'E'::"text", 'F'::"text", 'G'::"text", 'H'::"text", 'I'::"text", 'J'::"text", 'K'::"text", 'L'::"text"]))),
    CONSTRAINT "groups_display_order_valid_check" CHECK ((("display_order" >= 1) AND ("display_order" <= 12))),
    CONSTRAINT "groups_name_not_blank_check" CHECK (("btrim"("name") <> ''::"text"))
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "text" NOT NULL,
    "group_name" "text" NOT NULL,
    "home_team" "text" NOT NULL,
    "away_team" "text" NOT NULL,
    "kickoff_at" timestamp with time zone NOT NULL,
    "stadium" "text" NOT NULL,
    "city" "text" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "official_home_score" integer,
    "official_away_score" integer,
    "stage" "text" DEFAULT 'group_stage'::"text" NOT NULL,
    "matchday" integer,
    "group_order" integer,
    "home_team_code" "text",
    "away_team_code" "text",
    "display_order" integer,
    "group_code" "text",
    "venue_id" "uuid",
    "home_team_id" "uuid",
    "away_team_id" "uuid",
    "match_label" "text",
    "home_source_type" "text",
    "home_source_team_id" "uuid",
    "home_source_group_code" "text",
    "home_source_group_rank" smallint,
    "home_source_match_id" "text",
    "away_source_type" "text",
    "away_source_team_id" "uuid",
    "away_source_group_code" "text",
    "away_source_group_rank" smallint,
    "away_source_match_id" "text",
    "home_source_group_set" "text",
    "away_source_group_set" "text",
    CONSTRAINT "matches_away_source_group_rank_valid_check" CHECK ((("away_source_group_rank" IS NULL) OR (("away_source_group_rank" >= 1) AND ("away_source_group_rank" <= 4)))),
    CONSTRAINT "matches_away_source_group_set_valid_check" CHECK ((("away_source_group_set" IS NULL) OR (("btrim"("away_source_group_set") <> ''::"text") AND ("away_source_group_set" = "upper"("away_source_group_set")) AND ("away_source_group_set" ~ '^[A-L]{2,12}$'::"text")))),
    CONSTRAINT "matches_away_source_type_valid_check" CHECK ((("away_source_type" IS NULL) OR ("away_source_type" = ANY (ARRAY['team'::"text", 'group_position'::"text", 'best_third_place'::"text", 'match_winner'::"text", 'match_loser'::"text"])))),
    CONSTRAINT "matches_away_team_code_not_blank_check" CHECK ((("away_team_code" IS NULL) OR ("btrim"("away_team_code") <> ''::"text"))),
    CONSTRAINT "matches_away_team_not_blank_check" CHECK (("btrim"("away_team") <> ''::"text")),
    CONSTRAINT "matches_city_not_blank_check" CHECK (("btrim"("city") <> ''::"text")),
    CONSTRAINT "matches_display_order_positive_check" CHECK ((("display_order" IS NULL) OR ("display_order" > 0))),
    CONSTRAINT "matches_distinct_teams_check" CHECK (("home_team" <> "away_team")),
    CONSTRAINT "matches_group_name_not_blank_check" CHECK (("btrim"("group_name") <> ''::"text")),
    CONSTRAINT "matches_home_source_group_rank_valid_check" CHECK ((("home_source_group_rank" IS NULL) OR (("home_source_group_rank" >= 1) AND ("home_source_group_rank" <= 4)))),
    CONSTRAINT "matches_home_source_group_set_valid_check" CHECK ((("home_source_group_set" IS NULL) OR (("btrim"("home_source_group_set") <> ''::"text") AND ("home_source_group_set" = "upper"("home_source_group_set")) AND ("home_source_group_set" ~ '^[A-L]{2,12}$'::"text")))),
    CONSTRAINT "matches_home_source_type_valid_check" CHECK ((("home_source_type" IS NULL) OR ("home_source_type" = ANY (ARRAY['team'::"text", 'group_position'::"text", 'best_third_place'::"text", 'match_winner'::"text", 'match_loser'::"text"])))),
    CONSTRAINT "matches_home_team_code_not_blank_check" CHECK ((("home_team_code" IS NULL) OR ("btrim"("home_team_code") <> ''::"text"))),
    CONSTRAINT "matches_home_team_ids_distinct_check" CHECK ((("home_team_id" IS NULL) OR ("away_team_id" IS NULL) OR ("home_team_id" <> "away_team_id"))),
    CONSTRAINT "matches_home_team_not_blank_check" CHECK (("btrim"("home_team") <> ''::"text")),
    CONSTRAINT "matches_id_not_blank_check" CHECK (("btrim"("id") <> ''::"text")),
    CONSTRAINT "matches_match_label_not_blank_check" CHECK ((("match_label" IS NULL) OR ("btrim"("match_label") <> ''::"text"))),
    CONSTRAINT "matches_official_away_score_check" CHECK (("official_away_score" >= 0)),
    CONSTRAINT "matches_official_away_score_non_negative_check" CHECK ((("official_away_score" IS NULL) OR ("official_away_score" >= 0))),
    CONSTRAINT "matches_official_home_score_check" CHECK (("official_home_score" >= 0)),
    CONSTRAINT "matches_official_home_score_non_negative_check" CHECK ((("official_home_score" IS NULL) OR ("official_home_score" >= 0))),
    CONSTRAINT "matches_official_scores_pair_check" CHECK (((("official_home_score" IS NULL) AND ("official_away_score" IS NULL)) OR (("official_home_score" IS NOT NULL) AND ("official_away_score" IS NOT NULL)))),
    CONSTRAINT "matches_stadium_not_blank_check" CHECK (("btrim"("stadium") <> ''::"text")),
    CONSTRAINT "matches_stage_valid_check" CHECK (("stage" = ANY (ARRAY['group_stage'::"text", 'round_of_32'::"text", 'round_of_16'::"text", 'quarterfinals'::"text", 'semifinals'::"text", 'third_place'::"text", 'final'::"text"]))),
    CONSTRAINT "matches_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'live'::"text", 'finished'::"text"]))),
    CONSTRAINT "matches_status_score_consistency_check" CHECK (((("status" = 'scheduled'::"text") AND ("official_home_score" IS NULL) AND ("official_away_score" IS NULL)) OR ("status" = 'live'::"text") OR (("status" = 'finished'::"text") AND ("official_home_score" IS NOT NULL) AND ("official_away_score" IS NOT NULL)))),
    CONSTRAINT "matches_status_valid_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'live'::"text", 'finished'::"text"])))
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."predictions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "match_id" "text" NOT NULL,
    "home_score" integer NOT NULL,
    "away_score" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "predictions_away_score_check" CHECK (("away_score" >= 0)),
    CONSTRAINT "predictions_away_score_non_negative_check" CHECK (("away_score" >= 0)),
    CONSTRAINT "predictions_home_score_check" CHECK (("home_score" >= 0)),
    CONSTRAINT "predictions_home_score_non_negative_check" CHECK (("home_score" >= 0))
);


ALTER TABLE "public"."predictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "is_disabled" boolean DEFAULT false NOT NULL,
    CONSTRAINT "profiles_display_name_not_blank_check" CHECK (("btrim"("display_name") <> ''::"text"))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "short_name" "text",
    "flag_emoji" "text",
    "flag_asset" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "teams_code_length_check" CHECK ((("char_length"("code") >= 2) AND ("char_length"("code") <= 5))),
    CONSTRAINT "teams_code_not_blank_check" CHECK (("btrim"("code") <> ''::"text")),
    CONSTRAINT "teams_code_upper_check" CHECK (("code" = "upper"("code"))),
    CONSTRAINT "teams_name_not_blank_check" CHECK (("btrim"("name") <> ''::"text"))
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "city" "text" NOT NULL,
    "country" "text" DEFAULT 'USA'::"text" NOT NULL,
    "timezone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "venues_city_not_blank_check" CHECK (("btrim"("city") <> ''::"text")),
    CONSTRAINT "venues_country_not_blank_check" CHECK (("btrim"("country") <> ''::"text")),
    CONSTRAINT "venues_name_not_blank_check" CHECK (("btrim"("name") <> ''::"text"))
);


ALTER TABLE "public"."venues" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."group_teams"
    ADD CONSTRAINT "group_teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_teams"
    ADD CONSTRAINT "group_teams_unique_group_team" UNIQUE ("group_code", "team_id");



ALTER TABLE ONLY "public"."group_teams"
    ADD CONSTRAINT "group_teams_unique_team" UNIQUE ("team_id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_display_order_key" UNIQUE ("display_order");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_user_id_match_id_key" UNIQUE ("user_id", "match_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_group_teams_group_code" ON "public"."group_teams" USING "btree" ("group_code");



CREATE INDEX "idx_group_teams_team_id" ON "public"."group_teams" USING "btree" ("team_id");



CREATE INDEX "idx_matches_away_source_match_id" ON "public"."matches" USING "btree" ("away_source_match_id");



CREATE INDEX "idx_matches_away_team_id" ON "public"."matches" USING "btree" ("away_team_id");



CREATE INDEX "idx_matches_display_order" ON "public"."matches" USING "btree" ("display_order");



CREATE INDEX "idx_matches_group_code" ON "public"."matches" USING "btree" ("group_code");



CREATE INDEX "idx_matches_group_name" ON "public"."matches" USING "btree" ("group_name");



CREATE INDEX "idx_matches_home_source_match_id" ON "public"."matches" USING "btree" ("home_source_match_id");



CREATE INDEX "idx_matches_home_team_id" ON "public"."matches" USING "btree" ("home_team_id");



CREATE INDEX "idx_matches_stage_display_order" ON "public"."matches" USING "btree" ("stage", "display_order");



CREATE INDEX "idx_matches_stage_status" ON "public"."matches" USING "btree" ("stage", "status");



CREATE INDEX "idx_matches_status" ON "public"."matches" USING "btree" ("status");



CREATE INDEX "idx_matches_venue_id" ON "public"."matches" USING "btree" ("venue_id");



CREATE INDEX "idx_predictions_match_id" ON "public"."predictions" USING "btree" ("match_id");



CREATE INDEX "idx_teams_name" ON "public"."teams" USING "btree" ("name");



CREATE INDEX "idx_venues_city" ON "public"."venues" USING "btree" ("city");



CREATE INDEX "predictions_match_id_idx" ON "public"."predictions" USING "btree" ("match_id");



CREATE INDEX "predictions_user_id_idx" ON "public"."predictions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "uq_group_teams_group_seed" ON "public"."group_teams" USING "btree" ("group_code", "seed") WHERE ("seed" IS NOT NULL);



CREATE UNIQUE INDEX "uq_venues_name_city_country" ON "public"."venues" USING "btree" ("name", "city", "country");



CREATE OR REPLACE TRIGGER "set_app_settings_updated_at" BEFORE UPDATE ON "public"."app_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_group_teams_updated_at" BEFORE UPDATE ON "public"."group_teams" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_groups_updated_at" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_matches_updated_at" BEFORE UPDATE ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_predictions_updated_at" BEFORE UPDATE ON "public"."predictions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_venues_updated_at" BEFORE UPDATE ON "public"."venues" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "sync_match_denormalized_fields_on_matches" BEFORE INSERT OR UPDATE ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."sync_match_denormalized_fields"();



ALTER TABLE ONLY "public"."group_teams"
    ADD CONSTRAINT "group_teams_group_code_fkey" FOREIGN KEY ("group_code") REFERENCES "public"."groups"("code") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."group_teams"
    ADD CONSTRAINT "group_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_away_source_group_code_fkey" FOREIGN KEY ("away_source_group_code") REFERENCES "public"."groups"("code") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_away_source_match_id_fkey" FOREIGN KEY ("away_source_match_id") REFERENCES "public"."matches"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_away_source_team_id_fkey" FOREIGN KEY ("away_source_team_id") REFERENCES "public"."teams"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_group_code_fkey" FOREIGN KEY ("group_code") REFERENCES "public"."groups"("code") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_home_source_group_code_fkey" FOREIGN KEY ("home_source_group_code") REFERENCES "public"."groups"("code") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_home_source_match_id_fkey" FOREIGN KEY ("home_source_match_id") REFERENCES "public"."matches"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_home_source_team_id_fkey" FOREIGN KEY ("home_source_team_id") REFERENCES "public"."teams"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "admins can delete matches" ON "public"."matches" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."is_admin" = true)))));



CREATE POLICY "admins can insert app settings" ON "public"."app_settings" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."is_admin" = true)))));



CREATE POLICY "admins can insert matches" ON "public"."matches" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."is_admin" = true)))));



CREATE POLICY "admins can update app settings" ON "public"."app_settings" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."is_admin" = true)))));



CREATE POLICY "admins can update matches" ON "public"."matches" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."is_admin" = true)))));



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated users can read matches" ON "public"."matches" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."group_teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predictions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles are public readable" ON "public"."profiles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "public can read app settings" ON "public"."app_settings" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "public can read group teams" ON "public"."group_teams" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "public can read groups" ON "public"."groups" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "public can read teams" ON "public"."teams" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "public can read venues" ON "public"."venues" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users can delete their own predictions when allowed" ON "public"."predictions" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."can_manage_prediction"("match_id")));



CREATE POLICY "users can insert their own predictions when allowed" ON "public"."predictions" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND "public"."can_manage_prediction"("match_id")));



CREATE POLICY "users can read their own predictions" ON "public"."predictions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users can read visible audits" ON "public"."predictions" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR "public"."can_view_prediction_audit"("match_id")));



CREATE POLICY "users can update their own predictions when allowed" ON "public"."predictions" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") AND "public"."can_manage_prediction"("match_id"))) WITH CHECK ((("auth"."uid"() = "user_id") AND "public"."can_manage_prediction"("match_id")));



CREATE POLICY "users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."venues" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."admin_set_participant_disabled"("p_user_id" "uuid", "p_is_disabled" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_set_participant_disabled"("p_user_id" "uuid", "p_is_disabled" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_participant_disabled"("p_user_id" "uuid", "p_is_disabled" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_manage_prediction"("target_match_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_manage_prediction"("target_match_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_manage_prediction"("target_match_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_manage_prediction"("target_match_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_prediction_audit"("p_match_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_prediction_audit"("p_match_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_prediction_audit"("p_match_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_participants_overview"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_participants_overview"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_participants_overview"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_leaderboard"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_leaderboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leaderboard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_match_denormalized_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_match_denormalized_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_match_denormalized_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_qualified_teams_into_knockout"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_qualified_teams_into_knockout"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_qualified_teams_into_knockout"() TO "service_role";


















GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."group_teams" TO "anon";
GRANT ALL ON TABLE "public"."group_teams" TO "authenticated";
GRANT ALL ON TABLE "public"."group_teams" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."predictions" TO "anon";
GRANT ALL ON TABLE "public"."predictions" TO "authenticated";
GRANT ALL ON TABLE "public"."predictions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."venues" TO "anon";
GRANT ALL ON TABLE "public"."venues" TO "authenticated";
GRANT ALL ON TABLE "public"."venues" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "public can read app settings" on "public"."app_settings";

drop policy "public can read group teams" on "public"."group_teams";

drop policy "public can read groups" on "public"."groups";

drop policy "profiles are public readable" on "public"."profiles";

drop policy "public can read teams" on "public"."teams";

drop policy "public can read venues" on "public"."venues";


  create policy "public can read app settings"
  on "public"."app_settings"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "public can read group teams"
  on "public"."group_teams"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "public can read groups"
  on "public"."groups"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "profiles are public readable"
  on "public"."profiles"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "public can read teams"
  on "public"."teams"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "public can read venues"
  on "public"."venues"
  as permissive
  for select
  to anon, authenticated
using (true);


CREATE TRIGGER on_auth_user_created_create_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();


