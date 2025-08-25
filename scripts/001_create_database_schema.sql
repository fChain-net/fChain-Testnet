-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username TEXT UNIQUE,
  github_avatar_url TEXT,
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  github_repo_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_description TEXT,
  repo_stars INTEGER DEFAULT 0,
  repo_forks INTEGER DEFAULT 0,
  repo_language TEXT,
  repo_verified BOOLEAN DEFAULT FALSE,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_description TEXT NOT NULL,
  token_image_url TEXT,
  pump_fun_url TEXT,
  mint_address TEXT,
  bonding_curve_address TEXT,
  associated_bonding_curve_address TEXT,
  creator_address TEXT,
  market_cap DECIMAL,
  usd_market_cap DECIMAL,
  reply_count INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT FALSE,
  king_of_the_hill_timestamp TIMESTAMP WITH TIME ZONE,
  nsfw BOOLEAN DEFAULT FALSE,
  market_id TEXT,
  inverted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('create', 'buy', 'sell')),
  sol_amount DECIMAL,
  token_amount DECIMAL,
  signature TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Anyone can view projects" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for transactions table
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_market_cap ON public.projects(market_cap DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON public.transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_github_username ON public.users(github_username);
