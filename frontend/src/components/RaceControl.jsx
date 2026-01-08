import { useState, useEffect } from 'react';

const RaceControl = () => {
  const [messages, setMessages] = useState([
    { time: '00:15:32', flag: 'GREEN', message: 'Race Started', severity: 'info' },
    { time: '00:18:45', flag: 'DRS', message: 'DRS Enabled', severity: 'info' },
    { time: '00:22:10', flag: 'BLUE', message: 'Blue Flag - LAW', severity: 'warning' },
  ]);

  const [teamRadio, setTeamRadio] = useState([
    { time: '00:23:45', driver: 'VER', team: 'Red Bull Racing', message: 'Tyre temperature looking good', transcript: true },
    { time: '00:25:12', driver: 'NOR', team: 'McLaren', message: 'Box this lap for mediums', transcript: true },
    { time: '00:26:33', driver: 'HAM', team: 'Ferrari', message: 'Gap to Leclerc is 2.5 seconds', transcript: true },
  ]);

  useEffect(() => {
    // Simulate new race control messages
    const interval = setInterval(() => {
      const newMessages = [
        { flag: 'DRS', message: 'DRS Enabled - All Zones', severity: 'info' },
        { flag: 'YELLOW', message: 'Yellow Flag - Turn 12', severity: 'warning' },
        { flag: 'BLUE', message: `Blue Flag - ${['TSU', 'LAW', 'STR'][Math.floor(Math.random() * 3)]}`, severity: 'warning' },
        { flag: 'GREEN', message: 'Track Clear', severity: 'info' },
      ];
      
      const randomMessage = newMessages[Math.floor(Math.random() * newMessages.length)];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      setMessages(prev => [
        { time: timeStr, ...randomMessage },
        ...prev.slice(0, 9)
      ]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const getFlagColor = (flag) => {
    switch(flag) {
      case 'GREEN': return '#10b981';
      case 'YELLOW': return 'var(--ferrari-yellow)';
      case 'RED': return 'var(--ferrari-red)';
      case 'BLUE': return '#3b82f6';
      case 'DRS': return 'var(--ferrari-yellow)';
      default: return '#6b7280';
    }
  };

  const getFlagIcon = (flag) => {
    switch(flag) {
      case 'GREEN': return '🟢';
      case 'YELLOW': return '🟡';
      case 'RED': return '🔴';
      case 'BLUE': return '🔵';
      case 'DRS': return '⚡';
      default: return '🏁';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'column' }}>
      {/* Race Control Messages - Ferrari Theme */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">🏁 Race Control</div>
            <div className="card-subtitle">Live flag status and track information</div>
          </div>
          <div style={{ 
            padding: '0.4rem 0.8rem', 
            background: 'linear-gradient(135deg, var(--ferrari-red), var(--ferrari-dark-red))',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: 'var(--ferrari-yellow)',
            boxShadow: '0 0 15px var(--ferrari-glow)',
            animation: 'session-glow 2s ease-in-out infinite'
          }}>
            LIVE
          </div>
        </div>
        <div className="card-body" style={{ padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((msg, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, var(--bg-card), var(--ferrari-black))',
                  borderRadius: '8px',
                  border: `2px solid ${getFlagColor(msg.flag)}40`,
                  borderLeft: `5px solid ${getFlagColor(msg.flag)}`,
                  boxShadow: `0 0 20px ${getFlagColor(msg.flag)}30`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(5px)';
                  e.currentTarget.style.boxShadow = `0 0 30px ${getFlagColor(msg.flag)}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = `0 0 20px ${getFlagColor(msg.flag)}30`;
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>
                  {getFlagIcon(msg.flag)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {msg.message}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {msg.time}
                  </div>
                </div>
                <div 
                  style={{ 
                    padding: '0.4rem 0.9rem',
                    background: `linear-gradient(135deg, ${getFlagColor(msg.flag)}, ${getFlagColor(msg.flag)}CC)`,
                    color: msg.flag === 'YELLOW' || msg.flag === 'DRS' ? 'var(--ferrari-black)' : 'white',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    boxShadow: `0 0 15px ${getFlagColor(msg.flag)}50`,
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {msg.flag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Radio - Ferrari Theme */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">📻 Team Radio</div>
            <div className="card-subtitle">Driver and team communications</div>
          </div>
        </div>
        <div className="card-body" style={{ padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {teamRadio.map((radio, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '1rem',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, var(--bg-card), var(--ferrari-black))',
                  borderRadius: '8px',
                  border: '2px solid var(--ferrari-red)',
                  boxShadow: '0 0 15px rgba(220, 0, 0, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--ferrari-yellow)';
                  e.currentTarget.style.boxShadow = '0 0 25px var(--ferrari-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--ferrari-red)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(220, 0, 0, 0.2)';
                }}
              >
                <div style={{ 
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--ferrari-red), var(--ferrari-dark-red))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: 'var(--ferrari-yellow)',
                  boxShadow: '0 0 20px var(--ferrari-glow)',
                  border: '2px solid var(--ferrari-yellow)'
                }}>
                  {radio.driver}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {radio.driver}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {radio.team}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {radio.time}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    "{radio.message}"
                  </div>
                  {radio.transcript && (
                    <div style={{ 
                      marginTop: '0.5rem',
                      fontSize: '0.7rem',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span>📻</span> Transcript Available
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceControl;
