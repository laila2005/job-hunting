import React, { useState, useRef } from 'react';

const OfferNegotiationAI = ({ supabase }) => {
  const [form, setForm] = useState({ company: '', role: '', offeredSalary: '', currency: 'EGP', benefits: '', deadline: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('counter'); // 'counter' | 'script' | 'checklist'
  const channelRef = useRef(null);

  const generate = async () => {
    if (!form.company.trim() || !form.offeredSalary.trim()) return;
    setLoading(true);
    setResult('');
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const prompts = {
      counter: `[NEGOTIATION] Write a professional counter-offer email from Laila Mohamed Fikry for a ${form.role || 'Software Engineer'} position at ${form.company}. Offered: ${form.offeredSalary} ${form.currency}/month. Benefits: ${form.benefits || 'not specified'}. Deadline: ${form.deadline || 'not urgent'}.\n\nLaila is a 3rd-year CS student, Lead SWE at LM Tech Solutions, has deployed IoT systems for GASCO and Ministry of Interior, handles Stripe integrations. She is negotiating for a fair market rate.\n\nWrite a 2-paragraph email: acknowledge the offer warmly, then counter with a specific number ~15-20% higher with justification. Professional but confident tone. No placeholders.`,
      script: `[NEGOTIATION] Write a verbal negotiation script for Laila Mohamed Fikry for a ${form.role || 'Software Engineer'} offer at ${form.company} (${form.offeredSalary} ${form.currency}/month). Format as:\n- Opening line\n- Value pitch (2 sentences)\n- Counter ask (specific number)\n- Handling "that's our max" objection\n- Closing line\nKeep each line to 1-2 sentences. Real talk, not textbook.`,
      checklist: `[NEGOTIATION] Generate a pre-negotiation checklist for Laila Mohamed Fikry evaluating the ${form.role || 'Software Engineer'} offer from ${form.company} (${form.offeredSalary} ${form.currency}/month, benefits: ${form.benefits || 'unclear'}).\n\nInclude: market rate comparison, must-have vs nice-to-have benefits, red flags to watch, questions to ask HR, BATNA (best alternative), and a go/no-go recommendation. Be direct.`,
    };

    const command = `/cover-letter [tone=Professional] [company=${form.company}] [title=Offer Negotiation]\n\n${prompts[tab]}`;

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; setLoading(false); setResult('⚠️ Daemon not responding. Start your local daemon first.'); }
    }, 90000);

    channelRef.current = supabase
      .channel(`negotiation-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_chat' }, (payload) => {
        const msg = payload.new;
        const text = msg.message || msg.content || '';
        const sender = msg.sender || msg.role || '';
        if (sender !== 'agent' || !text.startsWith('[COVER_LETTER_RESPONSE]')) return;
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          setLoading(false);
          setResult(text.replace('[COVER_LETTER_RESPONSE]', '').trim());
          supabase.removeChannel(channelRef.current);
        }
      })
      .subscribe();

    await supabase.from('agent_chat').insert([{ role: 'user', sender: 'user', content: command, message: command }]);
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}>
        <h2 className="section-title" style={{ fontSize: '24px', color: '#f59e0b', marginBottom: '4px' }}>🤝 Offer Negotiation AI</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Got an offer? Get a counter-offer email, verbal script, or evaluation checklist in seconds.</p>
      </div>

      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          {[['company', 'Company *'], ['role', 'Role / Title']].map(([k, p]) => (
            <div key={k}>
              <label style={labelStyle}>{p.toUpperCase()}</label>
              <input value={form[k]} onChange={e => f(k, e.target.value)} placeholder={p} style={inputStyle} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>OFFERED SALARY *</label>
            <input value={form.offeredSalary} onChange={e => f('offeredSalary', e.target.value)} placeholder="e.g. 18000" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>CURRENCY</label>
            <select value={form.currency} onChange={e => f('currency', e.target.value)} style={inputStyle}>
              <option>EGP</option><option>USD</option><option>EUR</option><option>GBP</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>BENEFITS</label>
            <input value={form.benefits} onChange={e => f('benefits', e.target.value)} placeholder="e.g. health, equity, WFH" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>DEADLINE</label>
            <input value={form.deadline} onChange={e => f('deadline', e.target.value)} placeholder="e.g. Friday" style={inputStyle} />
          </div>
        </div>

        {/* Output type */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[['counter', '✉️ Counter-Offer Email'], ['script', '🎤 Verbal Script'], ['checklist', '✅ Evaluation Checklist']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer', border: tab === k ? '1px solid #f59e0b' : '1px solid var(--border-color)', background: tab === k ? 'rgba(251,191,36,0.12)' : 'transparent', color: tab === k ? '#f59e0b' : 'var(--text-secondary)', fontWeight: tab === k ? '700' : '400' }}>
              {label}
            </button>
          ))}
        </div>

        <button className="btn btn-gradient" onClick={generate} disabled={loading || !form.company.trim() || !form.offeredSalary.trim()} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? '⟳ Generating...' : '⚡ Generate'}
        </button>
      </div>

      {result && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#f59e0b', letterSpacing: '0.08em' }}>
              {tab === 'counter' ? '✉️ COUNTER-OFFER EMAIL' : tab === 'script' ? '🎤 VERBAL SCRIPT' : '✅ EVALUATION CHECKLIST'}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.12)', color: copied ? 'var(--accent-green)' : '#f59e0b', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(251,191,36,0.3)'}` }}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.75', fontFamily: 'inherit', margin: 0 }}>{result}</pre>
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '9px 12px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' };

export default OfferNegotiationAI;
