-- ============================================================
-- JellyRate Migration 002: Gender segmentation + notifications
-- ============================================================

-- 1. Add gender fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male','female','other')),
  ADD COLUMN IF NOT EXISTS feed_gender_filter TEXT DEFAULT 'all' CHECK (feed_gender_filter IN ('all','male','female')),
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_private_activity BOOLEAN DEFAULT FALSE;

-- 2. Add audience field to jellyrates
ALTER TABLE public.jellyrates
  ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'all' CHECK (audience IN ('all','male','female'));

-- 3. Notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  likes_jellyrate BOOLEAN DEFAULT TRUE,
  likes_comment BOOLEAN DEFAULT TRUE,
  comments_jellyrate BOOLEAN DEFAULT TRUE,
  mentions BOOLEAN DEFAULT TRUE,
  favorites_jellyrate BOOLEAN DEFAULT TRUE,
  rejellies_jellyrate BOOLEAN DEFAULT TRUE,
  reposts_jellyrate BOOLEAN DEFAULT TRUE,
  new_follower BOOLEAN DEFAULT TRUE,
  follow_request BOOLEAN DEFAULT TRUE,
  friend_joined BOOLEAN DEFAULT TRUE,
  follow_accepted BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification_settings"
  ON public.notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- Auto-create notification_settings row when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_notification_settings()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_notifications ON public.profiles;
CREATE TRIGGER on_profile_created_notifications
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification_settings();

-- Backfill notification_settings for existing profiles
INSERT INTO public.notification_settings (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 4. Update follows table to support pending state (for private accounts)
ALTER TABLE public.follows
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted' CHECK (status IN ('pending','accepted'));

-- 5. Update RLS on jellyrates to support audience filtering
-- Existing policy already allows public jellyrates; audience is just a data field
-- Clients filter by audience in queries

-- ============================================================
-- Run this in Supabase SQL Editor
-- ============================================================
