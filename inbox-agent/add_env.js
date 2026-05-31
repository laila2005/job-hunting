const fs = require('fs');
fs.appendFileSync('.env', '\nGOOGLE_SHEET_WEBHOOK=https://script.google.com/macros/s/AKfycbzGiyIjovpYxhGzhQI6zcJCU-jgyPI998hiNpXWuBXEMuACPePBnCFyRZ39tX9MSZy7/exec\n');
console.log("Added Webhook to .env");
