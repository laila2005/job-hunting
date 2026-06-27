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
    label: 'PIPELINE', color: '#3B82F6',
    items: [
      { id: 'telemetry',   label: 'Telemetry' },
      { id: 'fulltime',    label: 'Full-Time' },
      { id: 'parttime',    label: 'Part-Time' },
      { id: 'internships', label: 'Internships' },
      { id: 'radar',       label: 'Global Radar' },
    ],
  },
  {
    label: 'AI TOOLS', color: '#8B5CF6',
    items: [
      { id: 'commander',   label: 'AI Commander' },
      { id: 'coverletter', label: 'Cover Letter' },
      { id: 'company',     label: 'Company Intel' },
      { id: 'skillgap',    label: 'Skill Gap' },
      { id: 'negotiate',   label: 'Negotiate' },
      { id: 'coach',       label: 'Interview Coach' },
      { id: 'weekly',      label: 'Weekly Brief' },
    ],
  },
  {
    label: 'CAREER', color: '#10B981',
    items: [
      { id: 'interview',  label: 'Mock Interview' },
      { id: 'tracker',    label: 'App Tracker' },
      { id: 'dreamboard', label: 'Dream Board' },
      { id: 'salary',     label: 'Salary Intel' },
      { id: 'strategy',   label: 'Career Strategy' },
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

    // ── Default: Telemetry ──
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <DaemonHealthBanner supabase={supabase} />
        <DailyBriefing supabase={supabase} jobs={jobs} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <LiveTelemetry />
          <ActionCenter jobs={jobs} />
        </div>
        <StatCards jobs={jobs} />
        <NetworkingCRM supabase={supabase} />
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: '#080b1a', borderRight: '1px solid rgba(255,255,255,0.06)',
        position: 'fixed', top: 0, left: 0, height: '100vh', overflowY: 'auto', zIndex: 100,
        padding: '0 0 20px',
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '0.01em', lineHeight: 1.3 }}>
            Job Search
            <div style={{ color: 'var(--accent-blue)', fontWeight: '800' }}>Command Center</div>
          </div>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isLoading ? '#f59e0b' : '#10B981', display: 'inline-block', flexShrink: 0, boxShadow: isLoading ? 'none' : '0 0 4px #10B981' }}></span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '500' }}>{isLoading ? 'Syncing...' : 'Live'}</span>
          </div>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, padding: '10px 8px 0' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: '18px' }}>
              <div style={{
                fontSize: '0.58rem', fontWeight: '700', letterSpacing: '0.12em',
                padding: '0 10px', marginBottom: '3px',
                color: group.color, opacity: 0.7,
              }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const active = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '7px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    background: active ? `${group.color}18` : 'transparent',
                    color: active ? group.color : 'var(--text-muted)',
                    fontWeight: active ? '600' : '400', fontSize: '0.8rem',
                    textAlign: 'left', transition: 'background 0.12s, color 0.12s',
                    borderLeft: `2px solid ${active ? group.color : 'transparent'}`,
                    marginBottom: '1px',
                  }}>
                    <span style={{
                      width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                      background: active ? group.color : 'rgba(255,255,255,0.15)',
                      transition: 'background 0.12s',
                    }} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Add job button */}
        <div style={{ padding: '0 8px' }}>
          <button onClick={() => setShowAddModal(true)} style={{
            width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.3)',
            background: 'rgba(59,130,246,0.08)', color: 'var(--accent-blue)', cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> Manual Add
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ marginLeft: '200px', flex: 1, minWidth: 0, padding: '24px 28px', maxWidth: 'calc(100vw - 200px)' }}>
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
