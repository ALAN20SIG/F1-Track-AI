import { useState, useEffect, useRef } from 'react';

/**
 * LiveTrackMap - Professional F1 Race Visualization
 * Real-time driver positioning with smooth animations
 */
const LiveTrackMap = () => {
  const [driverPositions, setDriverPositions] = useState([]);
  const [interpolatedPositions, setInterpolatedPositions] = useState({});
  const [driverProgress, setDriverProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  const animationFrameRef = useRef(null);
  const isMountedRef = useRef(true);
  const targetDataRef = useRef({});
  const lastFetchTimeRef = useRef(0);
  const progressRef = useRef({});

  // 2026 F1 Season - Team Colors (from drivers2026.js)
  const TEAM_COLORS = {
    'Oracle Red Bull Racing': '#3671C6',
    'Scuderia Ferrari': '#E8002D',
    'Mercedes-AMG Petronas': '#27F4D2',
    'McLaren F1 Team': '#FF8000',
    'BWT Alpine F1 Team': '#FF87BC',
    'Aston Martin Aramco': '#229971',
    'MoneyGram Haas F1 Team': '#B6BABD',
    'Visa Cash App RB': '#6692FF',
    'Williams Racing': '#64C4FF',
    'AUDI': '#52E252',
    'CADILLAC': '#C0C0C0',
    'Unknown': '#FFFFFF'
  };

  // 2026 F1 Season - All 22 Drivers with correct team assignments
  const DRIVER_TEAMS = {
    // Red Bull Racing
    'VER': 'Oracle Red Bull Racing',
    'HAD': 'Oracle Red Bull Racing',
    // Ferrari
    'HAM': 'Scuderia Ferrari',
    'LEC': 'Scuderia Ferrari',
    // Mercedes
    'RUS': 'Mercedes-AMG Petronas',
    'ANT': 'Mercedes-AMG Petronas',
    // McLaren
    'NOR': 'McLaren F1 Team',
    'PIA': 'McLaren F1 Team',
    // Aston Martin
    'ALO': 'Aston Martin Aramco',
    'STR': 'Aston Martin Aramco',
    // Alpine
    'GAS': 'BWT Alpine F1 Team',
    'COL': 'BWT Alpine F1 Team',
    // Williams
    'ALB': 'Williams Racing',
    'SAI': 'Williams Racing',
    // Racing Bulls (RB)
    'LAW': 'Visa Cash App RB',
    'LIN': 'Visa Cash App RB',
    // Haas
    'BEA': 'MoneyGram Haas F1 Team',
    'OCO': 'MoneyGram Haas F1 Team',
    // AUDI
    'HUL': 'AUDI',
    'BOR': 'AUDI',
    // CADILLAC
    'PER': 'CADILLAC',
    'BOT': 'CADILLAC'
  };

  // Yas Marina Circuit - Scaled for larger canvas (1200x900 viewBox)
  // Based on Wikimedia Commons SVG with improved scaling
  const YAS_MARINA_PATH = `
    M 220 815
    C 232 811, 244 820, 252 826
    C 257 830, 258 831, 263 830
    C 282 818, 316 800, 321 796
    C 329 790, 340 781, 326 771
    C 312 758, 207 665, 202 661
    C 197 655, 188 646, 188 642
    C 186 636, 186 633, 186 621
    C 186 608, 186 595, 186 582
    C 186 569, 186 556, 191 552
    C 196 548, 234 520, 245 515
    C 256 509, 265 521, 286 540
    C 307 559, 312 558, 317 555
    C 326 551, 364 529, 378 523
    C 392 516, 392 508, 389 504
    C 387 500, 367 474, 367 474
    C 367 474, 271 394, 260 385
    C 248 374, 245 366, 251 360
    C 256 354, 296 300, 296 300
    C 296 300, 301 291, 314 283
    C 337 267, 348 267, 357 276
    C 369 285, 590 379, 609 394
    C 628 409, 640 408, 651 401
    C 660 393, 722 351, 745 336
    C 768 320, 771 308, 768 299
    C 766 290, 754 259 750 249
    C 746 238, 749 210, 757 195
    C 780 164, 795 164, 852 151
    C 883 144, 927 126, 944 113
    C 961 100, 1054 36, 1054 36
    C 1054 36, 1046 26, 1043 18
    C 1041 10, 1052 7, 1052 7
    L 1122 4
    C 1122 4, 1144 12, 1139 25
    C 1134 38, 1111 31, 1111 31
    L 482 197
    L 392 235
    L 237 291
    C 225 295, 214 299, 220 307
    C 228 316, 237 322, 242 326
    C 245 330, 256 334, 245 342
    C 233 351, 210 372, 193 391
    C 170 421, 144 484, 138 594
    C 135 629, 135 693, 135 728
    C 135 762, 156 841, 165 864
    C 170 877, 196 865, 212 860
    L 233 880
    Z
  `;

  // Path reference for precise driver positioning
  const pathRef = useRef(null);
  
  // Get position along path at specific distance (0-1)
  const getPositionAtDistance = (distance) => {
    if (!pathRef.current) return { x: 220, y: 815 };
    const pathLength = pathRef.current.getTotalLength();
    const point = pathRef.current.getPointAtLength(distance * pathLength);
    return { x: point.x, y: point.y };
  };

  // Accurate Yas Marina Circuit corner positions (T1-T20)
  // Based on official FIA circuit map and telemetry data
  const CORNERS = [
    { num: 1, x: 320, y: 798, label: 'T1' },      // First corner after start/finish
    { num: 2, x: 330, y: 775, label: 'T2' },      // Left hander (part of T1 complex)
    { num: 3, x: 255, y: 665, label: 'T3' },      // Hotel complex entry (right)
    { num: 4, x: 195, y: 645, label: 'T4' },      // Hotel complex (left hairpin)
    { num: 5, x: 188, y: 590, label: 'T5' },      // Hotel complex exit
    { num: 6, x: 198, y: 555, label: 'T6' },      // Through hotel section
    { num: 7, x: 250, y: 520, label: 'T7' },      // Left hander
    { num: 8, x: 320, y: 545, label: 'T8' },      // Right hander into marina
    { num: 9, x: 375, y: 515, label: 'T9' },      // Marina section entry
    { num: 10, x: 375, y: 470, label: 'T10' },    // Marina left hander
    { num: 11, x: 270, y: 390, label: 'T11' },    // Marina chicane entry
    { num: 12, x: 255, y: 365, label: 'T12' },    // Marina chicane apex
    { num: 13, x: 305, y: 305, label: 'T13' },    // Marina chicane exit
    { num: 14, x: 355, y: 280, label: 'T14' },    // Marina exit onto back straight
    { num: 15, x: 600, y: 395, label: 'T15' },    // End of back straight (right)
    { num: 16, x: 660, y: 400, label: 'T16' },    // Left hander
    { num: 17, x: 750, y: 340, label: 'T17' },    // Right hander
    { num: 18, x: 770, y: 305, label: 'T18' },    // Left hander
    { num: 19, x: 760, y: 255, label: 'T19' },    // North hairpin (left)
    { num: 20, x: 950, y: 115, label: 'T20' }     // Final corner before main straight
  ];

  // DRS Zones - Yas Marina Circuit (3 zones)
  // DRS 1: Main straight (detection before T1, activation after T20)
  // DRS 2: Back straight (between T8 and T9)
  // DRS 3: Between T14 and T15
  const DRS_ZONES = [
    { 
      name: 'DRS 1', 
      x: 260, 
      y: 810, 
      rotation: -35,
      detectionX: 210,
      detectionY: 820
    },    // Main straight - detection before T1
    { 
      name: 'DRS 2', 
      x: 380, 
      y: 490, 
      rotation: 0,
      detectionX: 390,
      detectionY: 520
    },    // Between T8-T9
    { 
      name: 'DRS 3', 
      x: 520, 
      y: 380, 
      rotation: 5,
      detectionX: 480,
      detectionY: 370
    }     // Between T14-T15
  ];

  useEffect(() => {
    isMountedRef.current = true;
    generateFallbackPositions();
    startAnimationLoop();
    
    const pollInterval = setInterval(fetchDriverPositions, 2000);
    
    return () => {
      isMountedRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(pollInterval);
    };
  }, []);

  const fetchDriverPositions = async () => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1500) return;
    lastFetchTimeRef.current = now;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch('https://f1-track-ai-backend.onrender.com/api/live/positions', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data.success && isMountedRef.current) {
        const positions = data.positions || [];
        if (positions.length === 0) {
          generateFallbackPositions();
          return;
        }
        
        const enrichedPositions = positions.map(pos => ({
          ...pos,
          team: pos.team || DRIVER_TEAMS[pos.code] || 'Unknown',
          teamColor: pos.teamColor || TEAM_COLORS[DRIVER_TEAMS[pos.code]] || '#FFFFFF'
        }));
        
        setDriverPositions(enrichedPositions);
        updateTargetPositions(enrichedPositions);
        setLoading(false);
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.log('Using fallback data');
      if (driverPositions.length === 0) {
        generateFallbackPositions();
      }
      setConnectionStatus('fallback');
    }
  };

  const generateFallbackPositions = () => {
    // All 22 drivers from 2026 season with realistic race positions
    const fallbackDrivers = [
      { code: 'VER', position: 1, speed: 285, progress: 0.05 },
      { code: 'NOR', position: 2, speed: 284, progress: 0.07 },
      { code: 'LEC', position: 3, speed: 283, progress: 0.09 },
      { code: 'HAM', position: 4, speed: 282, progress: 0.11 },
      { code: 'PIA', position: 5, speed: 281, progress: 0.13 },
      { code: 'RUS', position: 6, speed: 280, progress: 0.15 },
      { code: 'ANT', position: 7, speed: 278, progress: 0.17 },
      { code: 'ALB', position: 8, speed: 276, progress: 0.19 },
      { code: 'SAI', position: 9, speed: 275, progress: 0.21 },
      { code: 'ALO', position: 10, speed: 274, progress: 0.23 },
      { code: 'STR', position: 11, speed: 273, progress: 0.25 },
      { code: 'GAS', position: 12, speed: 272, progress: 0.27 },
      { code: 'COL', position: 13, speed: 271, progress: 0.29 },
      { code: 'OCO', position: 14, speed: 270, progress: 0.31 },
      { code: 'BEA', position: 15, speed: 269, progress: 0.33 },
      { code: 'LAW', position: 16, speed: 268, progress: 0.35 },
      { code: 'LIN', position: 17, speed: 267, progress: 0.37 },
      { code: 'HUL', position: 18, speed: 266, progress: 0.39 },
      { code: 'BOR', position: 19, speed: 265, progress: 0.41 },
      { code: 'HAD', position: 20, speed: 264, progress: 0.43 },
      { code: 'PER', position: 21, speed: 262, progress: 0.45 },
      { code: 'BOT', position: 22, speed: 260, progress: 0.47 }
    ];
    
    const positions = fallbackDrivers.map((driver) => {
      const pos = getPositionAtDistance(driver.progress);
      
      return {
        ...driver,
        x: pos.x,
        y: pos.y,
        team: DRIVER_TEAMS[driver.code] || 'Unknown',
        teamColor: TEAM_COLORS[DRIVER_TEAMS[driver.code]] || '#FFFFFF'
      };
    });
    
    setDriverPositions(positions);
    updateTargetPositions(positions);
    setLoading(false);
    setConnectionStatus('fallback');
  };

  const updateTargetPositions = (positions) => {
    positions.forEach(driver => {
      // Initialize progress if not exists
      if (!progressRef.current[driver.code]) {
        progressRef.current[driver.code] = {
          ...driver,
          progress: driver.progress || Math.random() * 0.5
        };
      } else {
        // Update speed and other data but keep progress
        progressRef.current[driver.code] = {
          ...progressRef.current[driver.code],
          ...driver,
          progress: progressRef.current[driver.code].progress
        };
      }
    });
  };

  const startAnimationLoop = () => {
    const animate = () => {
      if (!isMountedRef.current) return;
      
      if (isPlaying && pathRef.current) {
        // Update progress for each driver
        Object.keys(progressRef.current).forEach(driverCode => {
          const driver = progressRef.current[driverCode];
          if (driver) {
            // Move forward based on speed (normalized to lap progress)
            const speedFactor = (driver.speed / 300) * 0.0005 * playbackSpeed;
            progressRef.current[driverCode].progress = (driver.progress + speedFactor) % 1;
          }
        });
        
        // Update positions based on path
        setInterpolatedPositions(prev => {
          const newPositions = { ...prev };
          
          Object.keys(progressRef.current).forEach(driverCode => {
            const progress = progressRef.current[driverCode]?.progress || 0;
            const driverData = progressRef.current[driverCode];
            const pos = getPositionAtDistance(progress);
            
            if (driverData) {
              newPositions[driverCode] = {
                ...driverData,
                svgX: pos.x,
                svgY: pos.y
              };
            }
          });
          
          return newPositions;
        });
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      color: '#fff'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#fff'
    },
    status: {
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase'
    },
    statusConnected: {
      backgroundColor: '#22c55e',
      color: '#000'
    },
    statusFallback: {
      backgroundColor: '#f59e0b',
      color: '#000'
    },
    trackContainer: {
      position: 'relative',
      width: '100%',
      maxWidth: '1000px',
      margin: '0 auto',
      backgroundColor: '#111',
      borderRadius: '12px',
      padding: '20px'
    },
    legend: {
      display: 'flex',
      gap: '20px',
      marginTop: '20px',
      flexWrap: 'wrap',
      justifyContent: 'center'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px'
    },
    legendDot: {
      width: '12px',
      height: '12px',
      borderRadius: '50%'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Yas Marina Circuit - Live Track Map</h1>
        <span style={{
          ...styles.status,
          ...(connectionStatus === 'connected' ? styles.statusConnected : styles.statusFallback)
        }}>
          {connectionStatus === 'connected' ? 'Live' : 'Demo Mode'}
        </span>
      </div>

      <div style={styles.trackContainer}>
        <svg viewBox="0 0 1200 950" style={{ width: '100%', height: 'auto' }}>
          {/* Background */}
          <rect x="0" y="0" width="1200" height="950" fill="#0d0d0d" rx="16" />
          
          {/* Hidden reference path for driver positioning */}
          <path
            ref={pathRef}
            d={YAS_MARINA_PATH}
            fill="none"
            stroke="none"
            id="trackPath"
          />
          
          {/* Track kerbs */}
          <path
            d={YAS_MARINA_PATH}
            fill="none"
            stroke="#dc2626"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Track asphalt */}
          <path
            d={YAS_MARINA_PATH}
            fill="none"
            stroke="#374151"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Racing line */}
          <path
            d={YAS_MARINA_PATH}
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
            strokeDasharray="8,8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />

          {/* Start/Finish line - Main straight */}
          <g>
            <line x1="205" y1="805" x2="205" y2="835" stroke="#fff" strokeWidth="5" />
            <rect x="195" y="790" width="60" height="18" fill="#000" opacity="0.8" rx="3" />
            <text x="225" y="803" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">START</text>
          </g>

          {/* Driver dots */}
          {Object.values(interpolatedPositions).map(driver => (
            <g key={driver.code}>
              <circle
                cx={driver.svgX}
                cy={driver.svgY}
                r="8"
                fill={driver.teamColor}
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={driver.svgX}
                y={driver.svgY + 3}
                textAnchor="middle"
                fill="#000"
                fontSize="8"
                fontWeight="bold"
              >
                {driver.code}
              </text>
              <text
                x={driver.svgX}
                y={driver.svgY - 12}
                textAnchor="middle"
                fill="#fff"
                fontSize="9"
              >
                {Math.round(driver.speed)} km/h
              </text>
            </g>
          ))}
        </svg>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading track data...
          </div>
        )}
      </div>

      {/* Legend - All 10 Teams */}
      <div style={styles.legend}>
        {Object.entries(TEAM_COLORS)
          .filter(([team]) => team !== 'Unknown')
          .map(([team, color]) => (
            <div key={team} style={styles.legendItem}>
              <div style={{ ...styles.legendDot, backgroundColor: color }} />
              <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{team}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default LiveTrackMap;
