CREATE TABLE IF NOT EXISTS public.prediction_reactions (
  giver_id    uuid NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  match_id    text NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  count       int  NOT NULL DEFAULT 0,

  CONSTRAINT prediction_reactions_pkey PRIMARY KEY (giver_id, receiver_id, match_id),
  CONSTRAINT no_self_reaction            CHECK (giver_id <> receiver_id),
  CONSTRAINT count_range                 CHECK (count >= 0 AND count <= 25)
);

CREATE INDEX prediction_reactions_match_idx
  ON public.prediction_reactions (match_id);

ALTER TABLE public.prediction_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions_select" ON public.prediction_reactions
  FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.prediction_reactions TO authenticated;

CREATE OR REPLACE FUNCTION public.increment_maranita(
  p_receiver_id uuid,
  p_match_id    text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_giver_id     uuid := auth.uid();
  v_match_status text;
  v_count        int;
BEGIN
  IF v_giver_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  IF v_giver_id = p_receiver_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'self_reaction');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_giver_id AND is_disabled = true
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'giver_disabled');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_receiver_id AND is_disabled = true
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'receiver_disabled');
  END IF;

  SELECT status INTO v_match_status FROM public.matches WHERE id = p_match_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'match_not_found');
  END IF;

  IF v_match_status <> 'live' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'match_not_live');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.predictions WHERE user_id = p_receiver_id AND match_id = p_match_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_prediction');
  END IF;

  INSERT INTO public.prediction_reactions (giver_id, receiver_id, match_id, count)
  VALUES (v_giver_id, p_receiver_id, p_match_id, 1)
  ON CONFLICT (giver_id, receiver_id, match_id)
  DO UPDATE SET count = LEAST(prediction_reactions.count + 1, 25)
  RETURNING count INTO v_count;

  RETURN jsonb_build_object(
    'ok',       true,
    'count',    v_count,
    'at_limit', v_count >= 25
  );
END;
$$;

REVOKE ALL ON FUNCTION public.increment_maranita(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_maranita(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.increment_maranita IS
  'Incrementa en 1 la marañita del giver hacia receiver para un partido live. '
  'Valida: autenticación, no-self, giver activo, receiver activo, partido live, predicción existente.';
