# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173)
npm run build     # Type-check (tsc) + build production bundle
npm run preview   # Preview production build locally
```

There are no test or lint scripts. Type checking is done via `tsc` as part of `npm run build`.

## Environment Variables

Required in `.env` (local) and Vercel project settings (production):

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key
- `VITE_USDA_API_KEY` — USDA FoodData Central API key
- `ANTHROPIC_API_KEY` — Claude API key (used server-side in `/api/`)

## Architecture Overview

**MacroFit Pro** is a React + TypeScript SPA deployed on Vercel, with Supabase for auth/cloud sync and Vercel Edge Functions for AI features.

### State Management

The app uses a single Zustand store (`src/store/useStore.ts`) with:
- **Immer** middleware for draft-based mutations
- **Persist** middleware writing to `localStorage` under key `'macrofit-storage'`
- State slices: `profile`, `diary` (keyed by date), `weightLog`, `customFoods`, `mealTemplates`, `progressPhotos`, `bodyMeasurements`, `fastingSession`, `darkMode`

### Cloud Sync

`src/contexts/AuthContext.tsx` is the sync orchestration layer:
1. On login → `loadUserData()` fetches a single JSONB row from Supabase `user_data` table and calls `hydrateStore()` to populate Zustand
2. On store change → debounced 1.5s auto-save upserts back to Supabase
3. On tab hide / sign-out → flushes any pending save immediately
4. Exposes `syncStatus` ('idle' | 'saving' | 'saved' | 'error') consumed by `App.tsx` sync indicator

The Supabase schema (`supabase-schema.sql`) stores the entire app state as a JSONB blob in `user_data`, one row per user, with RLS enforcing user-scoped access.

### AI Features (Vercel Edge Functions)

- `api/chat.ts` — Natural language food logging via `claude-haiku-4-5-20251001`. Receives user messages + context (goals, today's entries), calls Claude with tools (`log_food`, `log_weight`, `log_water`, `remove_food`), returns text summary + actions.
- `api/analyze-photo.ts` — Meal photo analysis via Claude vision.

### Food Data Sources

1. `src/data/foodDatabase.ts` — 100+ local preset foods
2. USDA FoodData Central API (`src/utils/usdaApi.ts`) — real-time search (free DEMO_KEY: 30 req/min)
3. User-created custom foods stored in Zustand

### Key Utilities

- `src/utils/calculations.ts` — BMR, TDEE, and macro calculations
- `src/lib/supabase.ts` — Supabase client initialization
- `src/lib/storage.ts` — Progress photo upload/delete via Supabase Storage
- `src/types/index.ts` — All shared TypeScript interfaces (Food, User, Goals, DiaryEntry, etc.)

### Routing

React Router v6 with routes defined in `App.tsx`. All routes redirect to `/index.html` via `vercel.json` for SPA support. The `/login` route is only accessible when unauthenticated; auth state is managed by `AuthContext`.

### PWA

Vite PWA plugin (`vite.config.ts`) generates the service worker and manifest. USDA API responses are cached by Workbox (7-day max age). Icons are SVGs in `public/`.
