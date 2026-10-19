import { isDemo } from './supabaseClient';

// Every component reads the owner's name and contact details from here, so none of them can forget to hide them in the
// recruiter demo (?demo=1), where the viewer is a guest and no personal contact details may appear.
const REAL = { name: 'Laila', profile: "Laila's Profile", radar: 'Laila', email: 'laila.mohamed.fikry@gmail.com', phone: '+20 121 021 2792' };
const SAMPLE = { name: 'Guest', profile: 'Sample profile', radar: 'Sample', email: 'hidden in the demo', phone: 'hidden in the demo' };

export const identity = () => (isDemo() ? SAMPLE : REAL);
