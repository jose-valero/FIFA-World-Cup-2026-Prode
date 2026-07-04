-- Fix: can_view_prediction_audit ya no restringe por estado del partido.
--
-- Antes (20260409200001_fix_audit_visibility.sql):
--   Retornaba true solo si audits_visible=true Y partido en ('live','finished').
--   Efecto: pronósticos de partidos 'scheduled' eran invisibles para todos
--   excepto el propio usuario, aunque el admin hubiera habilitado audits_visible.
--
-- Ahora:
--   Retorna true si audits_visible=true, sin importar el estado del partido.
--   La regla de visibilidad es: admin decide cuándo abrir auditorías, no el
--   estado del partido.
--
-- Regla de producto:
--   - audits_visible=false → solo pronósticos propios visibles (sin cambio)
--   - audits_visible=true  → todos los pronósticos visibles (scheduled, live, finished)

CREATE OR REPLACE FUNCTION "public"."can_view_prediction_audit"("p_match_id" "text")
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT coalesce(
    (
      SELECT s.audits_visible
      FROM public.app_settings s
      WHERE s.key = 'global'
      LIMIT 1
    ),
    false
  );
$$;

COMMENT ON FUNCTION "public"."can_view_prediction_audit"("p_match_id" "text") IS
  'Retorna true cuando audits_visible=true en app_settings. No restringe por estado del partido.';
