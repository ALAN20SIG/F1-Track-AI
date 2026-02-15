"""
Diagnostic script for Strategy Engine issues
Checks all endpoints and data flow
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("=" * 70)
print("STRATEGY ENGINE DIAGNOSTIC")
print("=" * 70)

# Test 1: Check if backend is responding
print("\n[1] Backend Health Check...")
try:
    response = requests.get(f"{BASE_URL}/api/session/info", timeout=5)
    print(f"    Status: {response.status_code}")
    if response.status_code == 200:
        print("    ✓ Backend is running")
    else:
        print(f"    ✗ Backend returned {response.status_code}")
except Exception as e:
    print(f"    ✗ Backend not responding: {e}")
    exit(1)

# Test 2: Check database drivers endpoint
print("\n[2] Database Drivers Endpoint...")
try:
    response = requests.get(f"{BASE_URL}/api/db/drivers", timeout=5)
    print(f"    Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"    Success: {data.get('success')}")
        print(f"    Driver count: {len(data.get('drivers', []))}")
        
        if data.get('drivers'):
            print(f"\n    Sample driver data:")
            sample = data['drivers'][0]
            print(f"      - driver_code: {sample.get('driver_code')}")
            print(f"      - full_name: {sample.get('full_name')}")
            print(f"      - team_name: {sample.get('team_name')}")
            print(f"      - number: {sample.get('number')}")
            print("    ✓ Driver data structure looks correct")
        else:
            print("    ✗ No drivers in response")
    else:
        print(f"    ✗ Failed: {response.text[:200]}")
except Exception as e:
    print(f"    ✗ Error: {e}")

# Test 3: Check strategy suggestions endpoint
print("\n[3] Strategy Suggestions Endpoint...")
try:
    response = requests.get(
        f"{BASE_URL}/api/analysis/strategy-suggestions/VER?target_position=1",
        timeout=30
    )
    print(f"    Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"    Success: {data.get('success')}")
        print(f"    Strategies: {len(data.get('strategies', []))}")
        
        if data.get('driver'):
            print(f"\n    Driver info:")
            print(f"      - name: {data['driver'].get('name')}")
            print(f"      - avgLapTime: {data['driver'].get('avgLapTime')}")
            print(f"      - currentTire: {data['driver'].get('currentTire')}")
        
        if data.get('strategies'):
            print(f"\n    Sample strategy:")
            strategy = data['strategies'][0]
            print(f"      - name: {strategy.get('name')}")
            print(f"      - description: {strategy.get('description', '')[:50]}...")
            print(f"      - pitStops: {strategy.get('pitStops')}")
            print(f"      - probability: {strategy.get('probability')}")
            print(f"      - has explanation: {bool(strategy.get('explanation'))}")
            print(f"      - has historicalBasis: {bool(strategy.get('historicalBasis'))}")
            print("    ✓ Strategy data structure looks correct")
    elif response.status_code == 503:
        print("    ⚠ Backend still loading session data")
        print("    Wait 30 seconds and try again")
    else:
        print(f"    ✗ Failed: {response.text[:200]}")
except Exception as e:
    print(f"    ✗ Error: {e}")

# Test 4: Check for CORS issues
print("\n[4] CORS Configuration...")
try:
    response = requests.options(f"{BASE_URL}/api/db/drivers")
    headers = response.headers
    print(f"    Access-Control-Allow-Origin: {headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
    print(f"    Access-Control-Allow-Methods: {headers.get('Access-Control-Allow-Methods', 'NOT SET')}")
    
    if headers.get('Access-Control-Allow-Origin') == '*':
        print("    ✓ CORS is configured correctly")
    else:
        print("    ⚠ CORS might be blocking frontend requests")
except Exception as e:
    print(f"    ⚠ Could not check CORS: {e}")

# Summary
print("\n" + "=" * 70)
print("DIAGNOSTIC SUMMARY")
print("=" * 70)
print("\nIf all tests passed (✓), the issue is likely in the frontend:")
print("  1. Check browser console for errors (F12)")
print("  2. Verify frontend is running (npm run dev)")
print("  3. Check if frontend is connecting to http://localhost:8000")
print("  4. Clear browser cache and reload")
print("\nCommon Issues:")
print("  - Frontend not running: Start with 'npm run dev' in frontend folder")
print("  - Wrong port: Frontend should connect to localhost:8000")
print("  - Cache issue: Hard refresh browser (Ctrl+Shift+R)")
print("  - React errors: Check browser console (F12 -> Console tab)")
print("=" * 70 + "\n")
