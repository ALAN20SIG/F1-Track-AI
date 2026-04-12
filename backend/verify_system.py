"""
Quick verification script - confirms all systems operational
"""
print("="*60)
print("🏁 F1 TRACK.AI SYSTEM VERIFICATION")
print("="*60)

# Check imports
print("\n✓ Checking Python dependencies...")
try:
    import fastapi
    import pandas as pd
    import numpy as np
    import fastf1
    print("  ✓ FastAPI installed")
    print("  ✓ Pandas installed")
    print("  ✓ NumPy installed")
    print("  ✓ FastF1 installed")
except ImportError as e:
    print(f"  ✗ Missing dependency: {e}")
    exit(1)

# Check backend running
print("\n✓ Checking backend server...")
import requests
try:
    response = requests.get("https://f1-track-ai-production.up.railway.app/api/session/info", timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"  ✓ Backend running on port 8000")
        print(f"  ✓ Session: {data.get('session_name', 'N/A')} {data.get('year', 'N/A')}")
        print(f"  ✓ Total laps: {data.get('total_laps', 'N/A')}")
    else:
        print(f"  ⚠ Backend responding but returned {response.status_code}")
except requests.exceptions.ConnectionError:
    print("  ✗ Backend not running - start with: python main.py")
    exit(1)

# Check frontend running
print("\n✓ Checking frontend server...")
try:
    response = requests.get("http://localhost:3000", timeout=5)
    if response.status_code == 200:
        print(f"  ✓ Frontend running on port 3000")
    else:
        print(f"  ⚠ Frontend responding but returned {response.status_code}")
except requests.exceptions.ConnectionError:
    print("  ⚠ Frontend not running - start with: npm run dev")

# Test new endpoints
print("\n✓ Testing analysis endpoints...")
endpoints = [
    ("/api/analysis/race-telemetry", "Race Telemetry"),
    ("/api/analysis/strategy-suggestions/LEC?target_position=1", "Strategy Engine"),
    ("/api/analysis/enhanced-analytics", "Enhanced Analytics"),
]

for endpoint, name in endpoints:
    try:
        response = requests.get(f"https://f1-track-ai-production.up.railway.app{endpoint}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"  ✓ {name}: Working")
            else:
                print(f"  ⚠ {name}: No data")
        else:
            print(f"  ✗ {name}: {response.status_code}")
    except Exception as e:
        print(f"  ✗ {name}: {str(e)[:50]}")

print("\n" + "="*60)
print("✅ VERIFICATION COMPLETE")
print("="*60)
print("\nAccess your application at:")
print("  Frontend: http://localhost:3000")
print("  Backend API: https://f1-track-ai-production.up.railway.app/docs")
print("\nNew Components:")
print("  🏎️ Race Analysis - /race-analysis")
print("  🎯 Strategy Engine - /strategy-engine")
print("  🎬 Live/Replay Track - /live-replay")
print("  ⚡ Strategy Comparison - /strategy-comparison")
print("\n" + "="*60)
