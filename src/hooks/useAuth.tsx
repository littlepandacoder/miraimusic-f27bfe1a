import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
              setRoles((rolesData?.map(r => r.role as UserRole)) || []);
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
            setRoles((rolesData?.map(r => r.role as UserRole)) || []);
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
      // Don't sign out before signing in - this causes race conditions
      // Just attempt to sign in directly
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('[auth] signInWithPassword result', { data, error });
      }

      if (error) {
        // store raw error for debug UI in dev
        if (import.meta.env.DEV) setLastAuthError(error);
        // Normalize common auth errors for friendlier UI messages
        try {
          const anyErr = error as any;
          if (anyErr.status === 400) {
            return { error: new Error(anyErr.message || 'Invalid email or password') };
          }
        } catch (e) {
          // fall through
        }
        return { error };
      }
      
      // Wait a moment for auth state to update through the listener
      // before returning to allow the UI to catch up
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { error: null };
    } catch (err) {
      console.error("Sign in error:", err);
      if (import.meta.env.DEV) setLastAuthError(err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
