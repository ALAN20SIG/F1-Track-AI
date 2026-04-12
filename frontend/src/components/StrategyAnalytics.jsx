import { useState, useEffect } from 'react';

const StrategyAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(() => {
    const cached = localStorage.getItem('f1_analytics_cache');
    return cached ? JSON.parse(cached) : null;
  });
  const [liveTiming, setLiveTiming] = useState(() => {
    const cached = localStorage.getItem('f1_live_timing_cache');
    return cached ? JSON.parse(cached) : [];
  });
  const [lapHistory, setLapHistory] = useState(() => {
    const cached = localStorage.getItem('f1_lap_history_cache');
    return cached ? JSON.parse(cached) : {};
  });
  const [loading, setLoading] = useState(!analyticsData && liveTiming.length === 0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://https://f1-track-ai-production.up.railway.app/api/race/prediction/full');
        const data = await response.json();
        
        if (data.success) {
          setAnalyticsData(data);
          localStorage.setItem('f1_analytics_cache', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchLiveTiming = async () => {
      try {
        const response = await fetch('http://https://f1-track-ai-production.up.railway.app/api/live/timing');
        const data = await response.json();
        if (data.success && data.drivers) {
          setLiveTiming(data.drivers);
          localStorage.setItem('f1_live_timing_cache', JSON.stringify(data.drivers));
          
          // Update lap history for sparklines/trends
          setLapHistory(prev => {
            const newHistory = { ...prev };
            data.drivers.forEach(d => {
              if (!newHistory[d.code]) newHistory[d.code] = [];
              const timeStr = d.lastLapTime;
              const seconds = timeToSeconds(timeStr);
              if (seconds > 0) {
                const lastVal = newHistory[d.code][newHistory[d.code].length - 1];
                if (lastVal !== seconds) {
                  newHistory[d.code] = [...newHistory[d.code], seconds].slice(-20);
                }
              }
            });
            localStorage.setItem('f1_lap_history_cache', JSON.stringify(newHistory));
            return newHistory;
          });
        }
      } catch (err) {
        console.error('Live timing fetch error:', err);
      }
    };

    const timeToSeconds = (timeStr) => {
      if (!timeStr || timeStr === '0:00.000') return 0;
      const [m, s] = timeStr.split(':');
      return parseInt(m) * 60 + parseFloat(s);
    };

    fetchAnalytics();
    fetchLiveTiming();
    
    const interval = setInterval(() => {
      fetchAnalytics();
      fetchLiveTiming();
    }, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, []);

  const renderProbabilityChart = () => {
    if (!analyticsData || !analyticsData.predictions) return null;

    const top6 = analyticsData.predictions.slice(0, 6);
    const maxProb = Math.max(...top6.map(d => d.podium_probability || 0), 1);

    return (
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <div className="card-title">Podium Probability Distribution</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {top6.map(driver => (
              <div key={driver.driver} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', fontWeight: 'bold', color: '#FFF' }}>{driver.driver}</div>
                <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${((driver.podium_probability || 0) / 100) * 100}%`, 
                    background: 'var(--ferrari-red)',
                    transition: 'width 1s ease-out'
                  }} />
                </div>
                <div style={{ width: '60px', textAlign: 'right', fontSize: '0.9rem' }}>
                  {(driver.podium_probability || 0).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderLapTimeTrend = () => {
    // Get up to 8 drivers with history
    const driversWithHistory = Object.keys(lapHistory)
      .filter(code => lapHistory[code].length > 0)
      .slice(0, 8);
    
    if (driversWithHistory.length === 0) {
      return (
        <div className="card">
          <div className="card-header"><div className="card-title">Lap Time Evolution</div></div>
          <div className="card-body" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Waiting for lap data...
          </div>
        </div>
      );
    }

    const allTimes = driversWithHistory.flatMap(code => lapHistory[code]);
    const minTime = Math.min(...allTimes) - 0.2;
    const maxTime = Math.max(...allTimes) + 0.2;
    const range = maxTime - minTime;

    const getDriverColor = (code) => {
      const driver = liveTiming.find(d => d.code === code);
      return driver?.teamColor || '#FFF';
    };

    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Comparative Lap Time Evolution</div>
        </div>
        <div className="card-body" style={{ height: '320px', position: 'relative', padding: '1rem' }}>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', justifyContent: 'center' }}>
            {driversWithHistory.map(code => (
              <div key={code} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                <div style={{ width: '10px', height: '10px', background: getDriverColor(code), borderRadius: '2px' }}></div>
                <span style={{ fontWeight: 'bold' }}>{code}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', height: '220px', position: 'relative' }}>
            {/* Y-Axis */}
            <div style={{ width: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', paddingBottom: '5px' }}>
              <span>{maxTime.toFixed(1)}s</span>
              <span>{minTime.toFixed(1)}s</span>
            </div>

            {/* Chart Area */}
            <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                {driversWithHistory.map(code => (
                  <polyline
                    key={code}
                    points={lapHistory[code].map((p, i) => {
                      const x = (i / (Math.max(lapHistory[code].length - 1, 1))) * 100;
                      const y = 100 - ((p - minTime) / range) * 100;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke={getDriverColor(code)}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    style={{ transition: 'all 0.5s ease' }}
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGapChart = () => {
    const topDrivers = liveTiming.slice(0, 5);
    if (topDrivers.length === 0) return null;

    const maxGap = 30;

    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Live Gap to Leader</div>
        </div>
        <div className="card-body" style={{ height: '300px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topDrivers.map((d, i) => {
              const gapVal = d.gap === 'LEADER' ? 0 : parseFloat(d.gap.replace('+', '')) || 0;
              return (
                <div key={d.code} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', fontSize: '0.8rem' }}>{d.code}</div>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${(1 - gapVal / maxGap) * 100}%`, 
                      background: d.teamColor || '#FFF',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <div style={{ width: '60px', textAlign: 'right', fontSize: '0.8rem' }}>{d.gap}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderStrategyEfficiency = () => {
    const strategies = [
      { name: '1-Stop (M-H)', time: 5400, risk: 'Low', efficiency: 94 },
      { name: '2-Stop (S-M-H)', time: 5385, risk: 'Medium', efficiency: 98 },
      { name: '2-Stop (M-M-H)', time: 5392, risk: 'Low', efficiency: 96 },
      { name: '3-Stop (S-S-M-H)', time: 5410, risk: 'High', efficiency: 88 }
    ];

    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Strategy Efficiency</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {strategies.map(strat => (
              <div key={strat.name} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--ferrari-yellow)' }}>{strat.name}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{strat.efficiency}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading && !analyticsData) return <div style={{ padding: '2rem', textAlign: 'center' }}>Initializing Analytics...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {renderProbabilityChart()}
        {renderStrategyEfficiency()}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {renderLapTimeTrend()}
        {renderGapChart()}
      </div>
      
      <div className="card">
        <div className="card-header">
          <div className="card-title">Technical telemetry (Live)</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FUEL LOAD</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--ferrari-red)' }}>12.4 kg</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TYRE WEAR</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b' }}>22%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ERS CHARGE</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#8b5cf6' }}>88%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TRACK TEMP</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>42.1°C</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyAnalytics;
