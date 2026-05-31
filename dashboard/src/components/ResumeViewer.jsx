import React from 'react';

const ResumeViewer = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      zIndex: 10000, display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '40px 20px', overflowY: 'auto'
    }} onClick={onClose}>
      
      {/* Resume Container */}
      <div 
        style={{
          width: '100%', maxWidth: '850px', background: 'white',
          color: '#1a1a1a', padding: '60px 80px', borderRadius: '4px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          position: 'relative', cursor: 'default'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: '#f3f4f6', border: 'none', width: '32px', height: '32px',
            borderRadius: '50%', cursor: 'pointer', fontSize: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#4b5563'
          }}
        >
          &times;
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #2563eb', paddingBottom: '24px', marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 12px 0', fontSize: '2.5rem', color: '#111827', fontWeight: 'bold' }}>Laila Mohamed Fikry</h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', color: '#4b5563', fontSize: '0.95rem', flexWrap: 'wrap' }}>
            <span>📍 Badr City, Cairo, Egypt</span>
            <span>|</span>
            <span>✉️ laila.mohamed.fikry@gmail.com</span>
            <span>|</span>
            <span>📞 +20 121 021 2792</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', color: '#2563eb', fontSize: '0.95rem', marginTop: '8px' }}>
            <a href="https://linkedin.com/in/laila-mohamed23" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>LinkedIn: /in/laila-mohamed23</a>
            <span>|</span>
            <a href="https://github.com/laila2005" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>GitHub: /laila2005</a>
          </div>
        </div>

        {/* Summary */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ lineHeight: '1.6', fontSize: '1rem', color: '#374151' }}>
            Results-driven Junior Backend and Full-Stack Engineer with a strong foundation in modern web architecture, distributed systems, and scalable APIs. Adept at rapid problem-solving, clean code principles, and autonomous execution. Seeking international remote or hybrid opportunities to leverage my technical depth in C#, Node.js, and React.
          </p>
        </div>

        {/* Skills */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Technical Capabilities</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '12px', fontSize: '0.95rem' }}>
            <strong style={{ color: '#4b5563' }}>Backend & Core:</strong>
            <span style={{ color: '#111827' }}>C#, Node.js, Express.js, ASP.NET, Java, Python, C++</span>
            
            <strong style={{ color: '#4b5563' }}>Databases:</strong>
            <span style={{ color: '#111827' }}>PostgreSQL, SQL Server, MySQL, MongoDB</span>
            
            <strong style={{ color: '#4b5563' }}>Frontend:</strong>
            <span style={{ color: '#111827' }}>React.js, Next.js, TypeScript, JavaScript, Tailwind CSS</span>
            
            <strong style={{ color: '#4b5563' }}>Architecture:</strong>
            <span style={{ color: '#111827' }}>RESTful APIs, Custom Windows Services, Microservices</span>
            
            <strong style={{ color: '#4b5563' }}>AI & Tools:</strong>
            <span style={{ color: '#111827' }}>Git, Linux/Bash, TensorFlow, Docker (Familiar)</span>
          </div>
        </div>

        {/* Experience / Projects */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Engineering Experience</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>Autonomous Job Search Pipeline</h3>
              <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>May 2026 – Present</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#6b7280', fontStyle: 'italic' }}>Node.js, Supabase, React, Puppeteer, AI Agents</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li>Architected a fully autonomous job hunting pipeline capable of scraping data from LinkedIn and Wuzzuf.</li>
              <li>Engineered a custom AI evaluation layer (Google Gemini) that scores jobs based on tech stack fit and remote viability.</li>
              <li>Built a real-time full-stack dashboard (React, Vite, Supabase) with live telemetry and networking intelligence systems.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>Enterprise Notification System</h3>
              <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>2025</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#6b7280', fontStyle: 'italic' }}>C#, ASP.NET, SQL Server</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li>Designed and implemented a scalable notification microservice for a high-throughput internal application.</li>
              <li>Optimized SQL queries to reduce latency by 40% when fetching unread alerts.</li>
            </ul>
          </div>
        </div>

        {/* Education */}
        <div>
          <h2 style={{ fontSize: '1.25rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Education</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827' }}>Bachelor of Science in Computer Science</h3>
            <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>Expected 2027</span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#4b5563', fontSize: '0.95rem' }}>El Sewedy University of Technology / Egyptian Russian University</p>
        </div>

      </div>
    </div>
  );
};

export default ResumeViewer;
