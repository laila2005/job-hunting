import { useEffect, useRef } from 'react';

const PLATINUM_THRESHOLD = 80;

const NotificationManager = ({ supabase }) => {
  const permissionRef = useRef(Notification.permission);

  useEffect(() => {
    if (!('Notification' in window)) return;

    // Request permission once on mount
    if (permissionRef.current === 'default') {
      Notification.requestPermission().then(p => { permissionRef.current = p; });
    }

    // Subscribe to new jobs
    const channel = supabase
      .channel('notification-manager-jobs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' }, (payload) => {
        const job = payload.new;
        if (!job) return;
        const score = job.atsMatch || job.aqs_score || job.fitScore || 0;
        if (score < PLATINUM_THRESHOLD) return;
        if (permissionRef.current !== 'granted') return;

        new Notification('🔥 Platinum Job Found!', {
          body: `${job.title || 'Software Engineer'} at ${job.company || job.companySummary || 'Unknown'} — ATS ${score}%`,
          icon: '/favicon.ico',
          tag: `job-${job.id}`,
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [supabase]);

  return null; // invisible component
};

export default NotificationManager;
