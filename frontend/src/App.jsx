import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import TrackMap from './components/TrackMap';
import StrategySimulator from './components/StrategySimulator';
import StrategyComparison from './components/StrategyComparison';
import Standings from './components/Standings';
import Weather from './components/Weather';
import Schedule from './components/Schedule';
import RaceControl from './components/RaceControl';
import RacePrediction from './components/RacePrediction';
import TireDegradation from './components/TireDegradation';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [raceTime, setRaceTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRaceTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderContent = () => {
    if (currentView === 'dashboard') {
      return (
        <div style={{ display: 'flex', gap: '0.75rem', height: 'calc(100vh - 120px)', margin: 0 }}>
          <div style={{ flex: '1', overflow: 'auto' }}>
            <Dashboard />
          </div>
        </div>
      );
    }
    
    if (currentView === 'ai-predictions') {
      return <RacePrediction />;
    }
    
    if (currentView === 'track-map') {
      return <TrackMap />;
    }
    
    if (currentView === 'tire-degradation') {
      return <TireDegradation />;
    }
    
    if (currentView === 'strategy-simulator') {
      return <StrategySimulator />;
    }
    
    if (currentView === 'strategy-comparison') {
      return <StrategyComparison />;
    }
    
    if (currentView === 'standings') {
      return <Standings />;
    }
    
    if (currentView === 'weather') {
      return <Weather />;
    }
    
    if (currentView === 'schedule') {
      return <Schedule />;
    }
    
    if (currentView === 'race-control') {
      return <RaceControl />;
    }
    
    // Default fallback
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">{currentView.replace('-', ' ').toUpperCase()}</div>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--text-secondary)' }}>This page is under construction.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className="main-content">
        <TopBar raceTime={formatTime(raceTime)} />
        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
