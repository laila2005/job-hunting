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
  const needsInput = jobs.filter(j => j.status === 'Needs Input').length;
  const applied = jobs.filter(j => j.status === 'Applied').length;

  // Data for Pie Chart
  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
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
    <div style={{ marginBottom: '40px' }}>
      {/* Top 3 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="glass-panel">
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Total Pipeline</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>{total}</p>
        </div>
        <div className="glass-panel" style={{ borderLeft: `4px solid ${COLORS['Applied']}` }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Successfully Applied</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>{applied}</p>
        </div>
        <div className="glass-panel status-needs-input" style={{ borderLeft: `4px solid ${COLORS['Needs Input']}` }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Needs Input (Blocked)</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>{needsInput}</p>
        </div>
      </div>

      {/* Advanced Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Status Distribution Pie Chart */}
        <div className="glass-panel" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0, marginBottom: '16px', fontSize: '1.1rem' }}>Status Distribution</h3>
          {total === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              No data yet.
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Weekly Goal Tracker */}
        <div className="glass-panel" style={{ height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ margin: 0, marginBottom: '16px', fontSize: '1.1rem' }}>Weekly Automation Goal</h3>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--accent-color)' }}>{total}</span>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}> / {weeklyGoal}</span>
            <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0' }}>Jobs targeted this week</p>
          </div>
          
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${progressPercent}%`, 
              background: 'var(--accent-color)',
              transition: 'width 1s ease-in-out'
            }}></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatCards;
