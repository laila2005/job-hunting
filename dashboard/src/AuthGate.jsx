import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Login wall. Nothing from the dashboard renders until Laila has signed in with her own Supabase account.
// The database enforces the same rule (see supabase/migrations/20261018000000_lock_down.sql), so even someone
// who copies the public key out of this page cannot read or change any data.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wpxtstbquvbsiqgoqwma.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IwP7F-cxFhXEMwZCDOuyuw_-V33gBSh';
const auth = createClient(supabaseUrl, supabaseKey).auth;

const field = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
  padding: '11px 14px', color: '#fff', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box',
};

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = auth.onAuthStateChange((_event, s) => setSession(s || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError('Sign-in failed. Check your email and password.');
    setBusy(false);
  };

  if (session === undefined) {
    return <div style={{ minHeight: '100vh', background: '#0b1020' }} />;
  }

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1020', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <form onSubmit={signIn} style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14, color: '#fff', background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28 }}>
          <h2 style={{ margin: 0 }}>🔒 Job Search Command Center</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Private. Sign in to continue.</p>
          <input style={field} type="email" autoComplete="username" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={field} type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div style={{ color: '#F87171', fontSize: '0.88rem' }}>{error}</div>}
          <button type="submit" disabled={busy} className="btn btn-gradient" style={{ padding: '12px 16px', fontSize: '1rem' }}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      {children}
      <button
        onClick={() => auth.signOut()}
        title="Sign out of this device"
        style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 500, opacity: 0.6, background: 'rgba(17,24,39,0.9)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', cursor: 'pointer' }}
      >
        Sign out
      </button>
    </>
  );
}
