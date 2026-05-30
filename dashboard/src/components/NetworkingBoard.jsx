import React from 'react';

const NetworkingBoard = ({ contacts, onMarkSent }) => {
  if (!contacts || contacts.length === 0) return null;

  return (
    <div style={{ marginTop: '40px' }}>
      <h2 style={{ marginBottom: '20px', fontWeight: '600' }}>Networking Queue</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Click the button to copy the drafted message and instantly open their LinkedIn profile.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {contacts.map(contact => (
          <div key={contact.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{contact.employee_name}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {contact.role} at {contact.company}
                </p>
              </div>
              <span style={{ 
                background: contact.status === 'Sent' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.2)', 
                color: contact.status === 'Sent' ? 'var(--success)' : 'var(--warning)',
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {contact.status}
              </span>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
              <p style={{ fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>
                "{contact.draft_message}"
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(contact.draft_message);
                  window.open(contact.linkedin_url, '_blank');
                  if (contact.status !== 'Sent') {
                    onMarkSent(contact.id);
                  }
                }}
              >
                Copy Message & Connect
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkingBoard;
