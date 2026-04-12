import { useState, useEffect } from 'react';

const TireDegradation = () => {
  const [compound, setCompound] = useState('MEDIUM');
  const [raceLaps, setRaceLaps] = useState(58);
  const [degradationData, setDegradationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [strategyRecommendation, setStrategyRecommendation] = useState(null);
  const [showStrategy, setShowStrategy] = useState(false);

  useEffect(() => {
    fetchDegradationPrediction();
  }, [compound, raceLaps]);

  const fetchDegradationPrediction = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://https://f1-track-ai-production.up.railway.app/api/tire/degradation/predict?compound=${compound}&race_laps=${raceLaps}`
      );
      const data = await response.json();
      
      if (data.success) {
        setDegradationData(data);
      }
    } catch (error) {
      console.error('Error fetching tire degradation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStrategyRecommendation = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://https://f1-track-ai-production.up.railway.app/api/tire/strategy/recommend?race_distance=${raceLaps}&min_pit_stops=1&weather_condition=DRY`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (data.success) {
        setStrategyRecommendation(data);
        setShowStrategy(true);
      }
    } catch (error) {
      console.error('Error fetching strategy:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompoundColor = (comp) => {
    const colors = {
      'SOFT': '#FF1E1E',
      'MEDIUM': '#FFD700',
      'HARD': '#F0F0F0'
    };
    return colors[comp] || '#FFD700';
  };

  const renderDegradationChart = () => {
    if (!degradationData || !degradationData.degradation_curve) return null;

    const curve = degradationData.degradation_curve;
    const maxLap = curve[curve.length - 1].lap;

    return (
      <div style={{ 
        background: 'var(--bg-secondary)', 
        borderRadius: '8px', 
        padding: '1.5rem',
        border: '2px solid var(--border-color)'
      }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '700', 
          color: 'var(--ferrari-yellow)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: getCompoundColor(compound),
            boxShadow: `0 0 10px ${getCompoundColor(compound)}`
          }}></span>
          Tire Degradation Curve - {compound} Compound
        </h3>

        {/* Chart Area */}
        <div style={{ 
          position: 'relative', 
          height: '300px',
          background: 'linear-gradient(180deg, rgba(10, 10, 10, 0.5) 0%, rgba(26, 26, 26, 0.8) 100%)',
          borderRadius: '6px',
          padding: '1rem',
          border: '1px solid var(--border-color)'
        }}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percent => (
            <div key={percent} style={{
              position: 'absolute',
              left: '40px',
              right: '10px',
              top: `${280 - (percent / 100 * 250)}px`,
              height: '1px',
              background: percent === 70 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              borderTop: percent === 70 ? '1px dashed #ef4444' : 'none'
            }}>
              <span style={{
                position: 'absolute',
                left: '-35px',
                top: '-10px',
                fontSize: '0.7rem',
                color: percent === 70 ? '#ef4444' : 'var(--text-muted)'
              }}>
                {percent}%
              </span>
            </div>
          ))}

          {/* Degradation curve */}
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 40 }} viewBox="0 0 100 300" preserveAspectRatio="none">
            <defs>
              <linearGradient id="degradationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
                <stop offset="40%" style={{ stopColor: '#f59e0b', stopOpacity: 0.8 }} />
                <stop offset="70%" style={{ stopColor: '#ef4444', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#DC0000', stopOpacity: 0.9 }} />
              </linearGradient>
            </defs>
            <polyline
              points={curve.map((point, idx) => {
                const x = (idx / maxLap) * 90; // 0-90 range
                const y = 280 - (point.degradation_percent / 100 * 250);
                return `${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="url(#degradationGradient)"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
              style={{ filter: 'drop-shadow(0 0 2px rgba(220, 0, 0, 0.5))' }}
            />
          </svg>

          {/* Lap axis */}
          <div style={{
            position: 'absolute',
            bottom: '5px',
            left: '40px',
            right: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: 'var(--text-muted)'
          }}>
            {[0, Math.floor(maxLap/4), Math.floor(maxLap/2), Math.floor(maxLap*3/4), maxLap].map(lap => (
              <span key={lap}>L{lap}</span>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '1rem', 
          marginTop: '1rem' 
        }}>
          <div style={{ 
            background: 'var(--bg-card)', 
            padding: '0.75rem', 
            borderRadius: '6px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              MAX LAPS
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ferrari-yellow)' }}>
              {degradationData.max_recommended_laps}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              TRACK TEMP
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
              {degradationData.track_temp}°C
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              STRESS INDEX
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>
              {(degradationData.stress_factors.overall_stress_index * 100).toFixed(0)}%
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              FINAL DEG
            </div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: curve[curve.length - 1].condition_color 
            }}>
              {curve[curve.length - 1].degradation_percent.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStrategyRecommendation = () => {
    if (!showStrategy || !strategyRecommendation) return null;

    const strategy = strategyRecommendation.recommended_strategy;

    return (
      <div style={{ 
        background: 'var(--bg-secondary)', 
        borderRadius: '8px', 
        padding: '1.5rem',
        border: '2px solid var(--ferrari-red)',
        marginTop: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--ferrari-red)' }}>
            🏁 Recommended Strategy: {strategy.name}
          </h3>
          <span style={{
            padding: '0.25rem 0.75rem',
            background: 'var(--ferrari-dark-red)',
            color: 'var(--ferrari-yellow)',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '700'
          }}>
            {strategy.pit_stops} PIT STOP{strategy.pit_stops !== 1 ? 'S' : ''}
          </span>
        </div>

        {/* Stint breakdown */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {strategy.stints.map((stint, idx) => (
            <div key={idx} style={{ 
              flex: 1,
              background: 'var(--bg-card)',
              padding: '1rem',
              borderRadius: '6px',
              border: `2px solid ${getCompoundColor(stint.compound)}`,
              boxShadow: `0 0 15px ${getCompoundColor(stint.compound)}40`
            }}>
              <div style={{ 
                fontSize: '0.7rem', 
                color: 'var(--text-muted)', 
                marginBottom: '0.5rem',
                textTransform: 'uppercase'
              }}>
                Stint {idx + 1}
              </div>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: getCompoundColor(stint.compound),
                marginBottom: '0.25rem'
              }}>
                {stint.compound}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {stint.laps} laps
              </div>
            </div>
          ))}
        </div>

        {/* Performance metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem',
          padding: '1rem',
          background: 'rgba(220, 0, 0, 0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(220, 0, 0, 0.3)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Est. Time Loss (Degradation)
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b' }}>
              +{strategy.estimated_time_loss?.toFixed(2) || 'N/A'}s
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total Race Time Penalty
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444' }}>
              +{strategy.total_race_time_penalty?.toFixed(2) || 'N/A'}s
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div>
          <div className="card-title">Tire Degradation Analysis</div>
          <div className="card-subtitle">Predictive tire wear modeling · Abu Dhabi GP</div>
        </div>
      </div>

      <div className="card-body" style={{ padding: '1.5rem' }}>
        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'var(--bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Tire Compound
            </label>
            <select 
              value={compound}
              onChange={(e) => setCompound(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: `2px solid ${getCompoundColor(compound)}`,
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="SOFT">🔴 Soft (C5)</option>
              <option value="MEDIUM">🟡 Medium (C4)</option>
              <option value="HARD">⚪ Hard (C3)</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)', 
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Stint Length (Laps)
            </label>
            <input 
              type="number"
              value={raceLaps}
              onChange={(e) => setRaceLaps(parseInt(e.target.value) || 58)}
              min="1"
              max="70"
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '2px solid var(--ferrari-red)',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: '600',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={fetchStrategyRecommendation}
              disabled={loading}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'linear-gradient(135deg, var(--ferrari-red) 0%, var(--ferrari-dark-red) 100%)',
                color: 'var(--ferrari-yellow)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 15px rgba(220, 0, 0, 0.4)',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
            >
              {loading ? '⏳ Loading...' : '🏆 Get Strategy'}
            </button>
          </div>
        </div>

        {/* Degradation Chart */}
        {loading && !degradationData ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <div>Analyzing tire degradation...</div>
          </div>
        ) : (
          <>
            {renderDegradationChart()}
            {renderStrategyRecommendation()}
          </>
        )}
      </div>
    </div>
  );
};

export default TireDegradation;
