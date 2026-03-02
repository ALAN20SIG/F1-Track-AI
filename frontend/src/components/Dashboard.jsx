import { useState, useEffect } from 'react';
import { drivers2026 } from '../data/drivers2026';

const Dashboard = () => {
  const [drivers, setDrivers] = useState(drivers2026);
  const [raceStatus, setRaceStatus] = useState('Track Clear');
  const [sessionType, setSessionType] = useState('Race');  // Track current session type

  useEffect(() => {
    // Fetch live data from FastF1 API continuously
    const fetchLiveData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/live/timing');
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.drivers && data.drivers.length > 0) {
            // Use live data from FastF1 API
            setDrivers(data.drivers);
            // Update session type from API response
            if (data.session_type) {
              const sessionNames = {
                'R': 'Race',
                'Q': 'Qualifying',
                'FP3': 'Practice 3',
                'FP2': 'Practice 2',
                'FP1': 'Practice 1',
                'S': 'Sprint'
              };
              setSessionType(sessionNames[data.session_type] || 'Race');
            }
            console.log(`✓ Loaded ${data.drivers.length} drivers from ${sessionType} session`);
          } else {
            console.warn('API response missing driver data:', data);
          }
        } else {
          console.error('Failed to fetch live timing:', response.status);
        }
      } catch (error) {
        console.error('Error fetching FastF1 data:', error);
      }
    };

    // Initial fetch
    fetchLiveData();

    // Poll for updates every 10 seconds
    const dataInterval = setInterval(fetchLiveData, 10000);

    // Simulate race control messages
    const messageInterval = setInterval(() => {
      const messages = [
        'DRS Enabled',
        'Track Clear',
        'Yellow Flag - Turn 6',
        'Virtual Safety Car',
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setRaceStatus(randomMessage);
    }, 30000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(messageInterval);
    };
  }, []);

  const getTyreClass = (tyre) => {
    if (tyre === 'SOFT') return 'tyre-soft';
    if (tyre === 'MEDIUM') return 'tyre-medium';
    if (tyre === 'HARD') return 'tyre-hard';
    return 'tyre-medium';
  };

  const getPositionClass = (position) => {
    if (position === 1) return 'p1';
    if (position === 2) return 'p2';
    if (position === 3) return 'p3';
    return '';
  };

  const getStatusBadge = (status) => {
    if (status === 'PIT' || status === 'IN PIT') {
      return <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: '700' }}>● PIT</span>;
    }
    if (status === 'RETIRED' || status === 'STOP') {
      return <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: '700' }}>✕ OUT</span>;
    }
    if (status === 'PIT OUT') {
      return <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '700' }}>◁ OUT</span>;
    }
    return null;
  };

  const getRaceStatusColor = (status) => {
    if (status.includes('Yellow')) return '#f59e0b';
    if (status.includes('Red')) return '#ef4444';
    if (status.includes('Safety Car') || status.includes('Virtual')) return '#f59e0b';
    if (status.includes('DRS')) return '#8b5cf6';
    return '#10b981';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Live Timing</div>
          <div className="card-subtitle">{sessionType} Session · {drivers.length} drivers</div>
        </div>
        <div style={{ 
          padding: '0.5rem 1rem', 
          background: getRaceStatusColor(raceStatus) + '20',
          border: `1px solid ${getRaceStatusColor(raceStatus)}`,
          borderRadius: '6px',
          color: getRaceStatusColor(raceStatus),
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          {raceStatus}
        </div>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="leaderboard-table">
          <div className="leaderboard-row leaderboard-header" style={{ gridTemplateColumns: '40px 60px 1fr 80px 80px 60px 60px 60px 60px 80px' }}>
            <div>POS</div>
            <div>CODE</div>
            <div>DRIVER</div>
            <div>BEST</div>
            <div>LAST</div>
            <div>S1</div>
            <div>S2</div>
            <div>S3</div>
            <div>TYRE</div>
            <div>GAP</div>
          </div>
          {drivers.map(driver => (
            <div key={driver.code} className="leaderboard-row" style={{ gridTemplateColumns: '40px 60px 1fr 80px 80px 60px 60px 60px 60px 80px' }}>
              <div className={`position ${getPositionClass(driver.position)}`}>
                {driver.position}
              </div>
              <div 
                className="driver-code" 
                style={{ 
                  background: driver.teamColor + '20',
                  color: driver.teamColor,
                  border: `1px solid ${driver.teamColor}`
                }}
              >
                {driver.code}
              </div>
              <div className="driver-info">
                <div 
                  className="team-indicator" 
                  style={{ background: driver.teamColor }}
                ></div>
                <div className="driver-name">
                  {driver.fullName}
                  {driver.status && getStatusBadge(driver.status)}
                </div>
              </div>
              <div className="lap-time" style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>
                {driver.bestLap || driver.lastLapTime}
              </div>
              <div className="lap-time">{driver.lastLapTime}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {driver.sector1 || '24.5'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {driver.sector2 || '27.2'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {driver.sector3 || '26.4'}
              </div>
              <div className={`tyre-compound ${getTyreClass(driver.tyre)}`}>
                {driver.tyre[0]}
                <div style={{ fontSize: '0.6rem', marginTop: '-2px' }}>
                  {driver.tyreAge}
                </div>
              </div>
              <div className="gap-time">{driver.gap}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
