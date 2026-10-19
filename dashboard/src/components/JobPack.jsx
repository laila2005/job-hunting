import React, { useState } from 'react';
import { supabase, isDemo } from '../supabaseClient';
import { safeUrl } from '../safeUrl';
import { answerQuestion } from '../answerBank';

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

// Opens a private file with a short-lived signed link (works only while signed in; there is no public link).
const SAFE_PATH = /^[\w\-./]+\.pdf$/;  // a bucket path we wrote ourselves: letters, digits, - _ . / and a .pdf ending

const KitButton = ({ path, label, name }) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const blocked = !path || isDemo() || !SAFE_PATH.test(path) || path.includes('..');
  if (blocked) {
    return (
      <button type="button" className="btn btn-secondary" disabled style={{ opacity: 0.55, padding: '8px 14px' }}
        title={isDemo() ? 'Downloads are switched off in the demo' : 'Not generated yet. It appears after the next nightly run.'}>
        {label}{isDemo() ? ' (demo)' : ' (not ready)'}
      </button>
    );
  }
  const open = async () => {
    if (isDemo()) return; // belt and braces: never request a file in the demo, whatever the client is
    setBusy(true);
    setErr('');
    const safeName = (name || '').replace(/[^\w.\-]/g, '_').slice(0, 128) || true;
    const { data, error } = await supabase.storage.from('kit').createSignedUrl(path, 120, { download: safeName });
    setBusy(false);
    if (error || !data || !data.signedUrl) { setErr('Could not open the file. Sign in again.'); return; }
    window.open(data.signedUrl, '_blank', 'noopener');
  };
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
      <button type="button" className="btn" onClick={open} disabled={busy} style={{ background: 'var(--accent-green)', padding: '8px 14px' }}>
        {busy ? 'Opening...' : label}
      </button>
      {err && <span style={{ color: '#f87171', fontSize: '0.7rem' }}>{err}</span>}
    </span>
  );
};

const QuestionHelper = ({ job, pack }) => {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const salary = (pack.answers.find(a => a.q.startsWith('Salary')) || {}).a || 'Please see the salary answer above.';
  const ask = () => setRes(answerQuestion(q, { salary, cover: pack.cover, job }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <textarea
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Paste a question from the application form, e.g. 'Do you have experience with NestJS?' or 'What are your salary expectations?'"
        rows={2}
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'white', padding: 10, fontSize: '0.9rem', resize: 'vertical' }}
      />
      <div><button type="button" className="btn btn-gradient" onClick={ask} disabled={!q.trim()} style={{ padding: '6px 14px' }}>Get answer</button></div>
      {res && (
        <div style={{ ...box, borderColor: res.kind === 'none' ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.4)' }}>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{res.text}</div>
          {res.kind !== 'none' && <div style={{ marginTop: 6 }}><CopyButton small text={res.text.replace(/\s*\(Honest answer: do not claim it\.\)/g, '')} /></div>}
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Built only from your confirmed facts. Edit it to fit the box, and never add anything that is not true.
          </div>
        </div>
      )}
    </div>
  );
};

const STEPS = [
  'Download your CV for this job',
  'Open the application page',
  'Upload the CV; paste the cover note or upload the cover letter PDF',
  'Answer the form questions with the helper below',
  'Submit the form yourself',
  'Come back and press ✅ Mark as Applied',
];

export const ApplyPackPanel = ({ job }) => {
  const x = extrasOf(job);
  if (!x || !x.pack) {
    return <p style={{ color: 'var(--text-muted)' }}>No apply pack for this job. Packs are generated for jobs synced from the tracker (the 🔎 Curated ones).</p>;
  }
  const { pack } = x;
  const link = safeUrl(job.companyLink);
  const allAnswers = pack.answers.map(a => `${a.q}: ${a.a}`).join('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Section title="1-click kit">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <KitButton path={pack.cv_path} name={pack.cv_name} label="⬇ CV (PDF)" />
          <KitButton path={pack.cover_path} name={pack.cover_name} label="⬇ Cover letter (PDF)" />
          {link && <a className="btn btn-secondary" href={link} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 14px' }}>🔗 Open application</a>}
          <CopyButton text={allAnswers} />
        </div>
        <ol style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {STEPS.map(t => <li key={t}>{t}</li>)}
        </ol>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>
          CV file: <code>{pack.cv}</code>. The kit never submits anything for you.
        </div>
      </Section>

      <Section title="Cover note (paste into the form)" action={pack.cover && <CopyButton text={pack.cover} />}>
        {pack.cover
          ? <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: 1.5 }}>{pack.cover}</div>
          : <div style={{ color: 'var(--accent-yellow, #f59e0b)', fontSize: '0.88rem' }}>Not drafted yet. Paste the job description to Claude to draft it, or the nightly run will add it.</div>}
      </Section>

      <Section title="Ask a form question">
        <QuestionHelper job={job} pack={pack} />
      </Section>

      <Section title="Standard answers">
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
