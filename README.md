# MacroFit Pro

A full-featured nutrition and macro tracking progressive web app with AI-powered food logging, cross-device sync, and comprehensive health analytics.

## Features

- **AI Food Logging** — Chat naturally to log meals, weight, and water intake
- **Meal Photo Analysis** — Upload a photo and get automatic macro estimates
- **USDA Food Database** — Search 500,000+ foods with real nutritional data
- **Cross-Device Sync** — Cloud sync via Supabase; data follows you everywhere
- **Progress Tracking** — Weight trends, trend prediction, and pattern insights
- **Recipe Builder** — Combine ingredients into reusable meal templates
- **Fasting Timer** — Intermittent fasting session tracker
- **Body Measurements** — Track neck, chest, waist, hips, arms, and thighs
- **Progress Photos** — Front, side, and back pose photo gallery
- **PWA** — Installable on mobile and desktop, works offline

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| State | Zustand + Immer (localStorage persistence) |
| Routing | React Router v6 |
| Charts | Recharts |
| Backend | Vercel Edge Functions |
| Database | Supabase (PostgreSQL + JSONB) |
| Auth | Supabase Auth (email/password) |
| AI | Anthropic Claude (chat + vision) |
| Food API | USDA FoodData Central |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key
- A [USDA FoodData Central](https://fdc.nal.usda.gov/api-guide.html) API key

### Setup

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd macro-tracker
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_USDA_API_KEY=your_usda_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

3. Run the Supabase schema from `supabase-schema.sql` in your Supabase SQL editor.

4. Start the dev server:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

### Build

```bash
npm run build    # Type-check + production bundle
npm run preview  # Preview production build locally
```

## Deployment

The app is configured for [Vercel](https://vercel.com). Add the four environment variables to your Vercel project settings. The `vercel.json` handles SPA routing and Edge Function wiring automatically.

## Project Structure

```
src/
├── api/            # Vercel Edge Functions (chat, photo analysis)
├── components/     # Reusable UI components
├── contexts/       # AuthContext (auth + Supabase sync)
├── data/           # Local food database
├── lib/            # Supabase client, storage helpers
├── pages/          # Route-level page components
├── store/          # Zustand global store
├── types/          # Shared TypeScript interfaces
└── utils/          # Calculations, USDA API client
```
