# 🏎️ F1 Track.AI - Complete System Architecture

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FastF1 Official API                          │
│                      https://api.formula1.com                        │
│  • Timing Data    • Telemetry    • Weather    • Session Results    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ HTTP Requests
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Backend Layer (Python)                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              FastAPI Server (Port 8000)                      │  │
│  │                                                              │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │  │
│  │  │ FastF1 Service  │  │  ML Prediction  │  │ Monte-Carlo│  │  │
│  │  │                 │  │     Model       │  │ Simulation │  │  │
│  │  │ • Session load  │  │ • Data collect │  │ • Strategy │  │  │
│  │  │ • Timing data   │  │ • Train model  │  │ • Pit stops│  │  │
│  │  │ • Telemetry     │  │ • Predict win  │  │ • Lap times│  │  │
│  │  │ • Weather       │  │ • 16 features  │  │            │  │  │
│  │  └─────────────────┘  └─────────────────┘  └────────────┘  │  │
│  │                                                              │  │
│  │  API Endpoints:                                              │  │
│  │  • GET  /api/live/timing                                    │  │
│  │  • GET  /api/live/positions                                 │  │
│  │  • GET  /api/live/track-layout                              │  │
│  │  • POST /api/ml/train                                       │  │
│  │  • GET  /api/ml/predict/race                                │  │
│  │  • GET  /api/ml/model/info                                  │  │
│  │  • POST /api/strategy/simulate                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Data Storage & Cache                            │  │
│  │  • cache/ - FastF1 downloaded data (10GB+)                  │  │
│  │  • models/ - Trained ML models (f1_race_winner_model.pkl)   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ REST API (JSON)
                                │ CORS enabled
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React + Vite)                     │
│                         Port 3001                                    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Main Dashboard (App.jsx)                  │  │
│  │                                                              │  │
│  │  ┌────────────┬────────────────┬─────────────┬───────────┐  │  │
│  │  │  Sidebar   │ Live Timings   │ AI Predict  │ Track Map │  │  │
│  │  │  (Menu)    │   (45%)        │   (30%)     │   (25%)   │  │  │
│  │  │            │                │             │           │  │  │
│  │  │ • Dashboard│ Dashboard.jsx  │ Prediction  │ TrackMap  │  │  │
│  │  │ • Track    │                │ Panel.jsx   │ .jsx      │  │  │
│  │  │ • Strategy │ • P1 VER      │             │           │  │  │
│  │  │ • Standings│ • P2 NOR      │ 🥇 VER 78%  │ ╭───────╮ │  │  │
│  │  │ • Weather  │ • P3 HAM      │ 🥈 NOR 65%  │/    YAS  \│  │  │
│  │  │ • Schedule │ • Lap times   │ 🥉 HAM 52%  ││  MARINA ││  │  │
│  │  │ • Settings │ • Sectors     │    LEC 48%  │\         /│  │  │
│  │  │            │ • Tyre data   │    PIA 45%  │ ╰───────╯ │  │  │
│  │  │            │                │             │  • X,Y    │  │  │
│  │  │            │ Auto-refresh  │ Auto-refresh│  • Dots   │  │  │
│  │  │            │ 5s            │ 30s         │           │  │  │
│  │  └────────────┴────────────────┴─────────────┴───────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Other Components:                                                   │
│  • StrategySimulator.jsx  - Monte-Carlo race strategy               │
│  • StrategyComparison.jsx - Compare multiple strategies             │
│  • Standings.jsx          - Championship standings                  │
│  • Weather.jsx            - Track conditions                        │
│  • Schedule.jsx           - Race calendar                           │
│  • RaceControl.jsx        - Race incidents & flags                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Real-Time Race Data Flow

```
┌──────────────┐
│  FastF1 API  │ Formula 1 Official Data
└──────┬───────┘
       │
       │ 1. Request session data
       ▼
┌──────────────────────┐
│  fastf1_service.py   │
│                      │
│  session.load()      │ Load Abu Dhabi GP 2024
│  ↓                   │
│  session.laps        │ Extract lap times
│  session.results     │ Extract positions
│  session.weather     │ Extract conditions
└──────┬───────────────┘
       │
       │ 2. Expose via REST API
       ▼
┌──────────────────────┐
│   FastAPI Endpoints  │
│                      │
│  GET /api/live/timing      → { drivers: [...], positions: [...] }
│  GET /api/live/positions   → { X: 123, Y: 456, driver: "VER" }
│  GET /api/live/telemetry   → { speed: 285, throttle: 100 }
└──────┬───────────────┘
       │
       │ 3. Fetch from frontend
       ▼
┌──────────────────────┐
│   React Components   │
│                      │
│  useEffect(() => {   │
│    fetch('/api/live/timing')
│      .then(data => setDrivers(data))
│  }, [])              │
└──────┬───────────────┘
       │
       │ 4. Render to UI
       ▼
┌──────────────────────┐
│   Live Dashboard     │
│                      │
│  P1  VER  1:23.456  │
│  P2  NOR  1:23.678  │
│  P3  HAM  1:23.890  │
└──────────────────────┘
```

---

### 2. ML Prediction Pipeline

```
┌──────────────────────────────────────────────────────┐
│              Training Phase (One-time, 10-15 min)    │
└──────────────────────────────────────────────────────┘

Step 1: Collect Historical Data
┌─────────────────┐
│ FastF1 API      │
│ • 2021 Season   │ → 22 races × 20 drivers = 440 samples
│ • 2022 Season   │ → 22 races × 20 drivers = 440 samples
│ • 2023 Season   │ → 22 races × 20 drivers = 440 samples
└────────┬────────┘
         │ Total: ~1,320 training samples
         ▼
Step 2: Extract Features
┌─────────────────────────────────────────────────────┐
│ For each race, for each driver:                     │
│                                                      │
│  1. Qualifying:   Q1_time, Q2_time, Q3_time        │
│  2. Grid:         Starting position                 │
│  3. Laps:         avg_lap, fastest_lap, lap_std    │
│  4. Strategy:     pit_stops, compounds              │
│  5. Weather:      air_temp, track_temp, humidity   │
│  6. Identity:     driver_code, team_name            │
│  7. Result:       won_race (1 or 0) ← Target       │
└────────┬────────────────────────────────────────────┘
         │ 16 features per sample
         ▼
Step 3: Train ML Models
┌──────────────────────────────┐  ┌─────────────────────────────┐
│  Random Forest Classifier    │  │ Gradient Boosting Classifier│
│  • 200 trees                 │  │ • 150 boosting stages       │
│  • Max depth: 15             │  │ • Learning rate: 0.1        │
│  • Min samples split: 5      │  │ • Max depth: 10             │
└──────────────┬───────────────┘  └───────────┬─────────────────┘
               │                              │
               │   Prediction for Driver X:   │
               │   RF: 0.82 probability       │
               │   GB: 0.74 probability       │
               └──────────┬───────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │   Ensemble    │
                  │  (0.82+0.74)  │
                  │      / 2      │
                  │   = 0.78      │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  Save Model   │
                  │  .pkl file    │
                  └───────────────┘

┌──────────────────────────────────────────────────────┐
│            Prediction Phase (Real-time, <1 sec)      │
└──────────────────────────────────────────────────────┘

Step 1: Get Current Race Data
┌─────────────────┐
│ FastF1 API      │
│ Abu Dhabi GP    │ → 20 drivers, current session
│ 2024 Race       │
└────────┬────────┘
         │
         ▼
Step 2: Extract Same Features
┌─────────────────────────────────────────────────────┐
│  For each of 20 drivers:                            │
│  • Q1, Q2, Q3 times from qualifying                │
│  • Grid position from race start                   │
│  • Current lap statistics                          │
│  • Weather conditions                              │
└────────┬────────────────────────────────────────────┘
         │ 16 features × 20 drivers = 320 values
         ▼
Step 3: Load Trained Model & Predict
┌─────────────────────────────────────────────────────┐
│  f1_race_winner_model.pkl                          │
│                                                     │
│  For VER: [features] → RF(0.82) + GB(0.74) = 0.78  │
│  For NOR: [features] → RF(0.68) + GB(0.62) = 0.65  │
│  For HAM: [features] → RF(0.55) + GB(0.49) = 0.52  │
│  For LEC: [features] → RF(0.51) + GB(0.45) = 0.48  │
│  ...                                                │
└────────┬────────────────────────────────────────────┘
         │
         ▼
Step 4: Rank & Return Top 10
┌─────────────────────────────────────────────────────┐
│  Predictions (sorted by probability):              │
│                                                     │
│  1. VER - Red Bull Racing    → 78.5% (HIGH)        │
│  2. NOR - McLaren            → 65.2% (STRONG)      │
│  3. HAM - Ferrari            → 52.1% (STRONG)      │
│  4. LEC - Ferrari            → 48.3% (MODERATE)    │
│  5. PIA - McLaren            → 45.7% (MODERATE)    │
│  ...                                                │
└────────┬────────────────────────────────────────────┘
         │
         ▼ GET /api/ml/predict/race
┌─────────────────────────────────────────────────────┐
│  { "predictions": [                                 │
│      { "driver": "VER", "win_probability": 0.785 }, │
│      { "driver": "NOR", "win_probability": 0.652 }, │
│      ...                                            │
│    ]                                                │
│  }                                                  │
└────────┬────────────────────────────────────────────┘
         │
         ▼ fetch() in PredictionPanel.jsx
┌─────────────────────────────────────────────────────┐
│            Frontend Visualization                   │
│                                                     │
│  🥇 #1  VER - Red Bull     78.5% [████████] HIGH   │
│  🥈 #2  NOR - McLaren      65.2% [██████  ] STRONG │
│  🥉 #3  HAM - Ferrari      52.1% [█████   ] STRONG │
│     #4  LEC - Ferrari      48.3% [████    ] MOD    │
└─────────────────────────────────────────────────────┘
```

---

## 🗂️ File Structure & Responsibilities

```
F1 Track.AI/
│
├── backend/
│   │
│   ├── main.py (343 lines)
│   │   • FastAPI application setup
│   │   • CORS middleware configuration
│   │   • Strategy simulation endpoints
│   │   • FastF1 live data endpoints
│   │   • ML prediction endpoints
│   │   • Startup event handlers
│   │
│   ├── fastf1_service.py (282 lines)
│   │   • F1LiveDataService class
│   │   • load_abu_dhabi_session()
│   │   • get_live_timing_data()
│   │   • get_driver_telemetry()
│   │   • get_track_positions()
│   │   • get_track_layout()
│   │   • Time/data conversions
│   │
│   ├── ml_prediction.py (362 lines)
│   │   • F1PredictionModel class
│   │   • collect_training_data()
│   │   • _extract_race_features()
│   │   • prepare_features()
│   │   • train_model() - RF + GB ensemble
│   │   • predict_race_winner()
│   │   • save_model() / load_model()
│   │   • train_f1_prediction_model() - Main
│   │
│   ├── requirements.txt
│   │   • fastapi==0.104.1
│   │   • uvicorn[standard]==0.24.0
│   │   • numpy==1.26.2
│   │   • pandas>=2.0.0
│   │   • fastf1>=3.7.0
│   │   • scikit-learn>=1.3.0
│   │   • joblib>=1.3.0
│   │   • pydantic==2.5.0
│   │
│   ├── cache/
│   │   • FastF1 cached data (auto-generated)
│   │   • Session files, telemetry, timing data
│   │   • ~10GB+ for multiple seasons
│   │
│   └── models/
│       • f1_race_winner_model.pkl (trained model)
│       • training_data.csv (raw training data)
│
├── frontend/
│   │
│   ├── src/
│   │   │
│   │   ├── App.jsx (113 lines)
│   │   │   • Main application component
│   │   │   • View routing (dashboard, strategy, etc.)
│   │   │   • 3-column layout: Timings + Predictions + Map
│   │   │   • Sidebar collapse handler
│   │   │
│   │   ├── index.css
│   │   │   • Dark theme styling
│   │   │   • F1-inspired glowing UI
│   │   │   • Card layouts, colors, animations
│   │   │   • Responsive design
│   │   │
│   │   └── components/
│   │       │
│   │       ├── Sidebar.jsx
│   │       │   • Navigation menu
│   │       │   • Collapsible sidebar
│   │       │   • F1 Track.AI branding
│   │       │
│   │       ├── TopBar.jsx
│   │       │   • Race information (Abu Dhabi GP)
│   │       │   • Session type (Race)
│   │       │   • Live status indicator
│   │       │
│   │       ├── Dashboard.jsx
│   │       │   • Live timing display
│   │       │   • Driver positions (P1-P20)
│   │       │   • Lap times, sectors, tyres
│   │       │   • Auto-refresh 5s
│   │       │   • FastF1 data integration
│   │       │
│   │       ├── PredictionPanel.jsx (337 lines) ← NEW!
│   │       │   • AI race winner predictions
│   │       │   • Top 10 drivers ranked
│   │       │   • Win probability display
│   │       │   • Color-coded likelihood
│   │       │   • Position change tracking
│   │       │   • Auto-refresh 30s
│   │       │   • Train model button
│   │       │   • Model status indicator
│   │       │
│   │       ├── TrackMap.jsx
│   │       │   • Circuit visualization
│   │       │   • Driver position dots
│   │       │   • Real-time movement (planned)
│   │       │
│   │       ├── StrategySimulator.jsx
│   │       │   • Monte-Carlo simulation
│   │       │   • Pit stop strategy analysis
│   │       │   • Win probability calculation
│   │       │
│   │       ├── StrategyComparison.jsx
│   │       │   • Compare multiple strategies
│   │       │   • Side-by-side analysis
│   │       │
│   │       ├── Standings.jsx
│   │       │   • Championship standings
│   │       │   • Driver & constructor points
│   │       │
│   │       ├── Weather.jsx
│   │       │   • Track conditions
│   │       │   • Temperature, humidity
│   │       │
│   │       ├── Schedule.jsx
│   │       │   • F1 calendar
│   │       │   • Race schedule
│   │       │
│   │       └── RaceControl.jsx
│   │           • Safety car, VSC
│   │           • Track incidents
│   │
│   ├── package.json
│   │   • react: ^18.3.1
│   │   • vite: ^7.2.6
│   │
│   └── vite.config.js
│       • Server config: port 3000
│       • React plugin
│
└── Documentation/
    │
    ├── ML_PREDICTION_GUIDE.md (642 lines)
    │   • Complete ML system guide
    │   • Training instructions
    │   • API endpoint documentation
    │   • Frontend integration code
    │   • Model architecture details
    │
    ├── FASTF1_IMPLEMENTATION_SUMMARY.md (511 lines)
    │   • System architecture overview
    │   • FastF1 API learning summary
    │   • Implementation checklist
    │   • File modifications log
    │
    ├── QUICK_START.md (392 lines)
    │   • 3-step getting started guide
    │   • Training instructions
    │   • Troubleshooting tips
    │   • API usage examples
    │
    ├── SYSTEM_ARCHITECTURE.md (this file)
    │   • Visual architecture diagrams
    │   • Data flow diagrams
    │   • File structure breakdown
    │
    └── OPTIMIZATION_SUMMARY.md
        • Previous optimization work
        • Layout improvements
        • FastF1 initial integration
```

---

## 🔌 API Endpoint Map

```
FastAPI Backend (https://f1-track-ai-production.up.railway.app)
│
├── Strategy Simulation
│   ├── POST /api/strategy/simulate
│   │    Body: { driver_name, total_laps, pit_stops: [...], n_sim }
│   │    Returns: { job_id, status }
│   │
│   └── GET  /api/strategy/job/{job_id}
│        Returns: { status, results: { mean_time, win_prob, ... } }
│
├── FastF1 Live Data
│   ├── GET  /api/live/timing
│   │    Returns: { success, race, circuit, drivers: [...] }
│   │    • position, code, name, team
│   │    • last_lap_time, sector_1, sector_2, sector_3
│   │    • tyre_age, compound, pit_stops
│   │
│   ├── GET  /api/live/positions
│   │    Returns: { success, positions: [...] }
│   │    • driver, position, x, y, speed
│   │
│   ├── GET  /api/live/track-layout
│   │    Returns: { success, circuit, layout: [...] }
│   │    • x, y coordinates for track outline
│   │
│   └── GET  /api/live/telemetry/{driver_code}?lap_number=5
│        Returns: { success, telemetry: {...} }
│        • x, y, speed, throttle, brake, gear
│
└── ML Predictions
    ├── POST /api/ml/train
    │    Body: { years: [2021, 2022, 2023] }
    │    Returns: { success, message, years }
    │    Action: Starts background training (10-15 min)
    │
    ├── GET  /api/ml/predict/race
    │    Returns: { success, predictions: [...], model_info }
    │    • driver, team, win_probability, grid_position
    │    Top 10 drivers ranked by likelihood
    │
    └── GET  /api/ml/model/info
         Returns: { trained, features: [...], feature_count, model_type }
```

---

## ⚡ Performance Characteristics

### Backend Response Times:
```
Endpoint                      Cached    Uncached
─────────────────────────────────────────────────
/api/live/timing              <50ms     200-500ms
/api/live/positions           <30ms     150-300ms
/api/live/telemetry/:code     <100ms    300-800ms
/api/ml/predict/race          <200ms    400-1000ms
/api/ml/train                 (async)   10-15 min
```

### Frontend Refresh Intervals:
```
Component               Interval    Method
──────────────────────────────────────────────
Dashboard (Live Timing)   5s       Auto-refresh
PredictionPanel           30s      Auto-refresh
TrackMap                  1s       Animation loop
Weather                   60s      Auto-refresh
```

### Data Sizes:
```
FastF1 Cache (3 seasons)    ~10 GB
Trained ML Model            ~50 MB
Single session data         ~200 MB
API response (timing)       ~10 KB
API response (predictions)  ~5 KB
```

---

## 🔐 Security & Configuration

### CORS Settings:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Environment Variables (Future):
```env
FASTF1_CACHE_DIR=./cache
ML_MODEL_PATH=./models/f1_race_winner_model.pkl
FRONTEND_URL=http://localhost:3001
BACKEND_PORT=8000
```

---

## 📊 Technology Stack Summary

```
┌─────────────────────────────────────────────────────┐
│                   Technology Stack                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Frontend:                                           │
│  • React 18.3.1      - UI framework                 │
│  • Vite 7.2.6        - Build tool & dev server      │
│  • Vanilla CSS       - Dark theme styling           │
│  • Fetch API         - HTTP requests                │
│                                                      │
│  Backend:                                            │
│  • Python 3.12       - Programming language         │
│  • FastAPI 0.104.1   - Web framework                │
│  • Uvicorn 0.24.0    - ASGI server                  │
│  • FastF1 3.7.0      - F1 data API                  │
│                                                      │
│  Machine Learning:                                   │
│  • scikit-learn 1.7.2    - ML library               │
│  • RandomForest          - Primary classifier       │
│  • GradientBoosting      - Secondary classifier     │
│  • pandas 2.0+           - Data manipulation        │
│  • numpy 1.26.2          - Numerical computing      │
│  • joblib 1.5.2          - Model persistence        │
│                                                      │
│  Data Sources:                                       │
│  • FastF1 API        - Official F1 timing data      │
│  • FIA F1 APIs       - Race results, telemetry      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Summary

This architecture provides:

✅ **Real-time F1 Data** - Via FastF1 official API  
✅ **ML Race Predictions** - Random Forest + Gradient Boosting ensemble  
✅ **Strategy Simulation** - Monte-Carlo pit stop analysis  
✅ **Modern UI** - React dashboard with 3-column layout  
✅ **Scalable Backend** - FastAPI with async endpoints  
✅ **Data Caching** - Fast repeated access to F1 data  
✅ **Model Persistence** - Trained models saved to disk  
✅ **Auto-Refresh** - Live updates every 5-30 seconds  

**🏁 Complete end-to-end F1 analytics platform!** 🏎️📊🤖
