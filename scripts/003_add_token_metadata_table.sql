-- Create token_metadata table for storing IPFS metadata
CREATE TABLE IF NOT EXISTS public.token_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL,
  ipfs_uri TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.token_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own metadata" ON public.token_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own metadata" ON public.token_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_token_metadata_user_id ON public.token_metadata(user_id);
