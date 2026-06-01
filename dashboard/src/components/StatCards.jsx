import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = {
  'Applied': '#10b981',
  'Needs Input': '#f59e0b',
  'Pending Review': '#3b82f6',
  'Rejected': '#ef4444'
};

const StatCards = ({ jobs }) => {
  const total = jobs.length;
  const needsInput = jobs.filter(j => (j.status || '').trim().toLowerCase() === 'needs input').length;
  const applied = jobs.filter(j => (j.status || '').trim().toLowerCase() === 'applied').length;

  // Data for Pie Chart
  const statusCounts = jobs.reduce((acc, job) => {
    let status = (job.status || '').trim();
    if (status.toLowerCase() === 'needs input') status = 'Needs Input';
    else if (status.toLowerCase() === 'pending review') status = 'Pending Review';
    else if (status.toLowerCase() === 'applied') status = 'Applied';
    else if (status.toLowerCase() === 'rejected') status = 'Rejected';
    
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));

  // Data for Funnel/Progress Bar (Weekly Goal)
  const weeklyGoal = 20;
  const progressPercent = Math.min((total / weeklyGoal) * 100, 100);

  return (
    <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
      {/* Top 3 Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-total">
          <div className="kpi-content">
            <h3 className="kpi-title">Total Pipeline</h3>
            <p className="kpi-value">{total}</p>
            <span className="kpi-badge">Active Queue</span>
          </div>
          <div className="kpi-icon-wrapper">
            <svg className="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v16.5c0 .621.504 1.125 1.125 1.125H21m-16.5-5.25L12 10.5l4.5 4.5 5.25-5.25" />
            </svg>
          </div>
        </div>

        <div className="kpi-card kpi-applied">
          <div className="kpi-content">
            <h3 className="kpi-title">Successfully Applied</h3>
            <p className="kpi-value">{applied}</p>
            <span className="kpi-badge badge-green">Syncing Live</span>
          </div>
          <div className="kpi-icon-wrapper icon-green">
            <svg className="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="kpi-card kpi-blocked">
          <div className="kpi-content">
            <h3 className="kpi-title">Needs Input (Blocked)</h3>
            <p className="kpi-value">{needsInput}</p>
            <span className="kpi-badge badge-orange">Action Required</span>
          </div>
          <div className="kpi-icon-wrapper icon-orange">
            <svg className="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Advanced Charts Section */}
      <div className="analytics-grid">
        
        {/* Status Distribution Pie Chart */}
        <div className="analytics-card status-distribution-card">
          <h3 className="analytics-card-title">Status Distribution</h3>
          {total === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No active metrics.
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0e1227', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} 
                    itemStyle={{ color: '#fff', fontSize: '0.85rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Weekly Goal Tracker */}
        <div className="analytics-card weekly-goal-card">
          <h3 className="analytics-card-title">Weekly Automation Goal</h3>
          
          <div className="goal-metric-container">
            <span className="goal-metric-highlight">{total}</span>
            <span className="goal-metric-divider"> / {weeklyGoal}</span>
            <p className="goal-metric-caption">Automated job submittals this week</p>
          </div>
          
          <div className="goal-progress-track">
            <div className="goal-progress-bar" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatCards;
