"""
Test script to verify new analysis endpoints work correctly
Run this after starting the backend server
"""
import requests
import json

BASE_URL = "https://f1-track-ai-backend.onrender.com"

def test_endpoint(name, endpoint):
    """Test an API endpoint"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"Endpoint: {endpoint}")
    print(f"{'='*60}")
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ SUCCESS")
            print(f"Response keys: {list(data.keys())}")
            
            # Show specific data based on endpoint
            if 'drivers' in data:
                print(f"Number of drivers: {len(data['drivers'])}")
                if data['drivers']:
                    print(f"First driver: {data['drivers'][0].get('code', 'N/A')}")
            elif 'analytics' in data:
                print(f"Analytics sections: {list(data['analytics'].keys())}")
            elif 'strategies' in data:
                print(f"Number of strategies: {len(data['strategies'])}")
            
            return True
        else:
            print(f"✗ FAILED")
            print(f"Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"✗ CONNECTION ERROR - Backend not running on {BASE_URL}")
        return False
    except Exception as e:
        print(f"✗ ERROR: {str(e)}")
        return False

def main():
    print("="*60)
    print("F1 RACE ANALYSIS API TEST SUITE")
    print("="*60)
    
    # Test session info first
    if not test_endpoint("Session Info", "/api/session/info"):
        print("\n⚠️  Backend is not responding. Please start the backend server:")
        print("   cd backend && python main.py")
        return
    
    # Test new analysis endpoints
    endpoints = [
        ("Race Telemetry Analysis", "/api/analysis/race-telemetry"),
        ("Enhanced Analytics", "/api/analysis/enhanced-analytics"),
        ("Strategy Suggestions (VER to P1)", "/api/analysis/strategy-suggestions/VER?target_position=1"),
        ("Driver Comparison (VER vs NOR)", "/api/analysis/driver-comparison?driver1=VER&driver2=NOR"),
    ]
    
    results = []
    for name, endpoint in endpoints:
        result = test_endpoint(name, endpoint)
        results.append((name, result))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All endpoints working correctly!")
        print("\nYou can now use the frontend components:")
        print("  - Race Analysis Dashboard")
        print("  - Strategy Engine")
        print("  - Enhanced Strategy Comparison")
    else:
        print("\n⚠️  Some endpoints failed. This is likely because:")
        print("  1. Backend session data hasn't loaded yet (wait 10-30 seconds)")
        print("  2. No driver data available in the current session")
        print("  3. Cache directory doesn't have data for 2025/2026 season")

if __name__ == "__main__":
    main()
