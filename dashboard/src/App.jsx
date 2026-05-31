import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import './index.css'
import StatCards from './components/StatCards'
import JobBoard from './components/JobBoard'
import NetworkingBoard from './components/NetworkingBoard'

// Initialize Supabase Client
const supabaseUrl = 'https://wpxtstbquvbsiqgoqwma.supabase.co'
const supabaseAnonKey = 'sb_publishable_IwP7F-cxFhXEMwZCDOuyuw_-V33gBSh'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  const [jobs, setJobs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      setJobs(jobData || []);
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
    setJobs(jobs.map(j => j.id === id ? { ...j, status: 'Applied', appliedDate: new Date().toISOString().split('T')[0], proof_url: '/proof.png' } : j));
    
    // Real Supabase Update
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'Applied', appliedDate: new Date().toISOString().split('T')[0], proof_url: '/proof.png' })
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

  const handleMarkSent = async (id) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, status: 'Sent' } : c));
    await supabase.from('networking_contacts').update({ status: 'Sent' }).eq('id', id);
  };

  return (
    <div className="container">
      <header className="hero-header">
        <div>
          <h1 className="hero-title">
            Job Search Command Center
            {isLoading && <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', fontWeight: '400' }}>(Syncing...)</span>}
          </h1>
          <p className="hero-subtitle">Welcome back, Laila. Here is your automated pipeline.</p>
        </div>
        <button className="btn btn-secondary">+ Manual Add</button>
      </header>

      {isLoading && jobs.length === 0 ? (
        <div className="empty-state">
          <h2>Connecting to Cloud Database...</h2>
          <p>Authenticating background agents.</p>
        </div>
      ) : (
        <>
          <StatCards jobs={jobs} />
          <JobBoard jobs={jobs} onApprove={handleApprove} onDecline={handleDecline} />
          <NetworkingBoard contacts={contacts} onMarkSent={handleMarkSent} />
        </>
      )}
    </div>
  )
}

export default App
