import { useState } from 'react';
import drivers2025 from '../data/drivers2025';

const StrategySimulator = () => {
  const [selectedDrivers, setSelectedDrivers] = useState(['VER', 'NOR', 'LEC', 'PIA', 'HAM']);
  const [raceLaps, setRaceLaps] = useState(57);
  const [numSimulations, setNumSimulations] = useState(1000);
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState(null);
  const [jobId, setJobId] = useState(null);

  const API_BASE_URL = 'https://f1-track-ai-production.up.railway.app';

  const toggleDriver = (driverCode) => {
    setSelectedDrivers(prev => {
      if (prev.includes(driverCode)) {
        return prev.filter(code => code !== driverCode);
      } else {
        return [...prev, driverCode];
      }
    });
  };

  const runSimulation = async () => {
    if (selectedDrivers.length === 0) {
      alert('Please select at least one driver');
      return;
    }

    setIsSimulating(true);
    setResults(null);

    try {
      // Prepare simulation data
      const simulationData = {
        race_laps: raceLaps,
        n_simulations: numSimulations,
        drivers: selectedDrivers.map((code, index) => {
          const driver = drivers2025.find(d => d.code === code);
          return {
            driver_code: code,
            driver_name: driver.fullName,
            team: driver.teamName,
            base_lap: 83.5 + Math.random() * 2, // Base lap time in seconds
            degradation: 0.02 + Math.random() * 0.01, // Degradation per lap
            lap_std: 0.15 + Math.random() * 0.1, // Standard deviation
            pit_stops: index % 2 === 0 ? [20, 40] : [18, 38], // Pit strategy
            pit_delta: 22.0 + Math.random() * 2 // Pit stop time loss
          };
        })
      };

      // Start simulation
      const response = await fetch(`${API_BASE_URL}/api/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(simulationData),
      });

      if (!response.ok) {
        throw new Error('Failed to start simulation');
      }

      const data = await response.json();
      setJobId(data.job_id);

      // Poll for results
      pollJobStatus(data.job_id);
    } catch (error) {
      console.error('Simulation error:', error);
      alert('Failed to run simulation. Make sure the backend is running on port 8000.');
      setIsSimulating(false);
    }
  };

  const pollJobStatus = async (jobId) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/status/${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to get job status');
        }

        const data = await response.json();

        if (data.status === 'completed') {
          setResults(data.results);
          setIsSimulating(false);
        } else if (data.status === 'failed') {
          alert('Simulation failed: ' + (data.error || 'Unknown error'));
          setIsSimulating(false);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000);
        } else {
          alert('Simulation timeout');
          setIsSimulating(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
        setIsSimulating(false);
      }
    };

    poll();
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Strategy Simulator</div>
          <div className="card-subtitle">Monte-Carlo race simulation</div>
        </div>
      </div>
      <div className="card-body">
        {!results ? (
          <div className="simulator-controls">
            <div className="form-group">
              <label className="form-label">Race Laps</label>
              <input 
                type="number" 
                className="form-input"
                value={raceLaps}
                onChange={(e) => setRaceLaps(parseInt(e.target.value))}
                min="1"
                max="100"
                disabled={isSimulating}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Simulations</label>
              <input 
                type="number" 
                className="form-input"
                value={numSimulations}
                onChange={(e) => setNumSimulations(parseInt(e.target.value))}
                min="100"
                max="10000"
                step="100"
                disabled={isSimulating}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Drivers</label>
              <div className="driver-selector">
                {drivers2025.slice(0, 10).map(driver => (
                  <div
                    key={driver.code}
                    className={`driver-chip ${selectedDrivers.includes(driver.code) ? 'selected' : ''}`}
                    onClick={() => !isSimulating && toggleDriver(driver.code)}
                    style={{
                      borderColor: selectedDrivers.includes(driver.code) ? driver.teamColor : undefined
                    }}
                  >
                    {driver.code}
                  </div>
                ))}
              </div>
            </div>

            {isSimulating ? (
              <div className="simulation-status">
                <div className="status-spinner"></div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Running {numSimulations} simulations...
                </div>
              </div>
            ) : (
              <button 
                className="btn" 
                onClick={runSimulation}
                disabled={selectedDrivers.length === 0}
              >
                Run Simulation
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Simulation complete ({numSimulations} runs)
                </div>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => setResults(null)}
                style={{ padding: '0.5rem 1rem' }}
              >
                New Simulation
              </button>
            </div>

            <div className="results-table">
              <div className="result-row result-header">
                <div>POS</div>
                <div>DRIVER</div>
                <div>WIN %</div>
                <div>PODIUM %</div>
                <div>AVG POS</div>
              </div>
              {results.map((result, index) => (
                <div key={result.driver_code} className="result-row">
                  <div className="position">{index + 1}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{result.driver_code}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {result.driver_name}
                    </div>
                  </div>
                  <div>
                    <div className="percentage-value">{result.win_percentage}%</div>
                    <div className="percentage-bar">
                      <div 
                        className="percentage-fill" 
                        style={{ width: `${result.win_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="percentage-value">{result.podium_percentage}%</div>
                    <div className="percentage-bar">
                      <div 
                        className="percentage-fill" 
                        style={{ width: `${result.podium_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {result.avg_finish_position.toFixed(1)}
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

export default StrategySimulator;
