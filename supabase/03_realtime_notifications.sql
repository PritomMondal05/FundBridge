-- ========================================================
-- FUNDBRIDGE SUPABASE REALTIME & NOTIFICATIONS
-- File: 03_realtime_notifications.sql
-- Work: Realtime publication & composite indexes for live notifications
-- ========================================================

-- 1. Ensure columns exist on public.notifications
ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS sender_id TEXT;
ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS event_key TEXT;

-- 2. Create composite performance & deduplication indexes
CREATE UNIQUE INDEX IF NOT EXISTS notifications_event_key_uidx
  ON public.notifications (user_id, event_key)
  WHERE event_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
  ON public.notifications (user_id, is_read, created_at DESC);

-- 3. Add notifications to Supabase Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 4. Disable RLS for open direct Supabase client access (or configure policies)
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
