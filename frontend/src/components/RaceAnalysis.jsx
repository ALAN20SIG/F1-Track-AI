import { useState, useEffect } from 'react';

// Distinct color palette for driver comparison charts
const DRIVER_COLORS = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#008000', // Dark Green
  '#000080', // Navy
  '#808000', // Olive
  '#800000', // Maroon
  '#008080', // Teal
  '#C0C0C0', // Silver
  '#808080', // Gray
  '#FF69B4', // Hot Pink
  '#32CD32', // Lime Green
  '#1E90FF', // Dodger Blue
  '#FFD700', // Gold
  '#FF4500'  // Orange Red
];

const RaceAnalysis = () => {
  const [telemetryData, setTelemetryData] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [enhancedAnalytics, setEnhancedAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDrivers, setSelectedDrivers] = useState([]);

  useEffect(() => {
    fetchRaceTelemetry();
    fetchEnhancedAnalytics();
    const interval = setInterval(() => {
      fetchRaceTelemetry();
      fetchEnhancedAnalytics();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchRaceTelemetry = async () => {
    try {
      const response = await fetch('http://https://f1-track-ai-production.up.railway.app/api/analysis/race-telemetry');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setTelemetryData(data);
        if (!selectedDriver && data.drivers.length > 0) {
          setSelectedDriver(data.drivers[0].code);
        }
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch telemetry data');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching race telemetry:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchEnhancedAnalytics = async () => {
    try {
      const response = await fetch('http://https://f1-track-ai-production.up.railway.app/api/analysis/enhanced-analytics');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEnhancedAnalytics(data.analytics);
        }
      }
    } catch (error) {
      console.error('Error fetching enhanced analytics:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
  };

  const getDriverData = (code) => {
    return telemetryData?.drivers.find(d => d.code === code);
  };

  const toggleDriverSelection = (code) => {
    setSelectedDrivers(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else if (prev.length < 6) {
        return [...prev, code];
      }
      return prev;
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏱️</div>
          <div style={{ color: 'var(--ferrari-yellow)', fontSize: '1.25rem' }}>Loading Race Analysis...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{ color: '#ff6b6b' }}>⚠️ Race Analysis Error</div>
        </div>
        <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#ff6b6b' }}>
            {error}
          </div>
          <div style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            <p>This error usually occurs when:</p>
            <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '1rem auto', lineHeight: '1.8' }}>
              <li>Backend server is not running (start with: <code>python main.py</code>)</li>
              <li>Session data hasn't loaded yet (wait 10-30 seconds after starting backend)</li>
              <li>No cached data available for the current session</li>
              <li>CORS configuration issue (check browser console)</li>
            </ul>
          </div>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchRaceTelemetry();
            }}
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, var(--ferrari-red), var(--ferrari-dark-red))',
              border: '2px solid var(--ferrari-yellow)',
              borderRadius: '8px',
              color: 'var(--ferrari-yellow)',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  const driverData = selectedDriver ? getDriverData(selectedDriver) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'calc(100vh - 120px)' }}>
      {/* Header Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Race Analysis Dashboard</div>
            <div className="card-subtitle">
              {telemetryData?.session_type} - {telemetryData?.year} Abu Dhabi GP • {telemetryData?.total_drivers} Drivers
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card" style={{ padding: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['overview', 'telemetry', 'comparison', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: activeTab === tab 
                  ? 'linear-gradient(135deg, var(--ferrari-red), var(--ferrari-dark-red))'
                  : 'var(--card-bg)',
                border: `2px solid ${activeTab === tab ? 'var(--ferrari-yellow)' : 'var(--border-color)'}`,
                borderRadius: '8px',
                color: activeTab === tab ? 'var(--ferrari-yellow)' : 'var(--text-primary)',
                fontWeight: 'bold',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Driver Rankings */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Driver Rankings by Fastest Lap</div>
              </div>
              <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {telemetryData?.drivers.map((driver, idx) => (
                  <div
                    key={driver.code}
                    onClick={() => setSelectedDriver(driver.code)}
                    style={{
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      background: selectedDriver === driver.code 
                        ? `linear-gradient(90deg, ${driver.teamColor}40, transparent)`
                        : 'var(--secondary-bg)',
                      border: `2px solid ${selectedDriver === driver.code ? driver.teamColor : 'transparent'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${driver.teamColor}, ${driver.teamColor}80)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#000'
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: driver.teamColor }}>
                        {driver.code}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {driver.name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--ferrari-yellow)' }}>
                        {formatTime(driver.fastestLapTime)}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {driver.totalLaps} laps
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Driver Performance Details */}
            {driverData && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ color: driverData.teamColor }}>
                    {driverData.name} - Performance Analysis
                  </div>
                </div>
                <div className="card-body">
                  {/* Key Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ 
                      padding: '1rem', 
                      background: 'var(--secondary-bg)', 
                      borderRadius: '8px',
                      border: '2px solid var(--ferrari-yellow)'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        FASTEST LAP
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--ferrari-yellow)' }}>
                        {formatTime(driverData.fastestLapTime)}
                      </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--secondary-bg)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        AVG LAP TIME
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {formatTime(driverData.avgLapTime)}
                      </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--secondary-bg)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        CONSISTENCY (σ)
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00d448' }}>
                        {driverData.stdDeviation.toFixed(3)}s
                      </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--secondary-bg)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        TOTAL LAPS
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {driverData.totalLaps}
                      </div>
                    </div>
                  </div>

                  {/* Lap Time Chart */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                      Lap Time Progression
                    </div>
                    <div style={{ 
                      height: '200px', 
                      background: 'var(--secondary-bg)', 
                      borderRadius: '8px',
                      position: 'relative',
                      padding: '1rem'
                    }}>
                      <svg width="100%" height="100%" viewBox="0 0 600 150" preserveAspectRatio="none">
                        <polyline
                          points={driverData.lapTimes.map((time, idx) => {
                            const x = (idx / (driverData.lapTimes.length - 1)) * 600;
                            const y = 150 - ((time - Math.min(...driverData.lapTimes)) / 
                              (Math.max(...driverData.lapTimes) - Math.min(...driverData.lapTimes))) * 130;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke={driverData.teamColor}
                          strokeWidth="3"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Position Changes */}
                  {driverData.positionChanges.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                        Position Throughout Session
                      </div>
                      <div style={{ 
                        height: '150px', 
                        background: 'var(--secondary-bg)', 
                        borderRadius: '8px',
                        padding: '1rem'
                      }}>
                        <svg width="100%" height="100%" viewBox="0 0 600 120" preserveAspectRatio="none">
                          <polyline
                            points={driverData.positionChanges.map((pos, idx) => {
                              const x = (idx / (driverData.positionChanges.length - 1)) * 600;
                              const y = (pos.position / 20) * 120;
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="var(--ferrari-yellow)"
                            strokeWidth="3"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'telemetry' && driverData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Speed Trace */}
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ color: driverData.teamColor }}>
                  {driverData.code} - Speed Trace (Fastest Lap)
                </div>
              </div>
              <div className="card-body">
                {driverData.speedTrace && driverData.speedTrace.speed.length > 0 ? (
                  <div style={{ height: '250px', background: 'var(--secondary-bg)', borderRadius: '8px', padding: '1rem' }}>
                    <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none">
                      {/* Speed line */}
                      <polyline
                        points={driverData.speedTrace.speed.map((speed, idx) => {
                          const x = (idx / (driverData.speedTrace.speed.length - 1)) * 1000;
                          const y = 200 - (speed / 350) * 180;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke={driverData.teamColor}
                        strokeWidth="2"
                      />
                      {/* Throttle bars */}
                      {driverData.speedTrace.throttle.map((throttle, idx) => {
                        if (idx % 3 !== 0) return null;
                        const x = (idx / (driverData.speedTrace.throttle.length - 1)) * 1000;
                        const height = (throttle / 100) * 200;
                        return (
                          <line
                            key={idx}
                            x1={x}
                            y1={200}
                            x2={x}
                            y2={200 - height}
                            stroke="#00ff0040"
                            strokeWidth="2"
                          />
                        );
                      })}
                      {/* Brake indicators */}
                      {driverData.speedTrace.brake.map((brake, idx) => {
                        if (brake === 0 || idx % 3 !== 0) return null;
                        const x = (idx / (driverData.speedTrace.brake.length - 1)) * 1000;
                        return (
                          <line
                            key={idx}
                            x1={x}
                            y1={190}
                            x2={x}
                            y2={200}
                            stroke="#ff000080"
                            strokeWidth="4"
                          />
                        );
                      })}
                    </svg>
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '20px', height: '3px', background: driverData.teamColor }}></div>
                        <span>Speed (km/h)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '20px', height: '3px', background: '#00ff00' }}></div>
                        <span>Throttle</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '20px', height: '3px', background: '#ff0000' }}></div>
                        <span>Brake</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No telemetry data available
                  </div>
                )}
              </div>
            </div>

            {/* Sector Times Table */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Sector Times by Lap</div>
              </div>
              <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ 
                    position: 'sticky', 
                    top: 0, 
                    background: 'var(--card-bg)', 
                    borderBottom: '2px solid var(--ferrari-red)' 
                  }}>
                    <tr>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--ferrari-yellow)' }}>LAP</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--ferrari-yellow)' }}>SECTOR 1</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--ferrari-yellow)' }}>SECTOR 2</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--ferrari-yellow)' }}>SECTOR 3</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--ferrari-yellow)' }}>TIRE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverData.sectorData.map((sector, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem' }}>{sector.lap}</td>
                        <td style={{ padding: '0.5rem' }}>{sector.sector1.toFixed(3)}s</td>
                        <td style={{ padding: '0.5rem' }}>{sector.sector2.toFixed(3)}s</td>
                        <td style={{ padding: '0.5rem' }}>{sector.sector3.toFixed(3)}s</td>
                        <td style={{ padding: '0.5rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            background: sector.compound === 'SOFT' ? '#ff0000' : sector.compound === 'MEDIUM' ? '#ffff00' : '#eeeeee',
                            color: '#000',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            {sector.compound[0]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Multi-Driver Comparison</div>
                <div className="card-subtitle">Select up to 6 drivers to compare</div>
              </div>
            </div>
            <div className="card-body">
              {/* Driver Selection Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                {telemetryData?.drivers.slice(0, 12).map((driver, idx) => {
                  const selectionIndex = selectedDrivers.indexOf(driver.code);
                  const isSelected = selectionIndex !== -1;
                  const selectionColor = isSelected ? DRIVER_COLORS[selectionIndex % DRIVER_COLORS.length] : null;
                  
                  return (
                    <div
                      key={driver.code}
                      onClick={() => toggleDriverSelection(driver.code)}
                      style={{
                        padding: '0.75rem',
                        background: isSelected 
                          ? `linear-gradient(135deg, ${selectionColor}, ${selectionColor}80)`
                          : 'var(--secondary-bg)',
                        border: `3px solid ${isSelected ? selectionColor : 'transparent'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? `0 0 10px ${selectionColor}50` : 'none'
                      }}
                    >
                      <div style={{ 
                        fontWeight: 'bold', 
                        fontSize: '1.2rem', 
                        color: isSelected ? '#fff' : driver.teamColor,
                        textShadow: isSelected ? '0 0 4px rgba(0,0,0,0.5)' : 'none'
                      }}>
                        {isSelected && <span style={{ marginRight: '4px' }}>{selectionIndex + 1}.</span>}
                        {driver.code}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: isSelected ? '#ddd' : 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {formatTime(driver.fastestLapTime)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comparison Chart */}
              {selectedDrivers.length > 0 && (
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                    Lap Time Comparison
                  </div>
                  <div style={{ 
                    height: '400px', 
                    background: 'var(--secondary-bg)', 
                    borderRadius: '8px',
                    padding: '1rem',
                    position: 'relative'
                  }}>
                    <svg width="100%" height="100%" viewBox="0 0 1000 350" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <defs>
                        <pattern id="grid" width="100" height="35" patternUnits="userSpaceOnUse">
                          <path d="M 100 0 L 0 0 0 35" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      
                      {/* Y-axis labels */}
                      <text x="10" y="20" fill="#888" fontSize="12">Fastest</text>
                      <text x="10" y="340" fill="#888" fontSize="12">Slowest</text>
                      
                      {selectedDrivers.map((code, driverIdx) => {
                        const driver = getDriverData(code);
                        if (!driver || !driver.lapTimes || driver.lapTimes.length === 0) return null;
                        
                        // Use distinct color from palette based on driver index
                        const driverColor = DRIVER_COLORS[driverIdx % DRIVER_COLORS.length];
                        
                        const allTimes = selectedDrivers.flatMap(c => getDriverData(c)?.lapTimes || []);
                        const minTime = Math.min(...allTimes);
                        const maxTime = Math.max(...allTimes);
                        const timeRange = maxTime - minTime || 1; // Prevent division by zero
                        const maxLaps = Math.max(...selectedDrivers.map(c => getDriverData(c)?.lapTimes?.length || 0));
                        
                        return (
                          <g key={code}>
                            {/* Driver line */}
                            <polyline
                              points={driver.lapTimes.map((time, idx) => {
                                const x = maxLaps > 1 ? (idx / (maxLaps - 1)) * 950 + 25 : 500;
                                const y = 330 - ((time - minTime) / timeRange) * 300 + 10;
                                return `${x},${y}`;
                              }).join(' ')}
                              fill="none"
                              stroke={driverColor}
                              strokeWidth="3"
                              opacity="0.9"
                            />
                            {/* Data points */}
                            {driver.lapTimes.map((time, idx) => {
                              const x = maxLaps > 1 ? (idx / (maxLaps - 1)) * 950 + 25 : 500;
                              const y = 330 - ((time - minTime) / timeRange) * 300 + 10;
                              return (
                                <circle
                                  key={idx}
                                  cx={x}
                                  cy={y}
                                  r="4"
                                  fill={driverColor}
                                  opacity="0.8"
                                />
                              );
                            })}
                          </g>
                        );
                      })}
                    </svg>
                    
                    {/* Legend */}
                    <div style={{ 
                      position: 'absolute', 
                      top: '1rem', 
                      right: '1rem',
                      background: 'rgba(0,0,0,0.8)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--ferrari-yellow)',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {selectedDrivers.map((code, idx) => {
                        const driverColor = DRIVER_COLORS[idx % DRIVER_COLORS.length];
                        return (
                          <div key={code} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <div style={{ 
                              width: '20px', 
                              height: '4px', 
                              background: driverColor,
                              borderRadius: '2px'
                            }}></div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>{code}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && enhancedAnalytics && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Tire Degradation */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Tire Degradation Analysis</div>
              </div>
              <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {enhancedAnalytics.tireDegradation.slice(0, 5).map(data => (
                  <div key={data.driver} style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--ferrari-yellow)' }}>
                      {data.driver}
                    </div>
                    <div style={{ height: '80px', background: 'var(--secondary-bg)', borderRadius: '8px', padding: '0.5rem' }}>
                      <svg width="100%" height="100%" viewBox="0 0 600 60" preserveAspectRatio="none">
                        <polyline
                          points={data.degradationData.slice(0, 30).map((d, idx) => {
                            const x = (idx / 29) * 600;
                            const y = 60 - (d.lapTime / 95) * 50;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="var(--ferrari-red)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fuel Consumption */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Fuel Consumption Estimates</div>
              </div>
              <div className="card-body">
                {enhancedAnalytics.fuelConsumption.map(fuel => (
                  <div key={fuel.driver} style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    background: 'var(--secondary-bg)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{fuel.driver}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {fuel.fuelEfficiency}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--ferrari-yellow)' }}>
                        {fuel.estimatedFuelBurned.toFixed(1)} kg
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#00d448' }}>
                        {fuel.avgLapTimeImprovement > 0 ? '+' : ''}{fuel.avgLapTimeImprovement.toFixed(3)}s
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DRS Usage */}
            {enhancedAnalytics.drsUsage.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">DRS Usage Statistics</div>
                </div>
                <div className="card-body">
                  {enhancedAnalytics.drsUsage.map(drs => (
                    <div key={drs.driver} style={{
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      background: 'var(--secondary-bg)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold' }}>{drs.driver}</span>
                        <span style={{ color: 'var(--ferrari-yellow)' }}>{drs.drsPercentage.toFixed(1)}%</span>
                      </div>
                      <div style={{ 
                        height: '6px', 
                        background: 'var(--border-color)', 
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${drs.drsPercentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--ferrari-red), var(--ferrari-yellow))'
                        }}></div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Avg Speed Gain: {drs.avgSpeedGain.toFixed(1)} km/h
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Speed Heat Map */}
            {enhancedAnalytics.heatMaps.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Speed Heat Map (Track Segments)</div>
                </div>
                <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {enhancedAnalytics.heatMaps.slice(0, 5).map(heatMap => (
                    <div key={heatMap.driver} style={{ marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{heatMap.driver}</div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {heatMap.speedZones.map((zone, idx) => {
                          const speedRatio = zone.avgSpeed / 350;
                          const color = `hsl(${speedRatio * 120}, 100%, 50%)`;
                          return (
                            <div
                              key={idx}
                              style={{
                                flex: 1,
                                height: '40px',
                                background: color,
                                borderRadius: '2px',
                                position: 'relative'
                              }}
                              title={`Segment ${idx + 1}: ${zone.avgSpeed.toFixed(0)} km/h`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RaceAnalysis;
