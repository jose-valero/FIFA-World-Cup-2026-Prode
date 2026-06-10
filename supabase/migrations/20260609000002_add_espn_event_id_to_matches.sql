-- Agrega espn_event_id a matches para soportar el mapping ESPN → matches.
-- Null por defecto: los partidos sin mapear conviven con los ya mapeados.
-- Unique: garantiza que no haya dos filas apuntando al mismo evento ESPN.
-- PostgreSQL permite múltiples NULLs en columnas UNIQUE, así que no hay
-- conflicto entre partidos aún sin mapear.

ALTER TABLE public.matches
  ADD COLUMN espn_event_id text;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_espn_event_id_unique UNIQUE (espn_event_id);

COMMENT ON COLUMN public.matches.espn_event_id IS
  'ID del evento en la API pública de ESPN (site.api.espn.com). Null hasta el backfill. Usado para sincronización automática de status y resultados.';
