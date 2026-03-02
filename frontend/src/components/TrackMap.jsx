import { useState, useEffect, useRef } from 'react';

/**
 * Live Track Map - Real-time driver positions on Yas Marina Circuit
 * Shows animated driver dots moving around the track
 */
const TrackMap = () => {
  const [trackLayout, setTrackLayout] = useState(null);
  const [driverPositions, setDriverPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  const animationFrameRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastUpdateRef = useRef(Date.now());

  // Team colors mapping
  const TEAM_COLORS = {
    'Red Bull Racing': '#3671C6',
    'Ferrari': '#E8002D',
    'Mercedes': '#27F4D2',
    'McLaren': '#FF8000',
    'Alpine': '#FF87BC',
    'Aston Martin': '#229971',
    'Haas F1 Team': '#B6BABD',
    'RB': '#6692FF',
    'Williams': '#64C4FF',
    'Kick Sauber': '#52E252',
    'Unknown': '#FFFFFF'
  };

  // Initialize
  useEffect(() => {
    isMountedRef.current = true;
    fetchTrackLayout();
    fetchSessionInfo();
    
    // Start position updates
    const interval = setInterval(fetchDriverPositions, 2000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const fetchTrackLayout = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/live/track-layout');
      const data = await response.json();
      
      if (data.success && data.layout) {
        setTrackLayout(data.layout);
      } else {
        // Fallback to default Yas Marina layout
        setTrackLayout(generateDefaultTrackLayout());
      }
    } catch (error) {
      console.error('Error fetching track layout:', error);
      setTrackLayout(generateDefaultTrackLayout());
    }
  };

  const fetchSessionInfo = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/session/info');
      const data = await response.json();
      
      if (data.success && isMountedRef.current) {
        setSessionInfo(data);
      }
    } catch (error) {
      console.error('Error fetching session info:', error);
    }
  };

  const fetchDriverPositions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/live/positions');
      const data = await response.json();
      
      if (data.success && isMountedRef.current) {
        setDriverPositions(data.positions || []);
        setLoading(false);
        setError(null);
        lastUpdateRef.current = Date.now();
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      if (isMountedRef.current) {
        setError('Unable to fetch live positions');
        setLoading(false);
      }
    }
  };

  // Generate default Yas Marina track layout
  const generateDefaultTrackLayout = () => {
    const points = [];
    const numPoints = 100;
    
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * Math.PI * 2;
      // Simplified Yas Marina shape (oval-ish with some curves)
      let x, y;
      
      if (i < 25) {
        // Top straight
        x = 300 + (i / 25) * 400;
        y = 100 + Math.sin(t * 2) * 20;
      } else if (i < 50) {
        // Right side
        x = 700 + Math.cos(t * 2) * 50;
        y = 100 + ((i - 25) / 25) * 300;
      } else if (i < 75) {
        // Bottom
        x = 700 - ((i - 50) / 25) * 400;
        y = 400 + Math.sin(t * 2) * 30;
      } else {
        // Left side
        x = 300 + Math.cos(t * 2) * 50;
        y = 400 - ((i - 75) / 25) * 300;
      }
      
      points.push({ x, y });
    }
    
    return {
      name: 'Yas Marina Circuit',
      location: 'Abu Dhabi',
      x: points.map(p => p.x),
      y: points.map(p => p.y)
    };
  };

  // Transform track coordinates to SVG viewBox
  const transformCoordinates = (x, y) => {
    if (!trackLayout) return { x: 500, y: 250 };
    
    // Find min/max for normalization
    const minX = Math.min(...trackLayout.x);
    const maxX = Math.max(...trackLayout.x);
    const minY = Math.min(...trackLayout.y);
    const maxY = Math.max(...trackLayout.y);
    
    const padding = 50;
    const svgWidth = 1000;
    const svgHeight = 500;
    
    const normalizedX = (x - minX) / (maxX - minX || 1);
    const normalizedY = (y - minY) / (maxY - minY || 1);
    
    return {
      x: padding + normalizedX * (svgWidth - 2 * padding),
      y: padding + normalizedY * (svgHeight - 2 * padding)
    };
  };

  // Get team color
  const getTeamColor = (teamColor) => {
    return teamColor || '#FFFFFF';
  };

  // Render track path
  const renderTrackPath = () => {
    if (!trackLayout || !trackLayout.x || trackLayout.x.length === 0) return null;
    
    const points = trackLayout.x.map((x, i) => {
      const transformed = transformCoordinates(x, trackLayout.y[i]);
      return `${transformed.x},${transformed.y}`;
    }).join(' ');
    
    return (
      <>
        {/* Track outline */}
        <polyline
          points={points}
          fill="none"
          stroke="#333"
          strokeWidth="40"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Track surface */}
        <polyline
          points={points}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="30"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Racing line */}
        <polyline
          points={points}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Center line */}
        <polyline
          points={points}
          fill="none"
          stroke="#DC2626"
          strokeWidth="2"
          strokeDasharray="10,15"
          opacity="0.5"
        />
      </>
    );
  };

  // Render driver dots
  const renderDriverDots = () => {
    return driverPositions.map((driver, index) => {
      const pos = transformCoordinates(driver.x, driver.y);
      const color = getTeamColor(driver.teamColor);
      
      return (
        <g key={driver.code}>
          {/* Glow effect */}
          <circle
            cx={pos.x}
            cy={pos.y}
            r="20"
            fill={color}
            opacity="0.2"
          />
          {/* Driver dot */}
          <circle
            cx={pos.x}
            cy={pos.y}
            r="12"
            fill={color}
            stroke="#000"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedDriver(driver.code)}
          />
          {/* Position number */}
          <text
            x={pos.x}
            y={pos.y + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FFF"
            fontSize="10"
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            {driver.position}
          </text>
          {/* Driver code above */}
          <text
            x={pos.x}
            y={pos.y - 20}
            textAnchor="middle"
            fill={color}
            fontSize="12"
            fontWeight="bold"
            style={{ textShadow: '0 0 4px #000' }}
          >
            {driver.code}
          </text>
          {/* Speed indicator */}
          {selectedDriver === driver.code && (
            <text
              x={pos.x}
              y={pos.y + 30}
              textAnchor="middle"
              fill="#FFF"
              fontSize="10"
            >
              {Math.round(driver.speed)} km/h
            </text>
          )}
        </g>
      );
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏎️</div>
          <div style={{ color: 'var(--ferrari-yellow)', fontSize: '1.25rem' }}>
            Loading Track Map...
          </div>
        </div>
      </div>
    );
  }

  if (error && driverPositions.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{ color: '#ff6b6b' }}>⚠️ Track Map Error</div>
        </div>
        <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>
          <button 
            onClick={fetchDriverPositions}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--ferrari-red)',
              border: '2px solid var(--ferrari-yellow)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">🔴 Live Track Map</div>
            <div className="card-subtitle">
              {sessionInfo?.event_name || 'Yas Marina Circuit'} - Real-time driver positions
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Last Update: {new Date(lastUpdateRef.current).toLocaleTimeString()}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#00d448' }}>
              ● {driverPositions.length} Drivers on Track
            </div>
          </div>
        </div>
      </div>

      {/* Track Map */}
      <div className="card" style={{ background: '#0a0a0a' }}>
        <div className="card-body" style={{ padding: '1rem' }}>
          <svg 
            width="100%" 
            height="500" 
            viewBox="0 0 1000 500"
            style={{ display: 'block' }}
          >
            {/* Background */}
            <rect width="100%" height="100%" fill="#0a0a0a" />
            
            {/* Track */}
            {renderTrackPath()}
            
            {/* Start/Finish line */}
            <line x1="300" y1="80" x2="300" y2="120" stroke="#FBBF24" strokeWidth="4" />
            <text x="300" y="70" textAnchor="middle" fill="#FBBF24" fontSize="12" fontWeight="bold">
              START
            </text>
            
            {/* Driver dots */}
            {renderDriverDots()}
          </svg>
        </div>
      </div>

      {/* Driver List */}
      {driverPositions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Driver Positions</div>
          </div>
          <div className="card-body">
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem'
            }}>
              {driverPositions
                .sort((a, b) => a.position - b.position)
                .map((driver) => (
                  <div
                    key={driver.code}
                    onClick={() => setSelectedDriver(selectedDriver === driver.code ? null : driver.code)}
                    style={{
                      padding: '0.75rem',
                      background: selectedDriver === driver.code 
                        ? 'var(--secondary-bg)' 
                        : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${selectedDriver === driver.code ? getTeamColor(driver.teamColor) : 'transparent'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: getTeamColor(driver.teamColor),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      color: '#fff'
                    }}>
                      {driver.position}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: getTeamColor(driver.teamColor) }}>
                        {driver.code}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {Math.round(driver.speed)} km/h
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#DC2626' }} />
              <span style={{ fontSize: '0.9rem' }}>Track Center Line</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '20px', height: '4px', background: '#FBBF24' }} />
              <span style={{ fontSize: '0.9rem' }}>Start/Finish Line</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', border: '2px solid #333' }} />
              <span style={{ fontSize: '0.9rem' }}>Driver Position</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackMap;
