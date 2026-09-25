# Loom & Co — storefront (Stage 1–2)


https://share.snapchat.com/m/OMPwJa8LSMmOQWR9nHDANQGg2cpNPHhjpS8etwk1zqY?share_id=EpnYb7TjTQE&locale=en-SE-u-mu-celsius




React + TypeScript + Vite + Tailwind, reading the live catalog from Supabase
(project `rug-store`, 848 products / 1,665 variants / 3,904 images already
imported).

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:
- `VITE_SUPABASE_URL` is already set to the `rug-store` project.
- `VITE_SUPABASE_ANON_KEY` — copy from the Supabase dashboard: Project
  Settings → API → Project API keys → `anon` `public`. Safe to expose in the
  browser; Row Level Security decides what it can see. Never put the
  `service_role` key here.

```bash
npm run dev
```

## What's here (Stage 1–2 of the original plan)

- Supabase client, typed queries (TanStack Query) for categories, the shop
  grid with filters, a single product, and stock status via the
  `variant_availability` RPC (exact quantities stay staff-only, per the RLS
  design).
- Home, Shop (with category/color/material filters), Product, and a 404 page.
- Tailwind tokens matching the "quiet luxury" direction from the earlier
  mockup: ivory background, charcoal text, bronze accent, Fraunces for
  display type.

## Not yet built

Everything from Stage 3 onward in the original plan: cart, wishlist,
accounts (Supabase Auth), checkout/Stripe, orders, the admin dashboard,
reviews, promotions, and SEO/analytics polish. The `Add to cart` button on
the product page is inert — it's there to show the stock-aware disabled
state, not to add anything anywhere yet.

`shadcn/ui` isn't installed — the brief asks for it, but its CLI is
interactive and can't run in this environment. Once you have the project
locally: `npx shadcn@latest init`, then swap in its components where useful;
the Tailwind tokens here are already compatible.

Search uses Postgres full-text search (the `products.search` column) rather
than a dedicated search UI (suggestions, recent/popular searches) — that's
still to build.
