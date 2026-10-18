import React, { useState } from 'react';

// Extra per-job data (apply pack, interview prep, deadline, follow-up) is written by coaching/push_jobs_to_site.py
// into the existing `responsibilities` jsonb column as an object. Legacy rows keep an array there.
export const extrasOf = job => {
  const r = job && job.responsibilities;
  return r && typeof r === 'object' && !Array.isArray(r) ? r : null;
};

const box = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px' };
const label = { fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 };

export const CopyButton = ({ text, small }) => {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      window.prompt('Copy this text:', text);
    }
  };
  return (
    <button type="button" className="btn btn-secondary" onClick={copy} style={{ padding: small ? '2px 10px' : '4px 12px', fontSize: '0.75rem' }}>
      {done ? '✅ Copied' : '📋 Copy'}
    </button>
  );
};

const Section = ({ title, children, action }) => (
  <div style={box}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={label}>{title}</div>
      {action}
    </div>
    {children}
  </div>
);

export const ApplyPackPanel = ({ job }) => {
  const x = extrasOf(job);
  if (!x || !x.pack) {
    return <p style={{ color: 'var(--text-muted)' }}>No apply pack for this job. Packs are generated for jobs synced from the tracker (the 🔎 Curated ones).</p>;
  }
  const { pack } = x;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Everything below comes from your confirmed fact bank. Read each item, edit anything that doesn&apos;t sound like you, then apply yourself.
      </p>

      <Section title="CV to upload">
        <code style={{ color: 'var(--accent-blue)' }}>{pack.cv}</code>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Find it in G:\job-finder\coaching\daily\ (tailored) or coaching\cv\ (base).</div>
      </Section>

      <Section title="Cover note / why this role" action={pack.cover && <CopyButton text={pack.cover} />}>
        {pack.cover
          ? <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: 1.5 }}>{pack.cover}</div>
          : <div style={{ color: 'var(--accent-yellow, #f59e0b)', fontSize: '0.88rem' }}>Not drafted yet. Ask Claude to draft this cover note, or the nightly run will add it.</div>}
      </Section>

      <Section title="Form answers">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pack.answers.map(a => (
            <div key={a.q} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.q}</div>
                <div style={{ fontSize: '0.88rem' }}>{a.a}</div>
              </div>
              <CopyButton small text={a.a} />
            </div>
          ))}
        </div>
      </Section>

      {pack.gaps && pack.gaps.length > 0 && (
        <Section title="Gaps: be honest, never claim these">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.86rem' }}>
            {pack.gaps.map(g => <li key={g}>{g}</li>)}
          </ul>
        </Section>
      )}
    </div>
  );
};

export const PrepPanel = ({ job }) => {
  const x = extrasOf(job);
  if (!x || !x.prep) {
    return <p style={{ color: 'var(--text-muted)' }}>No prep material for this job yet.</p>;
  }
  const { prep } = x;
  const inProcess = ['Test', 'Interview', 'Offer'].includes(job.status);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!inProcess && (
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Prep for when this job reaches Test or Interview. You can read it early.
        </p>
      )}
      {prep.company && <Section title="Company notes"><div style={{ fontSize: '0.88rem' }}>{prep.company}</div></Section>}

      <Section title="Projects to talk about">
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.88rem' }}>
          {prep.projects.map(p => <li key={p}>{p}</li>)}
        </ul>
      </Section>

      <Section title="Likely questions and how to answer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {prep.questions.map(q => (
            <div key={q.q}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.q}</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{q.hint}</div>
            </div>
          ))}
        </div>
      </Section>

      {prep.gaps && prep.gaps.length > 0 && (
        <Section title="Gaps they may probe">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.86rem' }}>
            {prep.gaps.map(g => <li key={g}>{g}</li>)}
          </ul>
        </Section>
      )}

      {job.status === 'Test' && (
        <Section title="Take-home test checklist">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.86rem' }}>
            {prep.checklist.map(c => <li key={c}>{c}</li>)}
          </ul>
        </Section>
      )}
    </div>
  );
};
