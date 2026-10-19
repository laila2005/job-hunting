import { isDemo } from './supabaseClient';

// The jobs table has no date column, so a job's found-date lives inside its id
// (trk-YYYY-MM-DD-... from the tracker sync, or job-...-<epoch ms> from the old scraper / manual add).
// Jobs found before ARCHIVE_BEFORE are the old scraped listings: they were never applied to by hand, so they are
// archived and left out of every count, whatever status they were stored with.
export const ARCHIVE_BEFORE = '2026-10-16';
// The demo's sample jobs are dated relative to today, so its "old listings" cutoff is relative too (20 days back).
const cutoff = () => (isDemo() ? new Date(Date.now() - 20 * 86400000).toISOString().slice(0, 10) : ARCHIVE_BEFORE);

export const jobDate = job => {
  const id = job.id || '';
  const iso = id.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const ms = id.match(/(\d{13})/);
  if (ms) return new Date(Number(ms[1])).toISOString().slice(0, 10);
  return job.appliedDate || null;
};

export const isLegacy = job => {
  const d = jobDate(job);
  return !d || d < cutoff();
};

export const sectionOf = job => {
  if (isLegacy(job)) return 'Archived';
  const st = (job.status || '').trim().toLowerCase();
  if (['applied', 'test', 'interview', 'offer'].includes(st)) return 'Applied';
  if (st === 'rejected' || st === 'archived') return 'Archived';
  return 'Active';
};
