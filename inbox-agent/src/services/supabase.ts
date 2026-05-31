import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Classification } from './classifier';

export class DatabaseService {
  private supabase: SupabaseClient;

  constructor(url: string, key: string) {
    this.supabase = createClient(url, key);
  }

  async updateApplicationFromEmail(companyName: string, classification: Classification): Promise<boolean> {
    // 1. Fuzzy match active jobs. In a real scenario we'd use pg_trgm, but ilike is good for simple matches.
    const { data: jobs, error } = await this.supabase
      .from('jobs')
      .select('*')
      .ilike('company', `%${companyName}%`)
      .not('status', 'in', '("Rejected", "Offer")')
      .limit(1);

    if (error || !jobs || jobs.length === 0) {
      // Job not found or already closed
      return false;
    }
    
    const job = jobs[0];

    // 2. State Machine Logic
    let newStatus = job.status;
    if (classification.status === 'REJECTED') newStatus = 'Rejected';
    if (classification.status === 'INTERVIEW') newStatus = 'Interviewing';
    if (classification.status === 'ASSESSMENT') newStatus = 'Needs Input';
    
    // Skip unnecessary updates to maintain idempotency
    if (newStatus === job.status) return false;

    // 3. Update DB
    const { error: updateError } = await this.supabase
      .from('jobs')
      .update({
        status: newStatus,
        status_reason: classification.summary,
        last_status_update_at: new Date().toISOString()
      })
      .eq('id', job.id);

    if (updateError) {
      console.error("DB Update Error:", updateError);
      return false;
    }

    return true; // Status was changed
  }
}
