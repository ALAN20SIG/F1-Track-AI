"""
F1 Dashboard Feature Validation Test Suite
Tests all major features and validates functionality
"""

import requests
import json
import time

BASE_URL = "https://f1-track-ai-backend.onrender.com"

def test_api_health():
    """Test 1: API Health Check"""
    print("\n=== Test 1: API Health Check ===")
    try:
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        print("✓ API is healthy and responding")
        print(f"  Response: {data}")
        return True
    except Exception as e:
        print(f"✗ API health check failed: {e}")
        return False


def test_strategy_simulation():
    """Test 2: Monte-Carlo Strategy Simulation"""
    print("\n=== Test 2: Monte-Carlo Strategy Simulation ===")
    
    simulation_data = {
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
            },
            {
                "driver_code": "NOR",
                "driver_name": "Lando Norris",
                "team": "McLaren",
                "base_lap": 83.3,
                "degradation": 0.022,
                "lap_std": 0.14,
                "pit_stops": [18, 38],
                "pit_delta": 21.5
            },
            {
                "driver_code": "PIA",
                "driver_name": "Oscar Piastri",
                "team": "McLaren",
                "base_lap": 83.6,
                "degradation": 0.021,
                "lap_std": 0.16,
                "pit_stops": [22, 42],
                "pit_delta": 22.5
            }
        ]
    }
    
    try:
        # Start simulation
        response = requests.post(
            f"{BASE_URL}/api/simulate",
            json=simulation_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        job_data = response.json()
        assert "job_id" in job_data
        job_id = job_data["job_id"]
        print(f"✓ Simulation started with job_id: {job_id}")
        
        # Poll for results
        max_attempts = 30
        for attempt in range(max_attempts):
            time.sleep(1)
            status_response = requests.get(f"{BASE_URL}/api/status/{job_id}")
            assert status_response.status_code == 200
            status_data = status_response.json()
            
            if status_data["status"] == "completed":
                print(f"✓ Simulation completed after {attempt + 1} seconds")
                results = status_data["results"]
                assert len(results) == 3
                
                print("\n  Results:")
                for i, result in enumerate(results[:3], 1):
                    print(f"  {i}. {result['driver_code']} ({result['driver_name']})")
                    print(f"     Win %: {result['win_percentage']}%")
                    print(f"     Podium %: {result['podium_percentage']}%")
                    print(f"     Avg Position: {result['avg_finish_position']}")
                
                return True
            elif status_data["status"] == "failed":
                print(f"✗ Simulation failed: {status_data.get('error', 'Unknown error')}")
                return False
        
        print("✗ Simulation timeout")
        return False
        
    except Exception as e:
        print(f"✗ Strategy simulation test failed: {e}")
        return False


def test_multi_driver_comparison():
    """Test 3: Multi-Driver Strategy Comparison (10 drivers)"""
    print("\n=== Test 3: Multi-Driver Strategy Comparison ===")
    
    drivers = [
        ("VER", "Max Verstappen", "Red Bull Racing", 83.5),
        ("NOR", "Lando Norris", "McLaren", 83.3),
        ("PIA", "Oscar Piastri", "McLaren", 83.6),
        ("HAM", "Lewis Hamilton", "Ferrari", 83.4),
        ("LEC", "Charles Leclerc", "Ferrari", 83.5),
        ("RUS", "George Russell", "Mercedes", 83.7),
        ("SAI", "Carlos Sainz", "Williams", 83.8),
        ("ALO", "Fernando Alonso", "Aston Martin", 83.9),
        ("TSU", "Yuki Tsunoda", "Red Bull Racing", 84.0),
        ("GAS", "Pierre Gasly", "Alpine", 84.1),
    ]
    
    simulation_data = {
        "race_laps": 57,
        "n_simulations": 500,
        "drivers": [
            {
                "driver_code": code,
                "driver_name": name,
                "team": team,
                "base_lap": base_lap,
                "degradation": 0.02 + (i * 0.001),
                "lap_std": 0.15,
                "pit_stops": [18 + i, 38 + i],
                "pit_delta": 22.0
            }
            for i, (code, name, team, base_lap) in enumerate(drivers)
        ]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/simulate",
            json=simulation_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        job_data = response.json()
        job_id = job_data["job_id"]
        print(f"✓ 10-driver comparison started")
        
        # Wait for completion
        for _ in range(30):
            time.sleep(1)
            status_response = requests.get(f"{BASE_URL}/api/status/{job_id}")
            status_data = status_response.json()
            
            if status_data["status"] == "completed":
                results = status_data["results"]
                assert len(results) == 10
                print(f"✓ All 10 drivers processed successfully")
                print("\n  Top 5 Results:")
                for i, result in enumerate(results[:5], 1):
                    print(f"  P{i}: {result['driver_code']} - Win: {result['win_percentage']}%, Avg Pos: {result['avg_finish_position']}")
                return True
        
        print("✗ Comparison timeout")
        return False
        
    except Exception as e:
        print(f"✗ Multi-driver comparison failed: {e}")
        return False


def test_cors_configuration():
    """Test 4: CORS Configuration"""
    print("\n=== Test 4: CORS Configuration ===")
    try:
        # Test OPTIONS request (CORS preflight)
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type"
        }
        response = requests.options(f"{BASE_URL}/api/simulate", headers=headers)
        
        # Check CORS headers
        assert "access-control-allow-origin" in response.headers
        print("✓ CORS is properly configured")
        print(f"  Allowed Origin: {response.headers.get('access-control-allow-origin')}")
        return True
    except Exception as e:
        print(f"✗ CORS test failed: {e}")
        return False


def test_different_strategies():
    """Test 5: Different Tyre Strategies"""
    print("\n=== Test 5: Different Tyre Strategies ===")
    
    strategies = {
        "Aggressive (Early Pit)": {
            "driver_code": "VER",
            "driver_name": "Max Verstappen",
            "team": "Red Bull Racing",
            "base_lap": 83.3,
            "degradation": 0.025,  # Higher degradation (aggressive)
            "lap_std": 0.12,
            "pit_stops": [15, 32],  # Early pits
            "pit_delta": 21.0
        },
        "Conservative (Late Pit)": {
            "driver_code": "NOR",
            "driver_name": "Lando Norris",
            "team": "McLaren",
            "base_lap": 83.5,
            "degradation": 0.018,  # Lower degradation (conservative)
            "lap_std": 0.15,
            "pit_stops": [25, 45],  # Late pits
            "pit_delta": 22.5
        },
        "Balanced": {
            "driver_code": "PIA",
            "driver_name": "Oscar Piastri",
            "team": "McLaren",
            "base_lap": 83.4,
            "degradation": 0.020,
            "lap_std": 0.14,
            "pit_stops": [20, 40],  # Standard pits
            "pit_delta": 22.0
        }
    }
    
    simulation_data = {
        "race_laps": 57,
        "n_simulations": 1000,
        "drivers": list(strategies.values())
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/simulate", json=simulation_data)
        assert response.status_code == 200
        job_id = response.json()["job_id"]
        
        # Wait for completion
        for _ in range(30):
            time.sleep(1)
            status = requests.get(f"{BASE_URL}/api/status/{job_id}").json()
            if status["status"] == "completed":
                print("✓ Strategy comparison completed")
                print("\n  Strategy Performance:")
                for result in status["results"]:
                    strategy_name = [k for k, v in strategies.items() if v["driver_code"] == result["driver_code"]][0]
                    print(f"  {strategy_name}:")
                    print(f"    Win: {result['win_percentage']}%")
                    print(f"    Avg Lap: {result['avg_race_time'] / 57:.3f}s")
                return True
        
        print("✗ Strategy test timeout")
        return False
    except Exception as e:
        print(f"✗ Strategy test failed: {e}")
        return False


def run_all_tests():
    """Run all validation tests"""
    print("=" * 70)
    print("F1 DASHBOARD FEATURE VALIDATION TEST SUITE")
    print("=" * 70)
    
    tests = [
        test_api_health,
        test_strategy_simulation,
        test_multi_driver_comparison,
        test_cors_configuration,
        test_different_strategies,
    ]
    
    results = []
    for test_func in tests:
        try:
            result = test_func()
            results.append((test_func.__doc__, result))
        except Exception as e:
            print(f"\n✗ Test crashed: {e}")
            results.append((test_func.__doc__, False))
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Dashboard is fully functional.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the output above.")
    
    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
