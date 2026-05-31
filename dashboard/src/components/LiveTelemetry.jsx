import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wpxtstbquvbsiqgoqwma.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IwP7F-cxFhXEMwZCDOuyuw_-V33gBSh';
const supabase = createClient(supabaseUrl, supabaseKey);

const TELEMETRY_ID = '00000000-0000-0000-0000-000000000001';

const LiveTelemetry = () => {
  const [telemetry, setTelemetry] = useState({ status: 'Connecting...', current_task: 'Initializing radar link...' });

  useEffect(() => {
    // 1. Fetch initial state
    fetchTelemetry();

    // 2. Subscribe to realtime changes
    const channel = supabase
      .channel('telemetry_listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs', filter: `id=eq.telemetry_bot_status` },
        (payload) => {
          if (payload.new) {
            setTelemetry({ status: payload.new.company, current_task: payload.new.title });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTelemetry = async () => {
    const { data } = await supabase.from('jobs').select('*').eq('id', 'telemetry_bot_status').single();
    if (data) {
      setTelemetry({ status: data.company, current_task: data.title });
    }
  };

  // Determine glow color based on status
  let glowColor = 'var(--accent-purple)'; // Default
  let icon = '🤖';
  if (telemetry.status === 'Sleeping') { glowColor = 'var(--text-muted)'; icon = '💤'; }
  else if (telemetry.status === 'Applying') { glowColor = 'var(--accent-green)'; icon = '🚀'; }
  else if (telemetry.status === 'Sourcing' || telemetry.status === 'Scraping') { glowColor = 'var(--accent-blue)'; icon = '🔍'; }
  else if (telemetry.status === 'Networking') { glowColor = 'var(--accent-purple)'; icon = '🧊'; }

  return (
    <div style={{
      background: 'rgba(20, 20, 25, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${glowColor}55`,
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      boxShadow: `0 0 20px ${glowColor}22`,
      transition: 'all 0.3s ease',
      marginBottom: '30px'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: `${glowColor}22`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        border: `2px solid ${glowColor}`,
        boxShadow: `0 0 15px ${glowColor}`
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Autonomous Engine
          <span style={{ fontSize: '0.8rem', color: glowColor, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {telemetry.status}
          </span>
        </h3>
        <p style={{ 
          margin: '5px 0 0 0', 
          color: 'var(--text-muted)', 
          fontSize: '0.9rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {telemetry.current_task}
        </p>
      </div>
    </div>
  );
};

export default LiveTelemetry;
