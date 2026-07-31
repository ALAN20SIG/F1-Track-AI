# Quick Start Guide

## Running the Application

### Step 1: Start the Backend
Open a terminal and run:
```bash
cd backend
python main.py
```
✅ Backend running on https://f1-track-ai-backend.onrender.com

### Step 2: Start the Frontend
Open another terminal and run:
```bash
cd frontend
npm run dev
```
✅ Frontend running on http://localhost:3000 (or next available port)

### Step 3: Open in Browser
Click the preview button or navigate to the URL shown in the frontend terminal.

## What You'll See

### 🎯 Main Dashboard
- **Left Panel**: Live leaderboard with all 20 F1 2025 drivers
  - Real-time positions
  - Tyre compound indicators
  - Lap times and gaps
  - Team colors with glowing effects

- **Right Panel**: 
  - Track map (Losail International Circuit)
  - Strategy Simulator

### 🎮 Using the Strategy Simulator

1. **Select Drivers**: Click on driver chips to select (default: VER, NOR, LEC, PIA, HAM)
2. **Set Race Laps**: Adjust the number of laps (default: 57)
3. **Set Simulations**: Choose how many simulations to run (default: 1000)
4. **Run Simulation**: Click "RUN SIMULATION" button
5. **View Results**: 
   - Win % with bar chart
   - Podium % with bar chart
   - Average finish position
   - Results ranked by win probability

### 🔄 Live Updates
- Leaderboard updates every 5 seconds
- Tyre age increments automatically
- Race timer runs continuously

## Features to Try

### Sidebar Navigation
- Dashboard - Main view
- Track Map - Circuit visualization
- Standings - Championship positions
- Weather - Race conditions
- Settings - Configuration options
- Schedule - Race calendar
- Help - Documentation
- Github & Discord - External links

### Race Information Bar
- Qatar GP title
- Live race timer
- Weather data (Track temp, Air temp, Humidity, Wind)
- Lap counter (12/57)
- Track status (Track Clear)

## API Endpoints

You can also use the API directly:

### Test Backend
```bash
curl https://f1-track-ai-backend.onrender.com/
```

### Start Simulation
```bash
curl -X POST https://f1-track-ai-backend.onrender.com/api/simulate \
  -H "Content-Type: application/json" \
  -d @simulation_request.json
```

### Check Status
```bash
curl https://f1-track-ai-backend.onrender.com/api/status/{job_id}
```

### List All Jobs
```bash
curl https://f1-track-ai-backend.onrender.com/api/jobs
```

## Troubleshooting

### Port Already in Use
If port 3000 is occupied, Vite will automatically use the next available port (3001, 3002, etc.)

### Backend Not Responding
1. Make sure Python dependencies are installed: `pip install -r requirements.txt`
2. Check if port 8000 is available
3. Restart the backend server

### Frontend Not Loading
1. Make sure Node modules are installed: `npm install`
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Restart the dev server

### CORS Errors
The backend is configured to accept requests from:
- http://localhost:3000
- http://127.0.0.1:3000

If using a different port, update `main.py` in the CORS middleware.

## Performance Tips

### Simulation Performance
- 1000 simulations ≈ 2-3 seconds
- 5000 simulations ≈ 8-10 seconds
- 10000 simulations ≈ 15-20 seconds

### Optimal Settings
- **Quick test**: 500 simulations, 3-5 drivers
- **Standard**: 1000 simulations, 5-10 drivers
- **Detailed**: 5000+ simulations, 10-20 drivers

## Technical Details

### Frontend Stack
- React 18 (functional components + hooks)
- Vite 7 (dev server + bundler)
- Pure CSS (no framework)
- Fetch API (backend communication)

### Backend Stack
- FastAPI (async web framework)
- NumPy (numerical computations)
- Uvicorn (ASGI server)
- Pydantic (data validation)

### Data Format
All driver data is in `frontend/src/data/drivers2025.js`
- 20 drivers with full names, codes, teams
- 10 teams with official colors
- Starting positions and tyre compounds

## Next Steps

1. **Customize**: Edit driver data, team colors, race parameters
2. **Extend**: Add more simulation strategies, different tracks
3. **Deploy**: Build for production with `npm run build`
4. **Integrate**: Connect to live F1 timing data APIs

Enjoy your F1 Dashboard! 🏎️💨
