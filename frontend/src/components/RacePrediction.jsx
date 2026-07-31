import { useState, useEffect } from 'react';
import './RacePrediction.css';

const RacePrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrediction();
    fetchModelInfo();
    
    // Refresh predictions every 2 minutes
    const interval = setInterval(fetchPrediction, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://f1-track-ai-backend.onrender.com/api/race/prediction');
      const data = await response.json();
      
      if (data.success) {
        setPrediction(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load predictions');
      }
    } catch (err) {
      setError('Unable to connect to prediction service');
      console.error('Prediction fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModelInfo = async () => {
    try {
      const response = await fetch('https://f1-track-ai-backend.onrender.com/api/race/model/info');
      const data = await response.json();
      
      if (data.success) {
        setModelInfo(data.model_info);
      }
    } catch (err) {
      console.error('Model info fetch error:', err);
    }
  };

  const trainModel = async () => {
    try {
      setLoading(true);
      setError('Training model... This may take 30-60 seconds');
      
      const response = await fetch('https://f1-track-ai-backend.onrender.com/api/race/train', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setError(null);
        alert('Model trained successfully! Refreshing predictions...');
        await fetchPrediction();
        await fetchModelInfo();
      }
    } catch (err) {
      setError('Training failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTeamColor = (team) => {
    const colors = {
      'McLaren': '#FF8000',
      'Red Bull Racing': '#3671C6',
      'Mercedes': '#27F4D2',
      'Ferrari': '#E8002D',
      'Aston Martin': '#229971',
      'Haas F1 Team': '#B6BABD',
      'Williams': '#64C4FF',
      'Racing Bulls': '#6692FF',
      'Alpine': '#FF87BC',
      'Kick Sauber': '#52E252'
    };
    return colors[team] || '#FFFFFF';
  };

  const getPodiumIcon = (position) => {
    switch(position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return '#10b981'; // Very High - Green
    if (confidence >= 70) return '#ffd700'; // High - Gold  
    if (confidence >= 55) return '#f59e0b'; // Moderate - Orange
    if (confidence >= 40) return '#3b82f6'; // Low - Blue
    return '#ef4444'; // Very Low - Red
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 85) return '🟢 Very High';
    if (confidence >= 70) return '🟡 High';
    if (confidence >= 55) return '🟠 Moderate';
    if (confidence >= 40) return '🔵 Low';
    return '🔴 Very Low';
  };

  if (loading && !prediction) {
    return (
      <div className="race-prediction">
        <div className="prediction-header">
          <h2>🏁 AI Race Prediction</h2>
          <div className="loading-spinner">Loading predictions...</div>
        </div>
      </div>
    );
  }

  if (error && !prediction) {
    return (
      <div className="race-prediction">
        <div className="prediction-header">
          <h2>🏁 AI Race Prediction</h2>
          <div className="error-message">{error}</div>
          <button onClick={trainModel} className="train-button">
            Train Model
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="race-prediction">
      <div className="prediction-header">
        <h2>🏁 AI Race Prediction - Abu Dhabi GP 2025</h2>
        <div className="header-actions">
          <button onClick={fetchPrediction} className="refresh-button">
            🔄 Refresh
          </button>
          <button onClick={trainModel} className="train-button">
            🤖 Retrain
          </button>
        </div>
      </div>

      {/* Model Info */}
      {modelInfo && modelInfo.evaluation_metrics && (
        <div className="model-metrics">
          <div className="metric-card">
            <div className="metric-label">Accuracy</div>
            <div className="metric-value">
              {modelInfo.evaluation_metrics.overall_accuracy}%
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Podium Accuracy</div>
            <div className="metric-value">
              {modelInfo.evaluation_metrics.top3_podium_accuracy}%
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">MAE</div>
            <div className="metric-value">
              {modelInfo.evaluation_metrics.mean_absolute_error} pos
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">CV Score</div>
            <div className="metric-value">
              {modelInfo.evaluation_metrics.cross_validation_mean}%
            </div>
          </div>
        </div>
      )}

      {/* Podium Predictions */}
      {prediction && prediction.podium && (
        <div className="podium-predictions">
          <h3>Predicted Podium Finishers</h3>
          <div className="podium-grid">
            {prediction.podium.map((driver) => (
              <div 
                key={driver.position} 
                className={`podium-card position-${driver.position}`}
                style={{ 
                  borderLeft: `4px solid ${getTeamColor(driver.team)}` 
                }}
              >
                <div className="podium-position">
                  <span className="position-icon">
                    {getPodiumIcon(driver.position)}
                  </span>
                  <span className="position-number">P{driver.position}</span>
                </div>
                <div className="driver-info">
                  <div className="driver-code">{driver.driver}</div>
                  <div className="driver-name">{driver.fullName}</div>
                  <div className="driver-team" style={{ color: getTeamColor(driver.team) }}>
                    {driver.team}
                  </div>
                </div>
                <div className="prediction-stats">
                  <div className="confidence" style={{ marginBottom: '0.5rem' }}>
                    <span className="stat-label">Confidence:</span>
                    <span className="stat-value" style={{ color: getConfidenceColor(driver.confidence) }}>
                      {driver.confidence.toFixed(1)}% {getConfidenceLabel(driver.confidence).split(' ')[0]}
                    </span>
                  </div>
                  {driver.podium_probability && (
                    <div className="podium-prob" style={{ marginBottom: '0.5rem' }}>
                      <span className="stat-label">Podium Prob:</span>
                      <span className="stat-value" style={{ color: '#ffd700' }}>
                        {driver.podium_probability.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div className="skill-rating" style={{ marginBottom: '0.5rem' }}>
                    <span className="stat-label">Skill:</span>
                    <span className="stat-value">{driver.skill_rating}/100</span>
                  </div>
                  <div className="qualifying" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="stat-label">Qualifying:</span>
                    <span className="stat-value">P{driver.qualifying_position}</span>
                    {driver.position_change !== undefined && driver.position_change !== 0 && (
                      <span style={{ 
                        color: driver.position_change > 0 ? '#10b981' : '#ef4444',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}>
                        {driver.position_change > 0 ? `▲ +${driver.position_change}` : `▼ ${driver.position_change}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill"
                    style={{ 
                      width: `${driver.confidence}%`,
                      background: `linear-gradient(90deg, ${getConfidenceColor(driver.confidence)}, ${getConfidenceColor(driver.confidence)}88)`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Grid Prediction Preview */}
      {prediction && prediction.full_predictions && (
        <div className="full-grid-preview">
          <h3>📊 Full Grid Prediction (Top 10)</h3>
          <div className="grid-table">
            <div className="table-header">
              <span>Pos</span>
              <span>Code</span>
              <span>Driver & Team</span>
              <span>Conf.</span>
            </div>
            {prediction.full_predictions.slice(0, 10).map((driver, idx) => (
              <div 
                key={idx} 
                className="table-row"
                style={{ 
                  borderLeft: `3px solid ${getTeamColor(driver.team)}` 
                }}
              >
                <span className="pos">P{idx + 1}</span>
                <span className="driver-code-small">{driver.driver}</span>
                <span className="driver">
                  <div style={{ color: '#FFF', fontSize: '13px' }}>{driver.fullName}</div>
                  <div style={{ color: '#888', fontSize: '11px' }}>{driver.team}</div>
                </span>
                <span className="predicted" style={{ 
                  color: getConfidenceColor(driver.confidence_percentage || driver.confidence || 50),
                  fontSize: '12px', 
                  fontWeight: '600',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end'
                }}>
                  <div>{(driver.confidence_percentage || driver.confidence || 0).toFixed(1)}%</div>
                  {driver.position_change !== undefined && driver.position_change !== 0 && (
                    <div style={{ 
                      fontSize: '10px',
                      color: driver.position_change > 0 ? '#10b981' : '#ef4444'
                    }}>
                      {driver.position_change > 0 ? `▲${driver.position_change}` : `▼${Math.abs(driver.position_change)}`}
                    </div>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {prediction && prediction.prediction_metadata && (
        <div className="prediction-metadata">
          <div className="metadata-item">
            <strong>Circuit:</strong> {prediction.prediction_metadata.circuit}
          </div>
          <div className="metadata-item">
            <strong>Weather:</strong> 
            {prediction.prediction_metadata.weather && (
              <span>
                {' '}Track: {prediction.prediction_metadata.weather.track_temp}°C,
                Air: {prediction.prediction_metadata.weather.air_temp}°C,
                {prediction.prediction_metadata.weather.conditions}
              </span>
            )}
          </div>
          <div className="metadata-item">
            <strong>Predicted:</strong> {new Date(prediction.prediction_metadata.predicted_at).toLocaleString()}
          </div>
        </div>
      )}

      {/* Model Updates Info */}
      {prediction && prediction.prediction_metadata && prediction.prediction_metadata.model_updates && (
        <div className="model-updates" style={{
          marginTop: '1.5rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(220, 0, 0, 0.1), rgba(255, 215, 0, 0.05))',
          borderRadius: '8px',
          border: '2px solid var(--ferrari-red)'
        }}>
          <h3 style={{ 
            color: 'var(--ferrari-yellow)', 
            marginBottom: '1rem',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>✨</span> Model Improvements Applied
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ 
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              borderLeft: '3px solid #ef4444'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: '0.25rem' }}>⬇️ FERRARI ADJUSTED</div>
              <div style={{ fontSize: '0.85rem', color: '#ddd' }}>
                {prediction.prediction_metadata.model_updates.ferrari_adjustment}
              </div>
            </div>
            <div style={{ 
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              borderLeft: '3px solid #10b981'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginBottom: '0.25rem' }}>⬆️ MCLAREN BOOSTED</div>
              <div style={{ fontSize: '0.85rem', color: '#ddd' }}>
                {prediction.prediction_metadata.model_updates.mclaren_boost}
              </div>
            </div>
            <div style={{ 
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              borderLeft: '3px solid #f59e0b'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginBottom: '0.25rem' }}>🏎️ DRIVER ADJUSTMENTS</div>
              <div style={{ fontSize: '0.85rem', color: '#ddd', marginBottom: '0.5rem' }}>
                {prediction.prediction_metadata.model_updates.leclerc_adjustment}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#ddd', marginBottom: '0.5rem' }}>
                {prediction.prediction_metadata.model_updates.hamilton_adjustment}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#ddd', marginBottom: '0.5rem' }}>
                {prediction.prediction_metadata.model_updates.norris_boost}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#ddd' }}>
                {prediction.prediction_metadata.model_updates.piastri_boost}
              </div>
            </div>
            <div style={{ 
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '6px',
              borderLeft: '3px solid #3b82f6'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginBottom: '0.25rem' }}>📊 CONFIDENCE SYSTEM</div>
              <div style={{ fontSize: '0.85rem', color: '#ddd' }}>
                {prediction.prediction_metadata.model_updates.confidence_system}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RacePrediction;
