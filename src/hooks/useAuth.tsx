import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Dev-only helpers to quickly reproduce the raw GoTrue response when debugging 400s
// These read the same envs as the client (strip surrounding quotes if present).
const _rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const _rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const _stripQuotes = (s?: string) => s?.trim().replace(/^['\"]|['\"]$/g, "") || "";
const DEV_SUPABASE_URL = _stripQuotes(_rawUrl);
const DEV_SUPABASE_PUBLISHABLE_KEY = _stripQuotes(_rawKey);

type UserRole = "admin" | "teacher" | "student";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: UserRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  // debug: last raw auth error (DEV only)
  lastAuthError: any | null;
  clearLastAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastAuthError, setLastAuthError] = useState<any | null>(null);

  // Helper: remove all Supabase-related keys from localStorage without clearing unrelated data
  const clearSupabaseStorage = () => {
    try {
      const keysToRemove: string[] = [];
      // Collect all keys first (don't modify during iteration)
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (/^sb-/i.test(k) || /^supabase\./i.test(k) || /^sb_/i.test(k))) {
          keysToRemove.push(k);
        }
      }
      
      // Remove the identified keys
      keysToRemove.forEach(k => localStorage.removeItem(k));
      if (import.meta.env.DEV) {
        console.debug(`[auth] cleared ${keysToRemove.length} Supabase storage keys`);
      }
      return keysToRemove.length;
    } catch (e) {
      console.warn('[auth] error clearing storage:', e);
      return 0;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (import.meta.env.DEV) {
          // Helpful debug in dev to trace silent auth state changes
          // Do not log secrets; only show event and user identifier
          // eslint-disable-next-line no-console
          console.debug(`[auth] onAuthStateChange event=${event} user=${session?.user?.email ?? session?.user?.id ?? 'null'}`);
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Ensure the user has baseline lesson_progress rows (first-login initialization)
          // This is best-effort: if the table doesn't exist or the insert fails we do not block login.
          (async function ensureUserProgress() {
            try {
              const userId = session.user.id;
              const { data: existing, error: existErr } = await (supabase as any).from('lesson_progress').select('id').eq('student_id', userId).limit(1);
              if (existErr) return;
              if (!existing || existing.length === 0) {
                const { data: lessons } = await (supabase as any).from('module_lessons').select('id');
                if (lessons && lessons.length > 0) {
                  const payload = lessons.map((l: any) => ({ lesson_id: l.id, student_id: userId, completed: false, watched_seconds: 0 }));
                  // Use upsert to be idempotent
                  await (supabase as any).from('lesson_progress').upsert(payload, { onConflict: ['lesson_id', 'student_id'] });
                }
              }
            } catch (e) {
              // don't block auth on errors
              console.debug('ensureUserProgress failed (non-blocking):', e);
            }
          })();

          try {
            // Fetch user roles with timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const { data: rolesData, error: rolesError } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id);
            
            clearTimeout(timeoutId);
            
            if (rolesError) {
              console.warn("Warning: Could not fetch user roles:", rolesError.message);
              // Don't block login if roles can't be fetched
              setRoles([]);
            } else {
              const userRoles = (rolesData?.map(r => r.role as UserRole)) || [];
              setRoles(userRoles);
              if (import.meta.env.DEV) {
                console.debug(`[auth] User roles loaded:`, userRoles, `for user:`, session.user.email);
              }
            }
          } catch (err) {
            console.warn("Warning: Error fetching roles:", err);
            // Don't block login if roles fetch fails
            setRoles([]);
          }
        } else {
          setRoles([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug(`[auth] getSession returned user=${session?.user?.email ?? session?.user?.id ?? 'null'}`);
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Same ensure-on-first-login behavior for the initial session read
        (async function ensureUserProgress() {
          try {
            const userId = session.user.id;
            const { data: existing, error: existErr } = await (supabase as any).from('lesson_progress').select('id').eq('student_id', userId).limit(1);
            if (existErr) return;
            if (!existing || existing.length === 0) {
              const { data: lessons } = await (supabase as any).from('module_lessons').select('id');
              if (lessons && lessons.length > 0) {
                const payload = lessons.map((l: any) => ({ lesson_id: l.id, student_id: userId, completed: false, watched_seconds: 0 }));
                await (supabase as any).from('lesson_progress').upsert(payload, { onConflict: ['lesson_id', 'student_id'] });
              }
            }
          } catch (e) {
            console.debug('ensureUserProgress failed (non-blocking):', e);
          }
        })();

        try {
          // Fetch user roles with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const { data: rolesData, error: rolesError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
          
          clearTimeout(timeoutId);
          
          if (rolesError) {
            console.warn("Warning: Could not fetch user roles:", rolesError.message);
            setRoles([]);
          } else {
            const userRoles = (rolesData?.map(r => r.role as UserRole)) || [];
            setRoles(userRoles);
            if (import.meta.env.DEV) {
              console.debug(`[auth] User roles loaded on init:`, userRoles, `for user:`, session.user.email);
            }
          }
        } catch (err) {
          console.warn("Warning: Error fetching roles:", err);
          setRoles([]);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Quick network check
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const msg = 'No network connection. Please check your internet connection and try again.';
        if (import.meta.env.DEV) setLastAuthError({ message: msg });
        return { error: new Error(msg) };
      }
      
      // Always clear any stale session before attempting sign in
      // This prevents the "need to clear history" issue
      try {
        await supabase.auth.signOut();
        clearSupabaseStorage();
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        // ignore cleanup errors
      }
      
      // Attempt sign in
      let data: any = null;
      let error: any = null;
      
      try {
        const res = await supabase.auth.signInWithPassword({ email, password });
        data = res.data;
        error = res.error;
      } catch (fetchErr: any) {
        const msg = String(fetchErr?.message || fetchErr || 'Network error while contacting auth server');
        if (import.meta.env.DEV) console.debug('[auth] network/fetch error during signIn:', msg);
        if (import.meta.env.DEV) setLastAuthError({ message: msg });
        return { error: new Error(msg) };
      }
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('[auth] signInWithPassword result', { data, error });
      }

      // DEV: If we get a 400 from the token endpoint, attempt a one-off debug fetch
      // to the same endpoint and log the raw response body. This helps capture the
      // GoTrue JSON message that sometimes isn't visible in the normalized error.
      if (import.meta.env.DEV && error && (error as any)?.status === 400 && DEV_SUPABASE_URL && DEV_SUPABASE_PUBLISHABLE_KEY) {
        try {
          // Do a single debug fetch to surface the raw response body in the console.
          // NOTE: This sends the plaintext password to the same endpoint (dev-only).
          const debugResp = await fetch(`${DEV_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: DEV_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ email, password }),
          });
          const text = await debugResp.text();
          // eslint-disable-next-line no-console
          console.debug('[auth][dev-debug] raw token endpoint response', { status: debugResp.status, body: text });
        } catch (dbgErr) {
          // eslint-disable-next-line no-console
          console.warn('[auth][dev-debug] failed to fetch token endpoint for debug:', dbgErr);
        }
      }

      if (error) {
        // store raw error for debug UI in dev
        if (import.meta.env.DEV) setLastAuthError(error);
        
        // Normalize common auth errors for friendlier UI messages
        const anyErr = error as any;
        const msg = anyErr.message || 'Invalid email or password';
        return { error: new Error(msg) };
      }
      
      // Ensure session state is available immediately: fetch session and set local state
      try {
        const { data: sessionRes } = await supabase.auth.getSession();
        const newSession = sessionRes?.session ?? null;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // fetch roles as done during normal auth flows
        if (newSession?.user) {
          try {
            const { data: rolesData, error: rolesError } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", newSession.user.id);
            if (!rolesError) {
              const userRoles = (rolesData?.map(r => r.role as any)) || [];
              setRoles(userRoles);
              if (import.meta.env.DEV) {
                console.debug(`[auth] User roles loaded after sign-in:`, userRoles);
              }
            }
          } catch (e) {
            setRoles([]);
          }
        }
      } catch (e) {
        // non-critical
      }

      // Wait a moment for auth state to update
      await new Promise(resolve => setTimeout(resolve, 300));

      return { error: null };
    } catch (err) {
      console.error("Sign in error:", err);
      if (import.meta.env.DEV) setLastAuthError(err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearSupabaseStorage();
    setUser(null);
    setSession(null);
    setRoles([]);
  };

  const hasRole = (role: UserRole) => roles.includes(role);

  const clearLastAuthError = () => setLastAuthError(null);

  return (
    <AuthContext.Provider value={{ user, session, roles, loading, signIn, signOut, hasRole, lastAuthError, clearLastAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
