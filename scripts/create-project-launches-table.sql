-- Create a clean table for launches with no surprise NOT NULL constraints
create table if not exists public.project_launches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  symbol text not null check (char_length(symbol) <= 10),
  description text,
  mint text not null,
  dev_wallet text not null,
  image_url text not null,
  pump_url text not null,
  created_at timestamptz not null default now()
);

-- Create indexes for performance
create unique index if not exists project_launches_mint_unique on public.project_launches(lower(mint));
create index if not exists project_launches_created_at_idx on public.project_launches(created_at desc);
