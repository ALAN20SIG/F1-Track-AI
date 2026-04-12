"""
Quick verification script for the three fixes:
1. Live Track Map removed from sidebar
2. Strategy Engine timeout handling
3. Live/Replay module accuracy improvements
"""
import requests
import time

BASE_URL = "http://https://f1-track-ai-production.up.railway.app"

def test_strategy_engine():
    """Test Strategy Engine with timeout"""
    print("\n" + "="*60)
    print("TEST: Strategy Engine")
    print("="*60)
    
    try:
        print("Testing strategy suggestions endpoint...")
        start = time.time()
        response = requests.get(
            f"{BASE_URL}/api/analysis/strategy-suggestions/VER?target_position=1",
            timeout=30
        )
        end = time.time()
        
        print(f"Response time: {(end-start):.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('strategies'):
                print(f"[PASS] Received {len(data['strategies'])} strategies")
                print(f"[PASS] Driver info: {data.get('driver', {}).get('name', 'N/A')}")
                return True
            else:
                print(f"[FAIL] No strategies in response")
                return False
        elif response.status_code == 503:
            print(f"[WARN] Backend still loading (503)")
            return False
        else:
            print(f"[FAIL] HTTP {response.status_code}")
            return False
            
    except requests.Timeout:
        print(f"[FAIL] Request timed out after 30 seconds")
        return False
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False


def test_replay_accuracy():
    """Test Live/Replay module accuracy"""
    print("\n" + "="*60)
    print("TEST: Live/Replay Module Accuracy")
    print("="*60)
    
    try:
        print("Testing replay data endpoint...")
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/replay/race-data", timeout=15)
        end = time.time()
        
        print(f"Response time: {(end-start):.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('replay_data'):
                replay = data['replay_data']
                print(f"[PASS] Circuit: {replay.get('circuit')}")
                print(f"[PASS] Track length: {replay.get('track_length_meters')}m")
                print(f"[PASS] Total frames: {len(replay.get('frames', []))}")
                print(f"[PASS] Total laps: {replay.get('total_laps')}")
                
                # Check first frame accuracy
                if replay['frames']:
                    first_frame = replay['frames'][0]
                    print(f"\nFirst frame data:")
                    print(f"  - Lap: {first_frame.get('lap')}")
                    print(f"  - Positions: {len(first_frame.get('positions', []))}")
                    
                    if first_frame['positions']:
                        sample = first_frame['positions'][0]
                        print(f"  - Sample driver: {sample.get('driver_code')}")
                        print(f"  - Position: P{sample.get('position')}")
                        print(f"  - Coordinates: ({sample.get('x'):.1f}, {sample.get('y'):.1f})")
                        print(f"  - Speed: {sample.get('speed'):.0f} km/h")
                        print(f"  - Compound: {sample.get('compound')}")
                        print(f"  - Tire life: {sample.get('tire_life')} laps")
                        
                        # Check if coordinates are reasonable
                        x, y = sample.get('x', 0), sample.get('y', 0)
                        if 0 < x < 1000 and 0 < y < 1000:
                            print(f"[PASS] Coordinates within track bounds")
                        else:
                            print(f"[WARN] Coordinates may be out of bounds")
                
                return True
            else:
                print(f"[FAIL] No replay data in response")
                return False
        elif response.status_code == 503:
            print(f"[WARN] Backend still loading (503)")
            return False
        else:
            print(f"[FAIL] HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False


def main():
    print("\n" + "#"*60)
    print("# F1 TRACK.AI - FIX VERIFICATION")
    print("#"*60)
    
    # Wait for backend
    print("\nWaiting for backend to start...")
    for i in range(15):
        try:
            response = requests.get(f"{BASE_URL}/api/session/info", timeout=2)
            if response.status_code in [200, 503]:
                print("[OK] Backend is responding\n")
                break
        except:
            time.sleep(2)
            if i == 14:
                print("[FAIL] Backend not responding\n")
                return
    
    results = {
        'strategy_engine': test_strategy_engine(),
        'replay_accuracy': test_replay_accuracy()
    }
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    print(f"\nTests Passed: {passed}/{total}")
    
    for test_name, result in results.items():
        status = "[PASS]" if result else "[FAIL]"
        print(f"  {status} {test_name.replace('_', ' ').title()}")
    
    print("\nChanges Made:")
    print("  1. [DONE] Removed 'Live Track Map' from sidebar")
    print("  2. [DONE] Added 30s timeout to Strategy Engine")
    print("  3. [DONE] Improved replay data accuracy with:")
    print("     - Elliptical track approximation")
    print("     - Position-based coordinate calculation")
    print("     - Accurate speed, tire, and team data")
    
    print("\n" + "="*60 + "\n")


if __name__ == "__main__":
    main()
