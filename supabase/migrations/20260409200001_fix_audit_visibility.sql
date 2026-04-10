-- Fix: can_view_prediction_audit ahora solo retorna true para partidos
-- con status 'finished' o 'live'. Antes retornaba true para cualquier
-- partido cuando audits_visible=true, exponiendo predicciones de
-- partidos futuros.

CREATE OR REPLACE FUNCTION "public"."can_view_prediction_audit"("p_match_id" "text")
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    coalesce(
      (
        SELECT s.audits_visible
        FROM public.app_settings s
        WHERE s.key = 'global'
        LIMIT 1
      ),
      false
    )
    AND EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = p_match_id
        AND m.status IN ('finished', 'live')
    );
$$;

COMMENT ON FUNCTION "public"."can_view_prediction_audit"("p_match_id" "text") IS
  'Retorna true cuando la auditoria global esta habilitada y el partido ya esta live o finished';
