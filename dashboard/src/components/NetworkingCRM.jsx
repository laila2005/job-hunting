import React, { useState, useEffect, useRef } from 'react';

const STATUS_OPTIONS = ['To Contact', 'Reached Out', 'Coffee Chat Scheduled', 'Connected', 'Referred Me'];
const STATUS_COLORS = {
  'To Contact':             { bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b' },
  'Reached Out':            { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6' },
  'Coffee Chat Scheduled':  { bg: 'rgba(16,185,129,0.1)',  text: '#10b981' },
  'Connected':              { bg: 'rgba(139,92,246,0.1)',  text: '#8b5cf6' },
  'Referred Me':            { bg: 'rgba(34,211,238,0.1)',  text: '#22d3ee' },
};

const NetworkingCRM = ({ supabase }) => {
  const [contacts, setContacts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', company: '', role: '', linkedin_url: '', notes: '' });
  const [generatingFor, setGeneratingFor] = useState(null);
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [msgCopied, setMsgCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    fetchContacts();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  const fetchContacts = async () => {
    const { data } = await supabase.from('networking_contacts').select('*').order('id');
    if (data) setContacts(data);
  };

  const handleAddContact = async () => {
    if (!addForm.name.trim()) return;
    const newContact = {
      name: addForm.name.trim(),
      company: addForm.company.trim() || 'Unknown',
      role: addForm.role.trim() || 'Unknown',
      linkedin_url: addForm.linkedin_url.trim() || null,
      notes: addForm.notes.trim() || '',
      status: 'To Contact',
      last_contact: new Date().toISOString().split('T')[0],
    };
    setContacts(prev => [...prev, { ...newContact, id: Date.now() }]);
    setShowAdd(false);
    setAddForm({ name: '', company: '', role: '', linkedin_url: '', notes: '' });
    await supabase.from('networking_contacts').insert([newContact]);
    fetchContacts();
  };

  const updateStatus = async (contact, newStatus) => {
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: newStatus } : c));
    await supabase.from('networking_contacts').update({ status: newStatus }).eq('id', contact.id);
  };

  const deleteContact = async (id) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    await supabase.from('networking_contacts').delete().eq('id', id);
  };

  const generateLinkedInMsg = async (contact) => {
    setGeneratingFor(contact.id);
    setGeneratedMsg('');
    setGenerating(true);
    setMsgCopied(false);

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const command = `/cover-letter [tone=Professional] [company=${contact.company}] [title=LinkedIn Outreach]\n\n[LINKEDIN_MESSAGE] Write a short, warm LinkedIn connection request message (max 250 characters) from Laila Mohamed Fikry to ${contact.name}, who is a ${contact.role} at ${contact.company}. Laila is a 3rd-year CS student and Lead SWE at LM Tech Solutions with IoT deployments for the Ministry of Interior and GASCO. She is seeking a backend/fullstack internship or junior role. The message should be genuine, specific, and not generic. Do not use brackets or placeholders.`;

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; setGenerating(false); setGeneratedMsg('⚠️ Daemon not responding. Start your local daemon first.'); }
    }, 60000);

    channelRef.current = supabase
      .channel(`linkedin-msg-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_chat' }, (payload) => {
        const msg = payload.new;
        const text = msg.message || msg.content || '';
        const sender = msg.sender || msg.role || '';
        if (sender !== 'agent') return;
        if (!text.startsWith('[COVER_LETTER_RESPONSE]')) return;
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          setGenerating(false);
          setGeneratedMsg(text.replace('[COVER_LETTER_RESPONSE]', '').trim());
          supabase.removeChannel(channelRef.current);
        }
      })
      .subscribe();

    await supabase.from('agent_chat').insert([{ role: 'user', sender: 'user', content: command, message: command }]);
  };

  return (
    <div className="animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-blue)', marginBottom: '4px' }}>🤝 Networking CRM</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Track referrals, coffee chats, and LinkedIn outreach. {contacts.length > 0 && `${contacts.length} contacts tracked.`}</p>
        </div>
        <button className="btn btn-gradient" onClick={() => setShowAdd(s => !s)}>+ Add Contact</button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            {[['name','Name *'],['company','Company'],['role','Role']].map(([k,p]) => (
              <input key={k} value={addForm[k]} onChange={e => setAddForm(f => ({...f,[k]:e.target.value}))} placeholder={p} style={inputStyle} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <input value={addForm.linkedin_url} onChange={e => setAddForm(f => ({...f,linkedin_url:e.target.value}))} placeholder="LinkedIn URL" style={inputStyle} />
            <input value={addForm.notes} onChange={e => setAddForm(f => ({...f,notes:e.target.value}))} placeholder="Notes (mutual connection, how you know them...)" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-gradient" onClick={handleAddContact} disabled={!addForm.name.trim()}>Save Contact</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No contacts yet. Add your first networking target above.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {contacts.map(contact => {
            const col = STATUS_COLORS[contact.status] || STATUS_COLORS['To Contact'];
            const isGenerating = generatingFor === contact.id && generating;
            const hasMsg = generatingFor === contact.id && generatedMsg;

            return (
              <div key={contact.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderLeft: `4px solid ${col.text}`, borderRadius: '12px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  {/* Left */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#fff', fontSize: '1rem', flexShrink: 0 }}>
                      {(contact.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{contact.name}</span>
                        <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600', background: col.bg, color: col.text }}>
                          {contact.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {contact.role} · {contact.company}
                      </div>
                      {contact.notes && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>📝 {contact.notes}</div>}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {contact.linkedin_url && (
                      <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem', background: 'rgba(0,119,181,0.12)', color: '#0077b5', border: '1px solid rgba(0,119,181,0.3)', textDecoration: 'none' }}>🔗 LinkedIn</a>
                    )}
                    <button onClick={() => generateLinkedInMsg(contact)} disabled={isGenerating} style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', background: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)', opacity: isGenerating ? 0.6 : 1 }}>
                      {isGenerating ? '⟳ Generating...' : '✉️ Generate Message'}
                    </button>
                    <select value={contact.status} onChange={e => updateStatus(contact, e.target.value)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button onClick={() => deleteContact(contact.id)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>✕</button>
                  </div>
                </div>

                {/* Generated message panel */}
                {hasMsg && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--accent-blue)', letterSpacing: '0.06em', marginBottom: '6px' }}>✉️ LINKEDIN CONNECTION MESSAGE</div>
                    <p style={{ margin: '0 0 10px', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.6' }}>{generatedMsg}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { navigator.clipboard.writeText(generatedMsg); setMsgCopied(true); setTimeout(() => setMsgCopied(false), 2000); }} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', background: msgCopied ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', color: msgCopied ? 'var(--accent-green)' : 'var(--accent-blue)', border: `1px solid ${msgCopied ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}` }}>
                        {msgCopied ? '✓ Copied!' : '📋 Copy'}
                      </button>
                      <button onClick={() => { setGeneratingFor(null); setGeneratedMsg(''); }} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>Close</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '9px 12px', background: 'var(--bg-dark)',
  border: '1px solid var(--border-color)', borderRadius: '8px',
  color: 'var(--text-main)', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit',
};

export default NetworkingCRM;
