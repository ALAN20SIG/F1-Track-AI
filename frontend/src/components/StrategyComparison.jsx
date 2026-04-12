import { useState, useEffect } from 'react';
import drivers2025 from '../data/drivers2025';

const StrategyComparison = () => {
  const [selectedDrivers, setSelectedDrivers] = useState(['VER', 'NOR', 'PIA']);
  const [raceLaps, setRaceLaps] = useState(57);
  const [historicalData, setHistoricalData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [predictiveAnalytics, setPredictiveAnalytics] = useState(null);
  
  // Fetch historical and weather data for enhanced analysis
  useEffect(() => {
    fetchHistoricalData();
    fetchWeatherData();
  }, []);
  
  const fetchHistoricalData = async () => {
    try {
      const response = await fetch('http://https://f1-track-ai-production.up.railway.app/api/analysis/race-telemetry');
      const data = await response.json();
      if (data.success) {
        setHistoricalData(data);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };
  
  const fetchWeatherData = async () => {
    try {
      const response = await fetch('http://https://f1-track-ai-production.up.railway.app/api/live/weather');
      const data = await response.json();
      if (data.success) {
        setWeatherData(data.display);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };
  
  // Initialize configs for all drivers
  const initializeDriverConfigs = () => {
    const configs = {};
    drivers2025.forEach((driver, index) => {
      configs[driver.code] = {
        tyrCompound: 'MEDIUM',
        pitLap1: 18 + Math.floor(index / 5),
        pitLap2: 38 + Math.floor(index / 5),
        compound1: 'MEDIUM',
        compound2: 'HARD',
        fuelLoad: 108 + (index % 3),
        riskLevel: 'MEDIUM',
        baseLapTime: 83.3 + (index * 0.05),
      };
    });
    return configs;
  };

  const [driverConfigs, setDriverConfigs] = useState(initializeDriverConfigs());

  const [comparisonResults, setComparisonResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const toggleDriver = (code) => {
    setSelectedDrivers(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else if (prev.length < 10) {
        return [...prev, code];
      }
      return prev;
    });
  };

  const updateDriverConfig = (driverCode, field, value) => {
    setDriverConfigs(prev => ({
      ...prev,
      [driverCode]: {
        ...prev[driverCode],
        [field]: value,
      }
    }));
  };

  // Calculate race simulation based on strategy with predictive analytics
  const calculateRaceStrategy = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const results = selectedDrivers.map(code => {
        const config = driverConfigs[code] || {};
        const driver = drivers2025.find(d => d.code === code);
        
        // Get historical performance for this driver if available
        const historicalPerformance = historicalData?.drivers.find(d => d.code === code);
        const historicalAvgLap = historicalPerformance?.avgLapTime || config.baseLapTime;
        
        // Weather impact factors
        const weatherImpact = weatherData ? {
          trackTemp: weatherData.track_temp || 42,
          airTemp: weatherData.air_temp || 31,
          humidity: weatherData.humidity || 35,
          // High track temp increases tire degradation
          tempMultiplier: 1 + ((weatherData.track_temp - 35) * 0.01)
        } : { tempMultiplier: 1 };
        
        // Tyre compound performance multipliers
        const tyrePerf = {
          'SOFT': { speed: 1.05, degradation: 0.08 * weatherImpact.tempMultiplier, life: 20 },
          'MEDIUM': { speed: 1.0, degradation: 0.05 * weatherImpact.tempMultiplier, life: 30 },
          'HARD': { speed: 0.96, degradation: 0.03 * weatherImpact.tempMultiplier, life: 40 },
        };

        // Calculate stint times
        const stint1Laps = config.pitLap1;
        const stint2Laps = config.pitLap2 - config.pitLap1;
        const stint3Laps = raceLaps - config.pitLap2;

        // Risk factor impact
        const riskMultiplier = {
          'LOW': 1.0,
          'MEDIUM': 0.98,
          'HIGH': 0.95,
        }[config.riskLevel] || 1.0;
        
        // Use historical data for base lap time if available
        const effectiveBaseLap = historicalPerformance ? historicalAvgLap : config.baseLapTime;

        // Calculate stint 1
        const compound1 = tyrePerf[config.compound1];
        let stint1Time = 0;
        for (let lap = 0; lap < stint1Laps; lap++) {
          const degradation = 1 + (lap * compound1.degradation);
          stint1Time += effectiveBaseLap * degradation * compound1.speed * riskMultiplier;
        }

        // Calculate stint 2 (with pit stop)
        const compound2 = tyrePerf[config.compound2];
        let stint2Time = 22; // Pit stop time
        for (let lap = 0; lap < stint2Laps; lap++) {
          const degradation = 1 + (lap * compound2.degradation);
          stint2Time += effectiveBaseLap * degradation * compound2.speed * riskMultiplier;
        }

        // Calculate stint 3 (with pit stop)
        const compound3 = tyrePerf[config.compound2]; // Usually same as stint 2
        let stint3Time = 22; // Pit stop time
        for (let lap = 0; lap < stint3Laps; lap++) {
          const degradation = 1 + (lap * compound3.degradation);
          stint3Time += effectiveBaseLap * degradation * compound3.speed * riskMultiplier;
        }

        // Fuel effect (lighter = faster)
        const fuelEffect = (config.fuelLoad - 100) * 0.02; // seconds per kg
        
        const totalTime = stint1Time + stint2Time + stint3Time + fuelEffect;
        const avgLapTime = totalTime / raceLaps;
        
        // Predictive analytics - calculate probability of success
        const consistency = historicalPerformance?.stdDeviation || 0.5;
        const successProbability = Math.max(0.4, Math.min(0.95, 0.85 - (consistency * 0.2) - ((config.riskLevel === 'HIGH' ? 0.15 : 0) + (config.riskLevel === 'LOW' ? 0.05 : 0))));
        
        // Calculate risk assessment
        const riskScore = {
          tireDegradation: compound1.degradation > 0.06 ? 'HIGH' : compound1.degradation > 0.04 ? 'MEDIUM' : 'LOW',
          weatherVulnerability: weatherData?.track_temp > 45 ? 'HIGH' : weatherData?.track_temp > 40 ? 'MEDIUM' : 'LOW',
          strategyRisk: config.riskLevel,
          overallRisk: config.riskLevel
        };

        return {
          code: code,
          name: driver.fullName,
          teamColor: driver.teamColor,
          totalTime: totalTime,
          avgLapTime: avgLapTime,
          stint1Time: stint1Time,
          stint2Time: stint2Time,
          stint3Time: stint3Time,
          pitStops: 2,
          strategy: `${config.compound1[0]}-${config.compound2[0]}-${config.compound2[0]}`,
          predictedPosition: 0,
          successProbability: successProbability,
          riskAssessment: riskScore,
          weatherImpact: weatherImpact,
          historicalBaseline: historicalPerformance ? 'Available' : 'Estimated'
        };
      });

      // Sort by total time and assign positions
      results.sort((a, b) => a.totalTime - b.totalTime);
      results.forEach((r, i) => r.predictedPosition = i + 1);
      
      // Generate predictive analytics summary
      const analytics = {
        optimalStrategy: results[0]?.code,
        averageSuccessRate: (results.reduce((sum, r) => sum + r.successProbability, 0) / results.length * 100).toFixed(1),
        highRiskStrategies: results.filter(r => r.riskAssessment.overallRisk === 'HIGH').length,
        weatherImpactLevel: weatherData?.track_temp > 45 ? 'SEVERE' : weatherData?.track_temp > 40 ? 'MODERATE' : 'LOW',
        recommendedApproach: results[0]?.riskAssessment.overallRisk === 'HIGH' ? 'Aggressive (High Risk)' : results[0]?.riskAssessment.overallRisk === 'LOW' ? 'Conservative' : 'Balanced'
      };
      setPredictiveAnalytics(analytics);

      setComparisonResults(results);
      setIsCalculating(false);
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
  };

  const getDriver = (code) => drivers2025.find(d => d.code === code);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Enhanced Strategy Comparison with Predictive Analytics</div>
          <div className="card-subtitle">Compare strategies with AI-powered risk assessment and historical data analysis</div>
        </div>
      </div>
      <div className="card-body">
        
        {/* Predictive Analytics Summary */}
        {predictiveAnalytics && (
          <div style={{ 
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--secondary-bg)',
            borderRadius: '8px',
            border: '2px solid var(--ferrari-yellow)'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--ferrari-yellow)' }}>
              🔮 Predictive Analytics Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  OPTIMAL STRATEGY
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#00d448' }}>
                  {predictiveAnalytics.optimalStrategy}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  AVG SUCCESS RATE
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--ferrari-yellow)' }}>
                  {predictiveAnalytics.averageSuccessRate}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  HIGH RISK STRATEGIES
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ff6b6b' }}>
                  {predictiveAnalytics.highRiskStrategies}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  WEATHER IMPACT
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 
                  predictiveAnalytics.weatherImpactLevel === 'SEVERE' ? '#ff0000' :
                  predictiveAnalytics.weatherImpactLevel === 'MODERATE' ? '#ffaa00' : '#00d448'
                }}>
                  {predictiveAnalytics.weatherImpactLevel}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  RECOMMENDED APPROACH
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {predictiveAnalytics.recommendedApproach}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Weather Context */}
        {weatherData && (
          <div style={{ 
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--secondary-bg)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-around'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TRACK TEMP</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: weatherData.track_temp > 45 ? '#ff0000' : 'var(--text-primary)' }}>
                {weatherData.track_temp}°C
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AIR TEMP</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {weatherData.air_temp}°C
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HUMIDITY</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {weatherData.humidity}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CONDITIONS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {weatherData.conditions}
              </div>
            </div>
          </div>
        )}
        {/* Driver Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
<label className="form-label">Select Drivers to Compare (max 10)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {drivers2025.map(driver => (
              <div
                key={driver.code}
                onClick={() => toggleDriver(driver.code)}
                style={{
                  padding: '0.5rem 1rem',
                  background: selectedDrivers.includes(driver.code) ? driver.teamColor + '30' : 'var(--bg-tertiary)',
                  border: `2px solid ${selectedDrivers.includes(driver.code) ? driver.teamColor : 'var(--border-color)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s',
                }}
              >
                {driver.code}
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Configuration for Each Driver */}
        {selectedDrivers.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Strategy Configuration</label>
            <div style={{ display: 'grid', gap: '1rem', marginTop: '0.5rem' }}>
              {selectedDrivers.map(code => {
                const driver = getDriver(code);
                const config = driverConfigs[code] || {};
                
                return (
                  <div 
                    key={code}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                      border: `2px solid ${driver.teamColor}40`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: driver.teamColor
                      }} />
                      <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {driver.code} - {driver.fullName}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Base Lap Time (s)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={config.baseLapTime}
                          onChange={(e) => updateDriverConfig(code, 'baseLapTime', parseFloat(e.target.value))}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Pit Stop 1 (Lap)
                        </label>
                        <input
                          type="number"
                          value={config.pitLap1}
                          onChange={(e) => updateDriverConfig(code, 'pitLap1', parseInt(e.target.value))}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Pit Stop 2 (Lap)
                        </label>
                        <input
                          type="number"
                          value={config.pitLap2}
                          onChange={(e) => updateDriverConfig(code, 'pitLap2', parseInt(e.target.value))}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Stint 1 Tyre
                        </label>
                        <select
                          value={config.compound1}
                          onChange={(e) => updateDriverConfig(code, 'compound1', e.target.value)}
                          className="form-input"
                          style={{ width: '100%' }}
                        >
                          <option value="SOFT">Soft</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Stint 2/3 Tyre
                        </label>
                        <select
                          value={config.compound2}
                          onChange={(e) => updateDriverConfig(code, 'compound2', e.target.value)}
                          className="form-input"
                          style={{ width: '100%' }}
                        >
                          <option value="SOFT">Soft</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Risk Level
                        </label>
                        <select
                          value={config.riskLevel}
                          onChange={(e) => updateDriverConfig(code, 'riskLevel', e.target.value)}
                          className="form-input"
                          style={{ width: '100%' }}
                        >
                          <option value="LOW">Low (Conservative)</option>
                          <option value="MEDIUM">Medium (Balanced)</option>
                          <option value="HIGH">High (Aggressive)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Fuel Load (kg)
                        </label>
                        <input
                          type="number"
                          value={config.fuelLoad}
                          onChange={(e) => updateDriverConfig(code, 'fuelLoad', parseInt(e.target.value))}
                          className="form-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calculate Button */}
        <button
          className="btn"
          onClick={calculateRaceStrategy}
          disabled={selectedDrivers.length === 0 || isCalculating}
          style={{ width: '100%', marginBottom: '1.5rem' }}
        >
          {isCalculating ? 'Calculating...' : 'Calculate & Compare Strategies'}
        </button>

        {/* Results */}
        {comparisonResults && (
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Race Prediction Results
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', color: 'var(--text-muted)' }}>POS</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', color: 'var(--text-muted)' }}>DRIVER</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', color: 'var(--text-muted)' }}>STRATEGY</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-muted)' }}>TOTAL TIME</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-muted)' }}>AVG LAP</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-muted)' }}>GAP</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonResults.map((result, index) => {
                    const gap = index === 0 ? '-' : `+${(result.totalTime - comparisonResults[0].totalTime).toFixed(3)}s`;
                    
                    return (
                      <tr 
                        key={result.code}
                        style={{ 
                          borderBottom: '1px solid var(--border-color)',
                          background: index < 3 ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '0.75rem', fontWeight: '700', color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'var(--text-primary)' }}>
                          P{result.predictedPosition}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: result.teamColor }} />
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{result.code}</span>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{result.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                          {result.strategy}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {formatTime(result.totalTime)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {result.avgLapTime.toFixed(3)}s
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          {gap}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Performance Chart */}
            <div style={{ marginTop: '2rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Lap Time Comparison
              </div>
              {comparisonResults.map((result, index) => (
                <div key={result.code} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: result.teamColor }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{result.code}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {result.avgLapTime.toFixed(3)}s
                    </span>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${((comparisonResults[comparisonResults.length - 1].avgLapTime - result.avgLapTime + result.avgLapTime) / comparisonResults[comparisonResults.length - 1].avgLapTime) * 100}%`,
                      background: result.teamColor,
                      borderRadius: '4px',
                      transition: 'width 0.5s'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyComparison;
