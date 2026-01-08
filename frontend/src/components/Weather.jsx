import { useState, useEffect } from 'react';

const Weather = () => {
  const [time, setTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Abu Dhabi coordinates for Yas Marina Circuit
  const LOCATION = 'Abu Dhabi,ae';
  const API_KEY = '5f82849afb36c04c6ce3379fed9d9e58';

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch real-time weather data from backend API
    const fetchWeather = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/live/weather');
        const data = await response.json();
        
        if (data.success && data.display) {
          // Use backend aggregated weather data
          setWeatherData({
            current: {
              airTemp: Math.round(data.display.air_temp || data.display.airTemp || 28),
              trackTemp: Math.round(data.display.track_temp || data.display.trackTemp || 42),
              humidity: data.display.humidity || 35,
              windSpeed: Number(data.display.wind_speed || data.display.windSpeed || 3.2).toFixed(1),
              windDirection: data.display.wind_direction || 'N',
              pressure: data.display.pressure || 1013,
              rainfall: data.display.rainfall || 0,
              condition: data.display.conditions || data.display.condition || 'Clear'
            },
            // Generate simple forecast based on current conditions
            forecast: generateForecast({
              airTemp: Math.round(data.display.air_temp || data.display.airTemp || 28),
              trackTemp: Math.round(data.display.track_temp || data.display.trackTemp || 42),
              condition: data.display.conditions || data.display.condition || 'Clear'
            })
          });
        } else {
          // Fallback to OpenWeatherMap direct call if backend fails
          const owmResponse = await fetch(
            `http://api.openweathermap.org/data/2.5/weather?q=${LOCATION}&appid=${API_KEY}&units=metric`
          );
          const owmData = await owmResponse.json();
          
          if (owmResponse.ok) {
            const currentTemp = Math.round(owmData.main.temp);
            setWeatherData({
              current: {
                airTemp: currentTemp,
                trackTemp: Math.round(currentTemp * 1.7),
                humidity: owmData.main.humidity,
                windSpeed: Number(owmData.wind.speed).toFixed(1),
                windDirection: getWindDirection(owmData.wind.deg),
                pressure: owmData.main.pressure,
                rainfall: owmData.rain?.['1h'] || 0,
                condition: owmData.weather[0].main
              },
              forecast: generateForecast({
                airTemp: currentTemp,
                trackTemp: Math.round(currentTemp * 1.7),
                condition: owmData.weather[0].main
              })
            });
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Weather API error:', error);
        // Set default data on error
        setWeatherData({
          current: {
            airTemp: 28,
            trackTemp: 42,
            humidity: 35,
            windSpeed: '3.2',
            windDirection: 'N',
            pressure: 1013,
            rainfall: 0,
            condition: 'Clear'
          },
          forecast: generateForecast({ airTemp: 28, trackTemp: 42, condition: 'Clear' })
        });
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getWindDirection = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  };

  const generateForecast = (current) => {
    // Generate simple 6-hour forecast based on current conditions
    const forecast = [];
    const currentHour = new Date().getHours();
    
    for (let i = 1; i <= 6; i++) {
      const hour = (currentHour + i) % 24;
      // Slight temperature variation
      const tempVariation = Math.sin(i * 0.5) * 2;
      
      forecast.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        condition: current.condition,
        airTemp: Math.round(current.airTemp + tempVariation),
        trackTemp: Math.round(current.trackTemp + tempVariation * 1.5),
        rainChance: current.condition.includes('Rain') ? 60 : current.condition.includes('Cloud') ? 20 : 5
      });
    }
    
    return forecast;
  };

  const getConditionIcon = (condition) => {
    if (condition === 'Clear') return '☀️';
    if (condition === 'Partly Cloudy' || condition === 'Clouds') return '⛅';
    if (condition === 'Cloudy' || condition === 'Overcast') return '☁️';
    if (condition === 'Rain' || condition === 'Drizzle') return '🌧️';
    if (condition === 'Thunderstorm') return '⛈️';
    return '☀️';
  };

  if (loading || !weatherData) {
    return (
      <div className="card" style={{ height: '100%' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Weather Conditions</div>
            <div className="card-subtitle">Yas Marina Circuit · Loading...</div>
          </div>
        </div>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--ferrari-yellow)', fontSize: '1.2rem', animation: 'ferrari-pulse 2s ease-in-out infinite' }}>
            Loading weather data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div>
          <div className="card-title">🌤️ Weather Conditions</div>
          <div className="card-subtitle">Yas Marina Circuit, Abu Dhabi · {time.toLocaleTimeString()}</div>
        </div>
        <div style={{ 
          padding: '0.5rem 1rem', 
          background: 'linear-gradient(135deg, var(--ferrari-red), var(--ferrari-dark-red))',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: '700',
          color: 'var(--ferrari-yellow)',
          boxShadow: '0 0 15px var(--ferrari-glow)'
        }}>
          LIVE
        </div>
      </div>
      <div className="card-body">
        {/* Current Weather */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '3rem' }}>{getConditionIcon(weatherData.current.condition)}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                {weatherData.current.condition}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ferrari-red)', textShadow: '0 0 15px var(--ferrari-glow)' }}>
                {weatherData.current.airTemp}°C
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Air Temperature</div>
            </div>
          </div>

          {/* Weather Grid - Ferrari Theme */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, var(--bg-card), var(--ferrari-black))', 
              padding: '1rem', 
              borderRadius: '8px', 
              border: '2px solid var(--ferrari-red)',
              boxShadow: '0 0 15px rgba(220, 0, 0, 0.2)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                🔥 Track Temp
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ferrari-red)', textShadow: '0 0 10px var(--ferrari-glow)' }}>
                {weatherData.current.trackTemp}°C
              </div>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, var(--bg-card), var(--ferrari-black))', 
              padding: '1rem', 
              borderRadius: '8px', 
              border: '2px solid var(--ferrari-red)',
              boxShadow: '0 0 15px rgba(220, 0, 0, 0.2)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                💧 Humidity
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ferrari-yellow)', textShadow: '0 0 10px var(--yellow-glow)' }}>
                {weatherData.current.humidity}%
              </div>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, var(--bg-card), var(--ferrari-black))', 
              padding: '1rem', 
              borderRadius: '8px', 
              border: '2px solid var(--ferrari-red)',
              boxShadow: '0 0 15px rgba(220, 0, 0, 0.2)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                💨 Wind
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                {weatherData.current.windSpeed} m/s
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ferrari-yellow)', marginTop: '0.25rem', fontWeight: '600' }}>
                {weatherData.current.windDirection}
              </div>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, var(--bg-card), var(--ferrari-black))', 
              padding: '1rem', 
              borderRadius: '8px', 
              border: '2px solid var(--ferrari-red)',
              boxShadow: '0 0 15px rgba(220, 0, 0, 0.2)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                🌡️ Pressure
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {weatherData.current.pressure}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                hPa
              </div>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, var(--bg-card), var(--ferrari-black))', 
              padding: '1rem', 
              borderRadius: '8px', 
              border: '2px solid var(--ferrari-red)',
              boxShadow: '0 0 15px rgba(220, 0, 0, 0.2)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                🌧️ Rainfall
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--ferrari-yellow)' }}>
                {weatherData.current.rainfall}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                mm
              </div>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, var(--bg-card), var(--ferrari-black))', 
              padding: '1rem', 
              borderRadius: '8px', 
              border: '2px solid var(--success)',
              boxShadow: '0 0 15px var(--success-glow)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                🏁 Track Status
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--success)', marginTop: '0.5rem' }}>
                {weatherData.current.rainfall > 0 ? 'WET' : 'DRY'}
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Forecast */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Hourly Forecast
          </h3>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {weatherData.forecast.map((item, index) => (
              <div 
                key={index}
                style={{ 
                  background: 'var(--bg-card)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)',
                  minWidth: '140px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {item.hour}
                </div>
                <div style={{ fontSize: '2rem', margin: '0.5rem 0' }}>
                  {getConditionIcon(item.condition)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {item.condition}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AIR</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                      {item.airTemp}°
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TRC</div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--danger)' }}>
                      {item.trackTemp}°
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rain Chance</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: item.rainChance > 30 ? 'var(--warning)' : 'var(--success)' }}>
                    {item.rainChance}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;
