import { useState, useEffect, useCallback, useRef } from 'react';
import { drivers2026 } from '../data/drivers2026';

// Message categories for filtering
const MESSAGE_CATEGORIES = {
  ALL: 'all',
  SAFETY: 'safety',
  TIMING: 'timing',
  INCIDENTS: 'incidents',
  WEATHER: 'weather'
};

// Realistic F1 race control message templates
const RACE_CONTROL_MESSAGES = {
  safety: [
    { flag: 'GREEN', message: 'Track Clear - Green Flag', severity: 'info', category: 'safety' },
    { flag: 'YELLOW', message: 'Yellow Flag - Turn {turn}', severity: 'warning', category: 'safety' },
    { flag: 'DOUBLE_YELLOW', message: 'Double Yellow Flag - Turn {turn}', severity: 'warning', category: 'safety' },
    { flag: 'RED', message: 'Red Flag - Session Stopped', severity: 'critical', category: 'safety' },
    { flag: 'SC', message: 'Safety Car Deployed', severity: 'warning', category: 'safety' },
    { flag: 'VSC', message: 'Virtual Safety Car - Maintain Delta', severity: 'warning', category: 'safety' },
    { flag: 'VSC_ENDING', message: 'Virtual Safety Car Ending', severity: 'info', category: 'safety' },
    { flag: 'SC_IN', message: 'Safety Car In This Lap', severity: 'info', category: 'safety' },
  ],
  timing: [
    { flag: 'DRS', message: 'DRS Enabled - All Zones Active', severity: 'info', category: 'timing' },
    { flag: 'DRS_DISABLED', message: 'DRS Disabled - Wet Conditions', severity: 'warning', category: 'timing' },
    { flag: 'BLUE', message: 'Blue Flag - {driver}', severity: 'warning', category: 'timing' },
    { flag: 'CHEQUERED', message: 'Chequered Flag - Session Complete', severity: 'info', category: 'timing' },
  ],
  incidents: [
    { flag: 'INVESTIGATION', message: 'Incident Involving {driver1} and {driver2} Under Investigation', severity: 'warning', category: 'incidents' },
    { flag: 'PENALTY', message: '{driver} - {seconds}s Time Penalty for {reason}', severity: 'critical', category: 'incidents' },
    { flag: 'WARNING', message: '{driver} - Track Limits Warning', severity: 'warning', category: 'incidents' },
    { flag: 'BLACK_WHITE', message: '{driver} - Black and White Flag for Unsportsmanlike Behavior', severity: 'warning', category: 'incidents' },
    { flag: 'RETIRED', message: '{driver} - Car Stopped on Track', severity: 'critical', category: 'incidents' },
  ],
  weather: [
    { flag: 'RAIN', message: 'Rain Expected in {minutes} Minutes', severity: 'warning', category: 'weather' },
    { flag: 'TRACK_WET', message: 'Track Surface Wet - Intermediate Tyres Advised', severity: 'warning', category: 'weather' },
    { flag: 'TRACK_DRYING', message: 'Track Drying - Slick Tyres Possible', severity: 'info', category: 'weather' },
  ]
};

const TEAM_RADIO_TEMPLATES = [
  { message: 'Box this lap for {tyre}', type: 'strategy' },
  { message: 'Push now, we need to cover {driver}', type: 'strategy' },
  { message: 'Tyre temperature looking good, keep managing', type: 'feedback' },
  { message: 'Gap to {driver} ahead is {gap}s', type: 'timing' },
  { message: 'We have {laps} laps to go, fuel saving required', type: 'strategy' },
  { message: 'DRS is enabled, use it when you can', type: 'info' },
  { message: 'Yellow flag in sector {sector}, lift and coast', type: 'safety' },
  { message: 'Safety car deployed, stay behind the delta', type: 'safety' },
];

const RaceControl = () => {
  const [messages, setMessages] = useState([
    { id: 1, time: '00:15:32', flag: 'GREEN', message: 'Race Started - Green Flag', severity: 'info', category: 'safety', expanded: false, persistent: false },
    { id: 2, time: '00:18:45', flag: 'DRS', message: 'DRS Enabled - All Zones Active', severity: 'info', category: 'timing', expanded: false, persistent: false },
    { id: 3, time: '00:22:10', flag: 'BLUE', message: 'Blue Flag - LAW', severity: 'warning', category: 'timing', expanded: false, persistent: false },
  ]);

  const [teamRadio, setTeamRadio] = useState([
    { id: 1, time: '00:23:45', driver: 'VER', team: 'Red Bull Racing', message: 'Tyre temperature looking good', transcript: true, expanded: false },
    { id: 2, time: '00:25:12', driver: 'NOR', team: 'McLaren', message: 'Box this lap for mediums', transcript: true, expanded: false },
    { id: 3, time: '00:26:33', driver: 'HAM', team: 'Ferrari', message: 'Gap to Leclerc is 2.5 seconds', transcript: true, expanded: false },
  ]);

  const [filter, setFilter] = useState(MESSAGE_CATEGORIES.ALL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const intervalRef = useRef(null);
  const messageIdRef = useRef(4);

  // Generate random message with variables
  const generateMessage = useCallback(() => {
    const categories = Object.keys(RACE_CONTROL_MESSAGES);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const categoryMessages = RACE_CONTROL_MESSAGES[randomCategory];
    const template = categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
    
    let message = template.message;
    const drivers = drivers2026.map(d => d.code);
    const turns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const tyres = ['softs', 'mediums', 'hards', 'intermediates'];
    const reasons = ['causing a collision', 'track limits', 'unsafe release', 'impeding'];
    
    // Replace placeholders
    message = message.replace('{turn}', turns[Math.floor(Math.random() * turns.length)]);
    message = message.replace('{driver}', drivers[Math.floor(Math.random() * drivers.length)]);
    message = message.replace('{driver1}', drivers[Math.floor(Math.random() * drivers.length)]);
    message = message.replace('{driver2}', drivers[Math.floor(Math.random() * drivers.length)]);
    message = message.replace('{seconds}', [5, 10, 15, 20][Math.floor(Math.random() * 4)]);
    message = message.replace('{reason}', reasons[Math.floor(Math.random() * reasons.length)]);
    message = message.replace('{minutes}', [5, 10, 15][Math.floor(Math.random() * 3)]);
    
    return {
      ...template,
      id: messageIdRef.current++,
      message,
      expanded: false,
      persistent: template.severity === 'critical'
    };
  }, []);

  // Generate team radio message
  const generateTeamRadio = useCallback(() => {
    const template = TEAM_RADIO_TEMPLATES[Math.floor(Math.random() * TEAM_RADIO_TEMPLATES.length)];
    const drivers = drivers2026;
    const driver = drivers[Math.floor(Math.random() * drivers.length)];
    
    let message = template.message;
    message = message.replace('{tyre}', ['softs', 'mediums', 'hards'][Math.floor(Math.random() * 3)]);
    message = message.replace('{driver}', drivers[Math.floor(Math.random() * drivers.length)]?.code || 'VER');
    message = message.replace('{gap}', (Math.random() * 5 + 0.5).toFixed(1));
    message = message.replace('{laps}', Math.floor(Math.random() * 20 + 5));
    message = message.replace('{sector}', [1, 2, 3][Math.floor(Math.random() * 3)]);
    
    return {
      id: Date.now(),
      time: formatTime(sessionTime),
      driver: driver.code,
      team: driver.teamName,
      message,
      transcript: true,
      expanded: false,
      type: template.type
    };
  }, [sessionTime]);

  // Format time from session seconds
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Fetch race control data from backend
  const fetchRaceControlData = useCallback(async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('http://https://f1-track-ai-production.up.railway.app/api/race-control', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages && data.messages.length > 0) {
          setMessages(prev => {
            // Only add new messages from API if they're different
            const existingIds = new Set(prev.map(m => m.message));
            const newMessages = data.messages
              .filter(msg => !existingIds.has(msg.message))
              .map(msg => ({
                ...msg,
                id: messageIdRef.current++,
                expanded: false,
                persistent: msg.severity === 'critical'
              }));
            return [...newMessages, ...prev].slice(0, 20);
          });
        }
        setError(null);
      } else if (response.status === 404) {
        // API endpoint not found - silently use simulated data
        console.log('Race control API not available - using simulated data');
        setError(null);
      } else {
        console.warn('Race control API error:', response.status);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Race control fetch timeout - using simulated data');
      } else {
        console.log('Race control fetch failed - using simulated data');
      }
      // Don't show error to user - just use simulated data silently
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchRaceControlData();

    // Session timer
    const sessionInterval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    // Race control message simulation (variable interval for realism)
    const scheduleNextMessage = () => {
      const delay = Math.random() * 20000 + 10000; // 10-30 seconds
      intervalRef.current = setTimeout(() => {
        const newMessage = generateMessage();
        setMessages(prev => {
          const filtered = prev.filter(m => !m.persistent || m.id > messageIdRef.current - 10);
          return [{ ...newMessage, time: formatTime(sessionTime) }, ...filtered].slice(0, 20);
        });
        scheduleNextMessage();
      }, delay);
    };
    scheduleNextMessage();

    // Team radio simulation
    const radioInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        const newRadio = generateTeamRadio();
        setTeamRadio(prev => [newRadio, ...prev].slice(0, 15));
      }
    }, 12000);

    return () => {
      clearInterval(sessionInterval);
      clearInterval(radioInterval);
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [fetchRaceControlData, generateMessage, generateTeamRadio, sessionTime]);

  // Toggle message expansion
  const toggleMessageExpand = (id) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, expanded: !msg.expanded } : msg
    ));
  };

  // Toggle radio expansion
  const toggleRadioExpand = (id) => {
    setTeamRadio(prev => prev.map(radio => 
      radio.id === id ? { ...radio, expanded: !radio.expanded } : radio
    ));
  };

  // Filter messages
  const filteredMessages = filter === MESSAGE_CATEGORIES.ALL 
    ? messages 
    : messages.filter(m => m.category === filter);

  const getFlagColor = (flag, severity) => {
    const colors = {
      GREEN: '#10b981',
      YELLOW: '#f59e0b',
      DOUBLE_YELLOW: '#f59e0b',
      RED: '#ef4444',
      BLUE: '#3b82f6',
      DRS: '#8b5cf6',
      DRS_DISABLED: '#6b7280',
      CHEQUERED: '#000000',
      SC: '#f59e0b',
      VSC: '#f59e0b',
      VSC_ENDING: '#10b981',
      SC_IN: '#10b981',
      INVESTIGATION: '#f97316',
      PENALTY: '#ef4444',
      WARNING: '#f59e0b',
      BLACK_WHITE: '#1f2937',
      RETIRED: '#dc2626',
      RAIN: '#60a5fa',
      TRACK_WET: '#3b82f6',
      TRACK_DRYING: '#10b981'
    };
    return colors[flag] || '#6b7280';
  };

  const getFlagIcon = (flag) => {
    const icons = {
      GREEN: '🟢',
      YELLOW: '🟡',
      DOUBLE_YELLOW: '🟨',
      RED: '🔴',
      BLUE: '🔵',
      DRS: '⚡',
      DRS_DISABLED: '🚫',
      CHEQUERED: '🏁',
      SC: '🚗',
      VSC: '⏱️',
      VSC_ENDING: '✅',
      SC_IN: '🏁',
      INVESTIGATION: '🔍',
      PENALTY: '⏱️',
      WARNING: '⚠️',
      BLACK_WHITE: '🏴',
      RETIRED: '💥',
      RAIN: '🌧️',
      TRACK_WET: '💧',
      TRACK_DRYING: '🌤️'
    };
    return icons[flag] || '📋';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      safety: 'Safety',
      timing: 'Timing',
      incidents: 'Incidents',
      weather: 'Weather'
    };
    return labels[category] || 'General';
  };

  const getSeverityStyle = (severity) => {
    switch(severity) {
      case 'critical':
        return { 
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
          borderColor: '#ef4444',
          animation: 'pulse 2s infinite'
        };
      case 'warning':
        return { 
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
          borderColor: '#f59e0b'
        };
      default:
        return { 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
          borderColor: '#10b981'
        };
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'column' }}>
      {/* Race Control Messages - Enhanced Theme */}
      <div className="card" style={{ 
        background: 'linear-gradient(145deg, #1a1a1a, #0d0d0d)',
        border: '1px solid #2a2a2a',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <div className="card-header" style={{ 
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(145deg, #252525, #1a1a1a)'
        }}>
          <div>
            <div className="card-title" style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🏁 Race Control
              {loading && <span style={{ fontSize: '0.75rem', color: '#888' }}>⟳</span>}
            </div>
            <div className="card-subtitle" style={{ fontSize: '0.875rem', color: '#888', marginTop: '0.25rem' }}>
              Live flag status and track information
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {Object.entries(MESSAGE_CATEGORIES).map(([key, value]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: filter === value ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : '#2a2a2a',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    color: filter === value ? '#fff' : '#888',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textTransform: 'capitalize'
                  }}
                  onMouseEnter={(e) => {
                    if (filter !== value) e.currentTarget.style.background = '#3a3a3a';
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== value) e.currentTarget.style.background = '#2a2a2a';
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
            <div style={{ 
              padding: '0.4rem 0.8rem', 
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '700',
              color: '#fbbf24',
              boxShadow: '0 0 15px rgba(220, 38, 38, 0.5)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              ● LIVE
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div className="card-body" style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
          {filteredMessages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: '#666',
              fontSize: '0.875rem'
            }}>
              No messages in this category
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredMessages.map((msg) => {
                const severityStyle = getSeverityStyle(msg.severity);
                const flagColor = getFlagColor(msg.flag, msg.severity);
                
                return (
                  <div 
                    key={msg.id}
                    onClick={() => toggleMessageExpand(msg.id)}
                    style={{ 
                      display: 'flex', 
                      alignItems: msg.expanded ? 'flex-start' : 'center', 
                      gap: '1rem',
                      padding: '0.875rem 1rem',
                      background: severityStyle.background,
                      borderRadius: '10px',
                      border: `2px solid ${severityStyle.borderColor}`,
                      borderLeft: `5px solid ${flagColor}`,
                      boxShadow: `0 0 20px ${flagColor}20`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(5px)';
                      e.currentTarget.style.boxShadow = `0 0 30px ${flagColor}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = `0 0 20px ${flagColor}20`;
                    }}
                  >
                    {/* Persistent indicator */}
                    {msg.persistent && (
                      <div style={{
                        position: 'absolute',
                        top: '0.25rem',
                        right: '0.25rem',
                        width: '6px',
                        height: '6px',
                        background: '#ef4444',
                        borderRadius: '50%',
                        animation: 'pulse 1.5s infinite'
                      }} />
                    )}
                    
                    <div style={{ 
                      fontSize: '1.75rem',
                      filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))'
                    }}>
                      {getFlagIcon(msg.flag)}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: '600', 
                        color: '#fff',
                        lineHeight: '1.4'
                      }}>
                        {msg.message}
                      </div>
                      
                      {/* Expanded details */}
                      {msg.expanded && (
                        <div style={{
                          marginTop: '0.75rem',
                          paddingTop: '0.75rem',
                          borderTop: `1px solid ${flagColor}30`,
                          fontSize: '0.8rem',
                          color: '#aaa'
                        }}>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <span>Category: <strong style={{ color: '#fff' }}>{getCategoryLabel(msg.category)}</strong></span>
                            <span>Severity: <strong style={{ color: flagColor }}>{msg.severity.toUpperCase()}</strong></span>
                            {msg.persistent && <span style={{ color: '#ef4444' }}>🔔 Important</span>}
                          </div>
                        </div>
                      )}
                      
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#666', 
                        marginTop: '0.375rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>🕐</span>
                        {msg.time}
                        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#555' }}>
                          {msg.expanded ? '▼ Click to collapse' : '▶ Click to expand'}
                        </span>
                      </div>
                    </div>
                    
                    <div 
                      style={{ 
                        padding: '0.5rem 1rem',
                        background: `linear-gradient(135deg, ${flagColor}, ${flagColor}DD)`,
                        color: msg.flag === 'YELLOW' || msg.flag === 'DRS' || msg.flag === 'SC' || msg.flag === 'VSC' ? '#000' : '#fff',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        boxShadow: `0 0 15px ${flagColor}50`,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {msg.flag}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Team Radio - Enhanced Theme */}
      <div className="card" style={{ 
        background: 'linear-gradient(145deg, #1a1a1a, #0d0d0d)',
        border: '1px solid #2a2a2a',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <div className="card-header" style={{ 
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(145deg, #252525, #1a1a1a)'
        }}>
          <div>
            <div className="card-title" style={{ 
              fontSize: '1.25rem', 
              fontWeight: '700',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📻 Team Radio
            </div>
            <div className="card-subtitle" style={{ fontSize: '0.875rem', color: '#888', marginTop: '0.25rem' }}>
              Driver and team communications
            </div>
          </div>
          <div style={{
            padding: '0.4rem 0.8rem',
            background: '#2a2a2a',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: '#888'
          }}>
            {teamRadio.length} messages
          </div>
        </div>
        <div className="card-body" style={{ padding: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {teamRadio.map((radio) => (
              <div 
                key={radio.id}
                onClick={() => toggleRadioExpand(radio.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: radio.expanded ? 'flex-start' : 'center', 
                  gap: '1rem',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(153, 27, 27, 0.05))',
                  borderRadius: '12px',
                  border: '2px solid rgba(220, 38, 38, 0.3)',
                  boxShadow: '0 0 20px rgba(220, 38, 38, 0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.6)';
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(220, 38, 38, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.3)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(220, 38, 38, 0.1)';
                }}
              >
                <div style={{ 
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  color: '#fbbf24',
                  boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)',
                  border: '2px solid #fbbf24',
                  flexShrink: 0
                }}>
                  {radio.driver}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    marginBottom: '0.375rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>
                      {radio.driver}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#888',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      {radio.team}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginLeft: 'auto' }}>
                      🕐 {radio.time}
                    </div>
                  </div>
                  
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#ddd', 
                    fontStyle: 'italic',
                    lineHeight: '1.5',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #dc2626'
                  }}>
                    "{radio.message}"
                  </div>
                  
                  {/* Expanded details */}
                  {radio.expanded && (
                    <div style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(220, 38, 38, 0.2)'
                    }}>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#888',
                        display: 'flex',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}>
                        <span>Type: <strong style={{ color: '#fff' }}>{radio.type || 'General'}</strong></span>
                        {radio.transcript && (
                          <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            📻 Full Transcript Available
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {!radio.expanded && radio.transcript && (
                    <div style={{ 
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}>
                      <span>📻</span> Transcript Available
                      <span style={{ marginLeft: 'auto', color: '#555', fontSize: '0.7rem' }}>
                        ▶ Click to expand
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default RaceControl;
