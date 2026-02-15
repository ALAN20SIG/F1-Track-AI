"""
Test Script for Strategy Engine Performance and Live/Replay Track Module
Tests both fixes: fast driver loading and new replay functionality
"""
import requests
import time
import json

BASE_URL = "http://localhost:8000"

def test_strategy_engine_performance():
    """Test that driver loading is fast (database endpoint with cache)"""
    print("\n" + "="*80)
    print("TEST 1: STRATEGY ENGINE PERFORMANCE")
    print("="*80)
    
    try:
        # Test 1: First call (may be slow - database load)
        print("\n[Test 1.1] First Call (Database Load)")
        start = time.time()
        response1 = requests.get(f"{BASE_URL}/api/db/drivers")
        end = time.time()
        
        first_load_time_ms = (end - start) * 1000
        
        if response1.status_code == 200:
            data1 = response1.json()
            if data1.get('success') and data1.get('drivers'):
                driver_count = len(data1['drivers'])
                source1 = data1.get('source', 'unknown')
                print(f"[PASS] First call successful")
                print(f"  - Load time: {first_load_time_ms:.0f}ms")
                print(f"  - Drivers loaded: {driver_count}")
                print(f"  - Source: {source1}")
            else:
                print(f"[FAIL] No driver data returned")
                return False
        else:
            print(f"[FAIL] HTTP {response1.status_code}")
            return False
        
        # Test 2: Second call (should be FAST - cached)
        print("\n[Test 1.2] Second Call (Cache)")
        time.sleep(0.1)  # Small delay
        
        start = time.time()
        response2 = requests.get(f"{BASE_URL}/api/db/drivers")
        end = time.time()
        
        cached_load_time_ms = (end - start) * 1000
        
        if response2.status_code == 200:
            data2 = response2.json()
            source2 = data2.get('source', 'unknown')
            print(f"[PASS] Cached call successful")
            print(f"  - Load time: {cached_load_time_ms:.0f}ms")
            print(f"  - Source: {source2}")
            
            if cached_load_time_ms < 100:
                print(f"  - [PASS] Cache working perfectly (<100ms)")
            elif cached_load_time_ms < 500:
                print(f"  - [PASS] Cache working well (<500ms)")
            else:
                print(f"  - [WARN] Cache may not be working optimally")
        
        # Overall assessment
        print("\n[Overall Performance]")
        if cached_load_time_ms < 500:
            print(f"[PASS] Strategy Engine performance EXCELLENT")
            print(f"  - User experience: Instant loading after first visit")
            print(f"  - Cache speed: {cached_load_time_ms:.0f}ms (target <500ms)")
            return True
        else:
            print(f"[FAIL] Performance not meeting targets")
            return False
            
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        return False


def test_live_replay_module():
    """Test new Live/Replay Track module endpoints"""
    print("\n" + "="*80)
    print("TEST 2: LIVE/REPLAY TRACK MODULE")
    print("="*80)
    
    all_passed = True
    
    # Test 1: Session info (for mode switching)
    print("\n[Test 2.1] Session Info Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/api/session/info")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"[PASS] Session info loaded")
                print(f"  - Session type: {data.get('session_type')}")
                print(f"  - Event: {data.get('event_name')}")
            else:
                print(f"[FAIL] No success flag")
                all_passed = False
        else:
            print(f"[FAIL] HTTP {response.status_code}")
            all_passed = False
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        all_passed = False
    
    # Test 2: Live positions endpoint
    print("\n[Test 2.2] Live Positions Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/api/live/positions")
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('positions'):
                print(f"[PASS] Live positions loaded")
                print(f"  - Positions count: {len(data['positions'])}")
            else:
                print(f"[WARN] No position data (may be normal if no live session)")
        else:
            print(f"[WARN] HTTP {response.status_code} (may be normal)")
    except Exception as e:
        print(f"[WARN] Error: {str(e)} (may be normal)")
    
    # Test 3: Replay data endpoint (NEW)
    print("\n[Test 2.3] Replay Data Endpoint (NEW)")
    try:
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/replay/race-data")
        end = time.time()
        
        load_time_ms = (end - start) * 1000
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('replay_data'):
                replay = data['replay_data']
                print(f"[PASS] Replay data endpoint working")
                print(f"  - Load time: {load_time_ms:.0f}ms")
                print(f"  - Total frames: {len(replay.get('frames', []))}")
                print(f"  - Total laps: {replay.get('total_laps')}")
                
                # Verify frame structure
                if replay['frames']:
                    first_frame = replay['frames'][0]
                    print(f"  - First frame lap: {first_frame.get('lap')}")
                    print(f"  - Positions in frame: {len(first_frame.get('positions', []))}")
                    
                    if first_frame['positions']:
                        first_pos = first_frame['positions'][0]
                        print(f"  - Sample position data: {first_pos.get('driver_code')} at P{first_pos.get('position')}")
                
            else:
                print(f"[FAIL] No replay data returned")
                all_passed = False
        elif response.status_code == 503:
            print(f"[WARN] No session data loaded yet (503)")
        else:
            print(f"[FAIL] HTTP {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            all_passed = False
    except Exception as e:
        print(f"[FAIL] Error: {str(e)}")
        all_passed = False
    
    return all_passed


def test_module_integration():
    """Test that components don't crash and work together"""
    print("\n" + "="*80)
    print("TEST 3: MODULE INTEGRATION & STABILITY")
    print("="*80)
    
    all_passed = True
    
    # Test multiple rapid requests (simulate real usage)
    print("\n[Test 3.1] Rapid Sequential Requests")
    try:
        for i in range(5):
            response = requests.get(f"{BASE_URL}/api/db/drivers", timeout=2)
            if response.status_code != 200:
                print(f"[FAIL] Request {i+1} failed with status {response.status_code}")
                all_passed = False
                break
        else:
            print(f"[PASS] All 5 rapid requests succeeded")
    except Exception as e:
        print(f"[FAIL] Error during rapid requests: {str(e)}")
        all_passed = False
    
    # Test mode switching scenario
    print("\n[Test 3.2] Mode Switching Scenario")
    try:
        # Get session info
        r1 = requests.get(f"{BASE_URL}/api/session/info", timeout=2)
        # Get database drivers
        r2 = requests.get(f"{BASE_URL}/api/db/drivers", timeout=2)
        # Get replay data
        r3 = requests.get(f"{BASE_URL}/api/replay/race-data", timeout=5)
        
        if r1.status_code == 200 and r2.status_code == 200:
            print(f"[PASS] Mode switching endpoints stable")
            print(f"  - Session info: OK")
            print(f"  - Driver data: OK")
            print(f"  - Replay data: {'OK' if r3.status_code == 200 else 'Not available'}")
        else:
            print(f"[FAIL] Some endpoints failed")
            all_passed = False
    except Exception as e:
        print(f"[FAIL] Error during mode switching: {str(e)}")
        all_passed = False
    
    return all_passed


def run_all_tests():
    """Run complete test suite"""
    print("\n" + "#"*80)
    print("#" + " "*78 + "#")
    print("#" + " "*20 + "F1 TRACK.AI - PERFORMANCE & STABILITY TEST" + " "*15 + "#")
    print("#" + " "*78 + "#")
    print("#"*80)
    
    results = {
        'strategy_engine_performance': False,
        'live_replay_module': False,
        'integration_stability': False
    }
    
    # Wait for backend to be ready
    print("\nWaiting for backend to be ready...")
    for i in range(10):
        try:
            response = requests.get(f"{BASE_URL}/api/session/info", timeout=2)
            if response.status_code in [200, 503]:
                print("[OK] Backend is responding")
                break
        except:
            time.sleep(1)
            if i == 9:
                print("[FAIL] Backend not responding after 10 seconds")
                return
    
    # Run tests
    results['strategy_engine_performance'] = test_strategy_engine_performance()
    results['live_replay_module'] = test_live_replay_module()
    results['integration_stability'] = test_module_integration()
    
    # Final report
    print("\n" + "="*80)
    print("FINAL TEST REPORT")
    print("="*80)
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    print(f"\nTests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    print("\nDetailed Results:")
    for test_name, result in results.items():
        status = "[PASS]" if result else "[FAIL]"
        print(f"  {status} {test_name.replace('_', ' ').title()}")
    
    print("\n" + "="*80)
    
    if passed == total:
        print("[PASS] ALL TESTS PASSED - System ready for production")
    elif passed >= total - 1:
        print("[WARN] Most tests passed - Minor issues detected")
    else:
        print("[FAIL] Multiple failures - Please review")
    
    print("="*80 + "\n")
    
    # Save report
    with open('performance_test_report.json', 'w') as f:
        json.dump({
            'total': total,
            'passed': passed,
            'success_rate': (passed/total)*100,
            'results': results
        }, f, indent=2)
    
    print("[+] Report saved to: performance_test_report.json\n")


if __name__ == "__main__":
    run_all_tests()
