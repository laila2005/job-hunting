import React from 'react';

const NetworkingBoard = ({ contacts, onMarkSent }) => {
  if (!contacts || contacts.length === 0) return null;

  return (
    <div style={{ marginTop: '40px' }}>
      <h2 style={{ marginBottom: '20px', fontWeight: '600' }}>Networking Queue</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Click the button to copy the drafted message and instantly open their LinkedIn profile.
      </p>

      <div className="list-grid">
        {contacts.length === 0 ? (
          <p className="empty-state">No networking tasks right now. The bot is resting.</p>
        ) : contacts.map(contact => (
          <div key={contact.id} className="premium-card item-card">
            
            <div className="item-main">
              <div className="item-details">
                <div className="item-title-row">
                  <h3 className="item-title">{contact.employee_name}</h3>
                  <span className={contact.status === 'Sent' ? 'badge badge-sent' : 'badge badge-pending'}>
                    {contact.status}
                  </span>
                </div>
                <p className="item-meta">
                  {contact.role} at {contact.company}
                </p>
                <div className="networking-message">
                  "{contact.draft_message}"
                </div>
              </div>
            </div>

            <div className="item-actions">
              <button 
                className="btn"
                onClick={() => {
                  navigator.clipboard.writeText(contact.draft_message);
                  window.open(contact.linkedin_url, '_blank');
                  if (contact.status !== 'Sent') {
                    onMarkSent(contact.id);
                  }
                }}
                disabled={contact.status === 'Sent'}
                style={{ opacity: contact.status === 'Sent' ? 0.5 : 1, cursor: contact.status === 'Sent' ? 'not-allowed' : 'pointer' }}
              >
                {contact.status === 'Sent' ? 'Request Sent ✓' : 'Copy Message & Connect'}
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkingBoard;
