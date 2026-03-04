-- Run this in your Supabase project → SQL Editor

-- 1. User data table (one row per user, full app state as JSONB)
CREATE TABLE IF NOT EXISTS public.user_data (
  user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  data     JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security — each user can only see their own row
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own data"
  ON public.user_data
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_data_updated_at
  BEFORE UPDATE ON public.user_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
