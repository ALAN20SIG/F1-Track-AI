# F1 Track.AI - Technical Documentation

## Project Overview

F1 Track.AI is a comprehensive Formula 1 telemetry dashboard and race strategy simulator built with a modern full-stack architecture. The system provides real-time race data visualization, predictive analytics, strategy simulation, and team/driver management for the 2026 F1 season.

---

## Technology Stack

### Frontend Architecture

#### Core Technologies
- **React 19.0.0**: Modern React with hooks and functional components
- **Vite 7.2.6**: Next-generation frontend build tool with HMR (Hot Module Replacement)
- **TypeScript**: Type-safe JavaScript for enhanced development experience
- **CSS3**: Custom styling with CSS variables for theming

#### Build & Development Tools
- **Vite**: Primary build tool offering:
  - Lightning-fast HMR (Hot Module Replacement)
  - Optimized production builds with tree-shaking
  - Native ESM (ECMAScript Modules) support
  - Integrated dev server with proxy configuration

#### Frontend Project Structure
```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.jsx    # Live timing leaderboard
│   │   ├── RaceControl.jsx  # Race flags and messages
│   │   ├── LiveTrackMap.jsx # Real-time track visualization
│   │   ├── TeamsGallery.jsx # Team/driver showcase
│   │   ├── StrategyAnalytics.jsx # Strategy charts
│   │   ├── PredictionPanel.jsx # ML predictions
│   │   ├── Weather.jsx      # Weather data display
│   │   ├── Standings.jsx    # Championship standings
│   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   └── TopBar.jsx       # Header with session info
│   ├── data/
│   │   ├── drivers2026.js   # 2026 F1 driver data
│   │   └── drivers2025.js   # Legacy 2025 data
│   ├── App.jsx             # Main application router
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── package.json
├── vite.config.js          # Vite configuration
└── tsconfig.json           # TypeScript configuration
```

---

### Backend Architecture

#### Core Technologies
- **Python 3.12**: Primary backend language
- **FastAPI**: Modern, high-performance web framework
- **Uvicorn**: ASGI server for running FastAPI
- **Pydantic**: Data validation and serialization

#### Key Backend Libraries
```python
# Data Processing
numpy==2.2.6          # Numerical computations
pandas==2.3.1         # Data manipulation
scipy==1.15.2         # Scientific computing

# Machine Learning
scikit-learn==1.6.1   # ML algorithms
xgboost==3.0.0        # Gradient boosting

# F1 Data
fastf1==3.5.3         # Official F1 data API

# HTTP & API
httpx==0.28.1         # Async HTTP client
requests==2.32.3      # HTTP requests

# Database
sqlite3               # Embedded database

# Utilities
python-dateutil       # Date parsing
matplotlib==3.10.1    # Plotting (backend)
```

#### Backend Project Structure
```
backend/
├── main.py                 # FastAPI application entry
├── fastf1_service.py       # FastF1 integration service
├── ml_prediction.py        # Machine learning models
├── race_prediction_model.py # Race outcome predictor
├── tire_degradation_model.py # Tire wear simulation
├── api_sources.py          # Multi-source API aggregator
├── weather_sources.py      # Weather data integration
├── abu_dhabi_database.py   # Race data persistence
├── data_validator.py       # Data quality validation
└── requirements.txt        # Python dependencies
```

---

## Data Sources & Integrations

### Primary Data Sources

#### 1. FastF1 (Official F1 Data)
- **Purpose**: Primary source for official F1 telemetry
- **Data Types**:
  - Lap times and sector times
  - Car telemetry (speed, RPM, gear, DRS)
  - Track position data
  - Race control messages
  - Weather data
  - Driver/car information
- **Implementation**: `fastf1_service.py` provides caching and session management
- **Caching**: FastF1's built-in SQLite cache for offline access

#### 2. OpenF1 (Free Public API)
- **Purpose**: Fallback data source when FastF1 unavailable
- **Endpoints**:
  - `/drivers` - Driver information
  - `/sessions` - Session data
  - `/laps` - Lap timing data
  - `/pit` - Pit stop data
- **Implementation**: `api_sources.py` with automatic failover

#### 3. Weather APIs
- **Sources**: OpenWeatherMap, WeatherAPI
- **Implementation**: `weather_sources.py` with intelligent ranking
- **Fallback**: Default weather values when APIs unavailable

### Data Integration Strategy

```python
# Multi-Source Aggregation Pattern
class APIAggregator:
    def get_best_data(self, data_type):
        # Try primary source first
        for source in self.ranked_sources:
            result = source.fetch(data_type)
            if result.success and self.validate(result.data):
                return result
        # Return fallback if all fail
        return self.get_fallback_data(data_type)
```

---

## Component Architecture

### React Component Design Patterns

#### 1. Functional Components with Hooks
All components use modern React patterns:
```jsx
const Component = () => {
  const [state, setState] = useState(initialValue);
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // Data fetching
    fetchData();
    
    // Cleanup
    return () => {
      // Cancel subscriptions, timers
    };
  }, [dependencies]);
  
  return (
    <div className="card">
      {/* Component JSX */}
    </div>
  );
};
```

#### 2. Custom Hooks Pattern
Data fetching encapsulated in reusable logic:
```jsx
const useLiveTiming = () => {
  const [drivers, setDrivers] = useState([]);
  
  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);
  
  return drivers;
};
```

#### 3. Props Drilling Avoidance
- Context API for global state (theme, session)
- Props only for component-specific data
- Callback functions for parent-child communication

### Key Components

#### Dashboard.jsx (Live Timing)
- **Purpose**: Real-time race leaderboard
- **Features**:
  - Live position updates
  - Lap time comparisons
  - Tyre compound visualization
  - Gap calculations
  - Status indicators (PIT, OUT, RETIRED)
- **Data Flow**: FastAPI → React State → Render

#### LiveTrackMap.jsx (Track Visualization)
- **Purpose**: Real-time driver positioning on track
- **Technology**: SVG with requestAnimationFrame
- **Features**:
  - 60fps smooth animation
  - Linear interpolation (lerp) for movement
  - Team color coding
  - Interactive controls (play/pause/speed)
  - DRS zone visualization
- **Animation Algorithm**:
```javascript
const lerp = (start, end, factor) => start + (end - start) * factor;

// In animation loop
positions[driver] = {
  x: lerp(current.x, target.x, 0.15),
  y: lerp(current.y, target.y, 0.15)
};
```

#### RaceControl.jsx (Flag System)
- **Purpose**: Race control messages and flag status
- **Features**:
  - 20+ flag types (GREEN, YELLOW, RED, BLUE, DRS, SC, VSC, etc.)
  - Message categorization (safety, timing, incidents, weather)
  - Severity-based styling
  - Expandable message details
  - Category filtering
- **Data Source**: `/api/race-control` endpoint

#### TeamsGallery.jsx (Team Showcase)
- **Purpose**: Display all 11 teams and 22 drivers
- **Features**:
  - Official Formula1.com driver photos
  - Team car images
  - Grid layout with team cards
  - Driver statistics
- **Data Source**: `drivers2026.js`

---

## API Architecture

### FastAPI Endpoints

#### Live Data Endpoints
```python
GET /api/live/timing          # Current driver positions
GET /api/live/positions       # Track coordinates
GET /api/live/track-layout    # Track geometry
GET /api/live/telemetry/{driver}  # Driver telemetry
GET /api/live/weather         # Weather conditions
GET /api/race-control         # Race control messages
```

#### Analysis Endpoints
```python
GET /api/analysis/race-telemetry           # Telemetry analysis
GET /api/analysis/strategy-suggestions/{driver}  # Strategy AI
GET /api/analysis/driver-comparison        # Driver comparisons
GET /api/analysis/enhanced-analytics       # Advanced metrics
```

#### Simulation Endpoints
```python
POST /api/simulation/start    # Start Monte Carlo simulation
GET /api/status/{job_id}      # Check simulation status
GET /api/jobs                 # List all simulations
```

#### ML Prediction Endpoints
```python
POST /api/ml/train            # Train prediction model
GET /api/ml/predict/{driver}  # Get race predictions
```

### API Design Patterns

#### 1. Consistent Response Format
```json
{
  "success": true,
  "data": {...},
  "timestamp": "2026-02-27T12:00:00Z",
  "source": "fastf1"
}
```

#### 2. Error Handling
```python
try:
    data = fetch_data()
    return {"success": True, "data": data}
except Exception as e:
    return {
        "success": False,
        "error": str(e),
        "fallback": get_default_data()
    }
```

#### 3. CORS Configuration
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Machine Learning Architecture

### Prediction Models

#### 1. Race Outcome Predictor
- **Algorithm**: XGBoost Gradient Boosting
- **Features**:
  - Starting position
  - Tyre strategy
  - Pit stop timing
  - Weather conditions
  - Historical performance
- **Training**: Monte Carlo simulation data

#### 2. Tire Degradation Model
- **Algorithm**: Physics-based + ML hybrid
- **Factors**:
  - Track temperature
  - Compound type
  - Driving style
  - Fuel load
- **Output**: Lap time degradation curve

#### 3. Strategy Optimizer
- **Algorithm**: Dynamic programming
- **Objective**: Minimize total race time
- **Constraints**:
  - Pit window rules
  - Tyre compound requirements
  - Track position

### ML Pipeline
```python
# Training Flow
1. Collect historical race data
2. Feature engineering
3. Model training (XGBoost)
4. Cross-validation
5. Model persistence (pickle)
6. API endpoint exposure
```

---

## Database Architecture

### SQLite Schema

#### Race Data Tables
```sql
-- Sessions
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY,
    year INTEGER,
    round INTEGER,
    session_type TEXT,
    date TEXT
);

-- Drivers
CREATE TABLE drivers (
    code TEXT PRIMARY KEY,
    number INTEGER,
    full_name TEXT,
    team TEXT,
    team_color TEXT
);

-- Lap Times
CREATE TABLE lap_times (
    id INTEGER PRIMARY KEY,
    driver_code TEXT,
    lap_number INTEGER,
    lap_time REAL,
    sector1 REAL,
    sector2 REAL,
    sector3 REAL,
    compound TEXT
);

-- Pit Stops
CREATE TABLE pit_stops (
    id INTEGER PRIMARY KEY,
    driver_code TEXT,
    lap INTEGER,
    duration REAL,
    compound_in TEXT,
    compound_out TEXT
);
```

---

## Design Patterns & Best Practices

### 1. Separation of Concerns
- **Frontend**: UI rendering and user interaction
- **Backend**: Data processing and business logic
- **Services**: External API integrations
- **Models**: Data validation and ML

### 2. Error Handling Strategy
- **Frontend**: Graceful degradation with fallbacks
- **Backend**: Try-catch with meaningful error messages
- **API**: Consistent error response format

### 3. Caching Strategy
- **FastF1**: Automatic HTTP caching
- **Backend**: In-memory caching for API responses
- **Frontend**: Local state management

### 4. Performance Optimization
- **Frontend**:
  - React.memo for expensive components
  - useMemo for computed values
  - Virtual scrolling for long lists
  - Image lazy loading
  
- **Backend**:
  - Async/await for I/O operations
  - Connection pooling
  - Response compression
  - Request batching

### 5. Security Considerations
- CORS restricted to known origins
- Input validation with Pydantic
- No sensitive data in frontend
- SQL injection prevention (parameterized queries)

---

## Development Workflow

### Local Development Setup

#### Frontend
```bash
cd frontend
npm install
npm run dev          # Starts dev server on :5173
npm run build        # Production build
```

#### Backend
```bash
cd backend
pip install -r requirements.txt
python -c "import uvicorn; from main import app; uvicorn.run(app, host='0.0.0.0', port=8000)"
```

### Deployment Strategy

#### Production Build
1. Frontend: `npm run build` → `dist/` folder
2. Backend: Direct Python execution
3. Serve static files via FastAPI or reverse proxy

#### Environment Variables
```bash
# Backend
FASTF1_CACHE_DIR=/path/to/cache
DATABASE_URL=sqlite:///f1_data.db
ML_MODEL_PATH=/path/to/models

# Frontend
VITE_API_URL=https://f1-track-ai-production.up.railway.app
```

---

## Notable Implementation Strategies

### 1. Real-Time Data Simulation
When live F1 sessions unavailable, system generates realistic simulated data:
- Variable message intervals (10-30s) for realism
- Driver-specific behavior patterns
- Weather condition progression
- Random incidents and safety cars

### 2. Multi-Source Data Validation
```python
def validate_data(data, source):
    checks = {
        'completeness': check_all_fields_present(data),
        'range': check_values_in_range(data),
        'consistency': check_internal_consistency(data),
        'timestamp': check_freshness(data)
    }
    return all(checks.values())
```

### 3. Responsive Design
- CSS Grid for layout
- Flexbox for component alignment
- Media queries for breakpoints
- Mobile-first approach

### 4. State Management
- React useState for local component state
- Props for parent-child communication
- No global state library (keep it simple)
- URL parameters for view state

---

## Testing Strategy

### Frontend Testing
- Component unit tests (Jest + React Testing Library)
- Integration tests for API calls
- Visual regression testing

### Backend Testing
- API endpoint tests (pytest)
- ML model validation
- Data pipeline testing

### Manual Testing
- Cross-browser compatibility
- Mobile responsiveness
- Performance profiling

---

## Future Enhancements

### Planned Features
1. **WebSocket Integration**: Real-time push updates
2. **Historical Analysis**: Season-long statistics
3. **3D Track Visualization**: Three.js integration
4. **Mobile App**: React Native port
5. **AI Commentary**: Natural language race summaries

### Technical Debt
- Migrate to TypeScript fully
- Implement proper logging
- Add comprehensive error tracking
- Set up CI/CD pipeline

---

## Conclusion

F1 Track.AI demonstrates modern full-stack development practices with:
- Clean architecture separating concerns
- Robust error handling and fallbacks
- Performance optimization at multiple levels
- Scalable data integration patterns
- User-centric design with accessibility

The technology choices prioritize:
- **Developer Experience**: TypeScript, FastAPI, Vite
- **Performance**: Async operations, caching, optimization
- **Maintainability**: Clear patterns, documentation, testing
- **User Experience**: Responsive, fast, reliable

---

## Appendix: Technology Versions

### Frontend
- React: 19.0.0
- Vite: 7.2.6
- TypeScript: 5.7.3
- Node.js: 20.x

### Backend
- Python: 3.12
- FastAPI: 0.115.8
- Uvicorn: 0.34.0
- Pydantic: 2.10.6

### Data & ML
- FastF1: 3.5.3
- Pandas: 2.3.1
- NumPy: 2.2.6
- Scikit-learn: 1.6.1
- XGBoost: 3.0.0

---

*Document Version: 1.0*
*Last Updated: February 2026*
*Project: F1 Track.AI Dashboard*
