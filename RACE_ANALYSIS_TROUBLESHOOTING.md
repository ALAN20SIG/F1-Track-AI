# 🏁 Race Analysis Module - Setup & Troubleshooting Guide

## 📋 Quick Start

### 1. Start Backend Server
```bash
cd backend
python main.py
```

**Wait 10-30 seconds** for the backend to:
- Initialize FastF1 service
- Load Abu Dhabi GP session data (auto-detects latest available: Race → Qualifying → FP3 → FP2 → FP1)
- Cache telemetry data

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test Backend Endpoints (Optional)
```bash
cd backend
python test_analysis_endpoints.py
```

This will verify all new endpoints are working correctly.

## 🆕 New Components

### 1. **Race Analysis Dashboard** (📊 Race Analysis)
**What it does:**
- Displays comprehensive telemetry for all drivers
- Shows lap times, sector times, speed traces, position changes
- Provides multi-driver comparison (up to 6 drivers)
- Enhanced analytics: tire degradation, fuel consumption, DRS usage, heat maps

**Requires:**
- Backend running on http://localhost:8000
- Session data loaded (wait 10-30 seconds after backend starts)

### 2. **Strategy Engine** (🎯 Strategy Engine)
**What it does:**
- AI-powered strategy recommendations
- Select driver and target position (P1-P10)
- Generates 3 strategic options: Aggressive, Balanced, Conservative
- Shows pit windows, stint breakdown, risk assessment, success probability

**Requires:**
- Backend running with session data
- Driver list from `/api/live/timing`

### 3. **Live/Replay Track** (🎬 Live/Replay Track)
**What it does:**
- Auto-switches between live and replay modes
- Live: Real-time driver positions with smooth interpolation
- Replay: Playback controls with speed adjustment (0.5x-4x)
- Uses official Yas Marina Circuit GeoJSON coordinates

**Requires:**
- Backend running for live mode
- Session info from `/api/session/info`

### 4. **Enhanced Strategy Comparison** (⚡ Strategy Comparison)
**What it does:**
- Compare multiple driver strategies
- Historical data integration
- Weather impact analysis
- Predictive analytics with success probability
- Risk assessment for each strategy

**Requires:**
- Backend running with weather data
- Historical telemetry from `/api/analysis/race-telemetry`

## 🔧 Troubleshooting

### ❌ Error: "Backend not responding" or "Connection refused"

**Problem:** Backend server is not running

**Solution:**
```bash
cd backend
python main.py
```

Wait for this message:
```
>> F1 data service ready - [Session Type] loaded
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

### ❌ Error: "Session data not loaded" or "Service unavailable (503)"

**Problem:** Backend started but session data hasn't loaded yet

**Solution:** 
1. Wait 10-30 seconds (FastF1 needs time to load cached data)
2. Check backend console for:
   ```
   >> Loaded 2026 Abu Dhabi GP R session
   >> F1 data service ready - Race loaded
   ```
3. If you see errors, check if cache directory has data:
   ```
   backend/cache/2025/ or backend/cache/2026/
   ```

---

### ❌ Error: "No driver data available"

**Problem:** Current session has no lap data

**Solution:**
1. Switch to a different session manually:
   ```bash
   curl -X POST http://localhost:8000/api/session/switch?session_type=R&year=2025
   ```
2. Or wait for backend to auto-detect a session with data

---

### ❌ Error: "CORS policy blocked"

**Problem:** Frontend port not allowed in backend CORS config

**Solution:**
Backend already allows these ports:
- 3000, 3001, 3002 (React dev servers)
- 5173 (Vite default)

If using different port, update `backend/main.py`:
```python
allow_origins=[
    "http://localhost:YOUR_PORT",
    ...
]
```

---

### ❌ Components show loading forever

**Problem:** Backend endpoints returning errors

**Solution:**
1. Open browser console (F12) and check for errors
2. Test endpoints manually:
   ```bash
   curl http://localhost:8000/api/session/info
   curl http://localhost:8000/api/analysis/race-telemetry
   ```
3. Check backend console for Python errors

---

### ❌ "Module not found" errors in backend

**Problem:** Missing Python dependencies

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

Required packages:
- fastapi
- uvicorn
- fastf1
- pandas
- numpy
- httpx

---

## 📊 Backend Endpoints Reference

### New Analysis Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analysis/race-telemetry` | GET | Full telemetry data for all drivers |
| `/api/analysis/strategy-suggestions/{driver}?target_position={pos}` | GET | AI strategy recommendations |
| `/api/analysis/enhanced-analytics` | GET | Heat maps, tire deg, fuel, DRS |
| `/api/analysis/driver-comparison?driver1={d1}&driver2={d2}` | GET | Head-to-head comparison |

### Existing Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/session/info` | GET | Current session information |
| `/api/live/timing` | GET | Live timing for all drivers |
| `/api/live/positions` | GET | Real-time track positions |
| `/api/live/weather` | GET | Weather data |

## 🎯 Testing Checklist

✅ **Backend Health Check:**
```bash
curl http://localhost:8000/api/session/info
```
Should return: `{"success": true, "session_type": "R", ...}`

✅ **Race Analysis:**
```bash
curl http://localhost:8000/api/analysis/race-telemetry
```
Should return: `{"success": true, "drivers": [...], ...}`

✅ **Strategy Engine:**
```bash
curl "http://localhost:8000/api/analysis/strategy-suggestions/VER?target_position=1"
```
Should return: `{"success": true, "strategies": [...], ...}`

✅ **Frontend Access:**
- Open http://localhost:5173 (or your Vite port)
- Navigate to "Race Analysis" in sidebar
- Should load within 2-3 seconds

## 🚀 Performance Tips

1. **First Load:** May take 15-30 seconds for backend to cache data
2. **Subsequent Loads:** Should be < 2 seconds
3. **Data Updates:** Components refresh every 10 seconds (Race Analysis) or 2 seconds (Live Track)
4. **Cache Location:** `backend/cache/` stores FastF1 data
5. **Memory Usage:** ~500MB for full session data

## 📝 Common Questions

**Q: Why does Race Analysis show "Loading..." forever?**
A: Backend needs session data with laps. Check if cache has data for 2025/2026 season.

**Q: Can I use data from previous years?**
A: Yes! Modify backend startup to load specific year:
```python
# In backend/fastf1_service.py, initialize_f1_data()
success = await f1_service.load_abu_dhabi_session(year=2024, session_type='R')
```

**Q: Strategy Engine shows "No drivers available"**
A: Timing data endpoint needs drivers. Ensure `/api/live/timing` returns driver list.

**Q: Live/Replay Track shows no drivers**
A: Check `/api/live/positions` returns position data with X/Y coordinates.

## 🐛 Debug Mode

Enable detailed logging in backend:
```python
# Add to backend/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

Frontend console debugging:
```javascript
// In browser console
localStorage.setItem('debug', 'true')
```

## 📞 Still Having Issues?

1. Check backend console for Python errors
2. Check browser console (F12) for JavaScript errors
3. Verify FastF1 cache has data: `ls backend/cache/2025/` or `ls backend/cache/2026/`
4. Test with the provided test script: `python backend/test_analysis_endpoints.py`
5. Ensure ports 8000 (backend) and 5173 (frontend) are not blocked by firewall

---

**Happy Racing! 🏎️💨**
