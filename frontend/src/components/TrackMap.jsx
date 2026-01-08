import { useRef } from 'react';

const TrackMap = () => {
  const pathRef = useRef(null);

  // Abu Dhabi Yas Marina Circuit - Accurate 2024 Layout (matching official track map)
  const trackPathData = `
    M 470,420
    L 850,420
    Q 880,420 880,390
    L 880,110
    Q 880,80 850,80
    L 550,80
    Q 520,80 520,110
    L 520,140
    Q 520,155 505,155
    L 340,155
    Q 310,155 310,185
    L 310,240
    Q 310,265 285,265
    L 240,265
    Q 215,265 215,290
    L 215,330
    Q 215,355 190,355
    L 140,355
    Q 115,355 115,380
    L 115,450
    Q 115,475 140,475
    L 240,475
    Q 265,475 265,450
    L 265,400
    Q 265,380 280,370
    L 350,320
    Q 370,310 370,285
    L 370,220
    Q 370,195 390,195
    L 470,195
    Q 490,195 490,220
    L 490,390
    Q 490,420 470,420
    Z
  `;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">🏁 Live Track Map - Abu Dhabi GP</div>
          <div className="card-subtitle">Yas Marina Circuit · 5.281 km · 58 Laps</div>
        </div>
      </div>
      <div className="card-body">
        <div className="track-map-container">
          <svg
            viewBox="0 0 1000 600"
            className="track-svg"
            style={{ width: '100%', height: 'auto', maxHeight: '550px' }}
          >
            {/* Track outline */}
            <path
              ref={pathRef}
              d={trackPathData}
              fill="none"
              stroke="#1a1a22"
              strokeWidth="60"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Track surface - outer edge */}
            <path
              d={trackPathData}
              fill="none"
              stroke="#00d4ff"
              strokeWidth="52"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Track surface - inner */}
            <path
              d={trackPathData}
              fill="none"
              stroke="#0a0a0a"
              strokeWidth="48"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Racing line - golden */}
            <path
              d={trackPathData}
              fill="none"
              stroke="#ffaa00"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
            
            {/* Start/Finish line */}
            <line
              x1="850"
              y1="390"
              x2="880"
              y2="390"
              stroke="#ffffff"
              strokeWidth="4"
              strokeDasharray="4,4"
            />
            <text x="890" y="395" fill="#ffffff" fontSize="11" fontWeight="bold">🏁</text>
            
            {/* DRS Detection Zone 1 (bottom right) */}
            <rect x="780" y="360" width="90" height="50" fill="#00d448" opacity="0.15" rx="8" />
            <text x="800" y="390" fill="#00d448" fontSize="12" fontWeight="bold">DRS</text>
            <text x="785" y="405" fill="#00d448" fontSize="9">ZONE 1</text>
            
            {/* DRS Detection Zone 2 (top left) */}
            <rect x="140" y="140" width="80" height="60" fill="#00d448" opacity="0.15" rx="8" />
            <text x="155" y="175" fill="#00d448" fontSize="12" fontWeight="bold">DRS</text>
            <text x="145" y="190" fill="#00d448" fontSize="9">ZONE 2</text>
            
            {/* Speed Trap */}
            <rect x="650" y="70" width="90" height="35" fill="#ff00ff" opacity="0.2" rx="6" />
            <text x="660" y="93" fill="#ff00ff" fontSize="11" fontWeight="bold">SPEED TRAP</text>
            
            {/* Turn numbers with circles */}
            {/* T1 */}
            <circle cx="850" cy="315" r="18" fill="#e10600" opacity="0.9" />
            <text x="850" y="322" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">01</text>
            
            {/* T2 */}
            <circle cx="750" cy="315" r="18" fill="#e10600" opacity="0.9" />
            <text x="750" y="322" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">02</text>
            
            {/* T3 */}
            <circle cx="700" cy="280" r="18" fill="#e10600" opacity="0.9" />
            <text x="700" y="287" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">03</text>
            
            {/* T4 */}
            <circle cx="780" cy="240" r="18" fill="#e10600" opacity="0.9" />
            <text x="780" y="247" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">04</text>
            
            {/* T5 */}
            <circle cx="850" cy="180" r="18" fill="#e10600" opacity="0.9" />
            <text x="850" y="187" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">05</text>
            
            {/* T7 */}
            <circle cx="570" cy="90" r="18" fill="#e10600" opacity="0.9" />
            <text x="570" y="97" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">07</text>
            
            {/* T8 */}
            <circle cx="420" cy="155" r="18" fill="#e10600" opacity="0.9" />
            <text x="420" y="162" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">08</text>
            
            {/* T9 */}
            <circle cx="210" cy="265" r="18" fill="#e10600" opacity="0.9" />
            <text x="210" y="272" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">09</text>
            
            {/* T10 */}
            <circle cx="155" cy="350" r="18" fill="#e10600" opacity="0.9" />
            <text x="155" y="357" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">10</text>
            
            {/* T11 */}
            <circle cx="190" cy="420" r="18" fill="#e10600" opacity="0.9" />
            <text x="190" y="427" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">11</text>
            
            {/* T12 */}
            <circle cx="270" cy="370" r="18" fill="#e10600" opacity="0.9" />
            <text x="270" y="377" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">12</text>
            
            {/* T13 */}
            <circle cx="220" cy="285" r="18" fill="#e10600" opacity="0.9" />
            <text x="220" y="292" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">13</text>
            
            {/* T14 */}
            <circle cx="320" cy="240" r="18" fill="#e10600" opacity="0.9" />
            <text x="320" y="247" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">14</text>
            
            {/* T15 */}
            <circle cx="370" cy="220" r="18" fill="#e10600" opacity="0.9" />
            <text x="370" y="227" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">15</text>
            
            {/* T16 */}
            <circle cx="480" cy="180" r="18" fill="#e10600" opacity="0.9" />
            <text x="480" y="187" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">16</text>
            
            {/* Circuit name watermark */}
            <text 
              x="500" 
              y="330" 
              fill="#2a2a35" 
              fontSize="48" 
              fontWeight="900" 
              textAnchor="middle"
              opacity="0.3"
              fontFamily="Arial Black"
            >
              YAS MARINA
            </text>
          </svg>
        </div>
        
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem',
          background: 'var(--bg-card)',
          borderRadius: '6px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CIRCUIT LENGTH</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>5.281 km</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL LAPS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>58 Laps</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RACE DISTANCE</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>306.183 km</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackMap;
