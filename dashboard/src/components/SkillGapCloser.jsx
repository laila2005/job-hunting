import React, { useState, useRef } from 'react';

const MY_SKILLS = [
  'c#', 'asp.net', '.net', 'node.js', 'nodejs', 'react', 'python', 'javascript', 'typescript',
  'sql server', 'postgresql', 'supabase', 'mongodb', 'redis',
  'rest api', 'graphql', 'docker', 'git', 'github', 'linux',
  'html', 'css', 'tailwind', 'bootstrap',
  'deep learning', 'cnn', 'computer vision', 'tensorflow', 'pytorch', 'opencv',
  'iot', 'mqtt', 'signalr', 'websockets',
  'stripe', 'twilio', 'jwt', 'oauth',
  'azure', 'vercel', 'nginx',
];

const COMMON_SKILLS = [
  'go', 'rust', 'java', 'kotlin', 'swift', 'ruby', 'php', 'scala',
  'spring boot', 'django', 'flask', 'fastapi', 'laravel', 'rails',
  'aws', 'gcp', 'kubernetes', 'terraform', 'ci/cd', 'jenkins', 'github actions',
  'kafka', 'rabbitmq', 'elasticsearch', 'cassandra', 'dynamodb',
  'microservices', 'grpc', 'protobuf', 'system design',
  'unit testing', 'jest', 'pytest', 'selenium',
  'figma', 'agile', 'scrum', 'jira',
];

const extractSkills = (text) => {
  const t = text.toLowerCase();
  const allKnown = [...MY_SKILLS, ...COMMON_SKILLS];
  return [...new Set(allKnown.filter(s => t.includes(s)))];
};

const SkillGapCloser = ({ supabase, jobs = [] }) => {
  const [jobDesc, setJobDesc] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef(null);

  const pipelineJobs = jobs.filter(j => j.status === 'Pending' || j.status === 'Queued for Bot' || j.status === 'Applied').slice(0, 20);

  const handleJobSelect = (e) => {
    const id = e.target.value;
    setSelectedJobId(id);
    if (!id) return;
    const job = jobs.find(j => j.id === id);
    if (job) setJobDesc(job.description || job.notes || job.companySummary || '');
  };

  const analyze = () => {
    if (!jobDesc.trim()) return;
    setLoading(true);

    const required = extractSkills(jobDesc);
    const have = required.filter(s => MY_SKILLS.includes(s));
    const missing = required.filter(s => !MY_SKILLS.includes(s));

    // Also ask daemon for study resources for missing skills
    if (missing.length > 0 && supabase) {
      fetchResources(missing);
    } else {
      setLoading(false);
      setResult({ have, missing, resources: {} });
    }
  };

  const fetchResources = async (missing) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const command = `/cover-letter [tone=Concise] [company=SkillGap] [title=Study Resources]\n\n[SKILL_RESOURCES] For each of these skills: ${missing.join(', ')} — give one concise learning resource or approach per skill. Format: "skill: resource". No extra text.`;

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; setLoading(false); setResult({ have: extractSkills(jobDesc).filter(s => MY_SKILLS.includes(s)), missing, resources: {} }); }
    }, 30000);

    channelRef.current = supabase
      .channel(`skill-gap-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_chat' }, (payload) => {
        const msg = payload.new;
        const text = msg.message || msg.content || '';
        const sender = msg.sender || msg.role || '';
        if (sender !== 'agent' || !text.startsWith('[COVER_LETTER_RESPONSE]')) return;
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          const raw = text.replace('[COVER_LETTER_RESPONSE]', '').trim();
          const resources = {};
          raw.split('\n').forEach(line => {
            const [skill, ...rest] = line.split(':');
            if (skill && rest.length) resources[skill.trim().toLowerCase()] = rest.join(':').trim();
          });
          setLoading(false);
          const required = extractSkills(jobDesc);
          setResult({ have: required.filter(s => MY_SKILLS.includes(s)), missing, resources });
          supabase.removeChannel(channelRef.current);
        }
      })
      .subscribe();

    await supabase.from('agent_chat').insert([{ role: 'user', sender: 'user', content: command, message: command }]);
  };

  const matchPct = result ? Math.round((result.have.length / (result.have.length + result.missing.length || 1)) * 100) : 0;

  return (
    <div className="animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}>
        <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-purple)', marginBottom: '4px' }}>🧠 Skill Gap Closer</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Paste a job description to see which skills you have vs. what's needed.</p>
      </div>

      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
        {pipelineJobs.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>PICK FROM PIPELINE</label>
            <select value={selectedJobId} onChange={handleJobSelect} style={inputStyle}>
              <option value="">— or paste manually below —</option>
              {pipelineJobs.map(j => <option key={j.id} value={j.id}>{j.company || j.companySummary} — {j.title}</option>)}
            </select>
          </div>
        )}
        <label style={labelStyle}>JOB DESCRIPTION</label>
        <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} placeholder="Paste the job description here..." rows={5}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', marginBottom: '14px' }} />
        <button className="btn btn-gradient" onClick={analyze} disabled={loading || !jobDesc.trim()} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? '⟳ Analyzing...' : '🔍 Analyze Skill Gap'}
        </button>
      </div>

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Match score */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: matchPct >= 70 ? 'var(--accent-green)' : matchPct >= 40 ? '#f59e0b' : '#ef4444' }}>{matchPct}%</div>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>Skill Match</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{result.have.length} matched · {result.missing.length} gaps</div>
              </div>
              <div style={{ flex: 1, height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${matchPct}%`, background: matchPct >= 70 ? 'var(--accent-green)' : matchPct >= 40 ? '#f59e0b' : '#ef4444', borderRadius: '4px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>

          {/* Have */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--accent-green)', letterSpacing: '0.08em', marginBottom: '12px' }}>✅ YOU HAVE ({result.have.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {result.have.length === 0
                ? <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>None detected in this JD</span>
                : result.have.map(s => (
                  <span key={s} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>{s}</span>
                ))}
            </div>
          </div>

          {/* Missing */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#ef4444', letterSpacing: '0.08em', marginBottom: '12px' }}>📚 SKILL GAPS ({result.missing.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.missing.length === 0
                ? <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No gaps detected — you're a match! 🎉</span>
                : result.missing.map(s => (
                  <div key={s}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>{s}</span>
                    {result.resources[s] && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>→ {result.resources[s]}</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.06em', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '9px 12px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.875rem', boxSizing: 'border-box' };

export default SkillGapCloser;
