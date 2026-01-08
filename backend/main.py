from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
import uuid
import asyncio
import httpx
from datetime import datetime
from fastf1_service import f1_service, initialize_f1_data
from ml_prediction import F1PredictionModel
from abu_dhabi_2025_fp2_data import get_2025_fp2_data
from abu_dhabi_2025_race_data import get_2025_race_data
from api_sources import api_aggregator
from weather_sources import weather_aggregator
from race_prediction_model import race_predictor, train_abu_dhabi_predictor
from tire_degradation_model import tire_model, initialize_tire_model

app = FastAPI(title="F1 Strategy Simulator API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for simulation jobs
jobs_storage: Dict[str, Dict] = {}

# ML Prediction Model
ml_model = F1PredictionModel()


class DriverStrategy(BaseModel):
    driver_code: str
    driver_name: str
    team: str
    base_lap: float  # Base lap time in seconds
    degradation: float  # Degradation per lap
    lap_std: float  # Standard deviation for lap time
    pit_stops: List[int]  # Laps when pit stops occur
    pit_delta: float  # Time lost per pit stop


class SimulationRequest(BaseModel):
    race_laps: int
    n_simulations: int
    drivers: List[DriverStrategy]


class SimulationResult(BaseModel):
    driver_code: str
    driver_name: str
    team: str
    win_percentage: float
    podium_percentage: float
    avg_finish_position: float
    avg_race_time: float


class JobResponse(BaseModel):
    job_id: str
    status: str


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: Optional[int] = None
    results: Optional[List[SimulationResult]] = None
    error: Optional[str] = None


def run_monte_carlo_simulation(
    race_laps: int,
    n_simulations: int,
    drivers: List[DriverStrategy]
) -> List[SimulationResult]:
    """
    Run Monte-Carlo simulation for F1 race strategy
    """
    driver_results = {
        driver.driver_code: {
            "wins": 0,
            "podiums": 0,
            "total_positions": 0,
            "total_time": 0,
            "driver_name": driver.driver_name,
            "team": driver.team
        }
        for driver in drivers
    }
    
    for sim in range(n_simulations):
        race_times = {}
        
        # Calculate total race time for each driver
        for driver in drivers:
            total_time = 0.0
            
            for lap in range(1, race_laps + 1):
                # Base lap time + degradation * lap number + random noise
                lap_time = driver.base_lap + driver.degradation * lap + np.random.normal(0, driver.lap_std)
                total_time += lap_time
                
                # Add pit stop time if this is a pit lap
                if lap in driver.pit_stops:
                    total_time += driver.pit_delta
            
            race_times[driver.driver_code] = total_time
        
        # Sort drivers by race time
        sorted_drivers = sorted(race_times.items(), key=lambda x: x[1])
        
        # Record results
        for position, (driver_code, race_time) in enumerate(sorted_drivers, start=1):
            driver_results[driver_code]["total_positions"] += position
            driver_results[driver_code]["total_time"] += race_time
            
            if position == 1:
                driver_results[driver_code]["wins"] += 1
            if position <= 3:
                driver_results[driver_code]["podiums"] += 1
    
    # Calculate percentages and averages
    results = []
    for driver_code, data in driver_results.items():
        results.append(SimulationResult(
            driver_code=driver_code,
            driver_name=data["driver_name"],
            team=data["team"],
            win_percentage=round((data["wins"] / n_simulations) * 100, 2),
            podium_percentage=round((data["podiums"] / n_simulations) * 100, 2),
            avg_finish_position=round(data["total_positions"] / n_simulations, 2),
            avg_race_time=round(data["total_time"] / n_simulations, 2)
        ))
    
    # Sort by win percentage
    results.sort(key=lambda x: x.win_percentage, reverse=True)
    return results


async def process_simulation(job_id: str, request: SimulationRequest):
    """
    Process simulation asynchronously
    """
    try:
        jobs_storage[job_id]["status"] = "processing"
        jobs_storage[job_id]["progress"] = 0
        
        # Run simulation in executor to avoid blocking
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            run_monte_carlo_simulation,
            request.race_laps,
            request.n_simulations,
            request.drivers
        )
        
        jobs_storage[job_id]["status"] = "completed"
        jobs_storage[job_id]["progress"] = 100
        jobs_storage[job_id]["results"] = [result.dict() for result in results]
        
    except Exception as e:
        jobs_storage[job_id]["status"] = "failed"
        jobs_storage[job_id]["error"] = str(e)


@app.get("/")
async def root():
    return {"message": "F1 Strategy Simulator API", "version": "1.0.0"}


@app.post("/api/simulate", response_model=JobResponse)
async def create_simulation(request: SimulationRequest):
    """
    Create a new simulation job
    """
    job_id = str(uuid.uuid4())
    
    jobs_storage[job_id] = {
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "progress": 0,
        "results": None,
        "error": None
    }
    
    # Start background task
    asyncio.create_task(process_simulation(job_id, request))
    
    return JobResponse(job_id=job_id, status="pending")


@app.get("/api/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Get status of a simulation job
    """
    if job_id not in jobs_storage:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs_storage[job_id]
    
    return JobStatusResponse(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        results=job["results"],
        error=job["error"]
    )


@app.get("/api/jobs")
async def list_jobs():
    """
    List all simulation jobs
    """
    return {
        "total": len(jobs_storage),
        "jobs": [
            {
                "job_id": job_id,
                "status": job["status"],
                "created_at": job["created_at"]
            }
            for job_id, job in jobs_storage.items()
        ]
    }


# FastF1 Live Data Endpoints

@app.on_event("startup")
async def startup_event():
    """
    Initialize FastF1 data service and tire degradation model on startup
    """
    asyncio.create_task(initialize_f1_data())
    
    # Initialize tire model with default Abu Dhabi conditions
    initialize_tire_model(track_temp=42.0, air_temp=28.0)


@app.get("/api/live/timing")
async def get_live_timing():
    """
    Get live timing data from best available API source
    Automatically selects highest-ranked source based on integrity testing
    Returns data from currently loaded session (FP3, Q, or latest available)
    """
    try:
        # Get current session info from FastF1 service
        session_type = f1_service.current_session_type or 'FP3'
        year = f1_service.current_year or 2026
        
        # IMPORTANT: For live/ongoing sessions, prioritize OpenF1 over FastF1
        # FastF1 only works with completed sessions, OpenF1 provides real-time data
        print(f"[LiveTiming] Requesting {session_type} data for {year}...")
        
        result = await api_aggregator.get_best_data(session=session_type, year=year)
        
        if not result.get("success"):
            # Fallback: try FastF1 local data if OpenF1 fails
            print("[LiveTiming] API sources failed, using FastF1 fallback...")
            fastf1_data = f1_service.get_live_timing_data()
            
            if fastf1_data:
                result = {
                    "success": True,
                    "source": "FastF1 (Local)",
                    "data": fastf1_data,
                    "rankings": []
                }
            else:
                raise HTTPException(status_code=503, detail="All API sources unavailable")
        
        session_names = {
            'FP1': 'Free Practice 1',
            'FP2': 'Free Practice 2', 
            'FP3': 'Free Practice 3',
            'Q': 'Qualifying',
            'R': 'Race'
        }
        
        return {
            "success": True,
            "race": "Abu Dhabi Grand Prix",
            "circuit": "Yas Marina Circuit",
            "session": session_names.get(session_type, session_type),
            "session_type": session_type,
            "year": year,
            "source": result.get("source"),
            "drivers": result.get("data", []),
            "api_rankings": result.get("rankings", []),
            "last_refresh": f1_service.last_refresh.isoformat() if f1_service.last_refresh else datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[LiveTiming] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/live/positions")
async def get_track_positions():
    """
    Get real-time track positions for all drivers
    """
    try:
        positions = f1_service.get_track_positions()
        return {
            "success": True,
            "positions": positions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/live/track-layout")
async def get_track_layout():
    """
    Get Abu Dhabi circuit track layout
    """
    try:
        layout = f1_service.get_track_layout()
        return {
            "success": True,
            "layout": layout
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/live/telemetry/{driver_code}")
async def get_driver_telemetry(driver_code: str, lap_number: Optional[int] = None):
    """
    Get telemetry data for a specific driver
    """
    try:
        telemetry = f1_service.get_driver_telemetry(driver_code, lap_number)
        return {
            "success": True,
            "telemetry": telemetry
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/live/weather")
async def get_weather_data():
    """
    Get weather data from best available source with intelligent fallback
    Uses weather aggregator to combine multiple APIs
    """
    try:
        result = await weather_aggregator.get_best_weather(location="Abu Dhabi,ae")
        
        if not result.get("success"):
            # Fallback to default values
            return {
                "success": False,
                "error": "All weather sources unavailable",
                "display": {
                    "track_temp": 42.0,
                    "air_temp": 31.0,
                    "humidity": 35,
                    "wind_speed": 3.2,
                    "conditions": "Clear"
                }
            }
        
        weather_data = result.get("data", {})
        
        return {
            "success": True,
            "source": result.get("primary_source"),
            "location": "Abu Dhabi, UAE",
            "display": weather_data,
            "weather_rankings": result.get("rankings", []),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Session Management Endpoints

@app.post("/api/session/refresh")
async def refresh_session_data():
    """
    Refresh current session data to get latest laps and telemetry
    Use this during live sessions to pull new data
    """
    try:
        success = await f1_service.refresh_session_data()
        
        if success:
            return {
                "success": True,
                "message": f"Session data refreshed successfully",
                "session_type": f1_service.current_session_type,
                "year": f1_service.current_year,
                "last_refresh": f1_service.last_refresh.isoformat(),
                "total_laps": len(f1_service.laps_data) if f1_service.laps_data is not None else 0
            }
        else:
            return {
                "success": False,
                "error": "Failed to refresh session data"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/session/switch")
async def switch_session(session_type: str, year: int = 2025):
    """
    Manually switch to a specific session
    session_type: 'FP1', 'FP2', 'FP3', 'Q', 'R'
    """
    try:
        valid_sessions = ['FP1', 'FP2', 'FP3', 'Q', 'R', 'S']
        if session_type not in valid_sessions:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid session type. Must be one of: {', '.join(valid_sessions)}"
            )
        
        success = await f1_service.load_abu_dhabi_session(
            year=year, 
            session_type=session_type,
            auto_detect=False
        )
        
        if success:
            session_names = {
                'FP1': 'Free Practice 1',
                'FP2': 'Free Practice 2',
                'FP3': 'Free Practice 3',
                'Q': 'Qualifying',
                'R': 'Race',
                'S': 'Sprint'
            }
            
            return {
                "success": True,
                "message": f"Switched to {session_names.get(session_type, session_type)}",
                "session_type": session_type,
                "year": year,
                "total_laps": len(f1_service.laps_data) if f1_service.laps_data is not None else 0
            }
        else:
            return {
                "success": False,
                "error": f"Failed to load {session_type} session for {year}"
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/session/info")
async def get_session_info():
    """
    Get current session information
    """
    try:
        session_names = {
            'FP1': 'Free Practice 1',
            'FP2': 'Free Practice 2',
            'FP3': 'Free Practice 3',
            'Q': 'Qualifying',
            'R': 'Race',
            'S': 'Sprint'
        }
        
        return {
            "success": True,
            "session_type": f1_service.current_session_type,
            "session_name": session_names.get(f1_service.current_session_type, f1_service.current_session_type),
            "year": f1_service.current_year,
            "last_refresh": f1_service.last_refresh.isoformat() if f1_service.last_refresh else None,
            "total_laps": len(f1_service.laps_data) if f1_service.laps_data is not None else 0,
            "auto_refresh_enabled": f1_service.auto_refresh_enabled
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ML Prediction Endpoints

@app.get("/api/sources/status")
async def get_api_sources_status():
    """
    Get status and rankings of all F1 API sources
    Shows integrity scores, response times, and success rates
    """
    try:
        status = api_aggregator.get_source_status()
        return {
            "success": True,
            "status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/weather/status")
async def get_weather_sources_status():
    """
    Get status and rankings of all weather API sources
    Shows integrity scores, response times, and success rates
    """
    try:
        status = weather_aggregator.get_source_status()
        return {
            "success": True,
            "status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sources/test")
async def test_all_api_sources():
    """
    Test all API sources and return comparison data
    Useful for debugging and comparing data quality
    """
    try:
        # Test timing APIs
        timing_data = await api_aggregator.fetch_all_sources(session="FP2", year=2025)
        timing_rankings = api_aggregator.rank_sources()
        
        # Test weather APIs
        weather_data = await weather_aggregator.fetch_all_sources(location="Abu Dhabi,ae")
        weather_rankings = weather_aggregator.rank_sources()
        
        return {
            "success": True,
            "timing": {
                "all_sources": timing_data,
                "rankings": timing_rankings
            },
            "weather": {
                "all_sources": weather_data,
                "rankings": weather_rankings
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ML Prediction Endpoints

@app.get("/api/race/prediction")
async def get_race_prediction():
    """
    Get AI race prediction for Abu Dhabi 2025 GP
    Returns podium predictions with confidence scores
    """
    try:
        # Load model if not loaded
        if race_predictor.model is None:
            success = race_predictor.load_model("abu_dhabi_race_predictor.pkl")
            if not success:
                return {
                    "success": False,
                    "error": "Model not trained. Train using /api/race/train"
                }
        
        # Get current weather
        weather_result = await weather_aggregator.get_best_weather("Abu Dhabi,ae")
        weather_data = weather_result.get("data", {})
        
        # Get current qualifying results (from timing data)
        timing_result = await api_aggregator.get_best_data("FP2", 2025)
        drivers = timing_result.get("data", [])
        
        # Convert to qualifying format
        qualifying_results = [
            {"code": d["code"], "position": d["position"]}
            for d in drivers
        ]
        
        # Get predictions
        prediction = race_predictor.get_podium_prediction(
            weather_data,
            qualifying_results
        )
        
        return {
            "success": True,
            **prediction
        }
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/race/prediction/full")
async def get_full_race_prediction():
    """
    Get full race predictions for all 20 drivers
    Includes predicted positions, probabilities, and skill ratings
    """
    try:
        if race_predictor.model is None:
            success = race_predictor.load_model("abu_dhabi_race_predictor.pkl")
            if not success:
                return {
                    "success": False,
                    "error": "Model not trained"
                }
        
        # Get weather and timing data
        weather_result = await weather_aggregator.get_best_weather("Abu Dhabi,ae")
        weather_data = weather_result.get("data", {})
        
        timing_result = await api_aggregator.get_best_data("FP2", 2025)
        drivers = timing_result.get("data", [])
        
        qualifying_results = [
            {"code": d["code"], "position": d["position"]}
            for d in drivers
        ]
        
        # Get all predictions
        predictions = race_predictor.predict_abu_dhabi_2025(
            weather_data,
            qualifying_results
        )
        
        return {
            "success": True,
            "predictions": predictions,
            "weather": weather_data,
            "model_metrics": race_predictor.evaluation_metrics
        }
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/race/train")
async def train_race_predictor():
    """
    Train the Abu Dhabi GP race prediction model
    Returns training metrics and evaluation results
    """
    try:
        # Run training in background
        def train():
            return train_abu_dhabi_predictor()
        
        metrics = await asyncio.to_thread(train)
        
        return {
            "success": True,
            "message": "Model trained successfully",
            "metrics": metrics
        }
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/race/model/info")
async def get_race_model_info():
    """
    Get information about the race prediction model
    Includes evaluation metrics, feature importance, and training details
    """
    try:
        if race_predictor.model is None:
            success = race_predictor.load_model("abu_dhabi_race_predictor.pkl")
            if not success:
                return {
                    "success": False,
                    "error": "Model not available"
                }
        
        return {
            "success": True,
            "model_info": {
                "name": "Abu Dhabi 2025 GP Race Predictor",
                "type": "GradientBoostingClassifier",
                "circuit": "Yas Marina Circuit",
                "features": race_predictor.feature_names,
                "drivers_count": len(race_predictor.driver_skills),
                "evaluation_metrics": race_predictor.evaluation_metrics
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ML Prediction Endpoints (Legacy)

@app.on_event("startup")
async def load_ml_model():
    """
    Load pre-trained ML model on startup
    """
    try:
        if ml_model.load_model():
            print("✓ ML Model loaded successfully")
        else:
            print("✗ No pre-trained model found. Train model using /api/ml/train")
    except Exception as e:
        print(f"✗ Error loading ML model: {e}")


@app.post("/api/ml/train")
async def train_prediction_model(years: List[int] = [2024, 2025]):
    """
    Train ML model with 2024-2025 F1 data
    """
    try:
        from ml_prediction import train_f1_prediction_model
        
        # Run training in background
        asyncio.create_task(asyncio.to_thread(train_f1_prediction_model))
        
        return {
            "success": True,
            "message": "Training started in background",
            "years": years
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/predict/race")
async def predict_race_winner():
    """
    Predict race winner using current Abu Dhabi GP data
    """
    try:
        if ml_model.model is None:
            return {
                "success": False,
                "error": "Model not trained. Train model first using /api/ml/train"
            }
        
        # Get current race data from FastF1
        timing_data = f1_service.get_live_timing_data()
        
        if not timing_data:
            return {
                "success": False,
                "error": "No race data available"
            }
        
        # Convert to DataFrame for prediction
        import pandas as pd
        race_df = pd.DataFrame(timing_data)
        
        # Add mock features for prediction (in production, these would come from qualifying/practice)
        race_df['q1_time'] = race_df.index.map(lambda x: 80 + x * 0.1)
        race_df['q2_time'] = race_df.index.map(lambda x: 79 + x * 0.1)
        race_df['q3_time'] = race_df.index.map(lambda x: 78 + x * 0.1)
        race_df['avg_lap_time'] = 85.0
        race_df['fastest_lap'] = 83.5
        race_df['lap_time_std'] = 0.5
        race_df['pit_stops'] = 2
        race_df['positions_gained'] = 0
        race_df['compound_changes'] = 2
        race_df['avg_air_temp'] = 28
        race_df['avg_track_temp'] = 40
        race_df['avg_humidity'] = 45
        race_df['grid_position'] = race_df['position']
        race_df['starting_position'] = race_df['position']
        race_df['driver'] = race_df['code']
        race_df['team'] = race_df.get('team', 'Unknown')
        
        # Predict
        predictions = ml_model.predict_race_winner(race_df)
        
        # Convert to dict
        results = predictions.head(10).to_dict('records')
        
        return {
            "success": True,
            "predictions": results,
            "model_info": {
                "trained": True,
                "features": len(ml_model.feature_columns) if ml_model.feature_columns else 0
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/model/info")
async def get_model_info():
    """
    Get ML model information
    """
    if ml_model.model is None:
        return {
            "trained": False,
            "message": "No model loaded"
        }
    
    return {
        "trained": True,
        "features": ml_model.feature_columns,
        "feature_count": len(ml_model.feature_columns) if ml_model.feature_columns else 0,
        "model_type": "Random Forest + Gradient Boosting Ensemble"
    }


# =======================
# Tire Degradation API Endpoints
# =======================

@app.get("/api/tire/degradation/predict")
async def predict_tire_degradation(
    compound: str = 'MEDIUM',
    race_laps: int = 58,
    driver_code: Optional[str] = None
):
    """
    Predict tire degradation curve for a stint
    
    Args:
        compound: Tire compound (SOFT, MEDIUM, HARD)
        race_laps: Number of laps in stint
        driver_code: Optional driver code for telemetry analysis
    """
    try:
        # Get telemetry data if driver specified
        telemetry_data = None
        stress_factors = tire_model._default_stress_factors()
        
        if driver_code and f1_service.session is not None:
            telemetry = f1_service.get_driver_telemetry(driver_code)
            if telemetry:
                # Convert to DataFrame for analysis
                import pandas as pd
                telemetry_data = pd.DataFrame({
                    'Speed': telemetry.get('speed', []),
                    'Throttle': telemetry.get('throttle', []),
                    'Brake': telemetry.get('brake', []),
                    'nGear': telemetry.get('nGear', [])
                })
                stress_factors = tire_model.analyze_telemetry(telemetry_data, driver_code)
        
        # Generate degradation curve
        degradation_curve = tire_model.predict_degradation_curve(
            compound, 
            race_laps, 
            stress_factors
        )
        
        return {
            "success": True,
            "compound": compound,
            "race_laps": race_laps,
            "driver_code": driver_code,
            "stress_factors": stress_factors,
            "degradation_curve": degradation_curve,
            "track_temp": tire_model.track_temp,
            "air_temp": tire_model.air_temp,
            "max_recommended_laps": tire_model.COMPOUND_CHARACTERISTICS[compound]['max_stint_laps']
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tire/strategy/recommend")
async def recommend_tire_strategy(
    race_distance: int = 58,
    min_pit_stops: int = 1,
    weather_condition: str = 'DRY'
):
    """
    Recommend optimal tire strategy for race
    
    Args:
        race_distance: Total race laps
        min_pit_stops: Minimum required pit stops
        weather_condition: DRY, WET, MIXED
    """
    try:
        recommendation = tire_model.recommend_tire_strategy(
            race_distance,
            min_pit_stops,
            weather_condition
        )
        
        return {
            "success": True,
            **recommendation
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tire/pitstop/windows")
async def calculate_pit_windows(request: dict):
    """
    Calculate optimal pit stop windows based on tire degradation
    
    Request body:
        {
            "race_distance": 58,
            "strategy": [
                {"compound": "MEDIUM", "laps": 30},
                {"compound": "HARD", "laps": 28}
            ]
        }
    """
    try:
        race_distance = request.get('race_distance', 58)
        strategy = request.get('strategy', [])
        
        if not strategy:
            raise HTTPException(status_code=400, detail="Strategy array required")
        
        pit_windows = tire_model.calculate_optimal_pit_windows(
            race_distance,
            strategy
        )
        
        return {
            "success": True,
            "race_distance": race_distance,
            "strategy": strategy,
            "pit_windows": pit_windows
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tire/realtime/insights")
async def get_realtime_tire_insights(
    current_lap: int,
    current_compound: str,
    stint_start_lap: int,
    driver_code: Optional[str] = None
):
    """
    Get real-time tire degradation insights during race
    
    Args:
        current_lap: Current race lap
        current_compound: Current tire compound
        stint_start_lap: Lap when current tires were fitted
        driver_code: Optional driver code for telemetry
    """
    try:
        # Get recent telemetry if available
        telemetry_data = None
        if driver_code and f1_service.session is not None:
            telemetry = f1_service.get_driver_telemetry(driver_code)
            if telemetry:
                import pandas as pd
                telemetry_data = pd.DataFrame({
                    'Speed': telemetry.get('speed', []),
                    'Throttle': telemetry.get('throttle', []),
                    'Brake': telemetry.get('brake', []),
                    'nGear': telemetry.get('nGear', [])
                })
        
        insights = tire_model.generate_real_time_insights(
            current_lap,
            current_compound,
            stint_start_lap,
            telemetry_data
        )
        
        return {
            "success": True,
            **insights
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tire/temperature/update")
async def update_tire_temperatures(track_temp: float, air_temp: float):
    """
    Update track and air temperatures for tire model
    """
    try:
        global tire_model
        tire_model = initialize_tire_model(track_temp, air_temp)
        
        return {
            "success": True,
            "track_temp": track_temp,
            "air_temp": air_temp,
            "message": "Tire model temperatures updated"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tire/compounds/info")
async def get_compound_info():
    """
    Get tire compound characteristics
    """
    return {
        "success": True,
        "compounds": tire_model.COMPOUND_CHARACTERISTICS,
        "circuit_factors": tire_model.CIRCUIT_FACTORS
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
