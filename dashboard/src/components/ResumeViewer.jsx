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
            Backend Developer currently in Year 3 of a Computer Science degree, with production experience architecting and deploying enterprise systems. Built fault-tolerant backend services for IoT platforms serving the Ministry of Interior (MOI) and the Egyptian Natural Gas Holding Company (GASCO). Highly proficient in Node.js, TypeScript, C#, ASP.NET, and REST API design. Experienced in database architecture, concurrent data ingestion, and cloud-ready infrastructure.
          </p>
        </div>

        {/* Skills */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Technical Skills</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '12px', fontSize: '0.95rem' }}>
            <strong style={{ color: '#4b5563' }}>Backend Frameworks:</strong>
            <span style={{ color: '#111827' }}>Node.js, Express.js, ASP.NET, Custom Windows Services</span>
            
            <strong style={{ color: '#4b5563' }}>Languages:</strong>
            <span style={{ color: '#111827' }}>TypeScript, JavaScript, C#, Python, SQL, Bash, C, C++, Java, PHP</span>
            
            <strong style={{ color: '#4b5563' }}>Databases & Arch:</strong>
            <span style={{ color: '#111827' }}>RESTful API Design, SQL Server, PostgreSQL, MongoDB, MySQL, System Architecture</span>
            
            <strong style={{ color: '#4b5563' }}>Testing & Tooling:</strong>
            <span style={{ color: '#111827' }}>Playwright, Git, Linux (Ubuntu), Bash Scripting, Docker/Deployment Workflows</span>
            
            <strong style={{ color: '#4b5563' }}>Protocols & Integ:</strong>
            <span style={{ color: '#111827' }}>Stripe API, CDN Integrations, SNMP, Modbus, HTTP</span>
          </div>
        </div>

        {/* Experience */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Work Experience</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>Lead Software Engineer - LM Tech Solutions</h3>
              <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>Nov 2025 – Present</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#6b7280', fontStyle: 'italic' }}>Cairo, Egypt</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li><strong>Engineered Unified Polling Service:</strong> Built a fault-tolerant backend service in C# and ASP.NET to handle concurrent device communication and real-time data ingestion across Modbus, HTTP, and SNMP protocols.</li>
              <li><strong>Architected RMS 3.0 Enterprise IoT Platform:</strong> Led end-to-end backend and system development of the Remote Monitoring System (RMS 3.0), an industrial IoT platform with a scalable architecture.</li>
              <li><strong>Led Production Enterprise Deployments:</strong> Overseeing backend testing and production rollout of RMS 3.0 for major national clients including the MOI and GASCO.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>Freelance Full Stack Developer - Media Gate Company</h3>
              <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>Aug 2025 – Oct 2025</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#6b7280', fontStyle: 'italic' }}>Cairo, Egypt</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li><strong>Engineered Payment Workflows:</strong> Integrated the Stripe API to process subscription payments for bagijob.com, and built an admin dashboard backend.</li>
              <li><strong>Optimized Media Delivery:</strong> Accelerated video upload speeds and delivery by integrating Bunny CDN at the backend layer.</li>
            </ul>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>Software Engineering Trainee - ALX Africa</h3>
              <span style={{ color: '#4b5563', fontSize: '0.9rem' }}>Oct 2023 – Jul 2025</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li>Completed a 15-month intensive full-stack development and systems engineering program.</li>
              <li>Designed RESTful APIs using Node.js, Express.js, and MongoDB.</li>
              <li>Built and deployed 30+ production-style projects using Python, C, JavaScript, and SQL.</li>
            </ul>
          </div>
        </div>

        {/* Projects */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Projects</h2>
          
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#111827' }}>Tech-Road – Workforce Readiness Platform</h3>
            <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#6b7280', fontStyle: 'italic' }}>Backend Development, System Architecture, Node.js, REST API</p>
            <p style={{ margin: 0, color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>Served as Backend Developer and Team Leader. Built scalable endpoints bridging academic learning with real-world workforce requirements.</p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#111827' }}>Secure Real-Time Chat System</h3>
            <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#6b7280', fontStyle: 'italic' }}>Python, TCP Sockets, AES-256 Encryption, Multi-threading</p>
            <p style={{ margin: 0, color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>Developed a real-time encrypted messaging system using TCP sockets with multi-user support and AES-256 encryption.</p>
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
