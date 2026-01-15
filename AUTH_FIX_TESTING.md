# Sign-In Storage Corruption Fix - Testing Guide

## Problem Summary
After 3+ sign-in attempts, the login would get stuck on "Signing in..." and require manual browser history/storage clearing to work again.

**Root Cause**: Supabase stores session tokens in localStorage. When sign-in fails, stale/invalid refresh tokens accumulate in localStorage without being cleaned up. On subsequent sign-in attempts, the Supabase client loads these corrupted tokens and either:
1. Fails token refresh silently
2. Gets blocked by server-side token validation (invalid_grant errors)
3. Enters a retry loop that prevents new login attempts

## Solution Implemented

### 1. **Aggressive Token Cleanup on Failure Threshold**
- Tracks consecutive failed sign-in attempts via global counter `signInFailureCount`
- After **2 consecutive failures**, automatically clears ALL Supabase/auth-related localStorage keys
- Resets counter on successful sign-in or explicit sign-out

**Code location**: `src/hooks/useAuth.tsx` (lines 7-8, 37-56, 239-244, 302)

```typescript
let signInFailureCount = 0;
const FAILURE_THRESHOLD = 2;

const clearSupabaseStorage = async () => {
  // Removes all sb-*, supabase.*, auth, token, session, refresh keys
  // Preserves other app data (toast messages, theme prefs, etc.)
}

// On sign-in error:
signInFailureCount++;
if (signInFailureCount >= FAILURE_THRESHOLD) {
  await clearSupabaseStorage();
  signInFailureCount = 0;
}

// On sign-in success:
signInFailureCount = 0;

// On explicit sign-out:
signInFailureCount = 0;
```

### 2. **Enhanced Error Detection**
- Now catches `invalid_grant` errors (Supabase error for invalid/expired refresh token)
- Triggers retry-on-signOut logic for more error patterns

### 3. **Defensive Session State Setting**
- After successful sign-in, immediately fetches and sets session/user state
- Doesn't wait solely on `onAuthStateChange` listener
- Prevents UI from hanging on "Signing in..."

## Testing Instructions

### Prerequisites
- Open browser DevTools (F12) and go to **Storage > Local Storage > https://miraimusic.vercel.app** (or localhost)
- Keep DevTools open during testing to observe localStorage changes

### Test 1: Verify Storage Cleanup Doesn't Break Normal Flow

1. **Clear all storage** (DevTools: Storage > Local Storage > Clear All for your domain)
2. **Sign in successfully** (first attempt should work normally)
   - ✅ Redirect to dashboard
   - ✅ localStorage has keys: `supabase.auth.token`, `sb-[projectId]-auth-token`, etc.
   - ✅ Console shows `[auth] onAuthStateChange event=SIGNED_IN`

3. **Sign out** (go to /auth-debug or implement sign-out button)
   - ✅ localStorage cleaned of auth keys
   - ✅ Redirect to login

### Test 2: Verify Aggressive Cleanup Triggers at Threshold

1. **Start fresh** (clear storage, sign out, navigate to /login)

2. **Attempt sign-in 3+ times with WRONG credentials**
   - Attempt 1: Wrong password → error shown, `signInFailureCount = 1`, storage unchanged
   - Attempt 2: Wrong password → error shown, `signInFailureCount = 2`, **triggers cleanup!**
     - ✅ Check console: `[auth] 2 consecutive sign-in failures - clearing all Supabase/auth storage...`
     - ✅ Check localStorage: All `sb-*`, `supabase.*` keys should be GONE
     - ✅ `signInFailureCount` resets to 0
   - Attempt 3: Enter CORRECT credentials
     - ✅ Should sign in successfully (counter at 0, storage clean)
     - ✅ Console: `[auth] SIGNED_IN`, `[auth] onAuthStateChange event=SIGNED_IN`

3. **Verify no manual intervention needed**
   - ✅ No need to open DevTools and delete keys manually
   - ✅ No need to clear browser history
   - ✅ No need to close/reopen browser

### Test 3: Verify Counter Resets on Success

1. **Fail sign-in twice** (wrong password)
   - ✅ `signInFailureCount = 2`, triggers cleanup, resets to 0
   - ✅ localStorage cleared

2. **Sign in with correct credentials**
   - ✅ `signInFailureCount = 0` (reset on success)
   - ✅ Redirect to dashboard
   - ✅ localStorage repopulated with valid tokens

3. **Fail again (wrong password)**
   - ✅ `signInFailureCount = 1` (counter starts fresh from 0)
   - ✅ No automatic cleanup (threshold not reached yet)
   - ✅ localStorage still has tokens from previous session

### Test 4: Verify Counter Resets on Explicit Sign-Out

1. **Sign in successfully**
   - ✅ Dashboard accessible
   - ✅ localStorage has auth keys

2. **Sign out explicitly** (button or /auth-debug)
   - ✅ `signInFailureCount = 0` (reset)
   - ✅ localStorage cleaned by signOut

3. **Fail to sign in 2 times (wrong password)**
   - ✅ Counter increments to 2, triggers cleanup
   - ✅ localStorage already clean from sign-out, so cleanup is redundant but harmless

### Test 5: Verify Offline Detection Still Works

1. **Disable network** (DevTools: Network tab > throttle to "Offline")

2. **Attempt sign-in**
   - ✅ Error: "No network connection. Please check your internet connection and try again."
   - ✅ Does NOT increment failure counter (early return before attempt loop)
   - ✅ localStorage unchanged

3. **Re-enable network** (throttle back to "No throttling")

4. **Attempt sign-in with correct credentials**
   - ✅ Should sign in successfully
   - ✅ Failure counter is 0 (offline didn't increment)

### Test 6: Verify Retry-on-Stale-Session Still Works

1. **Manually inject an expired refresh token** into localStorage (advanced debugging)
   - Edit `supabase.auth.token` in DevTools to have an expired `expires_at`
   - Or wait for a token to naturally expire

2. **Attempt sign-in**
   - ✅ First attempt fails with stale session error
   - ✅ Code calls `supabase.auth.signOut()` and retries
   - ✅ Second attempt succeeds
   - ✅ No manual cleanup required

### Test 7: Stress Test - 10+ Sign-In Attempts

1. **Clear storage, go to login**

2. **Fail 4 times** (wrong password)
   - Attempts 1-2: Counter goes 1 → 2, triggers cleanup, resets to 0
   - Attempts 3-4: Counter goes 1 → 2, triggers cleanup, resets to 0
   - ✅ Each cleanup visible in console: `[auth] 2 consecutive sign-in failures...`

3. **Sign in successfully**
   - ✅ Works on first attempt with correct password
   - ✅ No stuck "Signing in..." state

4. **Sign out and fail 2 more times**
   - ✅ Cleanup triggers again automatically

## Expected Console Logs (DEV mode)

```
[auth] onAuthStateChange event=SIGNED_IN user=user@example.com
[auth] getSession returned user=user@example.com
[auth] signInWithPassword result {data: {…}, error: null}
[auth] 2 consecutive sign-in failures - clearing all Supabase/auth storage to prevent token corruption
[auth] cleared 5 Supabase/auth storage keys: ["supabase.auth.token", "sb-xyz-auth-token", ...]
```

## Rollback Plan (if needed)

If this fix causes issues:

1. Revert `src/hooks/useAuth.tsx` to remove:
   - `clearSupabaseStorage` function
   - `signInFailureCount` tracking
   - Threshold cleanup logic

2. Users can still manually clear storage via `/auth-debug` page (Clear Session button remains)

## Success Criteria

✅ **Must Have**:
- [ ] Sign-in works consistently after 3+ attempts without manual browser cache clearing
- [ ] No console errors during sign-in flow
- [ ] TypeScript compiles without errors

✅ **Should Have**:
- [ ] Console shows cleanup message when threshold reached
- [ ] localStorage inspection confirms stale keys removed
- [ ] Dashboard loads without hanging/loading state stuck

✅ **Nice to Have**:
- [ ] Production telemetry tracks how often cleanup is triggered
- [ ] A/B test shows reduced "contact support" complaints about login
