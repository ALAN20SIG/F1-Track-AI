import { useState } from 'react';
import { drivers2026, teams } from '../data/drivers2026';

/**
 * TeamsGallery - F1 Teams and Drivers Gallery
 * Displays all 10 teams and 20 drivers in a Formula1.com-style layout
 */
const TeamsGallery = () => {
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Sort teams by position 1-11 - MUST be defined before use
  const sortedTeamKeys = [
    'MCLAREN', 'RED_BULL', 'FERRARI', 'MERCEDES', 'ASTON_MARTIN',
    'ALPINE', 'WILLIAMS', 'RACING_BULLS', 'HAAS', 'AUDI', 'CADILLAC'
  ];

  // Group drivers by team in sorted order (1-11)
  const teamGroups = sortedTeamKeys.map(teamKey => {
    const team = teams[teamKey];
    const teamDrivers = drivers2026.filter(driver => driver.team === teamKey);
    return {
      key: teamKey,
      ...team,
      drivers: teamDrivers
    };
  });

  // Country flags mapping
  const getCountryFlag = (countryCode) => {
    const flags = {
      'NED': '🇳🇱', 'GBR': '🇬🇧', 'MON': '🇲🇨', 'ITA': '🇮🇹', 'AUS': '🇦🇺',
      'THA': '🇹🇭', 'ESP': '🇪🇸', 'CAN': '🇨🇦', 'FRA': '🇫🇷', 'ARG': '🇦🇷',
      'NZL': '🇳🇿', 'GER': '🇩🇪', 'BRA': '🇧🇷', 'JPN': '🇯🇵', 'MEX': '🇲🇽', 'FIN': '🇫🇮'
    };
    return flags[countryCode] || '🏳️';
  };

  // Driver photos from Formula1.com - Updated 2026 season
  // Using 2col transform for better quality images
  const driverPhotos = {
    // Red Bull Racing
    'VER': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/verstappen',
    'HAD': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/hadjar',
    // Ferrari
    'LEC': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/leclerc',
    'HAM': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/hamilton',
    // Mercedes
    'RUS': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/russell',
    'ANT': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/antonelli',
    // McLaren
    'NOR': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/norris',
    'PIA': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/piastri',
    // Williams
    'ALB': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/albon',
    'SAI': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/sainz',
    // Aston Martin
    'ALO': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/alonso',
    'STR': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/stroll',
    // Alpine
    'GAS': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/gasly',
    'COL': 'https://media.formula1.com/image/upload/c_fill,w_720/q_auto/v1740000000/common/f1/2025/alpine/fracol01/2025alpinefracol01right.webp',
    // Haas
    'OCO': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/ocon',
    'BEA': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/bearman',
    // Racing Bulls
    'LAW': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/lawson',
    'LIN': 'https://media.formula1.com/image/upload/c_fill,w_720/q_auto/v1740000000/common/f1/2026/racingbulls/arvlin01/2026racingbullsarvlin01right.webp',
    // Audi
    'HUL': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/hulkenberg',
    'BOR': 'https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/2025Drivers/bortoleto',
    // Cadillac
    'PER': 'https://media.formula1.com/image/upload/c_fill,w_720/q_auto/v1740000000/common/f1/2026/cadillac/serper01/2026cadillacserper01right.webp',
    'BOT': 'https://media.formula1.com/image/upload/c_fill,w_720/q_auto/v1740000000/common/f1/2026/cadillac/valbot01/2026cadillacvalbot01right.webp'
  };

  // Team car photos from Formula1.com - All 11 teams
  const teamCarPhotos = {
    'MCLAREN': 'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000000/common/f1/2025/mclaren/2025mclarencarright.webp',
    'RED_BULL': 'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000000/common/f1/2025/redbullracing/2025redbullracingcarright.webp',
    'FERRARI': 'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000000/common/f1/2025/ferrari/2025ferraricarright.webp',
    'MERCEDES': 'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000000/common/f1/2025/mercedes/2025mercedescarright.webp',
    'ASTON_MARTIN': 'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000000/common/f1/2025/astonmartin/2025astonmartincarright.webp',
    'ALPINE': 'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000000/common/f1/2025/alpine/2025alpinecarright.webp',
    'WILLIAMS': 'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000000/common/f1/2025/williams/2025williamscarright.webp',
    'RACING_BULLS': 'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000000/common/f1/2025/racingbulls/2025racingbullscarright.webp',
    'HAAS': 'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000000/common/f1/2025/haas/2025haascarright.webp',
    'AUDI': 'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000000/common/f1/2026/audi/2026audicarright.webp',
    'CADILLAC': 'https://media.formula1.com/image/upload/c_lfill,w_3392/q_auto/v1740000000/common/f1/2026/cadillac/2026cadillaccarright.webp'
  };

  // Team standings order 1-11 (2026 season)
  const getTeamPosition = (teamKey) => {
    const positions = {
      'MCLAREN': 1, 'RED_BULL': 2, 'FERRARI': 3, 'MERCEDES': 4,
      'ASTON_MARTIN': 5, 'ALPINE': 6, 'WILLIAMS': 7, 'RACING_BULLS': 8,
      'HAAS': 9, 'AUDI': 10, 'CADILLAC': 11
    };
    return positions[teamKey] || '-';
  };

  // Reset all team points to 0 for new season
  const getTeamPoints = (teamKey) => {
    return 0;
  };

  const styles = {
    container: {
      padding: '24px',
      backgroundColor: '#0a0a0a',
      minHeight: 'calc(100vh - 120px)',
      color: '#fff'
    },
    header: {
      marginBottom: '32px',
      textAlign: 'center'
    },
    title: {
      fontSize: '36px',
      fontWeight: 'bold',
      marginBottom: '8px',
      background: 'linear-gradient(90deg, #fff, #ccc)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    subtitle: {
      fontSize: '16px',
      color: '#888'
    },
    teamsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(580px, 1fr))',
      gap: '24px',
      maxWidth: '1600px',
      margin: '0 auto'
    },
    teamCard: {
      background: 'linear-gradient(145deg, #1a1a1a, #0d0d0d)',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid #2a2a2a',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    teamCardHover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      borderColor: '#3a3a3a'
    },
    teamHeader: {
      padding: '20px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #2a2a2a'
    },
    teamInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    positionBadge: {
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontWeight: 'bold',
      backgroundColor: '#2a2a2a'
    },
    teamName: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '4px'
    },
    teamPoints: {
      fontSize: '14px',
      color: '#888'
    },
    colorBar: (color) => ({
      width: '6px',
      height: '60px',
      backgroundColor: color,
      borderRadius: '3px'
    }),
    driversContainer: {
      padding: '20px 24px',
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap'
    },
    driverCard: {
      flex: '1',
      minWidth: '220px',
      backgroundColor: '#151515',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid #252525',
      transition: 'all 0.2s ease'
    },
    driverCardHover: {
      backgroundColor: '#1f1f1f',
      borderColor: '#353535'
    },
    driverHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px'
    },
    driverNumber: {
      fontSize: '32px',
      fontWeight: 'bold',
      fontFamily: 'Formula1, monospace',
      opacity: 0.3
    },
    driverFlag: {
      fontSize: '24px'
    },
    driverName: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '4px'
    },
    driverCode: {
      fontSize: '14px',
      color: '#666',
      fontFamily: 'monospace'
    },
    driverPhoto: {
      width: '100%',
      height: '120px',
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: '12px',
      overflow: 'hidden'
    },
    driverPhotoPlaceholder: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '48px'
    },
    teamCarContainer: {
      width: '100%',
      height: '120px',
      backgroundColor: '#0d0d0d',
      borderBottom: '1px solid #2a2a2a',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px 16px'
    },
    teamCarImage: {
      width: 'auto',
      height: '100%',
      maxWidth: '90%',
      objectFit: 'contain',
      objectPosition: 'center'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>2026 F1 Teams & Drivers</h1>
        <p style={styles.subtitle}>All 11 teams and 22 drivers competing in the 2026 Formula 1 World Championship</p>
      </div>

      <div style={styles.teamsGrid}>
        {teamGroups.map((team) => (
          <div
            key={team.key}
            style={{
              ...styles.teamCard,
              ...(selectedTeam === team.key ? styles.teamCardHover : {})
            }}
            onMouseEnter={() => setSelectedTeam(team.key)}
            onMouseLeave={() => setSelectedTeam(null)}
          >
            {/* Team Header */}
            <div style={styles.teamHeader}>
              <div style={styles.teamInfo}>
                <div style={styles.positionBadge}>
                  {getTeamPosition(team.key)}
                </div>
                <div>
                  <div style={styles.teamName}>{team.name}</div>
                  <div style={styles.teamPoints}>{getTeamPoints(team.key)} PTS</div>
                </div>
              </div>
              <div style={styles.colorBar(team.color)} />
            </div>

            {/* Team Car Image */}
            {teamCarPhotos[team.key] && (
              <div style={styles.teamCarContainer}>
                <img 
                  src={teamCarPhotos[team.key]} 
                  alt={`${team.name} Car`}
                  style={styles.teamCarImage}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Drivers */}
            <div style={styles.driversContainer}>
              {team.drivers.map((driver) => (
                <div
                  key={driver.code}
                  style={{
                    ...styles.driverCard,
                    borderLeft: `4px solid ${team.color}`
                  }}
                >
                  <div style={styles.driverHeader}>
                    <div>
                      <div style={{ ...styles.driverNumber, color: team.color }}>
                        {driver.number}
                      </div>
                    </div>
                    <div style={styles.driverFlag}>
                      {getCountryFlag(driver.country)}
                    </div>
                  </div>
                  <div style={styles.driverName}>{driver.fullName}</div>
                  <div style={styles.driverCode}>{driver.code}</div>
                  <div style={styles.driverPhoto}>
                    {driverPhotos[driver.code] ? (
                      <img 
                        src={driverPhotos[driver.code]} 
                        alt={driver.fullName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center top',
                          borderRadius: '8px'
                        }}
                        onError={(e) => { 
                          e.target.style.display = 'none'; 
                          const placeholder = e.target.parentElement.querySelector('.driver-placeholder');
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="driver-placeholder"
                      style={{ 
                        ...styles.driverPhotoPlaceholder, 
                        display: driverPhotos[driver.code] ? 'none' : 'flex' 
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏎️</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{driver.code}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsGallery;
