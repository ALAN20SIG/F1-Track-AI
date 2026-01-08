const Schedule = () => {
  const races2025 = [
    { round: 1, name: 'Australian Grand Prix', circuit: 'Albert Park Circuit', location: 'Melbourne', country: 'Australia', date: 'Mar 16', status: 'completed', winner: 'NOR' },
    { round: 2, name: 'Chinese Grand Prix', circuit: 'Shanghai International Circuit', location: 'Shanghai', country: 'China', date: 'Mar 23', status: 'completed', winner: 'PIA' },
    { round: 3, name: 'Japanese Grand Prix', circuit: 'Suzuka Circuit', location: 'Suzuka', country: 'Japan', date: 'Apr 6', status: 'completed', winner: 'VER' },
    { round: 4, name: 'Bahrain Grand Prix', circuit: 'Bahrain International Circuit', location: 'Sakhir', country: 'Bahrain', date: 'Apr 13', status: 'completed', winner: 'PIA' },
    { round: 5, name: 'Saudi Arabian Grand Prix', circuit: 'Jeddah Corniche Circuit', location: 'Jeddah', country: 'Saudi Arabia', date: 'Apr 20', status: 'completed', winner: 'PIA' },
    { round: 6, name: 'Miami Grand Prix', circuit: 'Miami International Autodrome', location: 'Miami', country: 'USA', date: 'May 4', status: 'completed', winner: 'PIA' },
    { round: 7, name: 'Emilia Romagna Grand Prix', circuit: 'Autodromo Enzo e Dino Ferrari', location: 'Imola', country: 'Italy', date: 'May 18', status: 'completed', winner: 'VER' },
    { round: 8, name: 'Monaco Grand Prix', circuit: 'Circuit de Monaco', location: 'Monte Carlo', country: 'Monaco', date: 'May 25', status: 'completed', winner: 'NOR' },
    { round: 9, name: 'Spanish Grand Prix', circuit: 'Circuit de Barcelona-Catalunya', location: 'Barcelona', country: 'Spain', date: 'Jun 1', status: 'completed', winner: 'PIA' },
    { round: 10, name: 'Canadian Grand Prix', circuit: 'Circuit Gilles Villeneuve', location: 'Montreal', country: 'Canada', date: 'Jun 15', status: 'completed', winner: 'RUS' },
    { round: 11, name: 'Austrian Grand Prix', circuit: 'Red Bull Ring', location: 'Spielberg', country: 'Austria', date: 'Jun 29', status: 'completed', winner: 'NOR' },
    { round: 12, name: 'British Grand Prix', circuit: 'Silverstone Circuit', location: 'Silverstone', country: 'United Kingdom', date: 'Jul 6', status: 'completed', winner: 'NOR' },
    { round: 13, name: 'Belgian Grand Prix', circuit: 'Circuit de Spa-Francorchamps', location: 'Spa', country: 'Belgium', date: 'Jul 27', status: 'completed', winner: 'PIA' },
    { round: 14, name: 'Hungarian Grand Prix', circuit: 'Hungaroring', location: 'Budapest', country: 'Hungary', date: 'Aug 3', status: 'completed', winner: 'NOR' },
    { round: 15, name: 'Dutch Grand Prix', circuit: 'Circuit Zandvoort', location: 'Zandvoort', country: 'Netherlands', date: 'Aug 31', status: 'completed', winner: 'PIA' },
    { round: 16, name: 'Italian Grand Prix', circuit: 'Autodromo Nazionale di Monza', location: 'Monza', country: 'Italy', date: 'Sep 7', status: 'completed', winner: 'VER' },
    { round: 17, name: 'Azerbaijan Grand Prix', circuit: 'Baku City Circuit', location: 'Baku', country: 'Azerbaijan', date: 'Sep 21', status: 'completed', winner: 'VER' },
    { round: 18, name: 'Singapore Grand Prix', circuit: 'Marina Bay Street Circuit', location: 'Marina Bay', country: 'Singapore', date: 'Oct 5', status: 'completed', winner: 'RUS' },
    { round: 19, name: 'United States Grand Prix', circuit: 'Circuit of the Americas', location: 'Austin', country: 'USA', date: 'Oct 19', status: 'completed', winner: 'VER' },
    { round: 20, name: 'Mexico City Grand Prix', circuit: 'Autódromo Hermanos Rodríguez', location: 'Mexico City', country: 'Mexico', date: 'Oct 26', status: 'completed', winner: 'NOR' },
    { round: 21, name: 'São Paulo Grand Prix', circuit: 'Autódromo José Carlos Pace', location: 'São Paulo', country: 'Brazil', date: 'Nov 9', status: 'completed', winner: 'NOR' },
    { round: 22, name: 'Las Vegas Grand Prix', circuit: 'Las Vegas Street Circuit', location: 'Las Vegas', country: 'USA', date: 'Nov 22', status: 'completed', winner: 'VER' },
    { round: 23, name: 'Qatar Grand Prix', circuit: 'Losail International Circuit', location: 'Lusail', country: 'Qatar', date: 'Nov 30', status: 'completed', winner: 'VER' },
    { round: 24, name: 'Abu Dhabi Grand Prix', circuit: 'Yas Marina Circuit', location: 'Abu Dhabi', country: 'UAE', date: 'Dec 7', status: 'upcoming' },
  ];

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return <span style={{ padding: '0.25rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>✓ Completed</span>;
    }
    if (status === 'active') {
      return <span style={{ padding: '0.25rem 0.75rem', background: 'var(--danger)', borderRadius: '12px', fontSize: '0.75rem', color: 'white', fontWeight: '600' }}>● LIVE</span>;
    }
    return <span style={{ padding: '0.25rem 0.75rem', background: 'var(--accent-primary)', borderRadius: '12px', fontSize: '0.75rem', color: 'white', fontWeight: '600' }}>Upcoming</span>;
  };

  const getCountryFlag = (country) => {
    const flags = {
      'Australia': '🇦🇺', 'China': '🇨🇳', 'Japan': '🇯🇵', 'Bahrain': '🇧🇭', 
      'Saudi Arabia': '🇸🇦', 'USA': '🇺🇸', 'Italy': '🇮🇹', 'Monaco': '🇲🇨',
      'Spain': '🇪🇸', 'Canada': '🇨🇦', 'Austria': '🇦🇹', 'United Kingdom': '🇬🇧',
      'Belgium': '🇧🇪', 'Hungary': '🇭🇺', 'Netherlands': '🇳🇱', 'Azerbaijan': '🇦🇿',
      'Singapore': '🇸🇬', 'Mexico': '🇲🇽', 'Brazil': '🇧🇷', 'Qatar': '🇶🇦', 'UAE': '🇦🇪'
    };
    return flags[country] || '🏁';
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div>
          <div className="card-title">2025 F1 Calendar</div>
          <div className="card-subtitle">24 Races · 21 Countries</div>
        </div>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="leaderboard-table">
          <div className="leaderboard-row leaderboard-header" style={{ gridTemplateColumns: '50px 1fr 2fr 120px 100px' }}>
            <div>RND</div>
            <div>COUNTRY</div>
            <div>CIRCUIT</div>
            <div>DATE</div>
            <div>STATUS</div>
          </div>
          {races2025.map(race => (
            <div 
              key={race.round} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '50px 1fr 2fr 120px 100px',
                gap: '1rem',
                padding: '1rem',
                borderBottom: '1px solid var(--border-color)',
                background: race.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = race.status === 'active' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = race.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'transparent'}
            >
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {race.round}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{getCountryFlag(race.country)}</span>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {race.country}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {race.location}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {race.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {race.circuit}
                </div>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {race.date}
              </div>
              <div>
                {getStatusBadge(race.status)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
