import { createClient } from '@supabase/supabase-js';

// One place for the database client. Every component imports `supabase` from here.
// `supabase` is a live binding: the recruiter demo (src/demo) swaps it for an in-memory fake before the app renders,
// so the demo can run the real interface without touching any real database.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wpxtstbquvbsiqgoqwma.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IwP7F-cxFhXEMwZCDOuyuw_-V33gBSh';

const real = createClient(supabaseUrl, supabaseKey);
export let supabase = real;

export const useDemoClient = client => { supabase = client; };
export const isDemo = () => supabase !== real;
