

# PulseBoard — Phase 1: Database Layer & Authentication

## What We're Building

Setting up the complete database foundation and user authentication for PulseBoard. This includes all tables, security policies, and login/signup pages. No external APIs or business logic — just a solid, secure data layer.

---

## Step 1: Database Schema (SQL Migration)

Create all 6 tables in a single migration:

### profiles
- `id` (UUID, primary key, linked to auth.users with CASCADE delete)
- `email` (text)
- `display_name` (text, nullable)
- `avatar_url` (text, nullable)
- `plan` (text, default 'free')
- `created_at` (timestamp)

A database trigger will auto-create a profile row whenever a new user signs up.

### dashboards
- `id` (UUID, primary key)
- `user_id` (UUID, references profiles)
- `name` (text, default 'My Dashboard')
- `layout_json` (JSONB, default empty array)
- `created_at`, `updated_at` (timestamps)

### widgets
- `id` (UUID, primary key)
- `dashboard_id` (UUID, references dashboards with CASCADE)
- `type` (text, not null)
- `config_json` (JSONB, default empty object)
- `position_x`, `position_y` (integer, default 0)
- `width`, `height` (integer, defaults 4 and 3)
- `created_at` (timestamp)

### alerts
- `id` (UUID, primary key)
- `user_id` (UUID, references profiles)
- `coin_symbol` (text)
- `target_price` (numeric)
- `condition_type` (text, default 'above')
- `is_active` (boolean, default true)
- `triggered_at` (timestamp, nullable)
- `created_at` (timestamp)

### cache_crypto_data (server-managed)
- `symbol` (text, primary key)
- `price`, `change_24h`, `market_cap`, `volume` (numeric)
- `last_updated` (timestamp)

### cache_news (server-managed)
- `id` (UUID, primary key)
- `title`, `summary`, `url`, `source` (text)
- `published_at`, `fetched_at` (timestamps)

---

## Step 2: Row Level Security

Every table gets RLS enabled. Policies:

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | Own row only | Auto (trigger) | Own row only | -- |
| dashboards | Own rows | Own rows | Own rows | Own rows |
| widgets | Via own dashboard | Via own dashboard | Via own dashboard | Via own dashboard |
| alerts | Own rows | Own rows | Own rows | Own rows |
| cache_crypto_data | All authenticated | None | None | None |
| cache_news | All authenticated | None | None | None |

Widget policies use a subquery to verify the widget's dashboard belongs to the current user — ensuring no cross-user access.

---

## Step 3: Authentication UI

### New Pages
- `/login` — email + password form, link to signup, error handling
- `/signup` — email + password form, link to login, success feedback

### Auth Context
- Create an `AuthProvider` component wrapping the app
- Listens to `onAuthStateChange` for session updates
- Provides `user`, `session`, `signOut`, and `loading` state

### Protected Routes
- A `ProtectedRoute` wrapper that redirects unauthenticated users to `/login`
- Applied to `/dashboard`, `/templates`, `/alerts`, `/settings`

### Auto-Create Dashboard
- On first login, if no dashboard exists, automatically create one named "My Dashboard"

---

## Step 4: App Routing Update

Update `App.tsx` with all routes:

| Route | Page | Protected? |
|---|---|---|
| `/` | Landing Page (placeholder) | No |
| `/login` | Login | No |
| `/signup` | Signup | No |
| `/dashboard` | Dashboard (placeholder) | Yes |
| `/templates` | Templates (placeholder) | Yes |
| `/alerts` | Alerts (placeholder) | Yes |
| `/settings` | Settings (placeholder) | Yes |

Protected pages will show a simple placeholder message for now — the UI will be built in later phases.

---

## Step 5: Dark Glass Styling for Auth Pages

Login and signup pages will use the PulseBoard dark glass design:
- Dark background (#0B0F1A)
- Glass card container for the form
- Purple accent buttons (#8B5CF6)
- Clean, minimal layout

---

## Technical Notes

- The `profiles` table is used instead of directly referencing `auth.users` (Supabase best practice)
- A PostgreSQL trigger + function handles automatic profile creation on signup
- Widget RLS policies check dashboard ownership via subquery to prevent cross-user access
- Cache tables have no INSERT/UPDATE/DELETE policies for authenticated users — only edge functions (using service role) will write to them later
- No edge functions or external API calls in this phase

