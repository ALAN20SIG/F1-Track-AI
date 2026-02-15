import { useState, useEffect, useRef } from 'react';

// Cache for driver data to reduce API calls
const driverCache = {
  data: null,
  timestamp: null,
  CACHE_DURATION: 300000 // 5 minutes
};

const StrategyEngine = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [targetPosition, setTargetPosition] = useState(1);
  const [strategies, setStrategies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [error, setError] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [historicalContext, setHistoricalContext] = useState(null);
  const [expandedStrategy, setExpandedStrategy] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    console.log('StrategyEngine mounted');
    isMounted.current = true;
    
    // Pre-load driver data on mount
    fetchDriversList();
    
    return () => {
      console.log('StrategyEngine unmounting');
      isMounted.current = false;
    };
  }, []);

  const fetchDriversList = async () => {
    // Check cache first
    if (driverCache.data && driverCache.timestamp && 
        (Date.now() - driverCache.timestamp < driverCache.CACHE_DURATION)) {
      console.log('Using cached driver data');
      setDrivers(driverCache.data);
      if (driverCache.data.length > 0 && !selectedDriver) {
        setSelectedDriver(driverCache.data[0].code);
      }
      setLoadingDrivers(false);
      return;
    }

    console.log('Fetching drivers from backend...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      setLoadingDrivers(true);
      
      // Use database endpoint for instant loading (optimized with indexes)
      const response = await fetch('http://localhost:8000/api/db/drivers', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Backend not responding (${response.status})`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      if (data.success && data.drivers && data.drivers.length > 0) {
        // Transform database format to expected format
        const driverList = data.drivers.map(d => ({
          code: d.driver_code,
          fullName: d.full_name,
          team: d.team_name,
          number: d.number
        }));
        
        console.log('Transformed driver list:', driverList.length, 'drivers');
        
        // Update cache
        driverCache.data = driverList;
        driverCache.timestamp = Date.now();
        
        setDrivers(driverList);
        if (driverList.length > 0 && !selectedDriver) {
          setSelectedDriver(driverList[0].code);
        }
        setError(null);
      } else {
        throw new Error('No driver data available in database');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error fetching drivers:', error);
      if (error.name === 'AbortError') {
        setError('Connection timeout. Backend is not responding. Please restart the backend server.');
      } else {
        setError('Unable to load drivers. Please ensure backend is running on http://localhost:8000');
      }
    } finally {
      setLoadingDrivers(false);
    }
  };

  const fetchStrategySuggestions = async () => {
    if (!selectedDriver) {
      console.log('No driver selected');
      return;
    }
    
    console.log(`[${new Date().toLocaleTimeString()}] Generating strategies for ${selectedDriver} targeting position ${targetPosition}`);
    
    setLoading(true);
    setError(null);
    setExpandedStrategy(null);
    setStrategies(null); // Clear previous strategies
    
    // Create abort controller for timeout - 60 seconds for complex analysis
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`[${new Date().toLocaleTimeString()}] Request timeout after 60 seconds`);
      controller.abort();
    }, 60000);
    
    try {
      const url = `http://localhost:8000/api/analysis/strategy-suggestions/${selectedDriver}?target_position=${targetPosition}`;
      console.log(`[${new Date().toLocaleTimeString()}] Fetching from:`, url);
      
      const startTime = Date.now();
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const fetchTime = Date.now() - startTime;
      console.log(`[${new Date().toLocaleTimeString()}] Fetch completed in ${fetchTime}ms, status: ${response.status}`);
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Backend is loading session data. Please wait a moment and try again.');
        }
        throw new Error(`Failed to generate strategies (${response.status})`);
      }
      
      const data = await response.json();
      console.log(`[${new Date().toLocaleTimeString()}] Strategy data received:`, {
        success: data.success,
        strategiesCount: data.strategies?.length,
        hasDriver: !!data.driver,
        hasContext: !!data.historicalContext
      });
      
      if (data.success && data.strategies) {
        // ALWAYS update state, even if component is unmounting
        setStrategies(data.strategies);
        setDriverInfo(data.driver);
        setHistoricalContext(data.historicalContext);
        setError(null);
        console.log(`[${new Date().toLocaleTimeString()}] ✓ Strategies successfully set in state`);
      } else {
        throw new Error(data.error || 'No strategy data returned. Please try again.');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Error fetching strategies:`, error);
      if (error.name === 'AbortError') {
        setError('Request timed out after 60 seconds. The strategy analysis is taking too long. This may indicate a backend performance issue.');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Cannot connect to backend. Please ensure backend is running on http://localhost:8000');
      } else {
        setError(error.message || 'Unable to generate strategies. Please check backend connection.');
      }
    } finally {
      console.log(`[${new Date().toLocaleTimeString()}] Setting loading to false, isMounted:`, isMounted.current);
      setLoading(false);
    }
  };

  const formatExplanation = (explanation) => {
    if (!explanation) return null;
    
    // Split by bullet points and format
    const sections = explanation.split('\n\n');
    return sections.map((section, idx) => {
      if (section.trim().startsWith('•')) {
        const parts = section.split(':**');
        if (parts.length === 2) {
          return (
            <div key={idx} style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--ferrari-yellow)', marginBottom: '0.5rem' }}>
                {parts[0].replace('•', '').trim()}:
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {parts[1].trim()}
              </div>
            </div>
          );
        }
      }
      return <div key={idx} style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{section}</div>;
    });
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'HIGH': return '#ff0000';
      case 'MEDIUM': return '#ffaa00';
      case 'LOW': return '#00d448';
      default: return '#888';
    }
  };

  const getPositionSuffix = (pos) => {
    if (pos === 1) return 'st';
    if (pos === 2) return 'nd';
    if (pos === 3) return 'rd';
    return 'th';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: 'calc(100vh - 120px)' }}>
      {/* Header Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">AI Strategy Engine</div>
            <div className="card-subtitle">
              Personalized race strategy recommendations powered by telemetry analysis
            </div>
          </div>
          {/* Debug Info - Remove after fixing */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Status: {loadingDrivers ? 'Loading...' : `${drivers.length} drivers loaded`} 
            {error && ' | Error occurred'}
          </div>
        </div>
      </div>

      {/* Selection Panel */}
      <div className="card">
        <div className="card-body">
          {loadingDrivers ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--ferrari-yellow)' }}>
                Loading Drivers...
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Fetching session data from FastF1
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
              {/* Driver Selection */}
              <div>
                <label 
                  htmlFor="driver-select"
                  style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.9rem', 
                    fontWeight: 'bold',
                    color: 'var(--ferrari-yellow)'
                  }}
                >
                  SELECT DRIVER
                </label>
                <select
                  id="driver-select"
                  name="driverCode"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--secondary-bg)',
                    border: '2px solid var(--ferrari-red)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {drivers.map(driver => (
                    <option key={driver.code} value={driver.code}>
                      {driver.code} - {driver.fullName} ({driver.team})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Position */}
              <div>
                <label 
                  htmlFor="target-position-select"
                  style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.9rem', 
                    fontWeight: 'bold',
                    color: 'var(--ferrari-yellow)'
                  }}
                >
                  TARGET POSITION
                </label>
                <select
                  id="target-position-select"
                  name="targetPosition"
                  value={targetPosition}
                  onChange={(e) => setTargetPosition(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--secondary-bg)',
                    border: '2px solid var(--ferrari-red)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {[...Array(10)].map((_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      P{idx + 1} ({(idx + 1)}{getPositionSuffix(idx + 1)} Place)
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={fetchStrategySuggestions}
                disabled={loading || !selectedDriver}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: loading 
                    ? 'var(--secondary-bg)' 
                    : 'linear-gradient(135deg, var(--ferrari-red), var(--ferrari-dark-red))',
                  border: '2px solid var(--ferrari-yellow)',
                  borderRadius: '8px',
                  color: 'var(--ferrari-yellow)',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? '🔄 Analyzing...' : '🎯 Generate Strategy'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--ferrari-yellow)', marginBottom: '1rem' }}>
              Analyzing Strategy...
            </div>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              This typically takes 2-5 seconds. If it takes longer than 30 seconds, there may be a connection issue.
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              💡 Tip: Check browser console (F12) for detailed logs
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="card" style={{ border: '2px solid #ff6b6b' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff6b6b', marginBottom: '0.5rem' }}>
              {error}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {drivers.length === 0 
                ? 'Please start the backend server and wait for session data to load'
                : 'Unable to generate strategy recommendations'}
            </div>
          </div>
        </div>
      )}

      {/* Driver Info Card */}
      {driverInfo && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--ferrari-yellow)' }}>
                  {driverInfo.name}
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {driverInfo.team}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AVG LAP TIME</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    {Math.floor(driverInfo.avgLapTime / 60)}:{(driverInfo.avgLapTime % 60).toFixed(3).padStart(6, '0')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CURRENT TIRE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    {driverInfo.currentTire} ({driverInfo.tireAge} laps)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TARGET</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--ferrari-yellow)' }}>
                    P{targetPosition}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Cards */}
      {strategies && strategies.length > 0 && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            {strategies.map((strategy, idx) => (
              <div 
                key={idx} 
                className="card"
                style={{
                  border: idx === 1 ? '3px solid var(--ferrari-yellow)' : '2px solid var(--border-color)',
                  position: 'relative'
                }}
              >
                {idx === 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--ferrari-yellow)',
                    color: '#000',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    RECOMMENDED
                  </div>
                )}
                
                <div className="card-header">
                  <div>
                    <div className="card-title" style={{ color: 'var(--ferrari-yellow)' }}>
                      {strategy.name}
                    </div>
                    <div className="card-subtitle">
                      {strategy.description}
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  {/* Key Metrics */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '0.75rem',
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: 'var(--secondary-bg)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RISK LEVEL</div>
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 'bold',
                        color: getRiskColor(strategy.riskLevel)
                      }}>
                        {strategy.riskLevel}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SUCCESS RATE</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#00d448' }}>
                        {(strategy.probability * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PIT STOPS</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                        {strategy.pitStops}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EXPECTED POS</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--ferrari-yellow)' }}>
                        P{strategy.expectedPosition}
                      </div>
                    </div>
                  </div>

                  {/* Stint Breakdown */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      Stint Breakdown
                    </div>
                    {strategy.stints.map((stint, stintIdx) => (
                      <div 
                        key={stintIdx}
                        style={{
                          padding: '0.5rem',
                          marginBottom: '0.25rem',
                          background: 'var(--secondary-bg)',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: stint.compound === 'SOFT' ? '#ff0000' : 
                                       stint.compound === 'MEDIUM' ? '#ffff00' : '#eeeeee',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: '#000'
                          }}>
                            {stint.compound[0]}
                          </div>
                          <span style={{ fontWeight: 'bold' }}>Stint {stintIdx + 1}</span>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          Lap {stint.startLap}-{stint.startLap + stint.laps - 1} ({stint.laps} laps)
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pit Windows */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      Pit Stop Windows
                    </div>
                    {strategy.pitWindows.map((window, winIdx) => (
                      <div 
                        key={winIdx}
                        style={{
                          padding: '0.5rem',
                          marginBottom: '0.25rem',
                          background: 'var(--secondary-bg)',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ fontWeight: 'bold' }}>Pit {winIdx + 1}</span>
                        <span style={{ color: 'var(--ferrari-yellow)' }}>
                          Lap {window.lap} ({(window.confidence * 100).toFixed(0)}% confidence)
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Fuel Strategy */}
                  <div style={{
                    padding: '0.75rem',
                    background: 'var(--secondary-bg)',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Fuel Strategy
                    </div>
                    <div style={{ fontWeight: 'bold' }}>{strategy.fuelStrategy}</div>
                  </div>

                  {/* Historical Explanation - Expandable */}
                  {strategy.explanation && (
                    <div style={{
                      marginBottom: '1rem',
                      border: '1px solid var(--ferrari-yellow)',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <button
                        onClick={() => setExpandedStrategy(expandedStrategy === idx ? null : idx)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'var(--secondary-bg)',
                          border: 'none',
                          color: 'var(--ferrari-yellow)',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--secondary-bg)'}
                      >
                        <span>📊 Why This Strategy?</span>
                        <span>{expandedStrategy === idx ? '▼' : '▶'}</span>
                      </button>
                      {expandedStrategy === idx && (
                        <div style={{
                          padding: '1rem',
                          background: 'rgba(220, 38, 38, 0.1)',
                          maxHeight: '400px',
                          overflowY: 'auto'
                        }}>
                          {formatExplanation(strategy.explanation)}
                          
                          {/* Historical Basis Summary */}
                          {strategy.historicalBasis && (
                            <div style={{
                              marginTop: '1rem',
                              padding: '0.75rem',
                              background: 'var(--secondary-bg)',
                              borderRadius: '8px',
                              borderLeft: '3px solid var(--ferrari-yellow)'
                            }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--ferrari-yellow)' }}>
                                Driver Profile at Yas Marina:
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>Abu Dhabi Wins: </span>
                                  <span style={{ fontWeight: 'bold' }}>{strategy.historicalBasis.driverWinRate}</span>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>Avg Finish: </span>
                                  <span style={{ fontWeight: 'bold' }}>P{strategy.historicalBasis.avgFinish?.toFixed(1)}</span>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>Tire Management: </span>
                                  <span style={{ fontWeight: 'bold' }}>{strategy.historicalBasis.tireManagement?.toFixed(1)}/10</span>
                                </div>
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>Track Suitability: </span>
                                  <span style={{ 
                                    fontWeight: 'bold',
                                    color: strategy.historicalBasis.trackSuitability === 'HIGH' ? '#00d448' : '#ffaa00'
                                  }}>
                                    {strategy.historicalBasis.trackSuitability}
                                  </span>
                                </div>
                              </div>
                              {strategy.historicalBasis.keyStrengths && strategy.historicalBasis.keyStrengths.length > 0 && (
                                <div style={{ marginTop: '0.5rem' }}>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                    Key Strengths:
                                  </div>
                                  <div style={{ fontSize: '0.85rem' }}>
                                    {strategy.historicalBasis.keyStrengths.join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Advantages */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 'bold', 
                      marginBottom: '0.5rem',
                      color: '#00d448'
                    }}>
                      ✓ Advantages
                    </div>
                    <ul style={{ 
                      margin: 0, 
                      paddingLeft: '1.25rem',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)'
                    }}>
                      {strategy.advantages.map((adv, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{adv}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Disadvantages */}
                  <div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 'bold', 
                      marginBottom: '0.5rem',
                      color: '#ff6b6b'
                    }}>
                      ⚠ Risks
                    </div>
                    <ul style={{ 
                      margin: 0, 
                      paddingLeft: '1.25rem',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)'
                    }}>
                      {strategy.disadvantages.map((dis, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{dis}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!strategies && !loading && (
        <div className="card" style={{ flex: 1 }}>
          <div className="card-body" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '300px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--ferrari-yellow)' }}>
              Ready to Generate Strategy
            </div>
            <div style={{ color: 'var(--text-muted)', maxWidth: '500px' }}>
              Select a driver and target position, then click "Generate Strategy" to receive AI-powered race strategy recommendations tailored to achieve your desired result.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyEngine;
