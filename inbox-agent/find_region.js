async function run() {
  try {
    const res = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json');
    const data = await res.json();
    const target = '2a05:d014:128e:9501:1d87:aea0:3a52:c216';
    
    // We will parse the ipv6_prefixes and check if the target matches
    // We'll convert IPv6 CIDRs or check which prefix contains the target block
    console.log("Total IPv6 prefixes to check:", data.ipv6_prefixes.length);
    
    // Find prefixes matching 2a05:d014
    const matches = data.ipv6_prefixes.filter(p => p.ipv6_prefix.startsWith('2a05:d014') || target.startsWith(p.ipv6_prefix.split('::')[0]));
    
    console.log("✅ Matches found:");
    console.log(JSON.stringify(matches, null, 2));
  } catch (e) {
    console.error("❌ Error:", e.message);
  }
}

run();
