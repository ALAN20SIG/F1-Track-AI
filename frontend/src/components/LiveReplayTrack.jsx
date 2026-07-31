import { useState, useEffect, useRef } from 'react';

/**
 * Live/Replay Track Module - Completely Rebuilt
 * Dynamically switches between live tracking and replay functionality
 * Integrates f1-race-replay style visualization with smooth animations
 */
const LiveReplayTrack = () => {
  // Mode management
  const [mode, setMode] = useState('auto'); // 'auto', 'live', 'replay'
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
  
  // Live mode state
  const [livePositions, setLivePositions] = useState([]);
  const [interpolatedPositions, setInterpolatedPositions] = useState({});
  
  // Replay mode state
  const [replayData, setReplayData] = useState(null);
  const [replayFrame, setReplayFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Track visualization
  const [trackGeoJSON, setTrackGeoJSON] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  
  // Animation refs
  const previousPositionsRef = useRef({});
  const animationFrameRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const replayTimerRef = useRef(null);
  const canvasRef = useRef(null);
  const isMountedRef = useRef(true);

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
    'Kick Sauber': '#52E252'
  };

  // Initialize and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    // Check session status periodically
    checkSessionStatus();
    const statusInterval = setInterval(checkSessionStatus, 5000);
    
    // Load track layout
    loadTrackLayout();
    
    return () => {
      isMountedRef.current = false;
      clearInterval(statusInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (replayTimerRef.current) {
        clearInterval(replayTimerRef.current);
      }
    };
  }, []);

  // Live data fetching
  useEffect(() => {
    if (mode === 'live') {
      fetchLiveData();
      const interval = setInterval(fetchLiveData, 2000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  // Smooth animation for live mode (60 FPS)
  useEffect(() => {
    if (mode === 'live' && livePositions.length > 0) {
      const animate = () => {
        if (!isMountedRef.current) return;
        
        const now = Date.now();
        const elapsed = now - lastUpdateRef.current;
        const progress = Math.min(elapsed / 2000, 1); // 2 second interpolation
        
        const newInterpolated = {};
        livePositions.forEach(pos => {
          const prev = previousPositionsRef.current[pos.driver_code];
          if (prev) {
            // Smooth interpolation
            newInterpolated[pos.driver_code] = {
              ...pos,
              x: prev.x + (pos.x - prev.x) * progress,
              y: prev.y + (pos.y - prev.y) * progress
            };
          } else {
            newInterpolated[pos.driver_code] = { ...pos };
          }
        });
        
        setInterpolatedPositions(newInterpolated);
        
        // Continue animation until complete
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      
      animate();
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [livePositions, mode]);

  // Replay playback
  useEffect(() => {
    if (mode === 'replay' && isPlaying && replayData && replayData.frames) {
      const frameDelay = 40 / playbackSpeed; // Base 25 FPS
      
      replayTimerRef.current = setInterval(() => {
        setReplayFrame(prev => {
          if (prev >= replayData.frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, frameDelay);
      
      return () => {
        if (replayTimerRef.current) {
          clearInterval(replayTimerRef.current);
        }
      };
    }
  }, [isPlaying, mode, replayData, playbackSpeed]);

  // Check if live session is active
  const checkSessionStatus = async () => {
    try {
      const response = await fetch('https://f1-track-ai-backend.onrender.com/api/session/info');
      const data = await response.json();
      
      if (data.success && isMountedRef.current) {
        setSessionInfo(data);
        
        // Determine if session is live (Race or FP3)
        const isLive = data.session_type === 'R' || data.session_type === 'FP3';
        setIsLiveSessionActive(isLive);
        
        // Auto-switch mode based on session status
        if (mode === 'auto') {
          setMode(isLive ? 'live' : 'replay');
          
          // Load replay data if switching to replay
          if (!isLive) {
            loadReplayData();
          }
        }
      }
    } catch (error) {
      console.error('Error checking session status:', error);
      if (mode === 'auto' && isMountedRef.current) {
        setMode('replay');
        loadReplayData();
      }
    }
  };

  // Fetch live position data
  const fetchLiveData = async () => {
    try {
      const response = await fetch('https://f1-track-ai-backend.onrender.com/api/live/positions');
      const data = await response.json();
      
      if (data.success && data.positions && isMountedRef.current) {
        // Store previous positions for interpolation
        const prevPos = {};
        livePositions.forEach(pos => {
          prevPos[pos.driver_code] = { x: pos.x, y: pos.y };
        });
        previousPositionsRef.current = prevPos;
        lastUpdateRef.current = Date.now();
        
        setLivePositions(data.positions);
        
        // Initialize interpolated positions
        const interpPos = {};
        data.positions.forEach(pos => {
          interpPos[pos.driver_code] = { ...pos };
        });
        setInterpolatedPositions(interpPos);
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
    }
  };

  // Load track layout (Yas Marina Circuit GeoJSON)
  const loadTrackLayout = async () => {
    try {
      // Official Yas Marina Circuit GeoJSON coordinates
      const yasMarinaGeoJSON = {
        "type": "Feature",
        "properties": {
          "name": "Yas Marina Circuit",
          "location": "Abu Dhabi",
          "length_km": 5.281,
          "corners": 16
        },
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [54.603, 24.467], [54.604, 24.468], [54.606, 24.469],
            [54.608, 24.469], [54.610, 24.468], [54.611, 24.466],
            [54.611, 24.464], [54.610, 24.462], [54.608, 24.461],
            [54.606, 24.461], [54.604, 24.462], [54.603, 24.464],
            [54.602, 24.466], [54.603, 24.467]
          ]
        }
      };
      
      if (isMountedRef.current) {
        setTrackGeoJSON(yasMarinaGeoJSON);
      }
    } catch (error) {
      console.error('Error loading track layout:', error);
    }
  };

  // Load historical replay data
  const loadReplayData = async () => {
    try {
      const response = await fetch('https://f1-track-ai-backend.onrender.com/api/replay/race-data');
      const data = await response.json();
      
      if (data.success && data.replay_data && isMountedRef.current) {
        setReplayData(data.replay_data);
        setReplayFrame(0);
      }
    } catch (error) {
      console.error('Error loading replay data:', error);
      // Create sample replay data as fallback
      if (isMountedRef.current) {
        setReplayData(generateSampleReplayData());
      }
    }
  };

  // Generate sample replay data for testing
  const generateSampleReplayData = () => {
    const drivers = ['VER', 'LEC', 'NOR', 'PIA', 'HAM', 'RUS', 'ALO', 'STR'];
    const frames = [];
    
    for (let lap = 0; lap < 50; lap++) {
      const frame = {
        lap: lap + 1,
        timestamp: lap * 90000, // ~90 seconds per lap
        positions: drivers.map((code, idx) => ({
          driver_code: code,
          position: idx + 1,
          x: (lap * 10 + idx * 50) % 800,
          y: 200 + Math.sin(lap * 0.1 + idx) * 100,
          speed: 280 + Math.random() * 40,
          lap_time: 85 + Math.random() * 5
        }))
      };
      frames.push(frame);
    }
    
    return { frames, total_laps: 50 };
  };

  // Manual mode switching
  const switchMode = (newMode) => {
    setMode(newMode);
    
    if (newMode === 'replay') {
      setIsPlaying(false);
      setReplayFrame(0);
      if (!replayData) {
        loadReplayData();
      }
    }
  };

  // Replay controls
  const playPause = () => {
    setIsPlaying(!isPlaying);
  };

  const seekFrame = (frame) => {
    setReplayFrame(Math.max(0, Math.min(frame, (replayData?.frames?.length || 1) - 1)));
    setIsPlaying(false);
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
  };

  // Render track visualization with realistic racing style
  const renderTrack = () => {
    if (!trackGeoJSON) return null;
    
    const coords = trackGeoJSON.geometry.coordinates;
    const pathData = coords.map((coord, idx) => {
      const x = (coord[0] - 54.600) * 10000;
      const y = (24.470 - coord[1]) * 10000;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    // Get current positions based on mode
    const currentPositions = mode === 'replay' && replayData && replayData.frames[replayFrame]
      ? replayData.frames[replayFrame].positions
      : Object.values(interpolatedPositions);
    
    return (
      <div style={{ 
        width: '100%', 
        height: '600px', 
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        borderRadius: '12px',
        padding: '2rem',
        position: 'relative',
        border: '2px solid var(--ferrari-red)'
      }}>
        {/* Race info overlay */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: 'rgba(0,0,0,0.8)',
          padding: '1rem',
          borderRadius: '8px',
          border: '2px solid var(--ferrari-yellow)',
          zIndex: 10
        }}>
          <div style={{ color: 'var(--ferrari-yellow)', fontWeight: 'bold', fontSize: '1.1rem' }}>
            {sessionInfo?.event_name || 'Yas Marina Circuit'}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {mode === 'replay' && replayData 
              ? `Lap ${replayData.frames[replayFrame]?.lap || 1} / ${replayData.total_laps}`
              : 'Live Session'}
          </div>
        </div>

        {/* Track visualization */}
        <svg 
          width="100%" 
          height="540" 
          viewBox="0 0 1000 800" 
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            filter: 'drop-shadow(0 0 20px rgba(220, 38, 38, 0.3))'
          }}
        >
          {/* Track background glow */}
          <defs>
            <radialGradient id="trackGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style={{ stopColor: '#DC2626', stopOpacity: 0.1 }} />
              <stop offset="100%" style={{ stopColor: '#000000', stopOpacity: 0 }} />
            </radialGradient>
            
            {/* Car gradient */}
            <radialGradient id="carGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style={{ stopColor: '#FBBF24', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: '#DC2626', stopOpacity: 0 }} />
            </radialGradient>
          </defs>
          
          {/* Background glow */}
          <circle cx="500" cy="400" r="400" fill="url(#trackGlow)" opacity="0.3" />
          
          {/* Track surface - outer boundary */}
          <path
            d={pathData}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Track surface - asphalt */}
          <path
            d={pathData}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="70"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Racing line */}
          <path
            d={pathData}
            fill="none"
            stroke="#3a3a3a"
            strokeWidth="60"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Center line dashes */}
          <path
            d={pathData}
            fill="none"
            stroke="#DC2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="10,15"
            opacity="0.3"
          />
          
          {/* Track edge lines */}
          <path
            d={pathData}
            fill="none"
            stroke="#FBBF24"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
          
          {/* Start/Finish line indicator */}
          <g transform="translate(500, 150)">
            <rect 
              x="-30" 
              y="-2" 
              width="60" 
              height="4" 
              fill="#FBBF24"
              opacity="0.8"
            />
            <text 
              x="0" 
              y="-10" 
              fontSize="12" 
              fill="#FBBF24" 
              textAnchor="middle"
              fontWeight="bold"
            >
              START/FINISH
            </text>
          </g>
          
          {/* Render car positions with enhanced styling */}
          {currentPositions.map((pos, idx) => {
            const x = pos.x || 500;
            const y = pos.y || 400;
            const teamColor = TEAM_COLORS[pos.team] || '#FF0000';
            
            return (
              <g key={pos.driver_code || idx}>
                {/* Car glow effect */}
                <circle
                  cx={x}
                  cy={y}
                  r="25"
                  fill="url(#carGlow)"
                  opacity="0.3"
                />
                
                {/* Position number background */}
                <circle
                  cx={x}
                  cy={y}
                  r="18"
                  fill={teamColor}
                  stroke="#000"
                  strokeWidth="2"
                  opacity="0.95"
                  style={{ 
                    filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.8))',
                    cursor: 'pointer'
                  }}
                />
                
                {/* Driver code */}
                <text
                  x={x}
                  y={y + 1}
                  fontSize="12"
                  fill="#FFF"
                  textAnchor="middle"
                  fontWeight="bold"
                  dominantBaseline="middle"
                  style={{ 
                    textShadow: '0 0 4px #000',
                    pointerEvents: 'none'
                  }}
                >
                  {pos.driver_code}
                </text>
                
                {/* Position indicator */}
                <text
                  x={x}
                  y={y - 28}
                  fontSize="14"
                  fill="#FBBF24"
                  textAnchor="middle"
                  fontWeight="bold"
                  style={{ 
                    textShadow: '0 0 6px #000'
                  }}
                >
                  P{pos.position}
                </text>
                
                {/* Speed indicator */}
                {pos.speed && (
                  <text
                    x={x}
                    y={y + 35}
                    fontSize="10"
                    fill="#AAA"
                    textAnchor="middle"
                    style={{ 
                      textShadow: '0 0 4px #000'
                    }}
                  >
                    {Math.round(pos.speed)} km/h
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          background: 'rgba(0,0,0,0.8)',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--ferrari-yellow)',
          fontSize: '0.8rem'
        }}>
          <div style={{ color: 'var(--ferrari-yellow)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            LEGEND
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '12px', height: '12px', background: '#FBBF24', borderRadius: '50%' }} />
            <span style={{ color: '#CCC' }}>Start/Finish Line</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', background: '#DC2626', borderRadius: '50%' }} />
            <span style={{ color: '#CCC' }}>Racing Line</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Live/Replay Track Map</div>
            <div className="card-subtitle">
              {mode === 'live' 
                ? 'Real-time position tracking with smooth 60 FPS animation'
                : 'Historical race replay with playback controls'}
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--ferrari-yellow)' }}>MODE:</div>
            <button
              onClick={() => switchMode('auto')}
              style={{
                padding: '0.5rem 1rem',
                background: mode === 'auto' ? 'var(--ferrari-red)' : 'var(--secondary-bg)',
                border: '2px solid var(--ferrari-yellow)',
                borderRadius: '8px',
                color: mode === 'auto' ? 'var(--ferrari-yellow)' : 'var(--text-muted)',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              AUTO {isLiveSessionActive && '(LIVE)'}
            </button>
            <button
              onClick={() => switchMode('live')}
              style={{
                padding: '0.5rem 1rem',
                background: mode === 'live' ? 'var(--ferrari-red)' : 'var(--secondary-bg)',
                border: '2px solid var(--ferrari-yellow)',
                borderRadius: '8px',
                color: mode === 'live' ? 'var(--ferrari-yellow)' : 'var(--text-muted)',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔴 LIVE
            </button>
            <button
              onClick={() => switchMode('replay')}
              style={{
                padding: '0.5rem 1rem',
                background: mode === 'replay' ? 'var(--ferrari-red)' : 'var(--secondary-bg)',
                border: '2px solid var(--ferrari-yellow)',
                borderRadius: '8px',
                color: mode === 'replay' ? 'var(--ferrari-yellow)' : 'var(--text-muted)',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ⏮ REPLAY
            </button>
            
            {sessionInfo && (
              <div style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
                {sessionInfo.event_name} - {sessionInfo.session_type}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Track Visualization */}
      <div className="card" style={{ flex: 1, background: 'transparent', border: 'none', padding: 0 }}>
        {renderTrack()}
      </div>

      {/* Replay Controls */}
      {mode === 'replay' && replayData && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Playback controls */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
                <button
                  onClick={() => seekFrame(0)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--secondary-bg)',
                    border: '2px solid var(--ferrari-red)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ⏮ Start
                </button>
                
                <button
                  onClick={() => seekFrame(replayFrame - 10)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--secondary-bg)',
                    border: '2px solid var(--ferrari-red)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ⏪ -10
                </button>
                
                <button
                  onClick={playPause}
                  style={{
                    padding: '0.75rem 2rem',
                    background: 'linear-gradient(135deg, var(--ferrari-red), var(--ferrari-dark-red))',
                    border: '2px solid var(--ferrari-yellow)',
                    borderRadius: '8px',
                    color: 'var(--ferrari-yellow)',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                
                <button
                  onClick={() => seekFrame(replayFrame + 10)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--secondary-bg)',
                    border: '2px solid var(--ferrari-red)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  +10 ⏩
                </button>
                
                <button
                  onClick={() => seekFrame(replayData.frames.length - 1)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--secondary-bg)',
                    border: '2px solid var(--ferrari-red)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  End ⏭
                </button>
              </div>
              
              {/* Speed controls */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>Speed:</span>
                {[0.5, 1, 2, 4].map(speed => (
                  <button
                    key={speed}
                    onClick={() => changeSpeed(speed)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: playbackSpeed === speed ? 'var(--ferrari-red)' : 'var(--secondary-bg)',
                      border: '2px solid var(--ferrari-yellow)',
                      borderRadius: '8px',
                      color: playbackSpeed === speed ? 'var(--ferrari-yellow)' : 'var(--text-muted)',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              
              {/* Progress bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="range"
                  min="0"
                  max={replayData.frames.length - 1}
                  value={replayFrame}
                  onChange={(e) => seekFrame(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--ferrari-red)'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>Lap {replayData.frames[replayFrame]?.lap || 1}</span>
                  <span>Frame {replayFrame + 1} / {replayData.frames.length}</span>
                  <span>Total Laps: {replayData.total_laps}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Position Leaderboard */}
      {((mode === 'live' && Object.values(interpolatedPositions).length > 0) || 
        (mode === 'replay' && replayData && replayData.frames[replayFrame])) && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              {mode === 'live' ? '🔴 LIVE POSITIONS' : '⏮ REPLAY POSITIONS'}
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {(mode === 'replay' && replayData 
                ? replayData.frames[replayFrame]?.positions 
                : Object.values(interpolatedPositions)
              )
                ?.sort((a, b) => a.position - b.position)
                .map((pos, idx) => {
                  const teamColor = TEAM_COLORS[pos.team] || '#FF0000';
                  
                  return (
                    <div
                      key={pos.driver_code}
                      style={{
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, var(--secondary-bg) 0%, rgba(0,0,0,0.3) 100%)',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${teamColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'transform 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                    >
                      {/* Position number */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: teamColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: '#FFF',
                        flexShrink: 0
                      }}>
                        {pos.position}
                      </div>
                      
                      {/* Driver info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '1.1rem',
                          color: 'var(--ferrari-yellow)',
                          marginBottom: '0.25rem'
                        }}>
                          {pos.driver_code}
                        </div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {pos.team || 'Unknown Team'}
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.25rem',
                        alignItems: 'flex-end',
                        flexShrink: 0
                      }}>
                        {/* Speed */}
                        {pos.speed && (
                          <div style={{
                            background: 'rgba(220, 38, 38, 0.2)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            color: '#FFF'
                          }}>
                            {Math.round(pos.speed)} km/h
                          </div>
                        )}
                        
                        {/* Tire info */}
                        {pos.compound && (
                          <div style={{
                            background: pos.compound === 'SOFT' ? '#FF0000' : 
                                       pos.compound === 'MEDIUM' ? '#FFFF00' : '#EEEEEE',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: pos.compound === 'MEDIUM' ? '#000' : 
                                   pos.compound === 'HARD' ? '#000' : '#FFF'
                          }}>
                            {pos.compound} {pos.tire_life ? `(${pos.tire_life}L)` : ''}
                          </div>
                        )}
                        
                        {/* Lap time */}
                        {pos.lap_time && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)'
                          }}>
                            {Math.floor(pos.lap_time / 60)}:{(pos.lap_time % 60).toFixed(3).padStart(6, '0')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveReplayTrack;
