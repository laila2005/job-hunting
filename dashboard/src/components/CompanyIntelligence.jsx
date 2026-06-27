import React, { useState, useRef } from 'react';

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: '🏢' },
  { key: 'stack', label: 'Tech Stack', icon: '⚙️' },
  { key: 'culture', label: 'Culture', icon: '🌱' },
  { key: 'interview', label: 'Interview Tips', icon: '🎯' },
];

const CompanyIntelligence = ({ supabase, jobs = [] }) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [error, setError] = useState('');
  const channelRef = useRef(null);

  const uniqueCompanies = [...new Set(jobs.map(j => j.company || j.companySummary).filter(Boolean))].slice(0, 30);

  const generate = async () => {
    if (!company.trim()) { setError('Enter a company name.'); return; }
    setError('');
    setLoading(true);
    setReport(null);

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const command = `/cover-letter [tone=Professional] [company=${company}] [title=Company Intelligence]\n\n[COMPANY_INTEL] Generate a structured company intelligence report for "${company}" targeting the role "${role || 'Software Engineer'}". Include exactly these sections separated by ###SECTION### markers:\n###OVERVIEW###\n2-3 sentences: what the company does, size, funding stage, HQ.\n###STACK###\nBullet list of their known tech stack (languages, frameworks, cloud, tools).\n###CULTURE###\n2-3 sentences on engineering culture, work-life balance, remote policy, Glassdoor highlights.\n###INTERVIEW###\nBullet list of 4-5 interview tips specific to this company's process.\nKeep each section concise. Do not use placeholder brackets.`;

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; setLoading(false); setError('⚠️ Daemon not responding. Start your local daemon first.'); }
    }, 90000);

    channelRef.current = supabase
      .channel(`company-intel-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_chat' }, (payload) => {
        const msg = payload.new;
        const text = msg.message || msg.content || '';
        const sender = msg.sender || msg.role || '';
        if (sender !== 'agent') return;
        if (!text.startsWith('[COVER_LETTER_RESPONSE]')) return;
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          setLoading(false);
          const raw = text.replace('[COVER_LETTER_RESPONSE]', '').trim();
          setReport(parseReport(raw));
          supabase.removeChannel(channelRef.current);
        }
      })
      .subscribe();

    await supabase.from('agent_chat').insert([{ role: 'user', sender: 'user', content: command, message: command }]);
  };

  const parseReport = (raw) => {
    const sections = {};
    const overviewMatch = raw.match(/###OVERVIEW###([\s\S]*?)(?=###STACK###|$)/);
    const stackMatch = raw.match(/###STACK###([\s\S]*?)(?=###CULTURE###|$)/);
    const cultureMatch = raw.match(/###CULTURE###([\s\S]*?)(?=###INTERVIEW###|$)/);
    const interviewMatch = raw.match(/###INTERVIEW###([\s\S]*?)$/);
    sections.overview = overviewMatch ? overviewMatch[1].trim() : raw;
    sections.stack = stackMatch ? stackMatch[1].trim() : '';
    sections.culture = cultureMatch ? cultureMatch[1].trim() : '';
    sections.interview = interviewMatch ? interviewMatch[1].trim() : '';
    return sections;
  };

  return (
    <div className="animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}>
        <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-blue)', marginBottom: '4px' }}>🏢 Company Intelligence</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Get AI-powered research on any company — tech stack, culture, interview tips.</p>
      </div>

      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>COMPANY</label>
            <input
              list="company-suggestions"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Instabug, Noon, Swvl"
              style={inputStyle}
            />
            <datalist id="company-suggestions">
              {uniqueCompanies.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label style={labelStyle}>TARGET ROLE</label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Backend Engineer Intern" style={inputStyle} />
          </div>
        </div>
        {error && <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '10px' }}>{error}</div>}
        <button className="btn btn-gradient" onClick={generate} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? '⟳ Generating intelligence report...' : '🔍 Generate Company Report'}
        </button>
      </div>

      {report && (
        <div className="glass-panel" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
          {/* Section tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)} style={{
                flex: 1, padding: '14px 8px', fontSize: '0.82rem', fontWeight: activeSection === s.key ? '700' : '400',
                background: activeSection === s.key ? 'rgba(59,130,246,0.1)' : 'transparent',
                color: activeSection === s.key ? 'var(--accent-blue)' : 'var(--text-muted)',
                border: 'none', borderBottom: activeSection === s.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
              {report[activeSection] || 'No data for this section.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '9px 12px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' };

export default CompanyIntelligence;
