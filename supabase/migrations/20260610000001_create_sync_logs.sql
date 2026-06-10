-- Historial resumido de ejecuciones del sync ESPN → matches.
-- El backend escribe con service role key (bypasa RLS).
-- Los admins leen desde la UI admin.

CREATE TABLE public.sync_logs (
  id             bigserial       PRIMARY KEY,
  created_at     timestamptz     NOT NULL DEFAULT now(),
  trigger_source text            NOT NULL,
  total_reviewed int             NOT NULL DEFAULT 0,
  total_updated  int             NOT NULL DEFAULT 0,
  total_unchanged int            NOT NULL DEFAULT 0,
  total_omitted  int             NOT NULL DEFAULT 0,
  duration_ms    int             NOT NULL DEFAULT 0,
  status         text            NOT NULL CHECK (status IN ('success', 'error')),
  error_message  text
);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can read sync_logs"
  ON public.sync_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );
