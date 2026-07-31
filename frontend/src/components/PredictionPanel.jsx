import { useState, useEffect } from 'react';

const PredictionPanel = () => {
  const [predictions, setPredictions] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState(null);

  const fetchModelInfo = async () => {
    try {
      const response = await fetch('https://f1-track-ai-backend.onrender.com/api/ml/model/info');
      const data = await response.json();
      setModelInfo(data);
    } catch (err) {
      console.error('Error fetching model info:', err);
    }
  };

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://f1-track-ai-backend.onrender.com/api/ml/predict/race');
      const data = await response.json();
      
      if (data.success) {
        setPredictions(data.predictions);
      } else {
        setError(data.error || 'Failed to get predictions');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError('Failed to connect to prediction service');
    }
    setLoading(false);
  };

  const startTraining = async () => {
    setTraining(true);
    setError(null);
    try {
      const response = await fetch('https://f1-track-ai-backend.onrender.com/api/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Training started! This will take 5-15 minutes. Check backend console for progress.');
        // Poll for model updates
        setTimeout(() => {
          fetchModelInfo();
          setTraining(false);
        }, 300000); // Check after 5 minutes
      }
    } catch (err) {
      console.error('Training error:', err);
      setError('Failed to start training');
      setTraining(false);
    }
  };

  useEffect(() => {
    fetchModelInfo();
    fetchPredictions();
    
    // Refresh predictions every 30 seconds
    const interval = setInterval(fetchPredictions, 30000);
    return () => clearInterval(interval);
  }, []);

  const getProbabilityColor = (probability) => {
    if (probability > 0.7) return '#10b981'; // Green
    if (probability > 0.5) return '#f59e0b'; // Orange
    if (probability > 0.3) return '#fbbf24'; // Yellow
    return '#6b7280'; // Gray
  };

  const getProbabilityLabel = (probability) => {
    if (probability > 0.7) return 'High';
    if (probability > 0.5) return 'Strong';
    if (probability > 0.3) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">🤖 AI Race Predictions</div>
          <div className="card-subtitle">ML-powered winner forecast</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {modelInfo && modelInfo.trained && (
            <span style={{ 
              fontSize: '0.75rem', 
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px'
            }}>
              ✓ Model Ready
            </span>
          )}
          <button 
            onClick={fetchPredictions}
            disabled={loading}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.875rem',
              background: 'var(--accent-primary)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⟳' : '↻'} Refresh
          </button>
        </div>
      </div>
      <div className="card-body">
        {error && (
          <div style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            <div style={{ color: '#ef4444', marginBottom: '0.5rem' }}>
              ⚠️ {error}
            </div>
            {!modelInfo?.trained && (
              <button 
                onClick={startTraining}
                disabled={training}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: training ? 'not-allowed' : 'pointer',
                  opacity: training ? 0.6 : 1,
                  fontSize: '0.875rem'
                }}
              >
                {training ? '⟳ Training...' : '🚀 Train Model Now'}
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⟳</div>
            Loading predictions...
          </div>
        ) : predictions.length > 0 ? (
          <div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Showing top 10 drivers by win probability
            </div>
            
            {predictions.slice(0, 10).map((pred, idx) => (
              <div 
                key={pred.driver} 
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${
                    idx === 0 ? '#ffd700' : 
                    idx === 1 ? '#c0c0c0' : 
                    idx === 2 ? '#cd7f32' : 
                    'var(--accent-primary)'
                  }`,
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ 
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 'bold',
                        minWidth: '1.5rem'
                      }}>
                        #{idx + 1}
                      </span>
                      <strong style={{ fontSize: '1rem' }}>
                        {pred.driver}
                      </strong>
                      {idx < 3 && (
                        <span style={{ fontSize: '1.2rem' }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.25rem',
                      marginLeft: '2rem'
                    }}>
                      {pred.team}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: getProbabilityColor(pred.win_probability)
                    }}>
                      {(pred.win_probability * 100).toFixed(1)}%
                    </div>
                    <div style={{ 
                      fontSize: '0.65rem',
                      color: getProbabilityColor(pred.win_probability),
                      textTransform: 'uppercase',
                      fontWeight: 'bold'
                    }}>
                      {getProbabilityLabel(pred.win_probability)}
                    </div>
                  </div>
                </div>
                
                {/* Probability bar */}
                <div style={{ 
                  height: '6px',
                  background: 'var(--bg-card)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div 
                    style={{
                      width: `${pred.win_probability * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${getProbabilityColor(pred.win_probability)}, ${getProbabilityColor(pred.win_probability)}aa)`,
                      transition: 'width 0.8s ease-out',
                      boxShadow: `0 0 8px ${getProbabilityColor(pred.win_probability)}88`
                    }} 
                  />
                </div>

                {/* Grid position badge */}
                {pred.grid_position && (
                  <div style={{ 
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Grid: P{pred.grid_position}</span>
                    {pred.grid_position > (idx + 1) && (
                      <span style={{ color: '#10b981' }}>
                        ▲ Predicted to gain {pred.grid_position - (idx + 1)} positions
                      </span>
                    )}
                    {pred.grid_position < (idx + 1) && (
                      <span style={{ color: '#ef4444' }}>
                        ▼ Predicted to lose {(idx + 1) - pred.grid_position} positions
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Model info footer */}
            {modelInfo?.trained && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'var(--bg-card)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                <div>
                  Model: {modelInfo.model_type}
                </div>
                <div>
                  Features: {modelInfo.feature_count} | 
                  Trained on 2021-2023 seasons
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            No predictions available yet
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionPanel;
