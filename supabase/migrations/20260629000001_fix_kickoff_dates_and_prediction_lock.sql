-- ============================================================
-- Fix 1: revertir kickoff_at de IDs 75 y 76 a June 29
--
-- El fix anterior los movió incorrectamente a June 28.
-- El schedule real tiene 2 partidos por día (doble jornada).
-- June 28: 73 (RSA-CAN 19:00Z), 74 (GER-PAR 22:00Z)
-- June 29: 75 (NED-MAR 19:00Z), 76 (BRA-JPN 22:00Z)
-- ============================================================

UPDATE public.matches SET kickoff_at = '2026-06-29T19:00:00+00'
WHERE id = '75' AND stage = 'round_of_32';

UPDATE public.matches SET kickoff_at = '2026-06-29T22:00:00+00'
WHERE id = '76' AND stage = 'round_of_32';

-- ============================================================
-- Fix 2: can_manage_prediction — bloquear si ya pasó el kickoff
--
-- Un partido con status = 'scheduled' pero cuyo kickoff_at ya
-- ocurrió no debe admitir pronósticos. El admin puede tardar
-- en marcar el partido como 'live'/'finished', y ese gap
-- dejaba partidos pasados como editables.
-- ============================================================

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
        and now() < m.kickoff_at
        and (
          m.stage = 'group_stage'
          or (m.home_team_id is not null and m.away_team_id is not null)
        )
    );
$$;

COMMENT ON FUNCTION "public"."can_manage_prediction"("target_match_id" "text") IS
  'Permite gestionar un pronóstico solo si: usuario activo, predicciones abiertas globalmente, partido scheduled, kickoff no ocurrido, y (group_stage o equipos de knockout ya definidos)';
