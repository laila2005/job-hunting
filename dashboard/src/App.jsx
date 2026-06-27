import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import './index.css'
import StatCards from './components/StatCards'
import JobBoard from './components/JobBoard'
import NetworkingBoard from './components/NetworkingBoard'
import InterviewAgent from './components/InterviewAgent'
import LiveTelemetry from './components/LiveTelemetry'
import ActionCenter from './components/ActionCenter'
import AiCommander from './components/AiCommander'
import ManualAddModal from './components/ManualAddModal'
import CareerPartner from './components/CareerPartner'
import NetworkingCRM from './components/NetworkingCRM'
import ApplicationTracker from './components/ApplicationTracker'
import CoverLetterGenerator from './components/CoverLetterGenerator'
import DreamBoard from './components/DreamBoard'
import DailyBriefing from './components/DailyBriefing'
import NotificationManager from './components/NotificationManager'
import CompanyIntelligence from './components/CompanyIntelligence'
import SkillGapCloser from './components/SkillGapCloser'
import SalaryIntelligence from './components/SalaryIntelligence'
import DaemonHealthBanner from './components/DaemonHealthBanner'
import InterviewCoach from './components/InterviewCoach'
import GlobalJobRadar from './components/GlobalJobRadar'
import OfferNegotiationAI from './components/OfferNegotiationAI'
import WeeklyBrief from './components/WeeklyBrief'

const NAV_GROUPS = [
  {
    label: 'PIPELINE',
    items: [
      { id: 'telemetry', icon: '📊', label: 'Telemetry' },
      { id: 'fulltime',  icon: '💼', label: 'Full-Time' },
      { id: 'parttime',  icon: '⏳', label: 'Part-Time' },
      { id: 'internships', icon: '🎓', label: 'Internships' },
      { id: 'radar',     icon: '🌍', label: 'Global Radar' },
    ],
  },
  {
    label: 'AI TOOLS',
    items: [
      { id: 'commander',   icon: '🤖', label: 'AI Commander' },
      { id: 'coverletter', icon: '✍️', label: 'Cover Letter' },
      { id: 'company',     icon: '🏢', label: 'Company Intel' },
      { id: 'skillgap',    icon: '🧠', label: 'Skill Gap' },
      { id: 'negotiate',   icon: '🤝', label: 'Negotiate' },
      { id: 'coach',       icon: '🎯', label: 'Interview Coach' },
      { id: 'weekly',      icon: '📱', label: 'Weekly Brief' },
    ],
  },
  {
    label: 'CAREER',
    items: [
      { id: 'interview',  icon: '🎤', label: 'Mock Interview' },
      { id: 'tracker',    icon: '📋', label: 'App Tracker' },
      { id: 'dreamboard', icon: '💎', label: 'Dream Board' },
      { id: 'salary',     icon: '💰', label: 'Salary Intel' },
      { id: 'strategy',   icon: '🔭', label: 'Career Strategy' },
    ],
  },
]

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wpxtstbquvbsiqgoqwma.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IwP7F-cxFhXEMwZCDOuyuw_-V33gBSh'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [jobs, setJobs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interviewJob, setInterviewJob] = useState(null);
  const [activeTab, setActiveTab] = useState('telemetry');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchJobs();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          console.log('Realtime update received:', payload);
          if (payload.eventType === 'INSERT') {
            setJobs(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setJobs(prev => prev.map(job => job.id === payload.new.id ? payload.new : job));
          } else if (payload.eventType === 'DELETE') {
            setJobs(prev => prev.filter(job => job.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    const { data: jobData, error: jobError } = await supabase.from('jobs').select('*');
    if (jobError) {
      console.error('Error fetching jobs:', jobError);
      setJobs([]); 
    } else {
      setJobs((jobData || []).filter(j => j.id !== 'telemetry_bot_status'));
    }

    const { data: contactData, error: contactError } = await supabase.from('networking_contacts').select('*');
    if (contactError) {
      console.error('Error fetching contacts:', contactError);
    } else {
      setContacts(contactData || []);
    }

    setIsLoading(false);
  };

  const handleApprove = async (id) => {
    // Optimistic UI update
    setJobs(jobs.map(j => j.id === id ? { ...j, status: 'Queued for Bot' } : j));
    
    // Trigger Realtime Daemon
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'Queued for Bot' })
      .eq('id', id);
      
    if (error) {
      console.error('Error updating job in Supabase:', error);
      alert('Error updating Supabase database. See console.');
    } else {
      alert("Application successfully submitted and synced with Supabase!");
    }
  };

  const handleDecline = async (id) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, status: 'Rejected' } : j));
    
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'Rejected' })
      .eq('id', id);
      
    if (error) {
      console.error('Error rejecting job in Supabase:', error);
      alert('Error updating Supabase database. See console.');
    } else {
      alert("Job declined and moved to Rejected tab.");
    }
  };

  const handleMarkApplied = async (id) => {
    const today = new Date().toISOString().split('T')[0];
    setJobs(jobs.map(j => j.id === id ? { ...j, status: 'Applied', appliedDate: today } : j));
    
    const { error } = await supabase
      .from('jobs')
      .update({ 
        status: 'Applied', 
        appliedDate: today
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error marking job as applied in Supabase:', error);
      alert('Error updating Supabase database. See console.');
    } else {
      alert("Job successfully marked as Applied!");
    }
  };

  const handleMarkSent = async (id) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, status: 'Sent' } : c));
    await supabase.from('networking_contacts').update({ status: 'Sent' }).eq('id', id);
  };

  const handleCreateJob = async (newJobData) => {
    const manualId = `job-manual-${Date.now()}`;
    const jobRow = {
      id: manualId,
      ...newJobData,
      resumeVersion: 'backend_resume.pdf'
    };

    // Optimistic UI update
    setJobs([jobRow, ...jobs]);
    setShowAddModal(false);

    // Save to Supabase
    const { error } = await supabase
      .from('jobs')
      .insert([jobRow]);

    if (error) {
      console.error('Error inserting manual job in Supabase:', error);
      alert('Error saving job to Supabase. Check console logs.');
      // Revert optimistic update
      setJobs(jobs.filter(j => j.id !== manualId));
    } else {
      alert('Job successfully saved and synced with Supabase!');
    }
  };

  const renderContent = () => {
    if (isLoading && jobs.length === 0) {
      return (
        <div className="empty-state">
          <h2>Connecting to Cloud Database...</h2>
          <p>Authenticating background agents.</p>
        </div>
      );
    }
    if (interviewJob) return <InterviewAgent job={interviewJob} onBack={() => setInterviewJob(null)} />;
    if (activeTab === 'interview')   return <InterviewSimulator supabase={supabase} />;
    if (activeTab === 'commander')   return <AiCommander supabase={supabase} />;
    if (activeTab === 'strategy')    return <CareerPartner supabase={supabase} />;
    if (activeTab === 'tracker')     return <ApplicationTracker supabase={supabase} jobs={jobs} />;
    if (activeTab === 'coverletter') return <CoverLetterGenerator supabase={supabase} jobs={jobs} />;
    if (activeTab === 'dreamboard')  return <DreamBoard supabase={supabase} jobs={jobs} />;
    if (activeTab === 'company')     return <CompanyIntelligence supabase={supabase} jobs={jobs} />;
    if (activeTab === 'skillgap')    return <SkillGapCloser supabase={supabase} jobs={jobs} />;
    if (activeTab === 'salary')      return <SalaryIntelligence jobs={jobs} />;
    if (activeTab === 'coach')       return <InterviewCoach supabase={supabase} />;
    if (activeTab === 'radar')       return <GlobalJobRadar jobs={jobs} onApprove={handleApprove} onDecline={handleDecline} onMarkApplied={handleMarkApplied} />;
    if (activeTab === 'negotiate')   return <OfferNegotiationAI supabase={supabase} />;
    if (activeTab === 'weekly')      return <WeeklyBrief supabase={supabase} jobs={jobs} />;

    const isIntern = j => ['intern','internship'].some(k => (j.title||'').toLowerCase().includes(k)||(j.companySummary||'').toLowerCase().includes(k)||(j.notes||'').toLowerCase().includes(k));
    const isPart   = j => ['part time','part-time'].some(k => (j.title||'').toLowerCase().includes(k)||(j.companySummary||'').toLowerCase().includes(k)||(j.notes||'').toLowerCase().includes(k));

    if (activeTab === 'fulltime') return (
      <div className="jobs-section animate-fade-in" style={{ marginTop: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '25px', borderRadius: '16px' }}>
          <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-blue)', marginBottom: '8px' }}>💼 Full-Time Engineering Jobs</h2>
          <p className="section-subtitle" style={{ color: 'var(--text-secondary)' }}>Direct application streams for full-time software engineering roles.</p>
        </div>
        <JobBoard jobs={jobs.filter(j => !isIntern(j) && !isPart(j))} onApprove={handleApprove} onDecline={handleDecline} onMarkApplied={handleMarkApplied} onStartInterview={setInterviewJob} />
      </div>
    );
    if (activeTab === 'parttime') return (
      <div className="jobs-section animate-fade-in" style={{ marginTop: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '25px', borderRadius: '16px' }}>
          <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-yellow)', marginBottom: '8px' }}>⏳ Part-Time & Contract Jobs</h2>
          <p className="section-subtitle" style={{ color: 'var(--text-secondary)' }}>Part-time or contract software engineering opportunities.</p>
        </div>
        <JobBoard jobs={jobs.filter(j => !isIntern(j) && isPart(j))} onApprove={handleApprove} onDecline={handleDecline} onMarkApplied={handleMarkApplied} onStartInterview={setInterviewJob} />
      </div>
    );
    if (activeTab === 'internships') return (
      <div className="internships-section animate-fade-in" style={{ marginTop: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '25px', borderRadius: '16px' }}>
          <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-purple)', marginBottom: '8px' }}>🎓 Student & Senior Internships</h2>
          <p className="section-subtitle" style={{ color: 'var(--text-secondary)' }}>Paid Software Engineering opportunities in Egypt/Cairo tailored for Year 3 CS students.</p>
        </div>
        <JobBoard jobs={jobs.filter(isIntern)} onApprove={handleApprove} onDecline={handleDecline} onMarkApplied={handleMarkApplied} onStartInterview={setInterviewJob} />
      </div>
    );

    return (
      <>
        <DaemonHealthBanner supabase={supabase} />
        <DailyBriefing supabase={supabase} jobs={jobs} />
        <LiveTelemetry />
        <ActionCenter jobs={jobs} />
        <StatCards jobs={jobs} />
        <NetworkingCRM supabase={supabase} />
      </>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'rgba(12,15,34,0.95)', borderRight: '1px solid var(--border-color)',
        position: 'fixed', top: 0, left: 0, height: '100vh', overflowY: 'auto', zIndex: 100,
        padding: '0 0 24px',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            Job Search<br />
            <span style={{ color: 'var(--accent-blue)' }}>Command Center</span>
          </div>
          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isLoading ? '#f59e0b' : 'var(--accent-green)', display: 'inline-block', flexShrink: 0 }}></span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{isLoading ? 'Syncing...' : 'Live Connected'}</span>
          </div>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '0 8px', marginBottom: '4px' }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const active = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontWeight: active ? '600' : '400', fontSize: '0.82rem',
                    textAlign: 'left', transition: 'all 0.15s ease',
                    borderLeft: active ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  }}>
                    <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Add job button */}
        <div style={{ padding: '0 10px' }}>
          <button className="btn btn-gradient" onClick={() => setShowAddModal(true)} style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', padding: '9px 12px' }}>
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Manual Add
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ marginLeft: '220px', flex: 1, minWidth: 0, padding: '28px 32px', maxWidth: 'calc(100vw - 220px)' }}>
        {renderContent()}
      </main>

      <NotificationManager supabase={supabase} />
      {showAddModal && (
        <ManualAddModal
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreateJob}
        />
      )}
    </div>
  )
}

export default App
