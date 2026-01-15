import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function AuthDebug() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState<boolean | null>(null);
  const { lastAuthError, clearLastAuthError } = useAuth();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setOutput(prev => ({ ...(prev || {}), onAuthStateChange: { event, user: session?.user?.email ?? session?.user?.id ?? null } }));
    });
    // detect localStorage availability
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      setStorageAvailable(true);
    } catch (e) {
      setStorageAvailable(false);
    }
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

  const clearClientSession = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    // remove likely Supabase keys from localStorage without clearing unrelated keys
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        // common patterns used by Supabase client storage
        if (/^supabase/i.test(k) || /^sb:|^sb-|supabase.auth|supabase-js/i.test(k)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      setOutput(prev => ({ ...(prev || {}), clearedLocalStorage: keysToRemove }));
      // re-check storage availability
      try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        setStorageAvailable(true);
      } catch (e) {
        setStorageAvailable(false);
      }
    } catch (e) {
      setOutput(prev => ({ ...(prev || {}), clearError: String(e) }));
    } finally {
      setLoading(false);
    }
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
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ output, lastAuthError, storageAvailable }, null, 2)}</pre>
        {lastAuthError && (
          <div className="mt-2 flex gap-2">
            <Button onClick={() => { clearLastAuthError(); setOutput(null); }}>Clear Debug</Button>
          </div>
        )}
        <div className="mt-3">
          <p className="text-sm">Storage available: {storageAvailable === null ? 'checking...' : storageAvailable ? 'yes' : 'no'}</p>
          {!storageAvailable && (
            <div className="mt-2 p-2 bg-yellow-50 border rounded">
              <p className="text-sm">It looks like your browser is blocking localStorage or cookies. This prevents the app from storing session tokens and can block login. Try:</p>
              <ul className="list-disc ml-5 text-sm mt-1">
                <li>Enable cookies and localStorage for this site.</li>
                <li>Disable strict privacy extensions or try a different browser.</li>
                <li>As a temporary step, use a private/incognito window (if allowed).</li>
              </ul>
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <Button onClick={clearClientSession} disabled={loading}>{loading ? 'Clearing...' : 'Clear Session'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
