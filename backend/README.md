# F1 Live Timing Dashboard - Backend

FastAPI backend with Monte-Carlo race simulation.

## Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Run the server:
```bash
python main.py
```

The API will be available at `https://f1-track-ai-production.up.railway.app`

## API Endpoints

- `GET /` - API info
- `POST /api/simulate` - Start a new simulation
- `GET /api/status/{job_id}` - Get simulation status and results
- `GET /api/jobs` - List all jobs

## Simulation Request Format

```json
{
  "race_laps": 57,
  "n_simulations": 1000,
  "drivers": [
    {
      "driver_code": "VER",
      "driver_name": "Max Verstappen",
      "team": "Red Bull Racing",
      "base_lap": 83.5,
      "degradation": 0.02,
      "lap_std": 0.15,
      "pit_stops": [20, 40],
      "pit_delta": 22.0
    }
  ]
}
```
