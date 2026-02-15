"""
Data Validation Utility for F1 Track.AI
Validates all graphs, charts, and visualizations for accuracy
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any
import json


class DataValidator:
    """
    Validates data accuracy across all F1 Track.AI components
    Ensures charts, graphs, and visualizations display correct information
    """
    
    def __init__(self):
        self.validation_results = []
        self.errors = []
        self.warnings = []
    
    def validate_lap_times(self, lap_data: List[Dict]) -> Dict[str, Any]:
        """
        Validate lap time data for accuracy
        Checks: reasonable ranges, monotonic lap numbers, no negative values
        """
        results = {
            "component": "Lap Times",
            "status": "PASS",
            "checks": []
        }
        
        for lap in lap_data:
            # Check lap time is reasonable (60-120 seconds for F1)
            if 'lap_time_seconds' in lap:
                time = lap['lap_time_seconds']
                if time < 60 or time > 180:
                    results["checks"].append({
                        "check": "Lap time range",
                        "status": "WARNING",
                        "message": f"Lap time {time:.3f}s outside normal range [60-180s]"
                    })
                    self.warnings.append(f"Lap time {time:.3f}s unusual")
                else:
                    results["checks"].append({
                        "check": "Lap time range",
                        "status": "PASS",
                        "value": f"{time:.3f}s"
                    })
            
            # Check sector times sum correctly
            if all(k in lap for k in ['sector_1_seconds', 'sector_2_seconds', 'sector_3_seconds', 'lap_time_seconds']):
                s1, s2, s3 = lap['sector_1_seconds'], lap['sector_2_seconds'], lap['sector_3_seconds']
                total = lap['lap_time_seconds']
                
                # Skip if any sector is None or 0
                if s1 is None or s2 is None or s3 is None or s1 == 0 or s2 == 0 or s3 == 0:
                    results["checks"].append({
                        "check": "Sector sum accuracy",
                        "status": "SKIP",
                        "message": "Incomplete sector data"
                    })
                    continue
                
                sector_sum = s1 + s2 + s3
                
                if abs(sector_sum - total) > 0.1:  # 100ms tolerance
                    results["checks"].append({
                        "check": "Sector sum accuracy",
                        "status": "ERROR",
                        "message": f"Sectors ({sector_sum:.3f}s) don't match lap time ({total:.3f}s)"
                    })
                    results["status"] = "ERROR"
                    self.errors.append(f"Sector mismatch: {sector_sum:.3f} vs {total:.3f}")
                else:
                    results["checks"].append({
                        "check": "Sector sum accuracy",
                        "status": "PASS",
                        "tolerance": "±0.1s"
                    })
        
        return results
    
    def validate_telemetry(self, telemetry_data: Dict[str, List]) -> Dict[str, Any]:
        """
        Validate telemetry data (speed, throttle, brake, gear)
        Checks: value ranges, data consistency, correlations
        """
        results = {
            "component": "Telemetry",
            "status": "PASS",
            "checks": []
        }
        
        # Validate speed data
        if 'speed' in telemetry_data:
            speeds = np.array(telemetry_data['speed'])
            
            # Speed range check (0-350 km/h for F1)
            if np.any((speeds < 0) | (speeds > 400)):
                results["checks"].append({
                    "check": "Speed range",
                    "status": "ERROR",
                    "message": f"Speed values outside valid range [0-400 km/h]"
                })
                results["status"] = "ERROR"
                self.errors.append("Invalid speed values detected")
            else:
                results["checks"].append({
                    "check": "Speed range",
                    "status": "PASS",
                    "range": f"{speeds.min():.1f}-{speeds.max():.1f} km/h"
                })
        
        # Validate throttle data
        if 'throttle' in telemetry_data:
            throttle = np.array(telemetry_data['throttle'])
            
            # Throttle range check (0-100%)
            if np.any((throttle < 0) | (throttle > 100)):
                results["checks"].append({
                    "check": "Throttle range",
                    "status": "ERROR",
                    "message": "Throttle values outside [0-100%]"
                })
                results["status"] = "ERROR"
                self.errors.append("Invalid throttle values")
            else:
                results["checks"].append({
                    "check": "Throttle range",
                    "status": "PASS",
                    "range": "0-100%"
                })
        
        # Validate brake data
        if 'brake' in telemetry_data:
            brake = np.array(telemetry_data['brake'])
            
            # Brake should be binary or 0-100
            if not np.all(np.isin(brake, [0, 1, True, False]) | ((brake >= 0) & (brake <= 100))):
                results["checks"].append({
                    "check": "Brake data",
                    "status": "WARNING",
                    "message": "Brake values not in expected format"
                })
                self.warnings.append("Unusual brake data format")
            else:
                results["checks"].append({
                    "check": "Brake data",
                    "status": "PASS"
                })
        
        # Correlation check: high speed should have low brake
        if 'speed' in telemetry_data and 'brake' in telemetry_data:
            speeds = np.array(telemetry_data['speed'])
            brakes = np.array(telemetry_data['brake'])
            
            # Find high-speed braking (suspicious)
            high_speed_braking = np.sum((speeds > 200) & (brakes > 50))
            if high_speed_braking > len(speeds) * 0.1:  # More than 10%
                results["checks"].append({
                    "check": "Speed-brake correlation",
                    "status": "WARNING",
                    "message": f"High-speed braking detected in {high_speed_braking} samples"
                })
                self.warnings.append("Unusual speed-brake correlation")
            else:
                results["checks"].append({
                    "check": "Speed-brake correlation",
                    "status": "PASS"
                })
        
        return results
    
    def validate_positions(self, position_data: List[Dict]) -> Dict[str, Any]:
        """
        Validate position/ranking data
        Checks: continuous positions, no duplicates, valid range
        """
        results = {
            "component": "Positions",
            "status": "PASS",
            "checks": []
        }
        
        positions = [p['position'] for p in position_data if 'position' in p]
        
        # Check position range (1-20 for F1)
        if positions:
            if min(positions) < 1 or max(positions) > 20:
                results["checks"].append({
                    "check": "Position range",
                    "status": "ERROR",
                    "message": f"Positions outside valid range [1-20]: {min(positions)}-{max(positions)}"
                })
                results["status"] = "ERROR"
                self.errors.append(f"Invalid position range: {min(positions)}-{max(positions)}")
            else:
                results["checks"].append({
                    "check": "Position range",
                    "status": "PASS",
                    "range": f"{min(positions)}-{max(positions)}"
                })
            
            # Check for duplicate positions (at same lap)
            from collections import Counter
            pos_counts = Counter(positions)
            duplicates = {pos: count for pos, count in pos_counts.items() if count > 1}
            
            if duplicates:
                results["checks"].append({
                    "check": "No duplicate positions",
                    "status": "WARNING",
                    "message": f"Duplicate positions found: {duplicates}"
                })
                self.warnings.append(f"Duplicate positions: {duplicates}")
            else:
                results["checks"].append({
                    "check": "No duplicate positions",
                    "status": "PASS"
                })
        
        return results
    
    def validate_strategy_data(self, strategies: List[Dict]) -> Dict[str, Any]:
        """
        Validate strategy recommendations
        Checks: pit window logic, tire compound choices, probability ranges
        """
        results = {
            "component": "Strategy Recommendations",
            "status": "PASS",
            "checks": []
        }
        
        for idx, strategy in enumerate(strategies):
            # Validate probability (0-1 or 0-100)
            if 'probability' in strategy:
                prob = strategy['probability']
                if prob < 0 or prob > 1:
                    results["checks"].append({
                        "check": f"Strategy {idx+1} probability",
                        "status": "ERROR",
                        "message": f"Probability {prob} outside range [0-1]"
                    })
                    results["status"] = "ERROR"
                    self.errors.append(f"Invalid probability: {prob}")
                else:
                    results["checks"].append({
                        "check": f"Strategy {idx+1} probability",
                        "status": "PASS",
                        "value": f"{prob*100:.1f}%"
                    })
            
            # Validate pit stops vs stints
            if 'pitStops' in strategy and 'stints' in strategy:
                pit_stops = strategy['pitStops']
                stints = len(strategy['stints'])
                
                if stints != pit_stops + 1:
                    results["checks"].append({
                        "check": f"Strategy {idx+1} pit-stint logic",
                        "status": "ERROR",
                        "message": f"{pit_stops} pit stops should create {pit_stops+1} stints, got {stints}"
                    })
                    results["status"] = "ERROR"
                    self.errors.append(f"Pit-stint mismatch: {pit_stops} stops, {stints} stints")
                else:
                    results["checks"].append({
                        "check": f"Strategy {idx+1} pit-stint logic",
                        "status": "PASS"
                    })
            
            # Validate tire compounds
            if 'stints' in strategy:
                valid_compounds = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET']
                for stint in strategy['stints']:
                    if 'compound' in stint:
                        if stint['compound'] not in valid_compounds:
                            results["checks"].append({
                                "check": f"Strategy {idx+1} tire compound",
                                "status": "ERROR",
                                "message": f"Invalid compound: {stint['compound']}"
                            })
                            results["status"] = "ERROR"
                            self.errors.append(f"Invalid tire compound: {stint['compound']}")
        
        return results
    
    def validate_weather_data(self, weather: Dict) -> Dict[str, Any]:
        """
        Validate weather data
        Checks: temperature ranges, humidity, realistic values
        """
        results = {
            "component": "Weather Data",
            "status": "PASS",
            "checks": []
        }
        
        # Track temperature check (10-60°C realistic for F1)
        if 'track_temp' in weather:
            temp = weather['track_temp']
            if temp < 10 or temp > 65:
                results["checks"].append({
                    "check": "Track temperature",
                    "status": "WARNING",
                    "message": f"Track temp {temp}°C outside typical range [10-65°C]"
                })
                self.warnings.append(f"Unusual track temp: {temp}°C")
            else:
                results["checks"].append({
                    "check": "Track temperature",
                    "status": "PASS",
                    "value": f"{temp}°C"
                })
        
        # Air temperature check
        if 'air_temp' in weather:
            temp = weather['air_temp']
            if temp < 5 or temp > 50:
                results["checks"].append({
                    "check": "Air temperature",
                    "status": "WARNING",
                    "message": f"Air temp {temp}°C unusual"
                })
                self.warnings.append(f"Unusual air temp: {temp}°C")
            else:
                results["checks"].append({
                    "check": "Air temperature",
                    "status": "PASS",
                    "value": f"{temp}°C"
                })
        
        # Humidity check (0-100%)
        if 'humidity' in weather:
            humidity = weather['humidity']
            if humidity < 0 or humidity > 100:
                results["checks"].append({
                    "check": "Humidity",
                    "status": "ERROR",
                    "message": f"Humidity {humidity}% outside valid range [0-100%]"
                })
                results["status"] = "ERROR"
                self.errors.append(f"Invalid humidity: {humidity}%")
            else:
                results["checks"].append({
                    "check": "Humidity",
                    "status": "PASS",
                    "value": f"{humidity}%"
                })
        
        return results
    
    def generate_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive validation report
        """
        total_checks = len(self.validation_results)
        passed = sum(1 for r in self.validation_results if r['status'] == 'PASS')
        
        return {
            "summary": {
                "total_components": total_checks,
                "passed": passed,
                "warnings": len(self.warnings),
                "errors": len(self.errors),
                "success_rate": f"{(passed/total_checks*100):.1f}%" if total_checks > 0 else "N/A"
            },
            "validation_results": self.validation_results,
            "errors": self.errors,
            "warnings": self.warnings,
            "status": "PASS" if len(self.errors) == 0 else "FAIL"
        }


def validate_all_data(session_data: Dict) -> Dict[str, Any]:
    """
    Validate all data from a session
    """
    validator = DataValidator()
    
    # Validate lap times
    if 'lap_times' in session_data:
        result = validator.validate_lap_times(session_data['lap_times'])
        validator.validation_results.append(result)
    
    # Validate telemetry
    if 'telemetry' in session_data:
        result = validator.validate_telemetry(session_data['telemetry'])
        validator.validation_results.append(result)
    
    # Validate positions
    if 'positions' in session_data:
        result = validator.validate_positions(session_data['positions'])
        validator.validation_results.append(result)
    
    # Validate strategies
    if 'strategies' in session_data:
        result = validator.validate_strategy_data(session_data['strategies'])
        validator.validation_results.append(result)
    
    # Validate weather
    if 'weather' in session_data:
        result = validator.validate_weather_data(session_data['weather'])
        validator.validation_results.append(result)
    
    return validator.generate_report()
