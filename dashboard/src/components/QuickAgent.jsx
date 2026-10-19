import { useEffect, useRef, useState } from 'react';
import { supabase, isDemo } from '../supabaseClient';
import { parseCommand, askLocalModel, ollamaReachable, OLLAMA_MODEL } from '../quickAgent';
import { answerQuestion } from '../answerBank';
import { extrasOf, CopyButton } from './JobPack';

// "Ask / update" panel. Type or say what happened ("I applied to Mintly", "finished the Brightline test") or paste a form
// question. Nothing is saved until you press a Yes button, every update can be undone, and nothing is ever sent anywhere.
const FINAL = ['Rejected'];
const addDays = (iso, n) => new Date(new Date(`${iso}T12:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
const label = j => `${(j.company || '').split('(')[0].split('/')[0].trim()} · ${j.title}`;
const EXAMPLES = ['I applied to …', 'I finished the … test', 'got an interview at …', '… rejected me', 'Do you have experience with …?'];

export default function QuickAgent({ jobs, onJobUpdated }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [log, setLog] = useState([]);           // {id, who:'you'|'bot', node}
  const [busy, setBusy] = useState(false);
  const [aiOn, setAiOn] = useState(false);
  const [listening, setListening] = useState(false);
  const undoRef = useRef(null);
  const endRef = useRef(null);
  const idRef = useRef(0);
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const push = (who, node, card = false) => setLog(l => [...l, { id: ++idRef.current, who, node, card }]);
  const dropCards = () => setLog(l => l.filter(m => !m.card));

  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ block: 'end' }); }, [log, open]);
  useEffect(() => {
    if (!open || isDemo()) return;
    ollamaReachable().then(setAiOn);
  }, [open]);

  const apply = async (job, status, note) => {
    const today = new Date().toISOString().slice(0, 10);
    const prev = { id: job.id, status: job.status, appliedDate: job.appliedDate ?? null, responsibilities: job.responsibilities ?? null };
    const patch = { status };
    if (['Applied', 'Test', 'Interview', 'Offer'].includes(status) && !job.appliedDate) patch.appliedDate = today;
    const x = extrasOf(job);
    if (x) {
      const kind = status === 'Applied' ? 'applied' : status.toLowerCase();
      patch.responsibilities = {
        ...x,
        followup_due: status === 'Applied' ? addDays(today, 7) : null,
        email_events: [{ kind, date: today, subject: 'Updated by you', note: note || `Marked ${status}` }, ...(x.email_events || [])].slice(0, 20),
      };
    }
    const { error } = await supabase.from('jobs').update(patch).eq('id', job.id);
    if (error) { push('bot', `⚠️ Could not save that: ${error.message}`); return; }
    undoRef.current = prev;
    onJobUpdated && onJobUpdated(job.id, patch);
    dropCards();
    push('bot', `✅ ${label(job)} is now "${status}"${note ? ` (${note})` : ''}. Say "undo" to reverse it.`);
  };

  const undo = async () => {
    const p = undoRef.current;
    if (!p) { push('bot', 'Nothing to undo.'); return; }
    const { id, ...patch } = p;
    const { error } = await supabase.from('jobs').update(patch).eq('id', id);
    if (error) { push('bot', `⚠️ Could not undo: ${error.message}`); return; }
    undoRef.current = null;
    onJobUpdated && onJobUpdated(id, patch);
    push('bot', '↩ Undone.');
  };

  const statusCards = (cmd) => {
    const cands = (cmd.jobs || []).slice(0, 5);
    const options = cands.length
      ? cands
      : jobs.filter(j => (j.id || '').startsWith('trk-') && !FINAL.includes(j.status)).slice(0, 6);
    const single = cands.length === 1;
    push('bot', (
      <div>
        <div style={{ marginBottom: 6 }}>
          {single
            ? <>Mark <strong>{label(cands[0])}</strong> as <strong>{cmd.status}</strong>{cmd.note ? <> with the note “{cmd.note}”</> : null}?</>
            : <>{cands.length ? 'Which job?' : 'I could not tell which job. Pick one'} to mark as <strong>{cmd.status}</strong>:</>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {options.map(j => (
            <button key={j.id} type="button" className="btn" style={{ background: 'var(--accent-green)', padding: '6px 10px', fontSize: '0.8rem', textAlign: 'left' }}
              onClick={() => apply(j, cmd.status, cmd.note)}>
              {single ? '✅ Yes, mark it' : `✅ ${label(j)}`}
            </button>
          ))}
          <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => { dropCards(); push('bot', 'Okay, nothing changed.'); }}>
            ✖ No
          </button>
        </div>
      </div>
    ), true);
  };

  const answerCard = (cmd) => {
    const job = (cmd.jobs || [])[0];
    const x = job && extrasOf(job);
    const salary = x && x.pack && (x.pack.answers.find(a => a.q.startsWith('Salary')) || {}).a;
    const res = answerQuestion(cmd.question, {
      salary: salary || 'USD 2,500-3,500/month for full-time; USD 1,800-2,800/month at 30 hrs/week as a contractor. Negotiable depending on scope.',
      cover: x && x.pack && x.pack.cover,
      job,
    });
    push('bot', (
      <div>
        {job && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4 }}>For {label(job)}</div>}
        <div style={{ whiteSpace: 'pre-wrap' }}>{res.text}</div>
        {res.kind !== 'none' && <div style={{ marginTop: 6 }}><CopyButton small text={res.text.replace(/\s*\(Honest answer: do not claim it\.\)/g, '').replace(/\s*\(Check the posting's country rules first\.\)/g, '')} /></div>}
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>Built only from your confirmed facts. Edit it to fit, and never add anything untrue.</div>
      </div>
    ));
  };

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setText('');
    dropCards();
    push('you', t);
    let cmd = parseCommand(t, jobs);
    if (cmd.type === 'unknown' && aiOn) {
      setBusy(true);
      push('bot', `🧠 Thinking with your local model (${OLLAMA_MODEL}). The first time can take a minute…`);
      try {
        const c = new AbortController();
        const timer = setTimeout(() => c.abort(), 120000);
        cmd = await askLocalModel(t, jobs, c.signal);
        clearTimeout(timer);
      } catch {
        push('bot', 'The local model did not answer. Try rephrasing, for example “I applied to Mintly”.');
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    if (cmd.type === 'undo') return undo();
    if (cmd.type === 'status') return statusCards(cmd);
    if (cmd.type === 'question') return answerCard(cmd);
    push('bot', 'I did not understand that. Try: “I applied to Mintly”, “I finished the Brightline test”, “Harbor Pay rejected me”, or paste a form question.');
  };

  const listen = () => {
    if (!SR) { push('bot', 'Voice input is not available in this browser (Brave turns it off). Type instead.'); return; }
    const r = new SR();
    r.lang = 'en-US';
    r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); push('bot', 'Could not hear you. Try again or type.'); };
    r.onresult = e => setText(e.results[0][0].transcript);
    r.start();
  };

  if (!open) {
    return (
      <>
        <style>{`
          @keyframes qaPulse { 0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.55); } 70% { box-shadow: 0 0 0 16px rgba(99,102,241,0); } 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); } }
          .qa-bubble:hover { transform: scale(1.08); }
        `}</style>
        <button
          type="button"
          className="qa-bubble"
          onClick={() => setOpen(true)}
          title="Chat: tell me what happened or paste a form question"
          aria-label="Open the update and ask chat"
          style={{
            position: 'fixed', right: 20, bottom: 60, zIndex: 700, width: 62, height: 62, borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', fontSize: '1.7rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'qaPulse 2.4s infinite',
            transition: 'transform 0.15s ease', boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          💬
        </button>
      </>
    );
  }

  return (
    <div style={{ position: 'fixed', right: 20, bottom: 60, zIndex: 700, width: 'min(400px, calc(100vw - 32px))', maxHeight: 'min(560px, calc(100vh - 90px))', display: 'flex', flexDirection: 'column', background: 'rgba(17,24,39,0.98)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.55)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ fontWeight: 700 }}>💬 Update / ask</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #9ca3af)' }}>
            {isDemo() ? 'Demo: works on sample data' : aiOn ? `🧠 Local AI on (${OLLAMA_MODEL})` : '🧠 Local AI off: simple sentences only'}
          </div>
        </div>
        <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }} aria-label="Close">×</button>
      </div>

      <div style={{ padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 120 }}>
        {log.length === 0 && (
          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted, #9ca3af)', lineHeight: 1.5 }}>
            Tell me what happened and I'll update the board after you confirm. Or paste a question from an application form and I'll answer it from your confirmed facts.
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {EXAMPLES.map(e => <span key={e} style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '2px 8px', fontSize: '0.72rem' }}>{e}</span>)}
            </div>
          </div>
        )}
        {log.map(m => (
          <div key={m.id} style={{ alignSelf: m.who === 'you' ? 'flex-end' : 'flex-start', maxWidth: '92%', background: m.who === 'you' ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '8px 11px', fontSize: '0.86rem', lineHeight: 1.45 }}>
            {m.node}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder="e.g. I applied to Mintly"
          style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', padding: '9px 12px', fontSize: '0.9rem', outline: 'none', minWidth: 0 }}
        />
        {SR && (
          <button type="button" onClick={listen} title="Speak" className="btn btn-secondary" style={{ padding: '6px 10px', background: listening ? 'rgba(239,68,68,0.3)' : undefined }}>🎤</button>
        )}
        <button type="button" onClick={submit} disabled={busy || !text.trim()} className="btn btn-gradient" style={{ padding: '6px 14px' }}>Send</button>
      </div>
    </div>
  );
}
