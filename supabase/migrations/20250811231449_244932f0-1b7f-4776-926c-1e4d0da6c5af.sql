-- 1) Fallback inventory table and RPCs for Ask Purposely
-- Create table ap_seed
CREATE TABLE IF NOT EXISTS public.ap_seed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  perspective TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available', -- available | reserved | consumed | failed
  reserved_by UUID,
  reserved_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS ap_seed_status_created_at_idx ON public.ap_seed (status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS ap_seed_hash_key ON public.ap_seed (hash);

-- Enable RLS
ALTER TABLE public.ap_seed ENABLE ROW LEVEL SECURITY;

-- RLS policies
DO $$
BEGIN
  -- Drop existing policies if they exist to avoid duplicates
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ap_seed' AND policyname = 'Authenticated can read available or own reserved'
  ) THEN
    DROP POLICY "Authenticated can read available or own reserved" ON public.ap_seed;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ap_seed' AND policyname = 'Service role can insert'
  ) THEN
    DROP POLICY "Service role can insert" ON public.ap_seed;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ap_seed' AND policyname = 'Service role can update'
  ) THEN
    DROP POLICY "Service role can update" ON public.ap_seed;
  END IF;
END$$;

-- Read: allow authenticated users to see available items, and items they reserved
CREATE POLICY "Authenticated can read available or own reserved"
ON public.ap_seed
FOR SELECT
USING (
  (auth.role() = 'authenticated' AND status = 'available') OR
  (auth.role() = 'authenticated' AND status = 'reserved' AND reserved_by = auth.uid())
);

-- Inserts: only service role (replenisher)
CREATE POLICY "Service role can insert"
ON public.ap_seed
FOR INSERT
TO service_role
WITH CHECK (true);

-- Updates: only service role (general). Reservation/consumption happen via SECURITY DEFINER functions below
CREATE POLICY "Service role can update"
ON public.ap_seed
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Atomic take function (FIFO) with reservation TTL reclamation
CREATE OR REPLACE FUNCTION public.ap_seed_take(p_user UUID, p_n INT, p_ttl_minutes INT DEFAULT 15)
RETURNS SETOF public.ap_seed
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.ap_seed%ROWTYPE;
BEGIN
  -- Reclaim expired reservations first
  UPDATE public.ap_seed
    SET status = 'available', reserved_by = NULL, reserved_at = NULL
    WHERE status = 'reserved' AND reserved_at < (now() - make_interval(mins => p_ttl_minutes));

  FOR r IN
    SELECT * FROM public.ap_seed
    WHERE status = 'available'
    ORDER BY created_at ASC
    LIMIT p_n
  LOOP
    UPDATE public.ap_seed
      SET status = 'reserved', reserved_by = p_user, reserved_at = now()
      WHERE id = r.id AND status = 'available'
      RETURNING * INTO r;
    IF FOUND THEN
      RETURN NEXT r;
    END IF;
  END LOOP;

  RETURN;
END$$;

-- Consume function
CREATE OR REPLACE FUNCTION public.ap_seed_consume(p_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ap_seed
    SET status = 'consumed', consumed_at = now()
    WHERE id = ANY(p_ids);
END$$;

-- Grant execute to authenticated users for take/consume
REVOKE ALL ON FUNCTION public.ap_seed_take(UUID, INT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ap_seed_consume(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ap_seed_take(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ap_seed_consume(UUID[]) TO authenticated;
