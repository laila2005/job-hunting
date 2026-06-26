import React, { useState, useEffect } from 'react';

const STATUSES = ['Targeted', 'Researching', 'Applied', 'Networking', 'Offer'];

const STATUS_COLORS = {
  Targeted:    { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  text: 'var(--accent-blue)' },
  Researching: { bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)',  text: '#fbbf24' },
  Applied:     { bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.35)',  text: 'var(--accent-purple)' },
  Networking:  { bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.35)',  text: '#22d3ee' },
  Offer:       { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)',  text: 'var(--accent-green)' },
};

const DreamBoard = ({ supabase, jobs = [] }) => {
  const [companies, setCompanies] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ name: '', linkedin_url: '', status: 'Targeted', notes: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDreamCompanies();
  }, []);

  const fetchDreamCompanies = async () => {
    const { data } = await supabase
      .from('dream_companies')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCompanies(data);
  };

  const jobMatchesCompany = (companyName) => {
    if (!companyName) return false;
    const lower = companyName.toLowerCase();
    return jobs.some(j =>
      (j.company || j.companySummary || '').toLowerCase().includes(lower) ||
      lower.includes((j.company || j.companySummary || '').toLowerCase().replace(/\s+/g, ' ').trim())
    );
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await supabase.from('dream_companies').insert([{
      name: form.name.trim(),
      linkedin_url: form.linkedin_url.trim() || null,
      status: form.status,
      notes: form.notes.trim() || null,
      domain: form.name.toLowerCase().replace(/\s+/g, '') + '.com',
    }]);
    setForm({ name: '', linkedin_url: '', status: 'Targeted', notes: '' });
    setSaving(false);
    fetchDreamCompanies();
  };

  const handleDelete = async (id) => {
    await supabase.from('dream_companies').delete().eq('id', id);
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditForm({ name: c.name, linkedin_url: c.linkedin_url || '', status: c.status, notes: c.notes || '' });
  };

  const saveEdit = async (id) => {
    setSaving(true);
    await supabase.from('dream_companies').update({
      name: editForm.name,
      linkedin_url: editForm.linkedin_url || null,
      status: editForm.status,
      notes: editForm.notes || null,
    }).eq('id', id);
    setEditingId(null);
    setSaving(false);
    fetchDreamCompanies();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div className="animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}>
        <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-purple)', marginBottom: '8px' }}>
          💎 Dream Companies Vault
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Track your target companies from first research to offer. {companies.length > 0 && `${companies.length} companies tracked.`}
        </p>
      </div>

      {/* Add form */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '14px' }}>
          ADD NEW TARGET COMPANY
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Company name *"
            style={inputStyle}
          />
          <input
            value={form.linkedin_url}
            onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
            placeholder="LinkedIn URL (optional)"
            style={inputStyle}
          />
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (recruiter name, referral contact, why you want to work here...)"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleAdd}
            disabled={saving || !form.name.trim()}
            className="btn btn-gradient"
            style={{ whiteSpace: 'nowrap', opacity: saving || !form.name.trim() ? 0.6 : 1 }}
          >
            + Add Target
          </button>
        </div>
      </div>

      {/* Status filter summary */}
      {companies.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {STATUSES.map(s => {
            const count = companies.filter(c => c.status === s).length;
            if (!count) return null;
            const col = STATUS_COLORS[s];
            return (
              <span key={s} style={{
                padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                background: col.bg, border: `1px solid ${col.border}`, color: col.text,
              }}>
                {s} {count}
              </span>
            );
          })}
        </div>
      )}

      {/* Cards */}
      {companies.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No target companies yet. Start building your dream vault above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {companies.map(c => {
            const col = STATUS_COLORS[c.status] || STATUS_COLORS.Targeted;
            const hasMatch = jobMatchesCompany(c.name);
            const isEditing = editingId === c.id;

            return (
              <div key={c.id} style={{
                background: 'var(--bg-card)',
                border: `1px solid ${hasMatch ? 'rgba(16,185,129,0.4)' : 'var(--border-color)'}`,
                borderLeft: `4px solid ${col.text}`,
                borderRadius: '12px',
                padding: '16px 20px',
              }}>
                {isEditing ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Company name" style={inputStyle} />
                      <input value={editForm.linkedin_url} onChange={e => setEditForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="LinkedIn URL" style={inputStyle} />
                      <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes..." style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={() => saveEdit(c.id)} style={{ ...actionBtn, background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.3)' }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ ...actionBtn, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{c.name}</h4>
                        <span style={{
                          padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600',
                          background: col.bg, border: `1px solid ${col.border}`, color: col.text,
                        }}>{c.status}</span>
                        {hasMatch && (
                          <span style={{
                            padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600',
                            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: 'var(--accent-green)',
                          }}>✓ Job Found in Pipeline</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        {c.created_at && <span>📅 Added {formatDate(c.created_at)}</span>}
                        {c.linkedin_url && (
                          <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0077b5', textDecoration: 'none' }}>
                            🔗 LinkedIn
                          </a>
                        )}
                      </div>
                      {c.notes && (
                        <div style={{
                          marginTop: '8px', padding: '8px 12px',
                          background: 'rgba(139,92,246,0.07)', borderRadius: '8px',
                          fontSize: '0.82rem', color: 'var(--text-secondary)',
                        }}>
                          📝 {c.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => startEdit(c)} style={{ ...actionBtn, background: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)' }}>✏️ Edit</button>
                      <button onClick={() => handleDelete(c.id)} style={{ ...actionBtn, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>✕</button>
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
  padding: '9px 12px',
  background: 'var(--bg-dark)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  color: 'var(--text-main)',
  fontSize: '0.875rem',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const actionBtn = {
  padding: '5px 14px',
  borderRadius: '8px',
  fontSize: '0.78rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export default DreamBoard;
