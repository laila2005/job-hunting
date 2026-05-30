require('dotenv').config();
const { findNetworkingContacts } = require('./linkedinScraper');

async function run() {
  console.log("Triggering the Networking Bot...");
  await findNetworkingContacts('job-2', 'Paymob');
  console.log("Done!");
}

run();
