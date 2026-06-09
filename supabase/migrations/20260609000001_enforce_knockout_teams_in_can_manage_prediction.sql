-- Refuerza can_manage_prediction para partidos de fase eliminatoria.
-- Para group_stage: solo se requiere status = 'scheduled' (sin cambio).
-- Para knockout: además se exige home_team_id y away_team_id definidos,
-- bloqueando pronósticos sobre cruces todavía no resueltos (placeholders).

CREATE OR REPLACE FUNCTION "public"."can_manage_prediction"("target_match_id" "text")
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
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
        and (
          m.stage = 'group_stage'
          or (m.home_team_id is not null and m.away_team_id is not null)
        )
    );
$$;

COMMENT ON FUNCTION "public"."can_manage_prediction"("target_match_id" "text") IS
  'Permite gestionar un pronóstico solo si: usuario activo, predicciones abiertas globalmente, partido scheduled y (group_stage o equipos de knockout ya definidos)';
