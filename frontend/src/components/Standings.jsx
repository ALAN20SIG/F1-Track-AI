import drivers2026, { teams } from '../data/drivers2026';

const Standings = () => {
  // Driver standings (2026 season - Pre-season, all points reset to 0)
  const driverStandings = [
    { position: 1, driver: 'VER', points: 0, wins: 0 },
    { position: 2, driver: 'HAD', points: 0, wins: 0 },
    { position: 3, driver: 'HAM', points: 0, wins: 0 },
    { position: 4, driver: 'LEC', points: 0, wins: 0 },
    { position: 5, driver: 'RUS', points: 0, wins: 0 },
    { position: 6, driver: 'ANT', points: 0, wins: 0 },
    { position: 7, driver: 'NOR', points: 0, wins: 0 },
    { position: 8, driver: 'PIA', points: 0, wins: 0 },
    { position: 9, driver: 'ALB', points: 0, wins: 0 },
    { position: 10, driver: 'SAI', points: 0, wins: 0 },
    { position: 11, driver: 'ALO', points: 0, wins: 0 },
    { position: 12, driver: 'STR', points: 0, wins: 0 },
    { position: 13, driver: 'GAS', points: 0, wins: 0 },
    { position: 14, driver: 'COL', points: 0, wins: 0 },
    { position: 15, driver: 'OCO', points: 0, wins: 0 },
    { position: 16, driver: 'BEA', points: 0, wins: 0 },
    { position: 17, driver: 'LAW', points: 0, wins: 0 },
    { position: 18, driver: 'LIN', points: 0, wins: 0 },
    { position: 19, driver: 'HUL', points: 0, wins: 0 },
    { position: 20, driver: 'BOR', points: 0, wins: 0 },
    { position: 21, driver: 'PER', points: 0, wins: 0 },
    { position: 22, driver: 'BOT', points: 0, wins: 0 },
  ];

  // Constructor standings (2026 season - Pre-season, all points reset to 0)
  const constructorStandings = [
    { position: 1, team: 'Oracle Red Bull Racing', points: 0, wins: 0, color: teams.RED_BULL.color },
    { position: 2, team: 'Scuderia Ferrari', points: 0, wins: 0, color: teams.FERRARI.color },
    { position: 3, team: 'Mercedes-AMG Petronas', points: 0, wins: 0, color: teams.MERCEDES.color },
    { position: 4, team: 'McLaren F1 Team', points: 0, wins: 0, color: teams.MCLAREN.color },
    { position: 5, team: 'Aston Martin Aramco', points: 0, wins: 0, color: teams.ASTON_MARTIN.color },
    { position: 6, team: 'BWT Alpine F1 Team', points: 0, wins: 0, color: teams.ALPINE.color },
    { position: 7, team: 'Williams Racing', points: 0, wins: 0, color: teams.WILLIAMS.color },
    { position: 8, team: 'Visa Cash App RB', points: 0, wins: 0, color: teams.RACING_BULLS.color },
    { position: 9, team: 'MoneyGram Haas F1 Team', points: 0, wins: 0, color: teams.HAAS.color },
    { position: 10, team: 'AUDI', points: 0, wins: 0, color: teams.AUDI.color },
    { position: 11, team: 'CADILLAC', points: 0, wins: 0, color: teams.CADILLAC.color },
  ];

  const getDriverInfo = (code) => {
    return drivers2026.find(d => d.code === code) || {};
  };

  // Driver photo URLs (2025 F1 official headshots)
  const driverPhotos = {
    'NOR': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png.transform/1col/image.png',
    'VER': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/1col/image.png',
    'PIA': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png.transform/1col/image.png',
    'RUS': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/1col/image.png',
    'LEC': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png.transform/1col/image.png',
    'HAM': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/1col/image.png',
    'SAI': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png.transform/1col/image.png',
    'ALO': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png.transform/1col/image.png',
    'ALB': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ALEALB01_Alexander_Albon/alealb01.png.transform/1col/image.png',
    'HUL': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png.transform/1col/image.png',
    'LIN': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/A/ARVLIN01_Arvid_Lindblad/arvlin01.png.transform/1col/image.png',
    'PER': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png.transform/1col/image.png',
    'BOT': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png.transform/1col/image.png',
    'GAS': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png.transform/1col/image.png',
    'OCO': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png.transform/1col/image.png',
    'STR': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png.transform/1col/image.png',
    'BEA': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png.transform/1col/image.png',
    'LAW': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png.transform/1col/image.png',
    'ANT': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/J/JACANT01_Jack_Aitken/jacant01.png.transform/1col/image.png',
    'HAD': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/I/ISAHAD01_Isack_Hadjar/isahad01.png.transform/1col/image.png',
    'BOR': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/G/GAYBOR01_Gabriel_Bortoleto/gaybor01.png.transform/1col/image.png',
    'COL': 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/F/FRACHO01_Franco_Colapinto/fracho01.png.transform/1col/image.png'
  };

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div>
          <div className="card-title">Championship Standings</div>
          <div className="card-subtitle">2026 Season - Pre-season Standings</div>
        </div>
      </div>
      <div className="card-body" style={{ padding: 0, display: 'flex', gap: '2rem', flexDirection: 'column' }}>
        {/* Driver Standings */}
        <div>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent-primary)' }}>Driver Championship</h3>
          </div>
          <div className="leaderboard-table">
            <div className="leaderboard-row leaderboard-header">
              <div style={{ width: '40px' }}>POS</div>
              <div style={{ width: '60px' }}>CODE</div>
              <div style={{ flex: 1 }}>DRIVER</div>
              <div style={{ width: '80px', textAlign: 'right' }}>POINTS</div>
              <div style={{ width: '60px', textAlign: 'center' }}>WINS</div>
            </div>
            {driverStandings.map(standing => {
              const driver = getDriverInfo(standing.driver);
              const photoUrl = driverPhotos[standing.driver];
              return (
                <div key={standing.driver} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                  <div className={`position ${standing.position <= 3 ? 'p' + standing.position : ''}`} style={{ width: '40px' }}>
                    {standing.position}
                  </div>
                  
                  {/* Driver Photo */}
                  {photoUrl && standing.position <= 3 && (
                    <div style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: `3px solid ${driver.teamColor}`,
                      boxShadow: `0 0 15px ${driver.teamColor}80`,
                      background: 'var(--bg-primary)',
                      flexShrink: 0
                    }}>
                      <img 
                        src={photoUrl} 
                        alt={driver.fullName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center top'
                        }}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                  
                  <div 
                    className="driver-code" 
                    style={{ 
                      width: '60px',
                      background: driver.teamColor + '20',
                      color: driver.teamColor,
                      border: `1px solid ${driver.teamColor}`
                    }}
                  >
                    {standing.driver}
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div 
                      className="team-indicator" 
                      style={{ background: driver.teamColor }}
                    ></div>
                    <div className="driver-name">{driver.fullName}</div>
                  </div>
                  <div style={{ width: '80px', textAlign: 'right', fontWeight: '700', fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                    {standing.points}
                  </div>
                  <div style={{ width: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {standing.wins}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Constructor Standings */}
        <div>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent-primary)' }}>Constructor Championship</h3>
          </div>
          <div className="leaderboard-table">
            <div className="leaderboard-row leaderboard-header">
              <div style={{ width: '40px' }}>POS</div>
              <div style={{ flex: 1 }}>TEAM</div>
              <div style={{ width: '80px', textAlign: 'right' }}>POINTS</div>
              <div style={{ width: '60px', textAlign: 'center' }}>WINS</div>
            </div>
            {constructorStandings.map(standing => (
              <div key={standing.team} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div className={`position ${standing.position <= 3 ? 'p' + standing.position : ''}`} style={{ width: '40px' }}>
                  {standing.position}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '6px', height: '30px', borderRadius: '3px', background: standing.color, boxShadow: `0 0 10px ${standing.color}` }}></div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{standing.team}</div>
                </div>
                <div style={{ width: '80px', textAlign: 'right', fontWeight: '700', fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                  {standing.points}
                </div>
                <div style={{ width: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {standing.wins}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Standings;
