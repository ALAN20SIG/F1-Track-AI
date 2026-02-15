const Sidebar = ({ currentView, setCurrentView, collapsed, setCollapsed }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', section: 'main' },
    { id: 'analytics', label: 'Strategy Analytics', icon: '📈', section: 'main' },
    { id: 'race-analysis', label: 'Race Analysis', icon: '🏎️', section: 'main' },
    { id: 'ai-predictions', label: 'AI Race Predictions', icon: '🤖', section: 'main' },
    { id: 'strategy-engine', label: 'Strategy Engine', icon: '🎯', section: 'main' },
    { id: 'live-replay', label: 'Live/Replay Track', icon: '🎬', section: 'main' },
    { id: 'race-control', label: 'Race Control', icon: '🏁', section: 'main' },
    { id: 'tire-degradation', label: 'Tire Degradation', icon: '🔴', section: 'tools' },
    { id: 'strategy-simulator', label: 'Strategy Simulator', icon: '⚙️', section: 'tools' },
    { id: 'strategy-comparison', label: 'Strategy Comparison', icon: '⚡', section: 'tools' },
    { id: 'standings', label: 'Standings', icon: '🏆', section: 'info' },
    { id: 'weather', label: 'Weather', icon: '🌤️', section: 'info' },
    { id: 'schedule', label: 'Schedule', icon: '📅', section: 'info' },
    { id: 'settings', label: 'Settings', icon: '⚙️', section: 'other' },
    { id: 'help', label: 'Help', icon: '❓', section: 'other' },
  ];

  const externalLinks = [
    { id: 'github', label: 'Github', icon: '💻', url: 'https://github.com' },
    { id: 'discord', label: 'Discord', icon: '💬', url: 'https://discord.com' },
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        {!collapsed && (
          <>
            F1<span>Track.AI</span>
          </>
        )}
        {collapsed && <span style={{ fontSize: '1.8rem' }}>🏎️</span>}
      </div>
      
      {/* Ferrari-themed Toggle Button */}
      <div 
        onClick={() => setCollapsed(!collapsed)}
        style={{
          padding: '1rem',
          textAlign: 'center',
          cursor: 'pointer',
          borderBottom: '2px solid var(--ferrari-red)',
          fontSize: '1.25rem',
          transition: 'all var(--transition-fast)',
          background: 'linear-gradient(90deg, transparent, var(--ferrari-dark-red), transparent)',
          color: 'var(--ferrari-yellow)',
          fontWeight: 'bold',
        }}
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(90deg, var(--ferrari-dark-red), var(--ferrari-red), var(--ferrari-dark-red))';
          e.currentTarget.style.boxShadow = '0 0 20px var(--ferrari-glow)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(90deg, transparent, var(--ferrari-dark-red), transparent)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {collapsed ? '▶' : '◀'}
      </div>
      
      <div className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <div className="nav-section-title">Main</div>}
          {navItems.map(item => (
            <div
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
              title={collapsed ? item.label : ''}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </div>
          ))}
        </div>
        <div className="nav-section">
          {!collapsed && <div className="nav-section-title">Links</div>}
          {externalLinks.map(item => (
            <a
              key={item.id}
              className="nav-item"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', justifyContent: collapsed ? 'center' : 'flex-start' }}
              title={collapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
