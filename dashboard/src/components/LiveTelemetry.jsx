import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wpxtstbquvbsiqgoqwma.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IwP7F-cxFhXEMwZCDOuyuw_-V33gBSh';
const supabase = createClient(supabaseUrl, supabaseKey);

const LiveTelemetry = () => {
  const [telemetry, setTelemetry] = useState({ status: 'Connecting...', current_task: 'Initializing...' });
  const [logs, setLogs] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchTelemetry();
    // Poll every 2 seconds (Supabase Realtime doesn't work on this project)
    const interval = setInterval(fetchTelemetry, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (containerRef.current && expanded) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, expanded]);

  const fetchTelemetry = async () => {
    const { data } = await supabase.from('jobs').select('*').eq('id', 'telemetry_bot_status').single();
    if (data) {
      setTelemetry({ status: data.company, current_task: data.title });
      // Parse logs from companySummary
      if (data.companySummary) {
        try {
          const parsed = JSON.parse(data.companySummary);
          if (Array.isArray(parsed)) setLogs(parsed);
        } catch (e) {}
      }
    }
  };

  // Status colors
  let glowColor = '#a78bfa'; // purple
  let statusDot = '#a78bfa';
  let icon = '🤖';
  const s = telemetry.status;
  if (s === 'Sleeping' || s === 'Listening') { glowColor = '#64748b'; statusDot = '#22c55e'; icon = s === 'Sleeping' ? '💤' : '📡'; }
  else if (s === 'Applying') { glowColor = '#22c55e'; statusDot = '#22c55e'; icon = '🚀'; }
  else if (s === 'Error') { glowColor = '#ef4444'; statusDot = '#ef4444'; icon = '❌'; }
  else if (s === 'Connecting...') { glowColor = '#f59e0b'; statusDot = '#f59e0b'; icon = '⏳'; }

  const logLevelColor = (level) => {
    if (level === 'success') return '#22c55e';
    if (level === 'error') return '#ef4444';
    if (level === 'step') return '#a78bfa';
    return '#94a3b8';
  };

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch (e) { return ''; }
  };

  return (
    <div style={{
      background: 'rgba(10, 10, 15, 0.9)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${glowColor}44`,
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: `0 0 30px ${glowColor}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
      marginBottom: '30px',
      transition: 'all 0.4s ease',
    }}>
      {/* Header Bar */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Animated status icon */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: `${glowColor}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px',
          border: `2px solid ${glowColor}88`,
          boxShadow: `0 0 12px ${glowColor}44`,
          animation: s === 'Applying' ? 'pulse 1.5s infinite' : 'none',
          position: 'relative',
        }}>
          {icon}
          {/* Live dot */}
          <div style={{
            position: 'absolute', bottom: '-1px', right: '-1px',
            width: '10px', height: '10px', borderRadius: '50%',
            background: statusDot,
            border: '2px solid rgba(10,10,15,0.9)',
            animation: s === 'Applying' || s === 'Listening' ? 'blink 1s infinite' : 'none',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '600', fontSize: '0.95rem', color: '#e2e8f0' }}>
              Autonomous Engine
            </span>
            <span style={{
              fontSize: '0.7rem', color: glowColor, textTransform: 'uppercase',
              letterSpacing: '1.5px', fontWeight: '700',
              background: `${glowColor}15`, padding: '2px 8px', borderRadius: '4px',
            }}>
              {s}
            </span>
          </div>
          <p style={{
            margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.82rem',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {telemetry.current_task}
          </p>
        </div>

        {/* Expand/collapse indicator + log count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '0.65rem',
            color: '#22c55e',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            padding: '2px 8px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            animation: 'blink 1.5s infinite'
          }}>
            <span style={{ fontSize: '8px' }}>●</span> LIVE
          </span>
          {logs.length > 0 && (
            <span style={{
              fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)',
              padding: '2px 8px', borderRadius: '10px',
            }}>
              {logs.length} logs
            </span>
          )}
          <span style={{
            color: '#64748b', fontSize: '1.2rem',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}>▼</span>
        </div>
      </div>

      {/* Expandable Log Terminal */}
      {expanded && (
        <div 
          ref={containerRef}
          style={{
            maxHeight: '350px',
            overflowY: 'auto',
            padding: '0',
            background: 'rgba(0, 0, 0, 0.4)',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontSize: '0.75rem',
            lineHeight: '1.7',
          }}
        >
          {logs.length === 0 ? (
            <div style={{ padding: '20px', color: '#475569', textAlign: 'center' }}>
              No logs yet. Start the bot to see live activity here.
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{
                padding: '4px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                borderBottom: '1px solid rgba(255,255,255,0.02)',
                background: log.l === 'success' ? 'rgba(34,197,94,0.05)' 
                  : log.l === 'error' ? 'rgba(239,68,68,0.05)' : 'transparent',
                transition: 'background 0.2s ease',
              }}>
                <span style={{ color: '#475569', flexShrink: 0, fontSize: '0.68rem', paddingTop: '2px' }}>
                  {formatTime(log.t)}
                </span>
                <span style={{ flexShrink: 0 }}>{log.e}</span>
                <span style={{ color: logLevelColor(log.l), wordBreak: 'break-word' }}>
                  {log.m}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 12px ${glowColor}44; }
          50% { box-shadow: 0 0 24px ${glowColor}88; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default LiveTelemetry;
