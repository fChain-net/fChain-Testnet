-- Create GitHub stats history table for tracking repository metrics over time
CREATE TABLE IF NOT EXISTS public.github_stats_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  watchers INTEGER DEFAULT 0,
  issues INTEGER DEFAULT 0,
  pull_requests INTEGER DEFAULT 0,
  commits INTEGER DEFAULT 0,
  contributors INTEGER DEFAULT 0,
  weekly_stars INTEGER DEFAULT 0,
  weekly_commits INTEGER DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.github_stats_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view GitHub stats history" ON public.github_stats_history
  FOR SELECT USING (true);

CREATE POLICY "System can insert GitHub stats history" ON public.github_stats_history
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_github_stats_history_project_id ON public.github_stats_history(project_id);
CREATE INDEX IF NOT EXISTS idx_github_stats_history_recorded_at ON public.github_stats_history(recorded_at DESC);

-- Add transaction count to projects for trending calculation
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS transaction_count INTEGER DEFAULT 0;

-- Create function to update transaction count
CREATE OR REPLACE FUNCTION update_project_transaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects 
    SET transaction_count = COALESCE(transaction_count, 0) + 1
    WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects 
    SET transaction_count = GREATEST(COALESCE(transaction_count, 0) - 1, 0)
    WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update transaction count
DROP TRIGGER IF EXISTS update_transaction_count_trigger ON public.transactions;
CREATE TRIGGER update_transaction_count_trigger
  AFTER INSERT OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_project_transaction_count();
