import React, { useState, useEffect } from 'react';

const ActionCenter = ({ jobs }) => {
  const [actions, setActions] = useState([]);

  useEffect(() => {
    // Generate intelligent actions based on pipeline data
    const generateActions = () => {
      const topActions = [];

      // 1. Check for Pending jobs with high AQS
      const highValuePending = jobs.filter(j => j.status === 'Pending Review' && j.aqs_score >= 90);
      if (highValuePending.length > 0) {
        topActions.push({
          type: 'high-priority',
          title: `Apply to ${highValuePending[0].company}`,
          desc: `Perfect AQS match (${highValuePending[0].aqs_score}/100) for Junior Backend.`
        });
      }

      // 2. Check for jobs needing networking
      const networkJobs = jobs.filter(j => j.status === 'Pending Review' && j.recommended_action === 'network');
      if (networkJobs.length > 0) {
        topActions.push({
          type: 'network',
          title: `Find Recruiter at ${networkJobs[0].company}`,
          desc: `High-tier target. Icebreaker recommended before applying.`
        });
      }

      // 3. Interview Prep reminder
      const appliedJobs = jobs.filter(j => j.status === 'Applied');
      if (appliedJobs.length > 0) {
        topActions.push({
          type: 'prep',
          title: `Practice Interview for ${appliedJobs[0].company}`,
          desc: `Keep your technical communication sharp.`
        });
      }

      // 4. Default Proof action
      topActions.push({
        type: 'proof',
        title: `Generate GitHub Proof`,
        desc: `Scan local commits for recruiter-friendly summaries.`
      });

      setActions(topActions);
    };

    generateActions();
  }, [jobs]);

  const getIcon = (type) => {
    switch(type) {
      case 'high-priority': return '🔥';
      case 'network': return '🧊';
      case 'prep': return '🎙️';
      case 'proof': return '🟩';
      default: return '✅';
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'high-priority': return 'var(--accent-red)';
      case 'network': return 'var(--accent-purple)';
      case 'prep': return 'var(--accent-blue)';
      case 'proof': return 'var(--accent-green)';
      default: return 'white';
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px', marginBottom: '30px' }}>
      <h2 style={{ margin: '0 0 20px 0', color: 'var(--text-main)', fontSize: '1.2rem' }}>🎯 Today's Top Moves</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
        {actions.map((action, i) => (
          <div key={i} style={{ 
            background: 'var(--bg-dark)', 
            padding: '15px', 
            borderRadius: '8px', 
            borderLeft: `4px solid ${getColor(action.type)}`,
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '24px' }}>{getIcon(action.type)}</div>
            <div>
              <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)' }}>{action.title}</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{action.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActionCenter;
