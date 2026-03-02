const Schedule = () => {
  const races2026 = [
    { round: 1, name: 'Australian Grand Prix', circuit: 'Albert Park Circuit', location: 'Melbourne', country: 'Australia', date: 'Mar 06', status: 'upcoming' },
    { round: 2, name: 'Chinese Grand Prix', circuit: 'Shanghai International Circuit', location: 'Shanghai', country: 'China', date: 'Mar 13', status: 'upcoming' },
    { round: 3, name: 'Japanese Grand Prix', circuit: 'Suzuka International Racing Course', location: 'Suzuka', country: 'Japan', date: 'Mar 27', status: 'upcoming' },
    { round: 4, name: 'Bahrain Grand Prix', circuit: 'Bahrain International Circuit', location: 'Manama', country: 'Bahrain', date: 'Apr 10', status: 'upcoming' },
    { round: 5, name: 'Saudi Arabian Grand Prix', circuit: 'Jeddah Corniche Circuit', location: 'Jeddah', country: 'Saudi Arabia', date: 'Apr 17', status: 'upcoming' },
    { round: 6, name: 'Miami Grand Prix', circuit: 'Miami International Autodrome', location: 'Miami', country: 'USA', date: 'May 01', status: 'upcoming' },
    { round: 7, name: 'Canadian Grand Prix', circuit: 'Circuit Gilles Villeneuve', location: 'Montreal', country: 'Canada', date: 'May 22', status: 'upcoming' },
    { round: 8, name: 'Monaco Grand Prix', circuit: 'Circuit de Monaco', location: 'Monte Carlo', country: 'Monaco', date: 'Jun 05', status: 'upcoming' },
    { round: 9, name: 'Spanish Grand Prix', circuit: 'Circuit de Barcelona-Catalunya', location: 'Barcelona', country: 'Spain', date: 'Jun 12', status: 'upcoming' },
    { round: 10, name: 'Austrian Grand Prix', circuit: 'Red Bull Ring', location: 'Spielberg', country: 'Austria', date: 'Jun 26', status: 'upcoming' },
    { round: 11, name: 'British Grand Prix', circuit: 'Silverstone Circuit', location: 'Silverstone', country: 'United Kingdom', date: 'Jul 03', status: 'upcoming' },
    { round: 12, name: 'Belgian Grand Prix', circuit: 'Circuit de Spa-Francorchamps', location: 'Spa', country: 'Belgium', date: 'Jul 17', status: 'upcoming' },
    { round: 13, name: 'Hungarian Grand Prix', circuit: 'Hungaroring', location: 'Budapest', country: 'Hungary', date: 'Jul 24', status: 'upcoming' },
    { round: 14, name: 'Dutch Grand Prix', circuit: 'Circuit Zandvoort', location: 'Zandvoort', country: 'Netherlands', date: 'Aug 21', status: 'upcoming' },
    { round: 15, name: 'Italian Grand Prix', circuit: 'Autodromo Nazionale di Monza', location: 'Monza', country: 'Italy', date: 'Sep 04', status: 'upcoming' },
    { round: 16, name: 'Spanish Grand Prix', circuit: 'Circuit de Montmeló', location: 'Barcelona', country: 'Spain', date: 'Sep 11', status: 'upcoming' },
    { round: 17, name: 'Azerbaijan Grand Prix', circuit: 'Baku City Circuit', location: 'Baku', country: 'Azerbaijan', date: 'Sep 24', status: 'upcoming' },
    { round: 18, name: 'Singapore Grand Prix', circuit: 'Marina Bay Street Circuit', location: 'Singapore', country: 'Singapore', date: 'Oct 09', status: 'upcoming' },
    { round: 19, name: 'United States Grand Prix', circuit: 'Circuit of The Americas', location: 'Austin', country: 'USA', date: 'Oct 23', status: 'upcoming' },
    { round: 20, name: 'Mexican Grand Prix', circuit: 'Autódromo Hermanos Rodríguez', location: 'Mexico City', country: 'Mexico', date: 'Oct 30', status: 'upcoming' },
    { round: 21, name: 'Brazilian Grand Prix', circuit: 'Autódromo José Carlos Pace', location: 'São Paulo', country: 'Brazil', date: 'Nov 06', status: 'upcoming' },
    { round: 22, name: 'Las Vegas Grand Prix', circuit: 'Las Vegas Street Circuit', location: 'Las Vegas', country: 'USA', date: 'Nov 19', status: 'upcoming' },
    { round: 23, name: 'Qatar Grand Prix', circuit: 'Lusail International Circuit', location: 'Lusail', country: 'Qatar', date: 'Nov 27', status: 'upcoming' },
    { round: 24, name: 'Abu Dhabi Grand Prix', circuit: 'Yas Marina Circuit', location: 'Abu Dhabi', country: 'UAE', date: 'Dec 04', status: 'upcoming' },
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
      'Saudi Arabia': '🇸🇦', 'USA': '🇺🇸', 'United States': '🇺🇸', 'Italy': '🇮🇹', 'Monaco': '🇲🇨',
      'Spain': '🇪🇸', 'Canada': '🇨🇦', 'Austria': '🇦🇹', 'United Kingdom': '🇬🇧',
      'Belgium': '🇧🇪', 'Hungary': '🇭🇺', 'Netherlands': '🇳🇱', 'Azerbaijan': '🇦🇿',
      'Singapore': '🇸🇬', 'Mexico': '🇲🇽', 'Brazil': '🇧🇷', 'Qatar': '🇶🇦', 'UAE': '🇦🇪',
      'United Arab Emirates': '🇦🇪'
    };
    return flags[country] || '🏁';
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div>
          <div className="card-title">2026 F1 Calendar</div>
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
          {races2026.map(race => (
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
