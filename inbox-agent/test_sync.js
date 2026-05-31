require('dotenv').config();
const { syncToGoogleSheet } = require('./sheetsSync');

async function testSync() {
  console.log("Sending a test row to your Google Sheet...");
  await syncToGoogleSheet({
    company: "Google DeepMind (Test)",
    title: "AI Engineer",
    location: "Remote",
    status: "Applied",
    appliedDate: new Date().toISOString().split('T')[0],
    companyLink: "https://deepmind.google/careers"
  });
  console.log("Done! Check your Google Sheet.");
}

testSync();
