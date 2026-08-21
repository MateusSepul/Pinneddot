CREATE TABLE public.pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'text' CHECK (kind IN ('text','drawing')),
  content TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow' CHECK (color IN ('white','yellow','pink','blue','green','orange')),
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  y DOUBLE PRECISION NOT NULL DEFAULT 0,
  rotation DOUBLE PRECISION NOT NULL DEFAULT 0,
  author TEXT,
  owner_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pins TO authenticated;
GRANT ALL ON public.pins TO service_role;

ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pins" ON public.pins FOR SELECT USING (true);
CREATE POLICY "Anyone can create pins" ON public.pins FOR INSERT WITH CHECK (char_length(content) <= 200000 AND char_length(owner_key) BETWEEN 8 AND 64);
CREATE POLICY "Owner key can update pins" ON public.pins FOR UPDATE USING (owner_key = current_setting('request.headers', true)::json->>'x-owner-key') WITH CHECK (owner_key = current_setting('request.headers', true)::json->>'x-owner-key');
CREATE POLICY "Owner key can delete pins" ON public.pins FOR DELETE USING (owner_key = current_setting('request.headers', true)::json->>'x-owner-key');

ALTER PUBLICATION supabase_realtime ADD TABLE public.pins;