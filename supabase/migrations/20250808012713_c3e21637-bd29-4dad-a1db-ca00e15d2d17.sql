-- Add has_intimacy_addon flag to track 18+ add-on status
ALTER TABLE public.subscribers
ADD COLUMN IF NOT EXISTS has_intimacy_addon BOOLEAN NOT NULL DEFAULT false;