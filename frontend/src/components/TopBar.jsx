import { useState, useEffect } from 'react';

const TopBar = ({ raceTime }) => {
  const [localTime, setLocalTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [weather, setWeather] = useState({
    track_temp: 42,
    air_temp: 31,
    humidity: 35,
    wind_speed: 3.2,
    conditions: 'Clear'
  });
  const [weatherSource, setWeatherSource] = useState('loading');

  useEffect(() => {
    // Fetch real weather data from backend
    const fetchWeather = async () => {
      try {
        const response = await fetch('http://https://f1-track-ai-production.up.railway.app/api/live/weather');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.display) {
            setWeather(data.display);
            
            // Determine source for display
            if (data.fastf1 && data.openweathermap) {
              setWeatherSource('F1 + OpenWeather');
            } else if (data.fastf1) {
              setWeatherSource('F1 Official');
            } else if (data.openweathermap) {
              setWeatherSource('OpenWeather');
            } else {
              setWeatherSource('Default');
            }
            
            console.log('✓ Weather data updated:', data.display);
          }
        }
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        setWeatherSource('Offline');
      }
    };

    // Initial fetch
    fetchWeather();

    // Refresh weather every 5 minutes
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);

    // Update local time every second
    const timeInterval = setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
      }));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <div className="top-bar">
      <div className="race-info">
        <div className="race-title">Abu Dhabi GP 2025</div>
        <div className="race-session" style={{ background: '#ffb800' }}>Race</div>
      </div>
      <div className="race-timer">{localTime}</div>
      <div className="race-widgets">
        <div className="widget" title="Track Temperature">
          <div className="widget-label">TRC</div>
          <div className="widget-value">{weather.track_temp}°C</div>
        </div>
        <div className="widget" title="Air Temperature">
          <div className="widget-label">AIR</div>
          <div className="widget-value">{weather.air_temp}°C</div>
        </div>
        <div className="widget" title="Humidity">
          <div className="widget-label">HUM</div>
          <div className="widget-value">{weather.humidity}%</div>
        </div>
        <div className="widget" title="Wind Speed">
          <div className="widget-label">WIND</div>
          <div className="widget-value">{weather.wind_speed} m/s</div>
        </div>
      </div>
      <div className="lap-counter">
        <span className="lap-label">SESSION</span>
        <span className="lap-number">{raceTime}</span>
      </div>
      <div className="track-status" style={{ background: '#00d448' }} title={`Weather: ${weather.conditions || 'Clear'}`}>
        Track Clear
      </div>
    </div>
  );
};

export default TopBar;
