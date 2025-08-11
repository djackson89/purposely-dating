-- Create billing table to track subscriptions
CREATE TABLE IF NOT EXISTS public.billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_customer_id text,
  subscription_id text,
  status text NOT NULL,
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  plan_price_id text,
  premium_activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Presence table for real-time active users
CREATE TABLE IF NOT EXISTS public.presence (
  user_id uuid PRIMARY KEY,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  -- Billing policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='billing' AND policyname='Users can view their own billing'
  ) THEN
    CREATE POLICY "Users can view their own billing" ON public.billing
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='billing' AND policyname='Admins can view all billing'
  ) THEN
    CREATE POLICY "Admins can view all billing" ON public.billing
      FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='billing' AND policyname='Users can upsert their own billing'
  ) THEN
    CREATE POLICY "Users can upsert their own billing" ON public.billing
      FOR INSERT WITH CHECK (user_id = auth.uid())
      , FOR UPDATE USING (user_id = auth.uid());
  END IF;

  -- Presence policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='presence' AND policyname='Users can upsert their own presence'
  ) THEN
    CREATE POLICY "Users can upsert their own presence" ON public.presence
      FOR INSERT WITH CHECK (user_id = auth.uid())
      , FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='presence' AND policyname='Admins can view all presence'
  ) THEN
    CREATE POLICY "Admins can view all presence" ON public.presence
      FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_billing_user ON public.billing(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON public.billing(status);
CREATE INDEX IF NOT EXISTS idx_billing_plan ON public.billing(plan_price_id);
CREATE INDEX IF NOT EXISTS idx_billing_premium_activated ON public.billing(premium_activated_at);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON public.presence(last_seen_at);

-- Unique per user & plan to dedupe records
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='uniq_billing_user_plan'
  ) THEN
    CREATE UNIQUE INDEX uniq_billing_user_plan ON public.billing(user_id, plan_price_id);
  END IF;
END $$;

-- Function to compute admin metrics in CST
CREATE OR REPLACE FUNCTION public.admin_metrics(tz text, price_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_today_utc timestamptz;
  start_last7_utc timestamptz;
  users_all bigint;
  signups_today bigint;
  free_trial_now bigint;
  premium_active_now bigint;
  premium_converted_today bigint;
  premium_converted_last7 bigint;
  active_now bigint;
BEGIN
  -- Compute CST day boundaries in UTC
  start_today_utc := date_trunc('day', now() AT TIME ZONE tz) AT TIME ZONE tz; -- convert local midnight to UTC
  start_last7_utc := (date_trunc('day', now() AT TIME ZONE tz) - interval '6 days') AT TIME ZONE tz;

  SELECT COUNT(*) INTO users_all FROM public.profiles;

  SELECT COUNT(*) INTO signups_today
  FROM public.profiles p
  WHERE p.created_at >= start_today_utc AND p.created_at < now();

  SELECT COUNT(DISTINCT b.user_id) INTO free_trial_now
  FROM public.billing b
  WHERE b.plan_price_id = price_id AND b.status = 'trialing';

  SELECT COUNT(DISTINCT b.user_id) INTO premium_active_now
  FROM public.billing b
  WHERE b.plan_price_id = price_id
    AND b.status = 'active'
    AND (b.trial_end IS NULL OR b.trial_end <= now());

  SELECT COUNT(*) INTO premium_converted_today
  FROM public.billing b
  WHERE b.plan_price_id = price_id
    AND b.premium_activated_at IS NOT NULL
    AND b.premium_activated_at >= start_today_utc
    AND b.premium_activated_at < now();

  SELECT COUNT(*) INTO premium_converted_last7
  FROM public.billing b
  WHERE b.plan_price_id = price_id
    AND b.premium_activated_at IS NOT NULL
    AND b.premium_activated_at >= start_last7_utc
    AND b.premium_activated_at < now();

  SELECT COUNT(*) INTO active_now
  FROM public.presence pr
  WHERE pr.last_seen_at >= (now() - interval '120 seconds');

  RETURN jsonb_build_object(
    'generated_at', now(),
    'tz', tz,
    'totals', jsonb_build_object(
      'users_all', users_all,
      'signups_today', signups_today,
      'free_trial_now', free_trial_now,
      'premium_active_now', premium_active_now,
      'premium_converted_today', premium_converted_today,
      'premium_converted_last7', premium_converted_last7,
      'active_now', active_now
    )
  );
END;
$$;