-- Enhance existing public.notifications (TEXT user ids). Do not DROP.
ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS sender_id TEXT;
ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS event_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_event_key_uidx
  ON public.notifications (user_id, event_key)
  WHERE event_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
  ON public.notifications (user_id, is_read, created_at DESC);

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

ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
