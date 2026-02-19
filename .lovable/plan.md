

# Dashooo - Full Audit and Fix Plan

## Issues Found

### 1. CRITICAL: No Database Trigger for New User Profiles
The `handle_new_user()` function exists in the database, but **no trigger is attached**. This means new users who sign up will NOT get a profile row created automatically, causing failures in dashboard creation, trial status, plan limits, and settings.

**Fix**: Create a database migration to add the trigger on `auth.users`.

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

### 2. HIGH: fetch-news Edge Function Intermittent Errors
Logs show repeated `(json.Data || []).slice is not a function`. The CryptoCompare API sometimes returns `Data` as an object (not array). 

**Fix**: Update `supabase/functions/fetch-news/index.ts` to safely extract the array:
```typescript
const rawData = json.Data;
const dataArray = Array.isArray(rawData) ? rawData : [];
const articles = dataArray.slice(0, 50).map(...)
```

---

### 3. MEDIUM: Login and Signup Pages Don't Redirect Authenticated Users
If a user is already logged in and navigates to `/login` or `/signup`, they still see the forms instead of being redirected to `/dashboard`.

**Fix**: Add auth check to both `Login.tsx` and `Signup.tsx`:
```typescript
const { user, loading } = useAuth();
if (!loading && user) return <Navigate to="/dashboard" replace />;
```

---

### 4. MEDIUM: Admin Promo PATCH Invocation Broken
In `useAdmin.ts`, the promo update calls `supabase.functions.invoke("admin-promo/${id}")`. Supabase `functions.invoke()` uses function names, not paths -- this will invoke a non-existent function.

**Fix**: Change to send the `id` in the request body instead:
```typescript
// useAdmin.ts
const { data, error } = await supabase.functions.invoke("admin-promo", {
  method: "PATCH",
  body: { id, ...updates },
});
```
And update the edge function to read `id` from the body instead of URL path.

---

### 5. LOW: CORS Headers Missing Newer Supabase Client Headers
All edge functions use a minimal CORS `Access-Control-Allow-Headers` that's missing headers the Supabase JS client now sends (`x-supabase-client-platform`, etc.). This can cause preflight failures.

**Fix**: Update all edge functions' CORS headers to:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

Affected files:
- `supabase/functions/fetch-news/index.ts`
- `supabase/functions/fetch-crypto-data/index.ts`
- `supabase/functions/check-alerts/index.ts`
- `supabase/functions/admin-auth/index.ts`
- `supabase/functions/admin-promo/index.ts`
- `supabase/functions/admin-stats/index.ts`
- `supabase/functions/scheduler/index.ts`

---

### 6. LOW: admin-auth Uses Deprecated `getUser()` Pattern
The `admin-auth` edge function uses `getUser(token)` while `admin-promo` uses the newer `getClaims(token)`. Should be consistent.

**Fix**: Update `admin-auth/index.ts` to use `getClaims()` for token verification.

---

## Implementation Order

1. Database migration (trigger for new users) -- most critical
2. Fix Login/Signup redirects
3. Fix fetch-news API parsing
4. Fix admin promo PATCH invocation
5. Update CORS headers across all edge functions
6. Update admin-auth to use getClaims

## Technical Summary

| # | Issue | Severity | Files |
|---|-------|----------|-------|
| 1 | Missing trigger | Critical | DB migration |
| 2 | News fetch error | High | fetch-news/index.ts |
| 3 | No auth redirect on login/signup | Medium | Login.tsx, Signup.tsx |
| 4 | Promo PATCH broken | Medium | useAdmin.ts, admin-promo/index.ts |
| 5 | CORS headers incomplete | Low | All edge functions |
| 6 | admin-auth deprecated pattern | Low | admin-auth/index.ts |

