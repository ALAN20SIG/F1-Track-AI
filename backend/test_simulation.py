import requests
import json
import time

# Test the simulation API
API_URL = "http://localhost:8000"

# Prepare test data
simulation_data = {
    "race_laps": 57,
    "n_simulations": 500,
    "drivers": [
        {
            "driver_code": "NOR",
            "driver_name": "Lando Norris",
            "team": "McLaren",
            "base_lap": 83.5,
            "degradation": 0.022,
            "lap_std": 0.15,
            "pit_stops": [20, 40],
            "pit_delta": 22.0
        },
        {
            "driver_code": "VER",
            "driver_name": "Max Verstappen",
            "team": "Red Bull Racing",
            "base_lap": 83.6,
            "degradation": 0.024,
            "lap_std": 0.16,
            "pit_stops": [19, 39],
            "pit_delta": 22.2
        },
        {
            "driver_code": "PIA",
            "driver_name": "Oscar Piastri",
            "team": "McLaren",
            "base_lap": 83.7,
            "degradation": 0.023,
            "lap_std": 0.15,
            "pit_stops": [20, 40],
            "pit_delta": 21.8
        },
        {
            "driver_code": "RUS",
            "driver_name": "George Russell",
            "team": "Mercedes",
            "base_lap": 83.8,
            "degradation": 0.025,
            "lap_std": 0.17,
            "pit_stops": [21, 41],
            "pit_delta": 22.5
        },
        {
            "driver_code": "LEC",
            "driver_name": "Charles Leclerc",
            "team": "Ferrari",
            "base_lap": 83.9,
            "degradation": 0.026,
            "lap_std": 0.18,
            "pit_stops": [19, 39],
            "pit_delta": 22.3
        }
    ]
}

print("Testing F1 Strategy Simulator API")
print("=" * 50)

# Test 1: Start simulation
print("\n1. Starting simulation...")
response = requests.post(f"{API_URL}/api/simulate", json=simulation_data)

if response.status_code == 200:
    job_data = response.json()
    job_id = job_data["job_id"]
    print(f"✓ Simulation started successfully!")
    print(f"   Job ID: {job_id}")
    
    # Test 2: Poll for results
    print("\n2. Waiting for simulation results...")
    max_attempts = 30
    attempts = 0
    
    while attempts < max_attempts:
        time.sleep(1)
        status_response = requests.get(f"{API_URL}/api/status/{job_id}")
        
        if status_response.status_code == 200:
            status_data = status_response.json()
            status = status_data["status"]
            
            if status == "completed":
                print(f"✓ Simulation completed!")
                print(f"\n3. Results (Top 5):")
                print("-" * 80)
                print(f"{'Pos':<5} {'Driver':<20} {'Team':<20} {'Win %':<10} {'Podium %':<12} {'Avg Pos'}")
                print("-" * 80)
                
                for idx, result in enumerate(status_data["results"][:5], 1):
                    print(f"{idx:<5} {result['driver_code']:<20} {result['team']:<20} "
                          f"{result['win_percentage']:<10.2f} {result['podium_percentage']:<12.2f} "
                          f"{result['avg_finish_position']:.2f}")
                
                print("\n✓ All tests passed! Simulation is working correctly.")
                break
            elif status == "failed":
                print(f"✗ Simulation failed: {status_data.get('error', 'Unknown error')}")
                break
            else:
                attempts += 1
                print(f"   Status: {status} (attempt {attempts}/{max_attempts})")
        else:
            print(f"✗ Error getting status: {status_response.status_code}")
            break
    
    if attempts >= max_attempts:
        print("✗ Simulation timeout")
else:
    print(f"✗ Failed to start simulation: {response.status_code}")
    print(f"   Response: {response.text}")
