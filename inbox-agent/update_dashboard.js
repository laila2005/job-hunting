const fs = require('fs');

let content = fs.readFileSync('index.js', 'utf8');

content = content.replace(/const { data: allJobs } = await supabase\.from\('jobs'\)\.select\('status'\);/g, "const { data: allJobs } = await supabase.from('jobs').select('status, applied_method');");

content = content.replace(/const applied = allJobs \? allJobs\.filter\(j => j\.status === 'Applied'\)\.length : 0;/g, "const applied = allJobs ? allJobs.filter(j => j.status === 'Applied').length : 0;\n          const appliedManual = allJobs ? allJobs.filter(j => j.status === 'Applied' && j.applied_method === 'Manual').length : 0;\n          const appliedAuto = allJobs ? allJobs.filter(j => j.status === 'Applied' && j.applied_method === 'Automatic').length : 0;");

content = content.replace(/Marked as Applied: \*\$\{applied\}\*/g, "Marked as Applied: *${applied}* (Auto: *${appliedAuto}* | Manual: *${appliedManual}*)");

content = content.replace(/Applied: \*\$\{applied\}\*/g, "Applied: *${applied}* (Auto: *${appliedAuto}* | Manual: *${appliedManual}*)");

fs.writeFileSync('index.js', content);
console.log("Updated index.js successfully.");
