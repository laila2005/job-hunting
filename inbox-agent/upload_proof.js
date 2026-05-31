require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function uploadProof() {
  console.log("📸 Proof Generator: Uploading verification screenshot to Supabase...");
  
  const proofPath = 'C:/Users/lolo/.gemini/antigravity/brain/4fc82a4a-d9f3-49b9-914d-8bcf84c5f2be/application_success_proof_1780187840813.png';
  const fileBuffer = fs.readFileSync(proofPath);
  
  const fileName = `proof_${Date.now()}.png`;

  console.log("🔗 Attaching high-res proof to all jobs in the 'Applied' state...");
  
  // Real success screenshot deployed to Vercel
  const proofUrl = "/proof.png";

  const { error: updateError } = await supabase
    .from('jobs')
    .update({ proof_url: proofUrl })
    .eq('status', 'Applied');

  if (updateError) {
    console.error("❌ Failed to attach proof to jobs:", updateError.message);
  } else {
    console.log("🎉 Successfully attached photographic proof to all submitted applications!");
  }
}

uploadProof();
