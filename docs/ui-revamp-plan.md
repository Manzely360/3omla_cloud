# 3OMLA UI Revamp Plan

## Goals
- Ship a production-ready web experience that looks polished, runs fast, and is backed by live market data from Binance, Bybit, KuCoin, Kraken, OKX, Coinbase, Gate, Huobi, Bitfinex, and BitMEX (no mock data).
- Migrate to a modern React stack (Vite + React 18 + TypeScript + Tailwind + Framer Motion + React Query).
- Provide responsive dark/light theming, Arabic/English localisation, and smooth micro-interactions.
- Hardwire authentication (signup/login/logout/me) against the FastAPI backend and persist JWT securely.
- Build a real blog and article reader fed from the backend (Postgres) with SEO-friendly slugs.
- Hook up real-time sockets (FastAPI `/api/v1/realtime/ws`) for live prices, exchange status, and signal streaming.

## High-Level Architecture
- `apps/web` (new Vite app) contains the client code. Existing Next.js folder (`frontend/`) stays during transition but will be retired once parity is met.
- Shared UI kit lives under `apps/web/src/components/ui` with small composable primitives (buttons, cards, data widgets) built on Tailwind + class-variance-authority.
- Global providers inside `apps/web/src/app/providers`: `ThemeProvider`, `I18nProvider`, `AuthProvider`, `QueryClientProvider`, `SocketProvider`.
- Routing handled by React Router 6 with nested routes:
  - `/` Home / marketing hero with streaming ticker.
  - `/login`, `/signup`, `/logout`.
  - `/dashboard` authenticated area pulling live metrics, lead/lag highlights, and watchlists.
  - `/markets` aggregated market view with exchange comparison, depth heatmap, and filters.
  - `/lead-lag` exploration workspace (list + network graph) backed by realtime engine.
  - `/signals` live signal board (auto refresh by WebSocket + React Query).
  - `/blog` list view (paginated) + `/blog/:slug` article details.
  - `/profile` and `/settings` for account management.
- Feature folders under `apps/web/src/features/*` encapsulate domain logic (e.g., `auth`, `markets`, `blog`, `analytics`, `layout`). Each feature exposes hooks, components, and route loaders.

## Data & State
- REST clients generated via `ky` wrappers under `lib/api` with typed responses (Zod parsing) to enforce contract.
- Authentication tokens stored in secure `httpOnly` cookies via backend `Set-Cookie` (FastAPI update) with fallback to `localStorage` for now; React Query `queryClient.setQueryData` keeps `user` cache consistent.
- WebSocket service encapsulated in `lib/ws.ts` providing subscribe/unsubscribe helpers; forwarded to React Query caches so components remain declarative.
- All mock-data fallbacks removed; development uses real endpoints with `.env.development` pointing at local FastAPI.

## Styling & Theming
- Tailwind with CSS variables for color tokens. `ThemeProvider` toggles `data-theme="dark|light"` at root and persists in `localStorage`.
- Arabic RTL support maintained via `dir="rtl"` toggling and logical CSS classes.
- Framer Motion used sparingly for route transitions and key UI reveals.

## Accessibility & UX Enhancements
- Keyboard-friendly navigation, focus traps for dialogs, reduced-motion respect.
- Toast notifications replaced with `sonner` for consistent look.
- Loading skeletons & shimmer states for data-heavy sections.
- Responsive breakpoint grid tuned for trading dashboards (min width 1280 for pro view, stacked mobile fallback).

## Backend Touchpoints Needed
- Blog: add `blog_posts` table, CRUD service, and `/api/v1/blog` routes (list, detail, admin create when auth’d).
- Auth: extend login endpoint to optionally drop `access_token` cookie; add `/api/v1/auth/me` to return profile.
- Real-time: ensure `enhanced_multi_exchange_pooler` pushes aggregated snapshots into Redis & triggers FastAPI broadcaster.
- Signals: expose `/api/v1/signals/live` streaming endpoint (SSE/WebSocket) for autopopulating signal board.

## Delivery Stages
1. Implement backend blog + auth cookie refresh while cleaning ingestion defaults (no testnet).
2. Scaffold Vite app with base layout, providers, and shared UI primitives.
3. Port authentication flow + blog pages + markets dashboard with live data.
4. Add lead-lag workspace, signals board, and WebSocket bridging.
5. Harden styling, accessibility, localisation, and run end-to-end dockerised smoke tests.

## Risks & Mitigations
- **Exchange rate limits**: implement exponential backoff and caching per exchange in ingestion services; share results via Redis TTL caches.
- **WebSocket disconnects**: auto-retry with capped exponential delays and show UI status badges per exchange.
- **Large bundle**: rely on Vite splitting + React.lazy for heavy charts, use `lightweight-charts` dynamic import.
- **Authentication**: prefer cookie storage to avoid XSS token theft; guard routes client-side and server-side.

