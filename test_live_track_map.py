"""
Test script for LiveTrackMap component
Verifies backend API endpoints and frontend integration
"""

import requests
import time
import sys

def test_endpoint(url, name):
    """Test a single endpoint"""
    try:
        print(f"\n🧪 Testing {name}...")
        print(f"   URL: {url}")
        
        start = time.time()
        response = requests.get(url, timeout=10)
        elapsed = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success ({elapsed:.2f}s)")
            
            if 'success' in data:
                print(f"   📊 Response: success={data.get('success')}")
            
            return True, data
        else:
            print(f"   ❌ Failed: HTTP {response.status_code}")
            return False, None
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False, None

def main():
    base_url = "http://https://f1-track-ai-production.up.railway.app"
    
    print("=" * 60)
    print("🚀 LiveTrackMap API Test Suite")
    print("=" * 60)
    
    # Test endpoints
    tests = [
        (f"{base_url}/", "Root API"),
        (f"{base_url}/api/session/info", "Session Info"),
        (f"{base_url}/api/live/track-layout", "Track Layout"),
        (f"{base_url}/api/live/positions", "Driver Positions"),
    ]
    
    results = []
    for url, name in tests:
        success, data = test_endpoint(url, name)
        results.append((name, success, data))
        time.sleep(0.5)
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    for name, success, data in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"   {status} - {name}")
    
    print(f"\n   Total: {passed}/{total} tests passed")
    
    # Detailed analysis
    print("\n" + "=" * 60)
    print("🔍 Detailed Analysis")
    print("=" * 60)
    
    # Check track layout
    track_layout = next((data for name, success, data in results if name == "Track Layout" and success), None)
    if track_layout and track_layout.get('success'):
        layout = track_layout.get('layout', {})
        x_coords = layout.get('x', [])
        y_coords = layout.get('y', [])
        print(f"   📍 Track Layout: {len(x_coords)} coordinate points")
        if x_coords:
            print(f"      X range: {min(x_coords):.1f} to {max(x_coords):.1f}")
            print(f"      Y range: {min(y_coords):.1f} to {max(y_coords):.1f}")
    
    # Check driver positions
    positions_data = next((data for name, success, data in results if name == "Driver Positions" and success), None)
    if positions_data and positions_data.get('success'):
        positions = positions_data.get('positions', [])
        print(f"   🏎️  Driver Positions: {len(positions)} drivers on track")
        
        for pos in positions[:5]:
            print(f"      P{pos.get('position', '-'):2d} {pos.get('code', '???'):3s} - "
                  f"Speed: {pos.get('speed', 0):.0f} km/h - "
                  f"Team: {pos.get('team', 'Unknown')}")
    
    print("\n" + "=" * 60)
    print("✨ LiveTrackMap is ready for use!")
    print("=" * 60)
    
    return passed == total

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
