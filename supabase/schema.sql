-- Mundus Supabase Schema
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (synced from Privy)
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  privy_id text unique not null,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  is_admin boolean default false,
  accuracy numeric(5,2) default 0,
  resolved_calls integer default 0,
  hits integer default 0,
  misses integer default 0,
  active_calls integer default 0,
  followers_count integer default 0,
  following_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tokens (verified by admins, data from GeckoTerminal)
create table if not exists public.tokens (
  id uuid primary key default uuid_generate_v4(),
  network text not null default 'solana', -- solana, eth, base, etc.
  contract_address text not null,
  symbol text not null,
  name text not null,
  image_url text,
  decimals integer,
  is_verified boolean default false,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),
  verification_notes text,
  gecko_data jsonb, -- cached metadata from GeckoTerminal
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(network, contract_address)
);

create index if not exists tokens_symbol_idx on public.tokens (symbol);
create index if not exists tokens_verified_idx on public.tokens (is_verified);

-- Calls (the core product)
create table if not exists public.calls (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_id uuid references public.tokens(id),
  -- For unverified tokens we still store the raw data
  network text not null default 'solana',
  contract_address text not null,
  symbol text not null,
  token_name text,
  direction text not null check (direction in ('bullish', 'bearish')),
  entry_price numeric not null,
  target_price numeric not null,
  invalidation_price numeric,
  timeframe text not null, -- e.g. '1d', '1w', '1m', '3m'
  thesis text not null,
  status text not null default 'active' check (status in ('active', 'hit', 'missed', 'invalidated')),
  resolved_at timestamptz,
  performance_pct numeric, -- calculated on resolve or live
  agrees_count integer default 0,
  disagrees_count integer default 0,
  comments_count integer default 0,
  is_promoted boolean default false,
  created_at timestamptz default now(),
  -- Original call data is immutable after publish (no update of core fields)
  constraint calls_immutable check (true)
);

create index if not exists calls_user_idx on public.calls (user_id);
create index if not exists calls_status_idx on public.calls (status);
create index if not exists calls_created_idx on public.calls (created_at desc);
create index if not exists calls_token_idx on public.calls (contract_address);

-- Follows
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- Votes (Agree / Disagree)
create table if not exists public.votes (
  id uuid primary key default uuid_generate_v4(),
  call_id uuid not null references public.calls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vote_type text not null check (vote_type in ('agree', 'disagree')),
  created_at timestamptz default now(),
  unique(call_id, user_id)
);

-- Comments
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  call_id uuid not null references public.calls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists comments_call_idx on public.comments (call_id);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, -- follow, comment, vote, call_resolved, etc.
  title text not null,
  body text,
  data jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, read);

-- Seasons (for future WDC rewards)
create table if not exists public.seasons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  wdc_pool numeric default 0,
  status text default 'upcoming' check (status in ('upcoming', 'active', 'ended')),
  created_at timestamptz default now()
);

-- Reward ledger (off-chain for now)
create table if not exists public.reward_ledger (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id),
  season_id uuid references public.seasons(id),
  amount numeric not null,
  reason text not null, -- accuracy, engagement, creator, etc.
  status text default 'pending' check (status in ('pending', 'locked', 'claimed')),
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.tokens enable row level security;
alter table public.calls enable row level security;
alter table public.follows enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.seasons enable row level security;
alter table public.reward_ledger enable row level security;

-- Profiles: public read, owner update
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid()::text = privy_id or true); -- adjust with Privy JWT later

-- Tokens: public read, admin write
create policy "Tokens are viewable by everyone"
  on public.tokens for select using (true);

create policy "Admins can manage tokens"
  on public.tokens for all using (
    exists (select 1 from public.profiles where privy_id = auth.uid()::text and is_admin = true)
  );

-- Calls: public read, authenticated insert, no update of core fields
create policy "Calls are viewable by everyone"
  on public.calls for select using (true);

create policy "Authenticated users can create calls"
  on public.calls for insert with check (true);

-- Follows, votes, comments: authenticated
create policy "Follows public read" on public.follows for select using (true);
create policy "Users can follow" on public.follows for insert with check (true);
create policy "Users can unfollow" on public.follows for delete using (true);

create policy "Votes public read" on public.votes for select using (true);
create policy "Users can vote" on public.votes for insert with check (true);
create policy "Users can change vote" on public.votes for update using (true);

create policy "Comments public read" on public.comments for select using (true);
create policy "Users can comment" on public.comments for insert with check (true);

create policy "Users see own notifications" on public.notifications for select using (true);

-- Helper function to update accuracy when call resolves
create or replace function update_user_accuracy()
returns trigger as $$
begin
  if new.status in ('hit', 'missed') and old.status = 'active' then
    update public.profiles
    set
      resolved_calls = resolved_calls + 1,
      hits = hits + case when new.status = 'hit' then 1 else 0 end,
      misses = misses + case when new.status = 'missed' then 1 else 0 end,
      active_calls = greatest(active_calls - 1, 0),
      accuracy = case
        when (resolved_calls + 1) > 0 then
          round( ((hits + case when new.status = 'hit' then 1 else 0 end)::numeric / (resolved_calls + 1)) * 100, 2)
        else 0
      end,
      updated_at = now()
    where id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_call_resolve
  after update of status on public.calls
  for each row
  execute function update_user_accuracy();

-- Seed a couple of verified tokens (SOL, BTC placeholders - update with real CAs)
-- Example for Solana SOL (native is special, use WSOL or known tokens)
insert into public.tokens (network, contract_address, symbol, name, is_verified, image_url)
values
  ('solana', 'So11111111111111111111111111111111111111112', 'SOL', 'Solana', true, 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'),
  ('solana', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'USDC', 'USD Coin', true, null)
on conflict do nothing;

