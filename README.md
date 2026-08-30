# Mundus — Make your call. Build your track record.

Real full-stack MVP of a crypto social platform for price calls, track records and discovery.

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase + Privy + GeckoTerminal

## What's included (Phases 0–1 + foundations for 2–3)

- Beautiful mobile-first landing page (liquid glass, animations)
- Privy authentication (email, Google, X, Discord) — **no wallets**
- Real Supabase schema + RLS for profiles, tokens, calls, follows, votes, comments, notifications, seasons, reward ledger
- Home feed with live call cards + performance calculation
- Post a Call flow (token lookup via GeckoTerminal, immutable after publish)
- Explore + Profile pages
- Admin-ready `tokens` table (`is_verified`, `verified_by`, notes)
- API routes that proxy GeckoTerminal (token lookup + prices)
- Foundations for follows, leaderboard, seasons, $WDC utility (no on-chain yet)

## Quick start

### 1. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Copy **Project URL** and **anon key** + **service_role key**

### 2. Run the schema
1. In Supabase → SQL Editor → paste the entire contents of `supabase/schema.sql`
2. Run it

### 3. Create Privy app
1. Go to [privy.io](https://privy.io) → create app
2. Enable login methods: Email, Google, Twitter, Discord
3. Copy **App ID**
4. (Optional) Set allowed origins to `http://localhost:3000` and your production domain

### 4. Configure env
```bash
cp .env.example .env.local
```
Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_PRIVY_APP_ID=...
```

### 5. Install & run
```bash
npm install
npm run dev
```
Open http://localhost:3000

### 6. Make yourself admin (for token verification)
In Supabase SQL Editor:
```sql
update public.profiles set is_admin = true where privy_id = 'your-privy-id';
```
(or after first login look up your row)

## Token verification (admin)
- Any admin can insert/update rows in `tokens` table and set `is_verified = true`
- UI for admin verification can be added under `/admin` (structure is ready)
- All token market data (price, name, symbol, image) comes from **GeckoTerminal** public API

## Push to GitHub
```bash
cd mundus
git init
git add .
git commit -m "Mundus MVP — Phase 0 + Core"
gh repo create mundus --public --source=. --remote=origin --push
# or create repo on GitHub first then:
git remote add origin https://github.com/YOUR_USER/mundus.git
git push -u origin main
```

## Design notes
- Premium dark UI, liquid glass, backdrop blur, subtle gradients
- Mobile-first, works on desktop
- Feels like X + modern fintech, not a trading terminal

## Next steps (you or future iterations)
- Wire live price polling into feed cards via `/api/prices`
- Full Explore (trending pools from GeckoTerminal + user search)
- Follow / For You feed split
- Comments + Agree/Disagree with real mutations
- Notifications
- Leaderboard (accuracy * log(resolved_calls) style ranking)
- Admin UI for token verification
- Seasons + reward ledger UI
- Later: wallets + $WDC for promotion / verification / creator rewards

## Important
- Calls are immutable after publish (by design)
- Verification ≠ safety guarantee (stated clearly on landing)
- No wallet connection in this MVP

Built as a real working prototype. Plug in your keys and it lives.
