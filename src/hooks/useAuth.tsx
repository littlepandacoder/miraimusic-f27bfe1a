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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
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
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
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
      
      if (error) {
        return { error };
      }
      
      // Wait a moment for auth state to update through the listener
      // before returning to allow the UI to catch up
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { error: null };
    } catch (err) {
      console.error("Sign in error:", err);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (role: UserRole) => roles.includes(role);

  return (
    <AuthContext.Provider value={{ user, session, roles, loading, signIn, signOut, hasRole }}>
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
