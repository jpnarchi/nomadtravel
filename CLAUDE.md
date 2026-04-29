# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server.
- `npm run build` / `npm run build:dev` — production / development builds.
- `npm run lint` / `npm run lint:fix` — ESLint (only lints `src/components/**`, `src/pages/**`, `src/Layout.jsx` per `eslint.config.js`).
- `npm run typecheck` — `tsc -p ./jsconfig.json` (JS with `checkJs: true`; `src/api`, `src/lib`, `src/components/ui` are excluded).
- `npm run preview` — preview the production build.

There is no test runner configured.

## Architecture

This is **Nomad Travel**, a luxury-travel-agency CRM. Spanish is the primary UI language. The app is a Vite + React 18 SPA backed by Supabase (data + storage), with **Clerk** as the identity provider and a legacy **Base44** SDK still wired in for a few integrations (LLM calls, app logs).

### Auth: Clerk is the source of truth, Supabase is the data store

- `src/main.jsx` wraps everything in `<ClerkProvider>` using `VITE_CLERK_PUBLISHABLE_KEY`.
- `src/App.jsx` gates the app on `useUser()` from `@clerk/clerk-react`. Unauthenticated users see `<Login />`; the only public route is `/public/trip-form/:token` (`ClientTripForm`).
- **There is no Supabase Auth in the request path for the main app** even though `src/lib/SupabaseAuthContext.jsx` exists — the Supabase client is used with the anon key and rows are filtered in code by the Clerk user's email. Don't assume RLS based on `auth.uid()` is wired up; treat Supabase as a shared-anon data layer.
- Admin gating is done by **email allowlist** in `src/config/adminEmails.js` (`isAdminEmail`). `AdminRoute` (`src/components/AdminRoute.jsx`) wraps any page whose key starts with `Admin` in `pages.config.js`.
- `SpoofContext` (`src/contexts/SpoofContext.jsx`) lets admins impersonate a regular user via `?spoof_email=...` URL params or `AdminSpoof` page; impersonation is held in `sessionStorage` under `admin_spoof_user`. When spoofing, `Layout` and `useSpoofableUser` swap the effective identity — pages that filter by user email should use `useSpoofableUser()`, not `useUser()` directly, or admin-as-user views will leak the admin's data.

### Routing is config-driven

- `src/pages.config.js` is the registry: keys are URL path segments, values are page components, and `mainPage: "Dashboard"` is rendered at `/`. `App.jsx` iterates this map to build routes.
- `createPageUrl(name)` in `src/utils/index.ts` is the canonical way to build internal links (`/SoldTripDetail`, etc.). When adding a page, register it in `pages.config.js` — there is no file-system routing.
- The sidebar in `src/Layout.jsx` has **two hardcoded navigation arrays** (`adminNavigation`, `userNavigation`); a new page won't appear in the sidebar just by registering it. Supervisors (custom_role `supervisor`) get an extra section in the user nav.

### Data layer: `supabaseAPI` is a base44-shaped wrapper

`src/api/supabaseClient.js` exposes `supabaseAPI.entities.<EntityName>` with `list / filter / get / create / bulkCreate / update / delete / hardDelete`. Key conventions:

- **Soft delete by default:** `delete()` sets `is_deleted = true` and `list/filter` exclude soft-deleted rows. Tables that don't have `is_deleted` must be registered with `{ hasIsDeleted: false }` (see `User`, `Task`, `TripService`, `ClientPayment`, `SupplierPayment`, `GroupMember`, `ErrorReport`, `SharedTripForm`, `ServiceDropdownOption`).
- Default ordering is `created_date DESC`; tables without that column pass `{ hasCreatedDate: false }`.
- `IndustryFair` overrides `list`/`get` to JSON-parse `includes` and `assigned_agents` defensively (they may be stored as either text or jsonb).
- New tables: add the entity to the `entities` block here; don't reach for `supabase.from()` in components unless you need behavior the wrapper doesn't cover.
- `supabaseAPI.storage.uploadFile(file, bucket='documents', path=null)` generates a unique filename and returns `{ file_url, file_path, file_name }` using the public URL.

### Base44 is legacy but not gone

- `src/api/base44Client.js` still wraps `@base44/sdk` and is configured via `src/lib/app-params.js` (reads `app_id`, `server_url`, `access_token` from URL params and persists them in localStorage under `base44_*`).
- When `VITE_DEV_MODE=true`, `base44` is replaced with a Proxy that returns empty/mock data — useful so pages don't crash without a Base44 token. **This dev-mode shim does not affect Supabase calls;** Supabase still hits the real backend.
- Live uses of Base44 in the app: `base44.integrations.Core.InvokeLLM` for the BBVA USD/MXN exchange rate widget in `Layout.jsx`, and `base44.appLogs.logUserInApp` for activity logging. Don't add new Base44 entity calls — route new data through `supabaseAPI`.

### Backend functions live in two places

- `functions/*.ts` — Base44 functions (imports, audits, payment reminders).
- `supabase/functions/<name>/index.ts` — Supabase Edge Functions (`importTripFromInvoice`, `importClientPaymentFromFiles`, `importServiceFromFiles`, `importSupplierPaymentFromFiles`). These are the active import pipeline.
- `migrations/*.sql` is a flat directory of historical schema patches (not Supabase CLI migrations under `supabase/migrations`). Many files are remediation scripts (e.g. `FIX-STORAGE-NOW.sql`, `fix-id-types-safe.sql`); read the filename and the file before running anything against a real DB — order matters and several have `-fixed` successors.

### Conventions

- Path alias `@/*` → `src/*` (configured in `jsconfig.json` and `vite.config.js`'s base44 plugin).
- UI is shadcn/ui (`new-york` style, neutral base, lucide icons) under `src/components/ui/`. Domain components are grouped by feature: `clients/`, `trips/`, `soldtrips/`, `commissions/`, `suppliers/`, `credentials/`, `dashboard/`, `documents/`, `learning/`, `reviews/`, `statistics/`, `control/`.
- Theming: brand tokens (`--nomad-green`, `--luxury-gold`, etc.) and the Playfair/Inter font pairing are injected as a `<style>` block at the top of `Layout.jsx` — global CSS is in `src/index.css` and `src/App.css` but the brand variables live in `Layout.jsx`.
- React Query (`@tanstack/react-query`) — client is `queryClientInstance` from `src/lib/query-client.js`, provider is at the App root.
- ESLint enforces `unused-imports/no-unused-imports` as an error and warns on unused vars (prefix with `_` to silence). `react/prop-types` is off.

### Environment

`.env` (gitignored) variables required at runtime:
- `VITE_CLERK_PUBLISHABLE_KEY` — required, app throws at boot without it.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — required for any data to load.
- `VITE_BASE44_APP_ID`, `VITE_BASE44_BACKEND_URL` — used by the Base44 client.
- `VITE_DEV_MODE=true` — short-circuits Base44 calls to mocks (does not affect Supabase).
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only, used by the import scripts in `scripts/` and Edge Functions; never reference from `src/`.
