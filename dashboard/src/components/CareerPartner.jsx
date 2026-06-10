import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const CareerPartner = ({ supabase }) => {
  const [skillData] = useState([
    { subject: 'ASP.NET Core & C#', Laila: 95, Market: 95, fullMark: 100 },
    { subject: 'React.js & TS', Laila: 85, Market: 90, fullMark: 100 },
    { subject: 'Python (AI/Backend)', Laila: 85, Market: 88, fullMark: 100 },
    { subject: 'System Arch & APIs', Laila: 80, Market: 85, fullMark: 100 },
    { subject: 'DB Management', Laila: 75, Market: 80, fullMark: 100 },
    { subject: 'Cloud & CI/CD', Laila: 40, Market: 85, fullMark: 100 },
  ]);

  const actionItems = [
    { id: 1, type: 'critical', text: 'Skill Gap Detected: Master Docker & CI/CD. The market expects cloud readiness. Build a GitHub Actions pipeline today.', status: 'pending' },
    { id: 2, type: 'critical', text: 'Skill Gap Detected: Implement Message Brokers (RabbitMQ/Kafka) & Automated Testing (xUnit) in your backend projects.', status: 'pending' },
    { id: 3, type: 'warning', text: 'Resume Update: Add quantifiable scale metrics (e.g., "Handled 10,000 RPM") to your GASCO/MOI experience.', status: 'pending' },
    { id: 4, type: 'success', text: 'Highlight your production IoT experience aggressively in interviews. It puts you in the top 1% of students.', status: 'completed' }
  ];

  return (
    <div className="career-partner-section animate-fade-in" style={{ marginTop: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '25px', borderRadius: '16px' }}>
        <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-purple)', marginBottom: '8px' }}>🤖 Your AI Career Partner</h2>
        <p className="section-subtitle" style={{ color: 'var(--text-secondary)' }}>Based on real-time market research and a deep audit of your GitHub portfolio.</p>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Daily Action Plan */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚡ Strategy Action Plan
          </h3>
          <div className="action-list">
            {actionItems.map(item => (
              <div key={item.id} className={`action-card status-${item.type}`} style={{ 
                padding: '16px', 
                marginBottom: '12px', 
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)',
                borderLeft: `4px solid ${item.type === 'critical' ? '#ef4444' : item.type === 'warning' ? '#f59e0b' : '#10b981'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <input type="checkbox" checked={item.status === 'completed'} readOnly style={{ marginTop: '4px', cursor: 'pointer' }} />
                <span style={{ color: item.status === 'completed' ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: item.status === 'completed' ? 'line-through' : 'none', lineHeight: '1.5' }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Gap Radar */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>🎯 Market Fit vs. Current Skills</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            <span style={{ color: '#8884d8' }}>● Laila's Profile</span> &nbsp;&nbsp; 
            <span style={{ color: '#82ca9d' }}>● Market Demand (2026)</span>
          </p>
          <div style={{ flex: 1, minHeight: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Laila" dataKey="Laila" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="Market" dataKey="Market" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Portfolio Health */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginTop: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--text-main)' }}>🚀 Portfolio Recommendations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '12px' }}>
            <h4 style={{ color: '#10b981', marginBottom: '8px' }}>Top Strength</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>Unmatched Real-World Impact: Unlike typical Year 3 CS students, your experience shipping enterprise IoT platforms for MOI and GASCO demonstrates exceptional ability to deliver production-ready software.</p>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px' }}>
            <h4 style={{ color: '#ef4444', marginBottom: '8px' }}>Urgent Architecture Gap</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>Your profile lacks explicit mention of modern DevOps and Event-Driven Architecture. Master Docker, CI/CD (GitHub Actions), and Message Brokers (RabbitMQ/Kafka) immediately.</p>
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '12px' }}>
            <h4 style={{ color: '#3b82f6', marginBottom: '8px' }}>Targeted Weekend Project</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}><strong>High-Throughput IoT Telemetry Ingestion API:</strong> Build a microservice in ASP.NET Core that receives heavy IoT telemetry, processes it via RabbitMQ, and stores it in Postgres. Dockerize it, add xUnit tests, load test it with k6, and set up GitHub Actions. Pin this to your GitHub!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerPartner;
