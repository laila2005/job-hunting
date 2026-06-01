import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wpxtstbquvbsiqgoqwma.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IwP7F-cxFhXEMwZCDOuyuw_-V33gBSh';
const supabase = createClient(supabaseUrl, supabaseKey);

const DreamBoard = () => {
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState('');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  useEffect(() => {
    fetchDreamCompanies();
  }, []);

  const fetchDreamCompanies = async () => {
    const { data } = await supabase.from('dream_companies').select('*').order('created_at', { ascending: false });
    if (data) setCompanies(data);
  };

  const handleAdd = async () => {
    if (!newCompany.trim()) return;
    
    await supabase.from('dream_companies').insert([{ 
      name: newCompany, 
      domain: newCompany.toLowerCase().replace(/\s+/g, '') + '.com',
      status: 'Targeted'
    }]);
    
    setNewCompany('');
    fetchDreamCompanies();
  };

  const handleDelete = async (id) => {
    await supabase.from('dream_companies').delete().eq('id', id);
    fetchDreamCompanies();
  };

  return (
    <div className="analytics-card" style={{ height: 'auto', marginBottom: '30px' }}>
      <div className="dreamboard-header">
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>💎 Dream Companies Vault</h2>
        <div className="dreamboard-form">
          <input 
            type="text" 
            placeholder="Add Company (e.g. Stripe)" 
            value={newCompany}
            onChange={e => setNewCompany(e.target.value)}
            className="dreamboard-input"
          />
          <button className="btn btn-gradient" onClick={handleAdd}>Add Target</button>
        </div>
      </div>

      {companies.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No target companies tracked yet. Start building your vault!
        </div>
      ) : (
        <div className="dream-grid">
          {companies.map(c => (
            <div key={c.id} className="dream-card">
              <button onClick={() => handleDelete(c.id)} className="dream-delete-btn">✕</button>
              <div className="dream-icon">🏢</div>
              <h4 className="dream-name">{c.name}</h4>
              <span className="badge badge-dream">{c.status}</span>
              {c.created_at && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: '500' }}>
                  📅 Added: {formatDate(c.created_at)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DreamBoard;
