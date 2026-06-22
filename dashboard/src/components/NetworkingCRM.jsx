import React, { useState, useEffect } from 'react';

const NetworkingCRM = ({ supabase }) => {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data } = await supabase.from('networking_contacts').select('*').order('id');
    if (data) setContacts(data);
  };

  const handleAddContact = async () => {
    const name = prompt("Enter contact name:");
    if (!name) return;
    
    const company = prompt("Enter company:") || 'Unknown';
    const role = prompt("Enter role:") || 'Unknown';
    
    try {
      const newContact = { name, company, role, status: 'To Contact', last_contact: '-', notes: '' };
      
      // Optimistic update
      setContacts(prev => [...prev, { ...newContact, id: Date.now() }]);
      
      await supabase.from('networking_contacts').insert([newContact]);
      fetchContacts();
    } catch (err) {
      console.error(err);
      alert('Failed to add contact.');
    }
  };

  return (
    <div className="networking-crm-section animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '25px', borderRadius: '16px' }}>
        <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-blue)', marginBottom: '8px' }}>🤝 Networking & CRM</h2>
        <p className="section-subtitle" style={{ color: 'var(--text-secondary)' }}>Track your referrals, coffee chats, and LinkedIn outreach.</p>
      </div>

      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: 'var(--text-main)', margin: 0 }}>Active Connections</h3>
          <button className="btn btn-primary" onClick={handleAddContact} style={{ padding: '8px 16px', fontSize: '14px' }}>+ Add Contact</button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', fontSize: '13px', textTransform: 'uppercase' }}>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Company</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Last Contact</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Next Action</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(contact => (
                <tr key={contact.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 20px', color: 'var(--text-main)', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                        {contact.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-main)' }}>{contact.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{contact.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{contact.company}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: contact.status === 'Coffee Chat Scheduled' ? 'rgba(16, 185, 129, 0.1)' : contact.status === 'Reached Out' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: contact.status === 'Coffee Chat Scheduled' ? '#10b981' : contact.status === 'Reached Out' ? '#3b82f6' : '#f59e0b',
                    }}>
                      {contact.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '14px' }}>{contact.lastContact}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <button style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NetworkingCRM;
