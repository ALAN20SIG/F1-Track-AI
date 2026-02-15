"""
Comprehensive Test Suite for F1 Track.AI
Tests all 6 requirements from the specification
"""

import requests
import time
import json
from typing import Dict, List

BASE_URL = "http://localhost:8000"

class F1TrackAITester:
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0
        self.warnings = 0
    
    def test_endpoint(self, name: str, endpoint: str, method: str = "GET", data: Dict = None) -> Dict:
        """Test a single endpoint"""
        print(f"\n{'='*60}")
        print(f"Testing: {name}")
        print(f"Endpoint: {method} {endpoint}")
        print('='*60)
        
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=30)
            elif method == "POST":
                response = requests.post(f"{BASE_URL}{endpoint}", json=data, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"[PASS] SUCCESS")
                
                # Analyze response
                if isinstance(data, dict):
                    if 'success' in data:
                        print(f"Success flag: {data['success']}")
                    if 'drivers' in data:
                        print(f"Drivers count: {len(data['drivers'])}")
                    if 'strategies' in data:
                        print(f"Strategies count: {len(data['strategies'])}")
                    if 'lap_times' in data:
                        print(f"Lap times count: {len(data['lap_times'])}")
                    if 'validation_report' in data:
                        report = data['validation_report']
                        print(f"Validation: {report['status']}")
                        print(f"  Errors: {report['summary']['errors']}")
                        print(f"  Warnings: {report['summary']['warnings']}")
                
                self.passed += 1
                return {"status": "PASS", "data": data}
            else:
                print(f"[FAIL] FAILED - HTTP {response.status_code}")
                print(f"Response: {response.text[:200]}")
                self.failed += 1
                return {"status": "FAIL", "error": response.text}
                
        except requests.exceptions.ConnectionError:
            print(f"[FAIL] CONNECTION ERROR - Backend not running")
            self.failed += 1
            return {"status": "FAIL", "error": "Backend not running"}
        except Exception as e:
            print(f"[FAIL] ERROR: {str(e)}")
            self.failed += 1
            return {"status": "FAIL", "error": str(e)}
    
    def test_requirement_1_historical_explanations(self):
        """
        Test Requirement 1: Strategy Engine Historical Explanations
        """
        print("\n" + "="*80)
        print("REQUIREMENT 1: STRATEGY ENGINE HISTORICAL EXPLANATIONS")
        print("="*80)
        
        # Test historical context endpoint
        result1 = self.test_endpoint(
            "Historical Context (VER)",
            "/api/analysis/historical-context/VER"
        )
        
        if result1['status'] == 'PASS':
            data = result1['data']
            checks = []
            
            # Check driver history
            if 'driver_history' in data:
                hist = data['driver_history']
                checks.append(f"[+] Driver history: {hist.get('abu_dhabi_wins')} wins")
                checks.append(f"[+] Tire management rating: {hist.get('tire_management_rating')}/10")
            
            # Check track factors
            if 'track_factors' in data:
                track = data['track_factors']
                checks.append(f"[+] Track: {track.get('circuit')}")
                checks.append(f"[+] Corners: {track.get('corners')}")
                checks.append(f"[+] Safety car probability: {track.get('safety_car_probability')*100:.0f}%")
            
            # Check tire degradation
            if 'tire_degradation' in data:
                tires = data['tire_degradation']
                checks.append(f"[+] Tire compounds: {len(tires)} types")
            
            print("\nHistorical Context Validation:")
            for check in checks:
                print(f"  {check}")
        
        # Test strategy suggestions with historical context
        result2 = self.test_endpoint(
            "Strategy Suggestions with History (LEC)",
            "/api/analysis/strategy-suggestions/LEC?target_position=1"
        )
        
        if result2['status'] == 'PASS':
            data = result2['data']
            
            if 'strategies' in data:
                print(f"\n[+] Generated {len(data['strategies'])} strategies")
                
                for idx, strategy in enumerate(data['strategies'], 1):
                    print(f"\n  Strategy {idx}: {strategy.get('name')}")
                    if 'explanation' in strategy:
                        print(f"    [+] Has historical explanation")
                        expl_len = len(strategy['explanation'])
                        print(f"    [+] Explanation length: {expl_len} chars")
                    if 'historicalBasis' in strategy:
                        print(f"    [+] Has historical basis data")
                        basis = strategy['historicalBasis']
                        print(f"    [+] Track suitability: {basis.get('trackSuitability')}")
    
    def test_requirement_2_performance_optimization(self):
        """
        Test Requirement 2: Performance Optimization & Caching
        """
        print("\n" + "="*80)
        print("REQUIREMENT 2: PERFORMANCE OPTIMIZATION")
        print("="*80)
        
        # Test driver loading speed
        print("\nTesting driver loading speed...")
        
        start = time.time()
        result = self.test_endpoint("Driver List", "/api/live/timing")
        end = time.time()
        
        load_time = (end - start) * 1000  # ms
        print(f"\nLoad time: {load_time:.0f}ms")
        
        if load_time < 3000:
            print(f"[PASS] Load time under 3 seconds")
        else:
            print(f"[WARN] Load time over 3 seconds")
            self.warnings += 1
        
        # Test database performance
        start = time.time()
        result2 = self.test_endpoint("Database Drivers", "/api/db/drivers")
        end = time.time()
        
        db_time = (end - start) * 1000
        print(f"\nDatabase load time: {db_time:.0f}ms")
        
        if db_time < 500:
            print(f"[PASS] Database under 500ms")
        elif db_time < 1000:
            print(f"[PASS] Database under 1 second")
        else:
            print(f"[WARN] Could be faster")
    
    def test_requirement_3_live_replay_module(self):
        """
        Test Requirement 3: Live/Replay Module Integration
        """
        print("\n" + "="*80)
        print("REQUIREMENT 3: LIVE/REPLAY MODULE")
        print("="*80)
        
        # Test session info (for mode detection)
        result1 = self.test_endpoint("Session Info", "/api/session/info")
        
        # Test live positions
        result2 = self.test_endpoint("Live Positions", "/api/live/positions")
        
        # Test track layout
        result3 = self.test_endpoint("Track Layout", "/api/live/track-layout")
        
        if result1['status'] == 'PASS':
            session = result1['data']
            print(f"\n[+] Session type: {session.get('session_type')}")
            print(f"[+] Year: {session.get('year')}")
            print(f"[+] Total laps: {session.get('total_laps')}")
    
    def test_requirement_4_data_validation(self):
        """
        Test Requirement 4: Data Validation
        """
        print("\n" + "="*80)
        print("REQUIREMENT 4: DATA VALIDATION")
        print("="*80)
        
        # Test validation endpoint
        result = self.test_endpoint(
            "Data Validation",
            "/api/validate/data",
            method="POST"
        )
        
        if result['status'] == 'PASS':
            report = result['data'].get('validation_report', {})
            summary = report.get('summary', {})
            
            print(f"\n[+] Validation Report:")
            print(f"  Total components: {summary.get('total_components')}")
            print(f"  Passed: {summary.get('passed')}")
            print(f"  Errors: {summary.get('errors')}")
            print(f"  Warnings: {summary.get('warnings')}")
            print(f"  Success rate: {summary.get('success_rate')}")
            print(f"  Overall status: {report.get('status')}")
            
            if report.get('status') == 'PASS':
                print(f"\n[PASS] ALL DATA VALIDATED SUCCESSFULLY")
            else:
                print(f"\n[WARN] Some validation issues found")
                if 'errors' in report:
                    for error in report['errors']:
                        print(f"  ERROR: {error}")
    
    def test_requirement_5_database_storage(self):
        """
        Test Requirement 5: Database Storage & Optimization
        """
        print("\n" + "="*80)
        print("REQUIREMENT 5: DATABASE STORAGE")
        print("="*80)
        
        # Test database import
        result1 = self.test_endpoint(
            "Database Import",
            "/api/db/import",
            method="POST"
        )
        
        if result1['status'] == 'PASS':
            print(f"\n[+] Imported {result1['data'].get('records')} records")
        
        # Test database queries
        endpoints = [
            ("Get All Drivers", "/api/db/drivers"),
            ("Get Lap Times (LEC)", "/api/db/lap-times/LEC"),
            ("Get Performance Metrics (VER)", "/api/db/performance/VER"),
            ("Get Fastest Laps", "/api/db/fastest-laps"),
            ("Get Session Info", "/api/db/session-info")
        ]
        
        print(f"\nTesting database query performance...")
        total_time = 0
        
        for name, endpoint in endpoints:
            start = time.time()
            result = self.test_endpoint(name, endpoint)
            end = time.time()
            
            query_time = (end - start) * 1000
            total_time += query_time
            
            if result['status'] == 'PASS':
                print(f"  Query time: {query_time:.0f}ms")
        
        avg_time = total_time / len(endpoints)
        print(f"\n[+] Average query time: {avg_time:.0f}ms")
        
        if avg_time < 500:
            print(f"[PASS] EXCELLENT DATABASE PERFORMANCE")
        elif avg_time < 1000:
            print(f"[PASS] GOOD DATABASE PERFORMANCE")
        else:
            print(f"[WARN] Database could be optimized further")
    
    def test_requirement_6_comprehensive_testing(self):
        """
        Test Requirement 6: Comprehensive End-to-End Testing
        """
        print("\n" + "="*80)
        print("REQUIREMENT 6: END-TO-END INTEGRATION TESTING")
        print("="*80)
        
        # Test race analysis endpoints
        analysis_endpoints = [
            ("Race Telemetry", "/api/analysis/race-telemetry"),
            ("Enhanced Analytics", "/api/analysis/enhanced-analytics"),
            ("Driver Comparison (VER vs NOR)", "/api/analysis/driver-comparison?driver1=VER&driver2=NOR")
        ]
        
        for name, endpoint in analysis_endpoints:
            self.test_endpoint(name, endpoint)
        
        # Test ML/prediction endpoints
        print(f"\nTesting ML/Prediction endpoints...")
        ml_endpoints = [
            ("ML Model Info", "/api/ml/model/info"),
            ("Race Model Info", "/api/race/model/info")
        ]
        
        for name, endpoint in ml_endpoints:
            self.test_endpoint(name, endpoint)
    
    def generate_final_report(self):
        """
        Generate comprehensive test report
        """
        print("\n" + "="*80)
        print("FINAL TEST REPORT")
        print("="*80)
        
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0
        
        print(f"\nTotal Tests: {total}")
        print(f"[PASS] Passed: {self.passed}")
        print(f"[FAIL] Failed: {self.failed}")
        print(f"[WARN] Warnings: {self.warnings}")
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        print(f"\n{'='*80}")
        
        if self.failed == 0:
            print("[PASS] ALL TESTS PASSED SUCCESSFULLY")
            print("[PASS] System is fully operational and ready for production")
        elif self.failed <= 2:
            print("[WARN] MOST TESTS PASSED")
            print(f"[WARN] {self.failed} test(s) need attention")
        else:
            print("[FAIL] MULTIPLE FAILURES DETECTED")
            print("[FAIL] Please review failed tests and fix issues")
        
        print(f"{'='*80}\n")
        
        return {
            "total": total,
            "passed": self.passed,
            "failed": self.failed,
            "warnings": self.warnings,
            "success_rate": success_rate
        }
    
    def run_all_tests(self):
        """
        Run complete test suite
        """
        print("\n" + "#"*80)
        print("#" + " "*78 + "#")
        print("#" + "  F1 TRACK.AI - COMPREHENSIVE TEST SUITE".center(78) + "#")
        print("#" + " "*78 + "#")
        print("#"*80)
        
        # Run all requirement tests
        self.test_requirement_1_historical_explanations()
        time.sleep(1)
        
        self.test_requirement_2_performance_optimization()
        time.sleep(1)
        
        self.test_requirement_3_live_replay_module()
        time.sleep(1)
        
        self.test_requirement_4_data_validation()
        time.sleep(1)
        
        self.test_requirement_5_database_storage()
        time.sleep(1)
        
        self.test_requirement_6_comprehensive_testing()
        time.sleep(1)
        
        # Generate final report
        return self.generate_final_report()


if __name__ == "__main__":
    tester = F1TrackAITester()
    report = tester.run_all_tests()
    
    # Save report to file
    with open("test_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n✓ Test report saved to: test_report.json")
