import React, { useState, useRef } from 'react';

const PROJECTS = [
  {
    id: 'rms', name: 'RMS 3.0 — Industrial IoT Platform',
    stack: 'C#, ASP.NET Core, MSBuild, SQL Server, Modbus, SNMP, HTTP',
    client: 'Ministry of Interior (MOI) & GASCO — in production',
    desc: 'Enterprise backend polling industrial devices concurrently with fault tolerance and protocol abstraction (Strategy/Factory OOP). Deployed to two Egyptian government clients handling critical national power infrastructure. Enhanced SQL Server schema for enterprise security and compliance.',
  },
  {
    id: 'inqaz', name: 'Inqaz — Emergency AI Response System',
    stack: 'Python, FastAPI, Computer Vision, CNN, MobileNetV2, React, REST API',
    client: 'Academic / National Emergency Services (122/123)',
    desc: 'End-to-end emergency platform: real-time computer vision pipeline detecting accidents from live mobile footage, AI severity classification, GPS-coordinated auto-dispatch to national emergency services. Led full system architecture across CV pipeline, backend REST API, and frontend dispatch dashboard.',
  },
  {
    id: 'crash', name: 'Crash Detection & Classification Model',
    stack: 'Python, CNN, MobileNetV2, TensorFlow, Grad-CAM, Streamlit',
    client: 'Academic / Research',
    desc: 'Two deep learning models trained on 3,000 real-world traffic images — MobileNetV2 achieved 68% F1-score on unseen test data. Grad-CAM thermal heatmaps make AI decisions interpretable for emergency operators. Deployed production-ready Streamlit app with live camera inference and dispatch simulation.',
  },
  {
    id: 'zagel', name: 'Zagel — Real-Time Messaging Platform',
    stack: 'FastAPI, Next.js, TypeScript, WebRTC, PostgreSQL, Docker',
    client: 'Personal / Production',
    desc: 'Full architectural migration to FastAPI + Next.js. Built WebRTC signaling for voice/video calls, offline message queue, read receipts, voice recording, and compliance APIs. Docker containerization + TypeScript/ESLint CI pipeline. Deployed on Hugging Face Spaces.',
  },
  {
    id: 'dashboard', name: 'AI Job-Hunting Platform',
    stack: 'React, Vite, Supabase/PostgreSQL, Node.js, Google Gemini API, Python scrapers',
    client: 'Personal Project',
    desc: 'Autonomous career OS: multi-source job scrapers (Wuzzuf + ATS sites) with Gemini-powered semantic deduplication, background daemon for continuous processing, real-time Mock Interview Simulator, Resume Tailor, networking CRM, and 16-tab AI dashboard.',
  },
  {
    id: 'petpulse', name: 'PetPulse — Pet-Care Marketplace',
    stack: 'React, Vite, Tailwind CSS, Leaflet.js, Supabase, Node.js Serverless',
    client: 'Personal / Production',
    desc: 'Multi-sided marketplace connecting vets, trainers, pet shops, adoption, mating matches, and subscription boxes across Egypt. Leaflet location search, Arabic-localized admin dashboard, AI chatbot integration, serverless Node.js backend, and business financial modeling (MRR projections, pitch deck).',
  },
  {
    id: 'chat', name: 'Secure Real-Time Chat System',
    stack: 'Python, TCP Sockets, AES-256, SHA-256, Multi-threading',
    client: 'Academic / Systems Programming',
    desc: 'Multi-threaded TCP server with AES-256 end-to-end encryption, SHA-256 authentication hashing, concurrent multi-user support, and persistent data storage. Demonstrates systems-level networking and security fundamentals.',
  },
  {
    id: 'techroad', name: 'Tech-Road — Workforce Readiness Platform',
    stack: 'Full-Stack Web, REST API Design, System Architecture',
    client: 'Digitopia Competition',
    desc: 'Full-stack platform bridging academic learning with real-world workforce requirements, built under competition conditions. Team Leader and Backend Developer — responsible for overall system architecture, REST API design, and backend implementation.',
  },
];

const OUTPUT_TYPES = [
  { key: 'readme', label: '📄 README Section' },
  { key: 'portfolio', label: '🌐 Portfolio Card Text' },
  { key: 'linkedin', label: '💼 LinkedIn Project Entry' },
  { key: 'bullet', label: '📋 Resume Bullet Points' },
];

const PortfolioAutoBuilder = ({ supabase }) => {
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0].id);
  const [outputType, setOutputType] = useState('readme');
  const [customProject, setCustomProject] = useState({ name: '', stack: '', desc: '' });
  const [useCustom, setUseCustom] = useState(false);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const channelRef = useRef(null);

  const project = useCustom
    ? customProject
    : PROJECTS.find(p => p.id === selectedProject) || PROJECTS[0];

  const generate = async () => {
    if (!project.name.trim()) return;
    setLoading(true);
    setResult('');
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const prompts = {
      readme: `Write a professional README section for this project:\nName: ${project.name}\nStack: ${project.stack}\nContext: ${project.desc}\nClient/Context: ${project.client || 'Personal'}\n\nInclude: one-line description, key features (3-4 bullets), tech stack badges (text format), and a brief impact/outcome statement. Markdown format.`,
      portfolio: `Write portfolio card text for this project:\nName: ${project.name}\nStack: ${project.stack}\nContext: ${project.desc}\n\nFormat: Title, 2-sentence description, 3 impact highlights, tech tags. Punchy, achievement-focused, suitable for a personal website. No filler.`,
      linkedin: `Write a LinkedIn "Projects" section entry for:\nName: ${project.name}\nStack: ${project.stack}\nContext: ${project.desc}\nClient: ${project.client || 'Personal'}\n\nFormat: Project name + dates (generic), 3-4 bullet points with strong action verbs and quantified impact where possible. Max 150 words.`,
      bullet: `Write 3 powerful resume bullet points for:\nProject: ${project.name}\nStack: ${project.stack}\nContext: ${project.desc}\n\nRules: start with strong past-tense verb, quantify impact, mention tech. Each bullet ≤ 100 chars. XYZ format: "Accomplished X by doing Y resulting in Z".`,
    };

    const command = `/cover-letter [tone=Professional] [company=Portfolio] [title=${project.name}]\n\n[PORTFOLIO] ${prompts[outputType]}`;

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; setLoading(false); setResult('⚠️ Daemon not responding. Start your local daemon first.'); }
    }, 90000);

    channelRef.current = supabase
      .channel(`portfolio-${Date.now()}`)
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

  return (
    <div className="animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}>
        <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-purple)', marginBottom: '4px' }}>🛠️ Portfolio Auto-Builder</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Generate README sections, portfolio cards, LinkedIn entries, and resume bullets for your projects.</p>
      </div>

      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
        {/* Project selector */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '10px' }}>SELECT PROJECT</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {PROJECTS.map(p => (
              <button key={p.id} onClick={() => { setSelectedProject(p.id); setUseCustom(false); }}
                style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer', border: !useCustom && selectedProject === p.id ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)', background: !useCustom && selectedProject === p.id ? 'rgba(139,92,246,0.12)' : 'transparent', color: !useCustom && selectedProject === p.id ? 'var(--accent-purple)' : 'var(--text-secondary)', fontWeight: !useCustom && selectedProject === p.id ? '700' : '400' }}>
                {p.name.split('—')[0].trim()}
              </button>
            ))}
            <button onClick={() => setUseCustom(true)}
              style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer', border: useCustom ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)', background: useCustom ? 'rgba(59,130,246,0.1)' : 'transparent', color: useCustom ? 'var(--accent-blue)' : 'var(--text-muted)', fontWeight: useCustom ? '700' : '400' }}>
              + Custom
            </button>
          </div>

          {useCustom && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input value={customProject.name} onChange={e => setCustomProject(p => ({ ...p, name: e.target.value }))} placeholder="Project name" style={inputStyle} />
              <input value={customProject.stack} onChange={e => setCustomProject(p => ({ ...p, stack: e.target.value }))} placeholder="Tech stack (comma separated)" style={inputStyle} />
              <textarea value={customProject.desc} onChange={e => setCustomProject(p => ({ ...p, desc: e.target.value }))} placeholder="Brief description / impact..." rows={2} style={{ ...inputStyle, gridColumn: '1/-1', resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
          )}

          {!useCustom && (
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>{project.name}</strong>
              <span style={{ marginLeft: '8px' }}>· {project.stack}</span>
              {project.client && <span style={{ marginLeft: '8px' }}>· {project.client}</span>}
            </div>
          )}
        </div>

        {/* Output type */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '10px' }}>OUTPUT FORMAT</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {OUTPUT_TYPES.map(o => (
              <button key={o.key} onClick={() => setOutputType(o.key)}
                style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer', border: outputType === o.key ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)', background: outputType === o.key ? 'rgba(139,92,246,0.12)' : 'transparent', color: outputType === o.key ? 'var(--accent-purple)' : 'var(--text-secondary)', fontWeight: outputType === o.key ? '700' : '400' }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-gradient" onClick={generate} disabled={loading || !project.name.trim()} style={{ opacity: loading ? 0.7 : 1 }}>
          {loading ? '⟳ Building...' : '✨ Generate'}
        </button>
      </div>

      {result && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--accent-purple)', letterSpacing: '0.08em' }}>
              {OUTPUT_TYPES.find(o => o.key === outputType)?.label.toUpperCase()}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.12)', color: copied ? 'var(--accent-green)' : 'var(--accent-purple)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.3)'}` }}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.75', fontFamily: 'inherit', margin: 0 }}>{result}</pre>
        </div>
      )}
    </div>
  );
};

const inputStyle = { width: '100%', padding: '9px 12px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.875rem', boxSizing: 'border-box' };

export default PortfolioAutoBuilder;
