# Orchidex

Orchidex is a web app for exploring orchid species and hybrids. Users can visualize complex ancestries, search hybrid registrations, and learn about the people and organizations who grow and discover orchids. Data comes from the Royal Horticultural Society (RHS) orchid registry.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, Server Components)
- **Language**: TypeScript (strict null checks, but `strict: false` overall)
- **Database**: PostgreSQL via Supabase, queried directly with `pg` (no ORM)
- **Auth**: Supabase Auth (OTP-based email login)
- **Styling**: Tailwind CSS v4 + SCSS modules for component-level styles
- **UI Components**: shadcn/ui (new-york style, Radix primitives, Lucide icons)
- **Data Fetching**: SWR for client-side, direct SQL for server-side
- **Visualization**: Vega-Lite, Nivo (treemaps), Cytoscape (network graphs)
- **Deployment**: Vercel

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server

No test runner or lint script is configured in package.json.

## Project Structure

```
app/                          # Next.js App Router
  (default)/                  # Layout group with header/search
    (authenticated)/          # Protected routes (account, lists)
    [genus]/                  # Dynamic genus detail pages
    learn/                    # Educational tools (hybridize, parentage, etc.)
    registrant/[r]/           # Individual registrant pages
    recent/                   # Recently registered hybrids
  (noSearch)/                 # Layout group without search bar
    (index)/                  # Home page
    search/                   # Search interfaces
  api/                        # REST API routes (GET-only, direct SQL)
components/                   # React components
  grex/                       # Hybrid display (card, name, parentage, etc.)
  search/                     # Search UI (autocomplete)
  viz/                        # Visualizations (progeny map, treemap)
  vega-lite/                  # Vega-Lite chart wrappers
  components/ui/              # shadcn/ui primitives
lib/
  fetchers/                   # Server-side data fetching functions
  hooks/                      # Client-side SWR hooks (useGrex, useProgeny, etc.)
  storage/                    # DB connection pool and query execution
  supabase/                   # Supabase client/server setup
  serverActions/              # Next.js Server Actions (auth, lists)
  types.ts                    # Core types (Grex, Stat)
  constants.ts                # App constants
```

## Path Aliases

- `@/components/*` → `components/components/*` (shadcn components)
- `components/*` → `components/*`
- `lib/*` → `lib/*`

## Key Patterns

- **Server Components by default**; use `'use client'` only when needed
- **`'use server'`** for Server Actions in `lib/serverActions/`
- **Direct SQL queries** via `pg` pool — no ORM, no query builder
- **SWR hooks** (`useGrex`, `useDate`, `useProgeny`, etc.) wrap client-side fetches to `/api/` routes
- **SCSS modules** (`*.module.scss`) for component-scoped styles alongside Tailwind utilities
- **Dynamic route params** are typed as Promises in Next.js 15 (e.g., `params: Promise<{ genus: string }>`)

## Database

Primary table: `rhs` (Royal Horticultural Society registry)
- Key fields: `id`, `genus`, `epithet`, `registrant_name`, `originator_name`, `date_of_registration`
- Parent references: `seed_parent_genus/epithet/id`, `pollen_parent_genus/epithet/id`
- Normalized fields: `*_normalized` variants for accent-insensitive search
- `hypothetical` boolean flag
- Ancestry/progeny queries use recursive CTEs

Connection uses `SB_PG_POOL_URL` env variable via `lib/storage/pool.ts`.

## Code Style

- **Prettier**: single quotes, JSX single quotes
- **ESLint**: extends `react-app`, with import ordering enforced
- **Naming**: PascalCase components, camelCase functions/hooks, UPPER_SNAKE_CASE constants
- **Imports**: ordered by builtin → external → internal → parent → sibling → index → type

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SB_PG_POOL_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` — Auth config
- `DD_RUM_APP_ID` / `DD_RUM_CLIENT_TOKEN` — Datadog RUM
