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

  return (
    <div className="container">
      <header className="hero-header">
        <div>
          <h1 className="hero-title">
            Job Search Command Center
            <span className="live-pill">
              <span className="live-indicator-dot"></span>
              {isLoading ? 'Syncing Cloud...' : 'Live Connected'}
            </span>
          </h1>
          <p className="hero-subtitle">Welcome back, Laila. Here is your automated telemetry stream.</p>
        </div>
        <div className="header-actions-row">
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'telemetry' ? 'active' : ''}`}
              onClick={() => setActiveTab('telemetry')}
            >
              📊 Telemetry
            </button>
            <button 
              className={`tab-btn ${activeTab === 'fulltime' ? 'active' : ''}`}
              onClick={() => setActiveTab('fulltime')}
            >
              💼 Full-Time
            </button>
            <button 
              className={`tab-btn ${activeTab === 'parttime' ? 'active' : ''}`}
              onClick={() => setActiveTab('parttime')}
            >
              ⏳ Part-Time
            </button>
            <button 
              className={`tab-btn ${activeTab === 'internships' ? 'active' : ''}`}
              onClick={() => setActiveTab('internships')}
            >
              🎓 Internships
            </button>
            <button 
              className={`tab-btn ${activeTab === 'strategy' ? 'active' : ''}`}
              onClick={() => setActiveTab('strategy')}
            >
              🧠 Career Strategy
            </button>
            <button 
              className={`tab-btn ${activeTab === 'commander' ? 'active' : ''}`}
              onClick={() => setActiveTab('commander')}
            >
              🤖 AI Commander
            </button>
            <button
              className={`tab-btn ${activeTab === 'interview' ? 'active' : ''}`}
              onClick={() => setActiveTab('interview')}
            >
              🎤 Mock Interview
            </button>
            <button
              className={`tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
              onClick={() => setActiveTab('tracker')}
            >
              📋 Tracker
            </button>
            <button
              className={`tab-btn ${activeTab === 'coverletter' ? 'active' : ''}`}
              onClick={() => setActiveTab('coverletter')}
            >
              ✍️ Cover Letter
            </button>
            <button
              className={`tab-btn ${activeTab === 'dreamboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dreamboard')}
            >
              💎 Dream Board
            </button>
            <button
              className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`}
              onClick={() => setActiveTab('company')}
            >
              🏢 Company Intel
            </button>
            <button
              className={`tab-btn ${activeTab === 'skillgap' ? 'active' : ''}`}
              onClick={() => setActiveTab('skillgap')}
            >
              🧠 Skill Gap
            </button>
            <button
              className={`tab-btn ${activeTab === 'salary' ? 'active' : ''}`}
              onClick={() => setActiveTab('salary')}
            >
              💰 Salary
            </button>
          </div>
          <button className="btn btn-gradient" onClick={() => setShowAddModal(true)}>
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Manual Add
          </button>
        </div>
      </header>

      {isLoading && jobs.length === 0 ? (
        <div className="empty-state">
          <h2>Connecting to Cloud Database...</h2>
          <p>Authenticating background agents.</p>
        </div>
      ) : interviewJob ? (
        <InterviewAgent job={interviewJob} onBack={() => setInterviewJob(null)} />
      ) : activeTab === 'interview' ? (
        <InterviewSimulator supabase={supabase} />
      ) : activeTab === 'commander' ? (
        <AiCommander supabase={supabase} />
      ) : activeTab === 'strategy' ? (
        <CareerPartner supabase={supabase} />
      ) : activeTab === 'tracker' ? (
        <ApplicationTracker supabase={supabase} jobs={jobs} />
      ) : activeTab === 'coverletter' ? (
        <CoverLetterGenerator supabase={supabase} jobs={jobs} />
      ) : activeTab === 'dreamboard' ? (
        <DreamBoard supabase={supabase} jobs={jobs} />
      ) : activeTab === 'company' ? (
        <CompanyIntelligence supabase={supabase} jobs={jobs} />
      ) : activeTab === 'skillgap' ? (
        <SkillGapCloser supabase={supabase} jobs={jobs} />
      ) : activeTab === 'salary' ? (
        <SalaryIntelligence jobs={jobs} />
      ) : activeTab === 'fulltime' ? (
        <div className="jobs-section animate-fade-in" style={{ marginTop: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', marginBottom: '25px', borderRadius: '16px' }}>
            <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-blue)', marginBottom: '8px' }}>💼 Full-Time Engineering Jobs</h2>
            <p className="section-subtitle" style={{ color: 'var(--text-secondary)' }}>Direct application streams for full-time software engineering roles.</p>
          </div>
          <JobBoard 
            jobs={jobs.filter(j => 
              // Exclude internships
              !((j.title || '').toLowerCase().includes('intern') || 
                (j.companySummary || '').toLowerCase().includes('intern') || 
                (j.notes || '').toLowerCase().includes('intern')) &&
              // Exclude part-time
              !((j.title || '').toLowerCase().includes('part time') || 
                (j.title || '').toLowerCase().includes('part-time') ||
                (j.companySummary || '').toLowerCase().includes('part time') || 
                (j.companySummary || '').toLowerCase().includes('part-time') ||
                (j.notes || '').toLowerCase().includes('part time') || 
                (j.notes || '').toLowerCase().includes('part-time'))
            )} 
            onApprove={handleApprove} 
            onDecline={handleDecline} 
            onMarkApplied={handleMarkApplied} 
            onStartInterview={setInterviewJob} 
          />
        </div>
      ) : activeTab === 'parttime' ? (
        <div className="jobs-section animate-fade-in" style={{ marginTop: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', marginBottom: '25px', borderRadius: '16px' }}>
            <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-yellow)', marginBottom: '8px' }}>⏳ Part-Time & Contract Jobs</h2>
            <p className="section-subtitle" style={{ color: 'var(--text-secondary)' }}>Part-time or contract software engineering opportunities.</p>
          </div>
          <JobBoard 
            jobs={jobs.filter(j => 
              // Exclude internships
              !((j.title || '').toLowerCase().includes('intern') || 
                (j.companySummary || '').toLowerCase().includes('intern') || 
                (j.notes || '').toLowerCase().includes('intern')) &&
              // Match part-time
              ((j.title || '').toLowerCase().includes('part time') || 
               (j.title || '').toLowerCase().includes('part-time') ||
               (j.companySummary || '').toLowerCase().includes('part time') || 
               (j.companySummary || '').toLowerCase().includes('part-time') ||
               (j.notes || '').toLowerCase().includes('part time') || 
               (j.notes || '').toLowerCase().includes('part-time'))
            )} 
            onApprove={handleApprove} 
            onDecline={handleDecline} 
            onMarkApplied={handleMarkApplied} 
            onStartInterview={setInterviewJob} 
          />
        </div>
      ) : activeTab === 'internships' ? (
        <div className="internships-section animate-fade-in" style={{ marginTop: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', marginBottom: '25px', borderRadius: '16px' }}>
            <h2 className="section-title" style={{ fontSize: '24px', color: 'var(--accent-purple)', marginBottom: '8px' }}>🎓 Student & Senior Internships</h2>
            <p className="section-subtitle" style={{ color: 'var(--text-secondary)' }}>Paid Software Engineering opportunities in Egypt/Cairo tailored for Year 3 CS students.</p>
          </div>
          <JobBoard 
            jobs={jobs.filter(j => 
              (j.title || '').toLowerCase().includes('intern') || 
              (j.companySummary || '').toLowerCase().includes('intern') || 
              (j.notes || '').toLowerCase().includes('intern')
            )} 
            onApprove={handleApprove} 
            onDecline={handleDecline} 
            onMarkApplied={handleMarkApplied} 
            onStartInterview={setInterviewJob} 
          />
        </div>
      ) : (
        <>
          <DaemonHealthBanner supabase={supabase} />
          <DailyBriefing supabase={supabase} jobs={jobs} />
          <LiveTelemetry />
          <ActionCenter jobs={jobs} />
          <StatCards jobs={jobs} />
          <NetworkingCRM supabase={supabase} />
        </>
      )}
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
