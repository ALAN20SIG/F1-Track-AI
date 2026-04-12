import { useState, useEffect, useRef } from 'react';

const LiveReplaySwitch = () => {
  const [mode, setMode] = useState('auto'); // 'auto', 'live', 'replay'
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
  const [positions, setPositions] = useState([]);
  const [trackLayout, setTrackLayout] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [replayData, setReplayData] = useState(null);
  const [replayFrame, setReplayFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Smooth interpolation for live mode
  const [interpolatedPositions, setInterpolatedPositions] = useState({});
  const previousPositionsRef = useRef({});
  const animationFrameRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  
  const replayTimerRef = useRef(null);

  useEffect(() => {
    checkSessionStatus();
    const interval = setInterval(checkSessionStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mode === 'live') {
      fetchLiveData();
      const interval = setInterval(fetchLiveData, 2000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  useEffect(() => {
    // Smooth animation for live mode
    if (mode === 'live') {
      const animate = () => {
        const now = Date.now();
        const elapsed = now - lastUpdateRef.current;
        const progress = Math.min(elapsed / 2000, 1);
        
        const newInterp = {};
        positions.forEach(pos => {
          const prev = previousPositionsRef.current[pos.code];
          if (prev) {
            newInterp[pos.code] = {
              ...pos,
              x: prev.x + (pos.x - prev.x) * progress,
              y: prev.y + (pos.y - prev.y) * progress
            };
          } else {
            newInterp[pos.code] = { ...pos };
          }
        });
        
        setInterpolatedPositions(newInterp);
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      
      if (positions.length > 0) {
        animate();
      }
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [positions, mode]);

  useEffect(() => {
    // Replay playback
    if (mode === 'replay' && isPlaying && replayData) {
      const frameDelay = 40 / playbackSpeed; // 25 FPS base
      
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

  const checkSessionStatus = async () => {
    try {
      const response = await fetch('https://f1-track-ai-production.up.railway.app/api/session/info');
      const data = await response.json();
      
      if (data.success) {
        setSessionInfo(data);
        
        // Determine if session is live
        const isLive = data.session_type === 'R' || data.session_type === 'FP3';
        setIsLiveSessionActive(isLive);
        
        // Auto-switch mode
        if (mode === 'auto') {
          setMode(isLive ? 'live' : 'replay');
        }
      }
    } catch (error) {
      console.error('Error checking session status:', error);
      if (mode === 'auto') {
        setMode('replay');
      }
    }
  };

  const fetchLiveData = async () => {
    try {
      // Fetch positions
      const posResponse = await fetch('https://f1-track-ai-production.up.railway.app/api/live/positions');
      const posData = await posResponse.json();
      
      if (posData.success && posData.positions) {
        // Store previous positions
        const prevPos = {};
        positions.forEach(pos => {
          prevPos[pos.code] = { x: pos.x, y: pos.y };
        });
        previousPositionsRef.current = prevPos;
        lastUpdateRef.current = Date.now();
        
        setPositions(posData.positions);
        
        // Initialize interpolated positions
        const interpPos = {};
        posData.positions.forEach(pos => {
          interpPos[pos.code] = { ...pos };
        });
        setInterpolatedPositions(interpPos);
      }
      
      // Fetch track layout if not loaded
      if (!trackLayout) {
        const layoutResponse = await fetch('https://f1-track-ai-production.up.railway.app/api/live/track-layout');
        const layoutData = await layoutResponse.json();
        if (layoutData.success && layoutData.layout) {
          setTrackLayout(layoutData.layout);
        }
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
    }
  };

  const loadReplayData = async () => {
    // For replay mode, we'll use historical session data
    try {
      const response = await fetch('https://f1-track-ai-production.up.railway.app/api/live/timing');
      const data = await response.json();
      
      if (data.success) {
        // Convert timing data to replay frames (simplified)
        const frames = data.drivers.map((driver, frameIdx) => ({
          timestamp: frameIdx * 1000,
          positions: data.drivers.map((d, idx) => ({
            code: d.code,
            x: Math.cos(frameIdx * 0.1 + idx) * 1000 + 1000,
            y: Math.sin(frameIdx * 0.1 + idx) * 1000 + 1000,
            position: d.position,
            teamColor: d.teamColor
          }))
        }));
        
        setReplayData({ frames, sessionType: data.session_type });
      }
    } catch (error) {
      console.error('Error loading replay data:', error);
    }
  };

  useEffect(() => {
    if (mode === 'replay' && !replayData) {
      loadReplayData();
    }
  }, [mode]);

  const YAS_MARINA_FALLBACK = {
    x: [
      0, 238, 251, 261, 268, 269, 266, -24, -31, -42, -62, -67, -150, -166, -178, -193, -205, -214, -230, -238, -239, -234, -223, -204, -139, -99, -80, -68,
      -181, -321, -326, -331, -342, -357, -367, -371, -379, -388, -397, -405, -415, -491, -554, -1276, -1483, -1617, -1727, -1882, -2185, -2457, -2474, -2482,
      -2488, -2493, -2490, -2409, -2407, -2342, -2247, -2226, -2124, -1989, -1790, -1486, -1369, -1284, -1153, -1056, -880, -742, -477, -353, -182, -109, -91,
      -81, -78, -84, -100, -119, -152, -189, -262, -368, -448, -623, -710, -756, -798, -886, -979, -1119, -1209, -1276, -1329, -1360, -1377, -1416, -1474, -1495,
      -1530, -1678, -1721, -1741, -1757, -1834, -1854, -1867, -1877, -1888, -1900, -1907, -1906, -1896, -1880, -1858, -1826, -1789, -1745, -1701, -1421, -1391,
      -1377, -1365, -1228, -1217, -1211, -1208, -1203, -1202, -1206, -1217, -1220, -1452, -1468, -1490, -1509, -1524, -1531, -1541, -1554, -1608, -1662, -1676,
      -1688, -1695, -1698, -1694, -1685, -1674, -1569, 0
    ],
    y: [
      0, 29, 33, 42, 54, 65, 79, 292, 305, 323, 346, 357, 445, 465, 482, 502, 520, 534, 562, 581, 603, 629, 658, 742, 870, 965, 1018, 1060,
      1195, 1382, 1394, 1405, 1423, 1447, 1463, 1473, 1486, 1499, 1512, 1523, 1538, 1626, 1708, 2242, 2454, 2578, 2680, 2811, 3104, 3352, 3372, 3382,
      3389, 3399, 3421, 3564, 3566, 3606, 3665, 3677, 3739, 3806, 3880, 4004, 4066, 4112, 4177, 4229, 4309, 4377, 4483, 4548, 4615, 4657, 4678, 4695,
      4699, 4696, 4687, 4674, 4658, 4639, 4616, 4590, 4532, 4476, 4437, 4310, 4268, 4237, 4208, 4153, 4099, 4001, 3943, 3896, 3857, 3828, 3812, 3760,
      3688, 3666, 3619, 3420, 3369, 3344, 3321, 3201, 3170, 3149, 3127, 3100, 3066, 3047, 3026, 3004, 2978, 2948, 2911, 2869, 2819, 2769, 2388, 2350,
      2334, 2319, 2135, 2123, 2117, 2114, 2106, 2101, 2100, 2107, 2111, 2425, 2446, 2477, 2508, 2532, 2543, 2558, 2578, 2656, 2735, 2756, 2778, 2792,
      2800, 2801, 2796, 2787, 2646, 0
    ],
    name: "Yas Marina Circuit",
    location: "Abu Dhabi"
  };

  const layout = trackLayout || YAS_MARINA_FALLBACK;
  
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 800;
  const PADDING = 50;

  const xMin = Math.min(...layout.x);
  const xMax = Math.max(...layout.x);
  const yMin = Math.min(...layout.y);
  const yMax = Math.max(...layout.y);

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  const scale = Math.min((SVG_WIDTH - 2 * PADDING) / xRange, (SVG_HEIGHT - 2 * PADDING) / yRange);

  const scaleX = (x) => (x - xMin) * scale + PADDING;
  const scaleY = (y) => (y - yMin) * scale + PADDING;

  const pathData = layout.x.map((x, i) => `${scaleX(x)},${scaleY(layout.y[i])}`).join(' L ');

  // Get current positions based on mode
  const currentPositions = mode === 'live' 
    ? Object.values(interpolatedPositions)
    : (replayData && replayData.frames[replayFrame] ? replayData.frames[replayFrame].positions : []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'calc(100vh - 120px)' }}>
      {/* Header with Mode Switcher */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">
                {mode === 'live' ? '🔴 Live Track Visualization' : '🎬 Race Replay'}
              </div>
              <div className="card-subtitle">
                {sessionInfo ? `${sessionInfo.session_name} - ${sessionInfo.year}` : 'Abu Dhabi Grand Prix'}
              </div>
            </div>
            
            {/* Mode Selector */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setMode('auto')}
                style={{
                  padding: '0.5rem 1rem',
                  background: mode === 'auto' ? 'var(--ferrari-red)' : 'var(--secondary-bg)',
                  border: `2px solid ${mode === 'auto' ? 'var(--ferrari-yellow)' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  color: mode === 'auto' ? 'var(--ferrari-yellow)' : 'var(--text-primary)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                AUTO
              </button>
              <button
                onClick={() => setMode('live')}
                style={{
                  padding: '0.5rem 1rem',
                  background: mode === 'live' ? 'var(--ferrari-red)' : 'var(--secondary-bg)',
                  border: `2px solid ${mode === 'live' ? 'var(--ferrari-yellow)' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  color: mode === 'live' ? 'var(--ferrari-yellow)' : 'var(--text-primary)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                LIVE
              </button>
              <button
                onClick={() => setMode('replay')}
                style={{
                  padding: '0.5rem 1rem',
                  background: mode === 'replay' ? 'var(--ferrari-red)' : 'var(--secondary-bg)',
                  border: `2px solid ${mode === 'replay' ? 'var(--ferrari-yellow)' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  color: mode === 'replay' ? 'var(--ferrari-yellow)' : 'var(--text-primary)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                REPLAY
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Track Visualization */}
      <div className="card" style={{ flex: 1 }}>
        <div className="card-body" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <svg 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            style={{ background: 'var(--secondary-bg)', borderRadius: '8px' }}
          >
            {/* Track Layout */}
            <path
              d={`M ${pathData}`}
              fill="none"
              stroke="var(--ferrari-red)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
            />
            
            {/* Start/Finish Line */}
            <line
              x1={scaleX(layout.x[0]) - 20}
              y1={scaleY(layout.y[0])}
              x2={scaleX(layout.x[0]) + 20}
              y2={scaleY(layout.y[0])}
              stroke="var(--ferrari-yellow)"
              strokeWidth="6"
              strokeDasharray="5,5"
            />
            
            {/* Driver Positions */}
            {currentPositions.map((driver) => {
              const dx = scaleX(driver.x);
              const dy = scaleY(driver.y);
              if (isNaN(dx) || isNaN(dy)) return null;

              return (
                <g key={driver.code}>
                  <circle
                    cx={dx}
                    cy={dy}
                    r="12"
                    fill={driver.teamColor || '#FFD700'}
                    stroke="#FFF"
                    strokeWidth="3"
                    style={{ 
                      filter: `drop-shadow(0 0 8px ${driver.teamColor || '#FFD700'})`,
                      transition: mode === 'live' ? 'all 0.1s ease-out' : 'none'
                    }}
                  />
                  <text
                    x={dx}
                    y={dy - 18}
                    fill="#FFF"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    style={{ 
                      textShadow: '0 0 4px #000',
                      fontFamily: 'Arial, sans-serif'
                    }}
                  >
                    {driver.code}
                  </text>
                  <circle
                    cx={dx}
                    cy={dy}
                    r="8"
                    fill="rgba(0, 0, 0, 0.7)"
                    stroke="#FFD700"
                    strokeWidth="1.5"
                  />
                  <text
                    x={dx}
                    y={dy + 5}
                    fill="#FFD700"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {driver.position || '?'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Replay Controls */}
      {mode === 'replay' && replayData && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Play/Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--ferrari-red)',
                  border: '2px solid var(--ferrari-yellow)',
                  borderRadius: '8px',
                  color: 'var(--ferrari-yellow)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
              </button>
              
              {/* Restart */}
              <button
                onClick={() => { setReplayFrame(0); setIsPlaying(false); }}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--secondary-bg)',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ⏮ RESTART
              </button>
              
              {/* Progress Bar */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="range"
                  min="0"
                  max={replayData.frames.length - 1}
                  value={replayFrame}
                  onChange={(e) => setReplayFrame(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Frame {replayFrame + 1} / {replayData.frames.length}</span>
                  <span>{((replayFrame / replayData.frames.length) * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              {/* Speed Control */}
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                style={{
                  padding: '0.75rem',
                  background: 'var(--secondary-bg)',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="4">4x</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Panel */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MODE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--ferrari-yellow)' }}>
                {mode.toUpperCase()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SESSION</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {sessionInfo?.session_type || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: isLiveSessionActive ? '#00d448' : '#888' }}>
                {isLiveSessionActive ? 'LIVE' : 'ARCHIVED'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DRIVERS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {currentPositions.length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UPDATE RATE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {mode === 'live' ? '2.0s' : `${playbackSpeed}x`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveReplaySwitch;
