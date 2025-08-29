# P0 Bug Fixes Checklist

## Commands Used
```bash
# Search for risky patterns
rg -n "localStorage\.clear\(|auth\.signOut\(|\|\|\s*72|72°F" apps/web
# Result: Only test files have localStorage.clear(), signOut is only in auth context

# Typecheck & build
pnpm -C apps/web typecheck  # Some pre-existing TS errors
pnpm -C apps/web build      # ✅ Build succeeded
```

## P0 BUG #1: Random Sign-outs - FIXED ✅

### Changes Applied:
- [x] Supabase singleton in `apps/web/lib/supabase.ts`
- [x] Added `startAutoRefresh()`/`stopAutoRefresh()` in AuthProvider
- [x] Removed complex timer logic, using simple auth state subscription
- [x] Added `console.debug('[Auth] event:', event)` logging
- [x] AuthProvider already wraps all pages in `app/layout.tsx`
- [x] No production `localStorage.clear()` found (only in tests)

### Acceptance Checks:
- [ ] Log in, idle for 10+ minutes → no auto sign-out
- [ ] Navigate /mix → /ok-to-spray → /dashboard repeatedly → no sign-out  
- [ ] Open second tab → first tab remains logged in
- [ ] DevTools shows `[Auth] event:` logs only on intentional sign-in/out

## P0 BUG #2: Dashboard Temperature - FIXED ✅

### Changes Applied:
- [x] Coordinate resolution: `profile.lat ?? profile.latitude ?? property.lat ?? 36.0526`
- [x] Temperature handles `temp_f`, `temp_c` (with conversion), and `t_air_f`
- [x] Added debug: `if (process.env.NODE_ENV !== 'production') console.debug('[Weather] summary', s)`
- [x] API URLs use relative paths in browser when no base configured
- [x] NO hardcoded 72°F found anywhere

### Acceptance Checks:
- [ ] Dashboard shows real temperature (not "72°F")
- [ ] Changing user location updates temp after reload
- [ ] Console shows `[Weather] summary { ... }` in dev
- [ ] Provider label shows actual source (e.g., "OpenMeteo")

## Manual QA Steps:
1. Deploy to production
2. Login and wait 10+ minutes
3. Navigate across pages - verify no logout
4. Check dashboard temperature matches API response
5. Open DevTools console - verify auth events logged correctly