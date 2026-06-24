-- ============================================================
-- Fase 3A: compuerta por etapa en predicciones
--
-- Agrega group_stage_locked a app_settings.
-- Semántica:
--   predictions_open = false               → todo cerrado (sin cambio)
--   predictions_open = true, locked = false → comportamiento actual
--   predictions_open = true, locked = true  → grupos cerrados, knockout abierto
--
-- can_manage_prediction() actualizada con nueva cláusula.
-- ============================================================

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS group_stage_locked boolean NOT NULL DEFAULT false;

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
        -- si group_stage_locked está activo, bloquear partidos de grupos
        and not (
          m.stage = 'group_stage'
          and coalesce(
            (select s.group_stage_locked from public.app_settings s where s.key = 'global'),
            false
          )
        )
    );
$$;

COMMENT ON FUNCTION "public"."can_manage_prediction"("target_match_id" "text") IS
  'Permite gestionar pronósticos si: usuario activo, predicciones abiertas, partido scheduled, (group_stage o knockout con equipos definidos), y grupo no bloqueado si group_stage_locked=true';
