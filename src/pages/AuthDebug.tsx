import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function AuthDebug() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { lastAuthError, clearLastAuthError } = useAuth();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setOutput(prev => ({ ...(prev || {}), onAuthStateChange: { event, user: session?.user?.email ?? session?.user?.id ?? null } }));
    });
    return () => subscription.unsubscribe();
  }, []);

  const doSignIn = async () => {
    setLoading(true);
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      setOutput(prev => ({ ...(prev || {}), signIn: res }));
    } catch (err) {
      setOutput(prev => ({ ...(prev || {}), signInError: String(err) }));
    } finally {
      setLoading(false);
    }
  };

  const doGetSession = async () => {
    const res = await supabase.auth.getSession();
    setOutput(prev => ({ ...(prev || {}), getSession: res }));
  };

  const doSignOut = async () => {
    await supabase.auth.signOut();
    setOutput(prev => ({ ...(prev || {}), signedOutAt: new Date().toISOString() }));
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Auth Debug</h2>
      <div className="space-y-2 mb-4">
        <label className="block">Email</label>
        <input className="w-full p-2 border rounded" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="block mt-2">Password</label>
        <input className="w-full p-2 border rounded" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={doSignIn} disabled={loading}>{loading ? 'Signing...' : 'Sign In'}</Button>
        <Button onClick={doGetSession}>Get Session</Button>
        <Button onClick={doSignOut}>Sign Out</Button>
      </div>

      <div className="bg-gray-50 p-3 rounded border overflow-auto max-h-96">
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ output, lastAuthError }, null, 2)}</pre>
        {lastAuthError && (
          <div className="mt-2 flex gap-2">
            <Button onClick={() => { clearLastAuthError(); setOutput(null); }}>Clear Debug</Button>
          </div>
        )}
      </div>
    </div>
  );
}
