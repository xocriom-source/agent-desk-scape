-- Chat channels
CREATE TABLE public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'public',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  building_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public channels"
  ON public.chat_channels FOR SELECT TO public
  USING (type = 'public');

CREATE POLICY "Auth users can view all channels"
  ON public.chat_channels FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Auth users can create channels"
  ON public.chat_channels FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  file_name TEXT DEFAULT NULL,
  file_size TEXT DEFAULT NULL,
  thread_id UUID DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can send messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.chat_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Meetings
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  room TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_by UUID NOT NULL,
  building_id TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  external_link TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view meetings"
  ON public.meetings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create meetings"
  ON public.meetings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update meetings"
  ON public.meetings FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

-- Meeting participants
CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants"
  ON public.meeting_participants FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can join meetings"
  ON public.meeting_participants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Meeting notes
CREATE TABLE public.meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view notes"
  ON public.meeting_notes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can add notes"
  ON public.meeting_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Presence / user status
CREATE TABLE public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'available',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  position_x REAL DEFAULT 0,
  position_y REAL DEFAULT 0,
  position_z REAL DEFAULT 0,
  building_id TEXT DEFAULT NULL
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view presence"
  ON public.user_presence FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can upsert own presence"
  ON public.user_presence FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence"
  ON public.user_presence FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;