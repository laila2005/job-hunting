import React from 'react';

const ResumeViewer = ({ onClose }) => {
  return (
    <div className="resume-viewer-overlay" onClick={onClose}>
      
      {/* Resume Container */}
      <div className="resume-paper" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="resume-close-btn">&times;</button>

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
            <a href="https://linkedin.com/in/laila-mohamed23" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>LinkedIn</a>
            <span>|</span>
            <a href="https://github.com/laila2005" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>GitHub</a>
            <span>|</span>
            <a href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>Portfolio</a>
          </div>
        </div>

        {/* Professional Summary */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Professional Summary</h2>
          <p style={{ lineHeight: '1.6', fontSize: '0.95rem', color: '#374151', margin: 0 }}>
            Full Stack Developer and Software Engineer currently in Year 3 of a Computer Science degree, with production experience most candidates do not reach until years into their careers. Built and deployed enterprise IoT systems serving the Ministry of Interior (MOI) and the Egyptian Natural Gas Holding Company (GASCO), trained deep learning models for real-world emergency response, and shipped full-stack web applications for paying clients – all while studying. Proficient in C#, ASP.NET, Python, React.js, and REST API design across the full software development lifecycle (SDLC). Actively seeking a software engineering internship where I can contribute immediately and keep growing fast.
          </p>
        </div>

        {/* Technical Skills */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Technical Skills</h2>
          <div className="resume-skills-grid">
            <strong className="skill-label">Languages:</strong>
            <span className="skill-value">C#, C, C++, Python, Java, JavaScript, SQL, Bash</span>
            
            <strong className="skill-label">Backend:</strong>
            <span className="skill-value">ASP.NET, Node.js, Express.js, RESTful API Design, Custom Windows Services</span>
            
            <strong className="skill-label">Frontend:</strong>
            <span className="skill-value">React.js, Next.js, Tailwind CSS, HTML5, CSS3, JavaScript</span>
            
            <strong className="skill-label">AI & Machine Learning:</strong>
            <span className="skill-value">TensorFlow, Keras, CNN, Transfer Learning, MobileNetV2, Grad-CAM, Computer Vision</span>
            
            <strong className="skill-label">IoT & Protocols:</strong>
            <span className="skill-value">SNMP, Modbus, HTTP, Hardware Integration, Industrial Device Communication</span>

            <strong className="skill-label">Databases:</strong>
            <span className="skill-value">SQL Server, PostgreSQL, MySQL, MongoDB</span>

            <strong className="skill-label">Tools & Practices:</strong>
            <span className="skill-value">Git, MSBuild, Linux (Ubuntu), Bash Scripting, Agile, Scrum, SDLC</span>
          </div>
        </div>

        {/* Experience */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Work Experience</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div className="resume-section-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>Lead Software Engineer</h3>
              <span className="resume-date">Nov 2025 – Present</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#4b5563', fontStyle: 'italic' }}>LM Tech Solutions | Cairo, Egypt</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '6px' }}><strong>Architected RMS 3.0 Enterprise IoT Platform:</strong> Led end-to-end software development of the Remote Monitoring System (RMS 3.0), an industrial IoT platform for critical power infrastructure including rectifiers, solar systems, inverters, and rectiverters.</li>
              <li style={{ marginBottom: '6px' }}><strong>Engineered Unified Polling Service:</strong> Built a fault-tolerant backend service in C# and ASP.NET using MSBuild to handle concurrent device communication and real-time data ingestion across Modbus, HTTP, and SNMP protocols.</li>
              <li style={{ marginBottom: '6px' }}><strong>Led Production Enterprise Deployments:</strong> Overseeing testing and production rollout of RMS 3.0 for major national clients including the MOI and GASCO, enhancing SQL Server database architecture to meet strict enterprise specifications.</li>
              <li style={{ marginBottom: '6px' }}><strong>Developed Real-Time Operational Dashboards:</strong> Built a scalable full-stack frontend using React.js and Tailwind CSS to visualize live power metrics, providing NOC teams with visual alerts and performance tracking.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div className="resume-section-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>Freelance Full Stack Developer</h3>
              <span className="resume-date">August 2025 – Oct 2025</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#4b5563', fontStyle: 'italic' }}>Media Gate Company | Cairo, Egypt</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '6px' }}><strong>Engineered Payment and Admin Workflows:</strong> Integrated the Stripe API to process subscription payments for bagijob.com, and built a comprehensive admin dashboard with automated revenue calculations and real-time approval notifications.</li>
              <li style={{ marginBottom: '6px' }}><strong>Optimized Media Delivery Performance:</strong> Accelerated video upload speeds and delivery by integrating Bunny CDN, and improved frontend performance through custom scroll-aware video autoplay and pause functionality.</li>
              <li style={{ marginBottom: '6px' }}><strong>Resolved Complex State Management Issues:</strong> Fixed persistent dark mode preferences across sessions, standardized responsive ad card layouts, and built dynamic redirect flows for mobile and desktop payment outcomes.</li>
            </ul>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div className="resume-section-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>Software Engineering Trainee</h3>
              <span className="resume-date">Oct 2023 – Jul 2025</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#4b5563', fontStyle: 'italic' }}>ALX Africa | Remote</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '4px' }}>Completed a 15-month intensive full-stack development and systems engineering program covering the complete software development lifecycle.</li>
              <li style={{ marginBottom: '4px' }}>Built and deployed 30+ production-style projects using Python, C, JavaScript, and SQL with version control via Git.</li>
              <li style={{ marginBottom: '4px' }}>Designed RESTful APIs and full-stack web applications using React.js, Node.js, Express.js, and MongoDB.</li>
              <li style={{ marginBottom: '4px' }}>Worked extensively in Linux environments using Bash scripting and Agile and Scrum workflows.</li>
            </ul>
          </div>
        </div>

        {/* Projects */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Projects</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div className="resume-section-header" style={{ marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827' }}>Inqaz-app – Egypt Emergency AI Response System</h3>
              <span className="resume-date">Jan 2026</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#6b7280', fontStyle: 'italic' }}>Full-Stack AI Platform – Python, Computer Vision, REST API, Web Frontend</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '4px' }}>Architected an end-to-end emergency response platform using computer vision to detect accidents and disasters from live mobile camera footage, classify scene severity, and automatically dispatch emergency services in real time.</li>
              <li style={{ marginBottom: '4px' }}>Designed and built a full-stack web interface for live camera ingestion, AI-powered incident triage, and GPS-coordinated automated dispatch alerts to MOI emergency line (122) and Ambulance services (123).</li>
              <li style={{ marginBottom: '4px' }}>Led all system architecture decisions across the computer vision pipeline, backend REST API, and frontend dispatch dashboard.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div className="resume-section-header" style={{ marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827' }}>Crash Detection and Classification Model</h3>
              <span className="resume-date">Dec 2025</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#6b7280', fontStyle: 'italic' }}>Deep Learning, CNN, Transfer Learning, Grad-CAM, Python, Streamlit</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '4px' }}>Trained two deep learning models on 3,000 real-world traffic images: a custom CNN built from scratch, and a MobileNetV2 transfer learning model achieving 68% F1-score on entirely unseen test data.</li>
              <li style={{ marginBottom: '4px' }}>Applied Grad-CAM explainability to generate thermal heatmaps identifying exact regions of vehicle structural damage detected by the model, making AI decisions interpretable for emergency operators.</li>
              <li style={{ marginBottom: '4px' }}>Deployed a production-ready web application on Streamlit Community Cloud with live camera ingestion, real-time classification, and simulated emergency dispatch.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div className="resume-section-header" style={{ marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827' }}>Secure Real-Time Chat System</h3>
              <span className="resume-date">Dec 2025</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#6b7280', fontStyle: 'italic' }}>Python, TCP Sockets, AES-256 Encryption, Multi-threading</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '4px' }}>Developed a real-time encrypted messaging system using TCP sockets with multi-user support and a multi-threaded server architecture.</li>
              <li style={{ marginBottom: '4px' }}>Implemented AES-256 encryption for end-to-end message security and SHA-256 hashing for user authentication with persistent data storage.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div className="resume-section-header" style={{ marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827' }}>Tech-Road – Workforce Readiness Platform</h3>
              <span className="resume-date">August 2025</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#6b7280', fontStyle: 'italic' }}>Full-Stack Web Development, System Architecture, REST API</p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '4px' }}>Built a full-stack web platform bridging academic learning with real-world workforce requirements, developed under competition conditions.</li>
              <li style={{ marginBottom: '4px' }}>Served as Team Leader and Backend Developer, responsible for overall system architecture, REST API design, and backend implementation.</li>
            </ul>
          </div>
        </div>

        {/* Education */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Education</h2>
          <div className="resume-section-header">
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827' }}>Bachelor of Science in Computer Science</h3>
            <span className="resume-date">Expected 2027</span>
          </div>
          <p style={{ margin: '4px 0 4px 0', color: '#374151', fontSize: '0.95rem', fontWeight: '500' }}>El Sewedy University of Technology – Polytechnic of Egypt <span style={{ color: '#6b7280', fontWeight: 'normal' }}>(2025 – Present)</span></p>
          <p style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '0.95rem', fontWeight: '500' }}>Egyptian Russian University <span style={{ color: '#6b7280', fontWeight: 'normal' }}>(2023 – 2025, Transferred)</span></p>
          <p style={{ margin: '0', color: '#4b5563', fontSize: '0.95rem' }}><strong>Relevant Coursework:</strong> Data Structures and Algorithms, Operating Systems, Software Engineering, Artificial Intelligence, Object-Oriented Programming</p>
        </div>

        {/* Volunteering & Languages */}
        <div className="resume-footer-grid">
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Volunteering</h2>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#111827' }}>Computality Community – HR Team</h3>
            <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#6b7280', fontStyle: 'italic' }}>Cairo, Egypt | 2023 – 2024</p>
            <p style={{ margin: 0, color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>Conducted interviews, managed records for 60+ members, and organized university technology events.</p>
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Languages</h2>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', fontSize: '0.95rem', lineHeight: '1.6' }}>
              <li><strong>Arabic:</strong> Native</li>
              <li><strong>English:</strong> Fluent</li>
              <li><strong>Turkish:</strong> Proficient</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResumeViewer;
