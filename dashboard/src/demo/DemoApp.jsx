import { lazy, Suspense } from 'react';
import { useDemoClient } from '../supabaseClient';
import { createMockClient } from './mockSupabase';
import { demoSeed } from './demoSeed';

// Recruiter demo: the REAL dashboard (same sidebar, tabs and design) running on an in-memory fake database filled with
// invented sample data. This module swaps the database client BEFORE the app loads, so the app can never reach a real
// database in this mode. Refreshing the page resets everything.
useDemoClient(createMockClient(demoSeed()));
const App = lazy(() => import('../App.jsx'));

export default function DemoApp() {
  return (
    <>
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0b1020' }} />}>
        <App />
      </Suspense>
      <div
        style={{
          position: 'fixed', left: 12, bottom: 12, zIndex: 1000, maxWidth: 'calc(100vw - 24px)',
          background: 'rgba(17,24,39,0.95)', color: '#fff', border: '1px solid rgba(245,158,11,0.6)', borderRadius: 12,
          padding: '8px 12px', fontSize: '0.78rem', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        }}
      >
        <span>👀 <strong>Live demo</strong> with invented sample data. Nothing here is real or saved.</span>
        <button
          onClick={() => { window.location.href = window.location.pathname; }}
          style={{ background: 'transparent', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.5)', borderRadius: 8, padding: '2px 10px', cursor: 'pointer', fontSize: '0.75rem' }}
        >
          Exit demo
        </button>
      </div>
    </>
  );
}
