-- Creating projects table for Explore Cards feature
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  symbol text not null check (char_length(symbol) <= 10),
  description text,
  mint text not null,                 -- coin address (CA)
  dev_wallet text not null,           -- wallet that launched
  image_url text not null,            -- http(s) URL (convert ipfs:// to gateway)
  pump_url text not null,             -- https://pump.fun/coin/<mint>
  created_at timestamptz not null default now()
);

create unique index if not exists projects_mint_unique on public.projects(lower(mint));
create index if not exists projects_created_at_idx on public.projects(created_at desc);
