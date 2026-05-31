import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wpxtstbquvbsiqgoqwma.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IwP7F-cxFhXEMwZCDOuyuw_-V33gBSh';
const supabase = createClient(supabaseUrl, supabaseKey);

const DreamBoard = () => {
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState('');

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
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px', marginBottom: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>💎 Dream Companies Vault</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Add Company (e.g. Stripe)" 
            value={newCompany}
            onChange={e => setNewCompany(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-dark)', color: 'white' }}
          />
          <button className="btn btn-primary" onClick={handleAdd}>Add Target</button>
        </div>
      </div>

      {companies.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No Dream Companies added yet. Start targeting!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
          {companies.map(c => (
            <div key={c.id} style={{ background: 'var(--bg-dark)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative' }}>
              <button 
                onClick={() => handleDelete(c.id)}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏢</div>
              <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)' }}>{c.name}</h4>
              <span className="badge badge-primary">{c.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DreamBoard;
