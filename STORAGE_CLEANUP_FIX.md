# Login Storage Corruption Fix - Summary

## Issue
After 3+ sign-in attempts, the login would get stuck on "Signing in..." and require manual browser history/storage clearing to work again.

## Root Cause Analysis
**Mechanism**: Supabase Auth stores session tokens in localStorage with `persistSession: true`. When sign-in fails:
1. Invalid/expired refresh tokens accumulate in localStorage without cleanup
2. On next sign-in attempt, Supabase client loads these corrupted tokens
3. Token refresh fails silently or returns `invalid_grant` error (Supabase backend rejects expired refresh token)
4. Client retries with same corrupted tokens → infinite loop or blocked sign-in
5. User forced to clear browser history/cache to reset localStorage

**Why it happens after 3+ attempts**: 
- First 1-2 failures: Fresh token state, retry logic clears session and succeeds
- After 3+ failures: Multiple stale tokens accumulate; cleanup logic doesn't trigger automatically; Supabase client gets confused

## Solution: Aggressive Auto-Cleanup on Failure Threshold

### What Changed
**File**: `src/hooks/useAuth.tsx`

1. **Added failure tracking** (lines 7-14):
   - Global counter `signInFailureCount` tracks consecutive failed sign-in attempts
   - Threshold: 2 consecutive failures triggers automatic cleanup
   - Counter resets on successful sign-in or explicit sign-out

2. **Added storage cleanup function** (lines 37-56):
   - `clearSupabaseStorage()` removes all Supabase/auth-related keys from localStorage
   - Preserves other app data (toast messages, theme prefs, etc.)
   - Only removes keys matching: `sb-*`, `supabase.*`, `*auth*`, `*token*`, `*session*`, `*refresh*`

3. **Enhanced error detection** (line 211):
   - Now catches `invalid_grant` errors (Supabase error for expired refresh tokens)
   - Triggers retry-on-signOut logic for broader error patterns

4. **Automatic cleanup on threshold** (lines 239-244):
   - When sign-in fails and `signInFailureCount >= 2`:
     - Automatically clears all Supabase storage keys
     - Resets counter to 0
     - Next sign-in attempt starts with clean localStorage

5. **Counter management**:
   - Increment on error: `signInFailureCount++`
   - Reset on success: `signInFailureCount = 0` (line 248)
   - Reset on explicit sign-out: `signInFailureCount = 0` (line 302)

### How It Works

**Scenario: User fails to sign in 3+ times with wrong password, then tries correct password**

```
Attempt 1 (wrong password):
  → Error: "Invalid email or password"
  → signInFailureCount = 1
  → localStorage unchanged (only 1 failure, threshold is 2)

Attempt 2 (wrong password):
  → Error: "Invalid email or password"
  → signInFailureCount = 2
  → ⚠️ Threshold reached! Automatically clear localStorage
  → All sb-*, supabase.* keys removed
  → signInFailureCount = 0 (reset)
  → Console: "[auth] 2 consecutive sign-in failures - clearing all Supabase/auth storage..."

Attempt 3 (correct password):
  → Fresh localStorage (cleaned in step 2)
  → No stale tokens to cause interference
  → Sign-in succeeds ✅
  → Redirect to dashboard
  → signInFailureCount = 0 (reset on success)

Next session:
  → User fails again 2 times
  → Automatic cleanup triggers again (independent counter)
  → User can recover with correct password without manual intervention
```

## Benefits

✅ **No manual browser intervention required**
- Users no longer need to clear history/cookies/storage
- Automatic recovery after threshold

✅ **Transparent to user**
- Cleanup happens in background
- No UI changes or disruptions
- Debug logging in dev mode only

✅ **Defensive architecture**
- Catches more error patterns (`invalid_grant`)
- Retry logic still works as fallback
- Offline detection unaffected

✅ **Backward compatible**
- Existing sign-in flow unchanged on success
- Existing session state management preserved
- AuthDebug page "Clear Session" button still available

## Testing

See `AUTH_FIX_TESTING.md` for comprehensive testing guide including:
- Verification of normal sign-in flow
- Threshold triggering at 2 consecutive failures
- Counter reset behavior
- Offline detection
- Stress testing (10+ attempts)
- Expected console logs

### Quick Test
1. Open DevTools → Storage → Local Storage
2. Attempt sign-in 3+ times with wrong password
3. After 2nd attempt, localStorage keys disappear (cleaned automatically)
4. 3rd attempt with correct password → sign-in succeeds without manual intervention
5. Console shows: `[auth] 2 consecutive sign-in failures - clearing...`

## Code Quality
- ✅ TypeScript: No compilation errors (`npx tsc --noEmit`)
- ✅ No breaking changes to existing functions
- ✅ Dev-only logging (no console noise in production)
- ✅ Idempotent cleanup (safe to call multiple times)
- ✅ Non-blocking error handling (cleanup errors logged but don't prevent sign-in)

## Deployment Safety
- **Low risk**: Cleanup only triggers after threshold; normal sign-in unaffected
- **Rollback simple**: Remove failure tracking + cleanup function, keep retry logic
- **No backend changes**: Client-side only, works with existing Supabase config
- **No infrastructure impact**: Uses only localStorage, no API changes
