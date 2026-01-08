"""
Tire Degradation Prediction System for F1 Strategy Dashboard
Analyzes telemetry data to predict tire wear and optimal pit strategies
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import json


class TireDegradationModel:
    """
    Advanced tire degradation prediction model using telemetry analysis
    Considers: track temperature, speed, braking, cornering forces, compound characteristics
    """
    
    # Tire compound characteristics (based on F1 2025 Pirelli specifications)
    COMPOUND_CHARACTERISTICS = {
        'SOFT': {
            'base_degradation_rate': 0.085,  # % per lap
            'optimal_temp_range': (90, 110),  # Celsius
            'grip_level': 1.0,
            'thermal_sensitivity': 1.2,
            'max_stint_laps': 18,
            'color': '#FF1E1E'
        },
        'MEDIUM': {
            'base_degradation_rate': 0.055,
            'optimal_temp_range': (85, 105),
            'grip_level': 0.92,
            'thermal_sensitivity': 1.0,
            'max_stint_laps': 28,
            'color': '#FFD700'
        },
        'HARD': {
            'base_degradation_rate': 0.035,
            'optimal_temp_range': (80, 100),
            'grip_level': 0.85,
            'thermal_sensitivity': 0.8,
            'max_stint_laps': 40,
            'color': '#F0F0F0'
        }
    }
    
    # Abu Dhabi circuit characteristics
    CIRCUIT_FACTORS = {
        'tire_wear_severity': 'Medium',  # Low, Medium, High
        'abrasive_surface': 0.7,  # 0-1 scale
        'high_speed_corners': 8,
        'heavy_braking_zones': 9,
        'track_evolution_factor': 0.15  # Track improvement per lap
    }
    
    def __init__(self, track_temp: float = 42.0, air_temp: float = 28.0):
        """
        Initialize tire degradation model
        
        Args:
            track_temp: Track temperature in Celsius
            air_temp: Air temperature in Celsius
        """
        self.track_temp = track_temp
        self.air_temp = air_temp
        self.telemetry_data = None
        self.historical_deg_data = {}
        
    def analyze_telemetry(self, telemetry_data: pd.DataFrame, driver_code: str) -> Dict:
        """
        Analyze telemetry data to calculate stress factors affecting tire degradation
        
        Args:
            telemetry_data: DataFrame with Speed, Throttle, Brake, nGear columns
            driver_code: Driver identifier
            
        Returns:
            Dictionary with stress factor metrics
        """
        if telemetry_data is None or telemetry_data.empty:
            return self._default_stress_factors()
        
        try:
            # Calculate high-speed stress (speed > 250 km/h)
            high_speed_ratio = (telemetry_data['Speed'] > 250).sum() / len(telemetry_data)
            
            # Calculate braking intensity (heavy braking events)
            heavy_braking_events = (telemetry_data['Brake'] > 80).sum()
            braking_stress = heavy_braking_events / len(telemetry_data)
            
            # Calculate cornering load (speed variance in corners)
            speed_variance = telemetry_data['Speed'].std() / telemetry_data['Speed'].mean()
            
            # Calculate throttle application stress
            full_throttle_ratio = (telemetry_data['Throttle'] > 95).sum() / len(telemetry_data)
            
            # Calculate gear changes (transmission stress indicator)
            gear_changes = (telemetry_data['nGear'].diff() != 0).sum()
            
            return {
                'high_speed_stress': high_speed_ratio,
                'braking_stress': braking_stress,
                'cornering_load': min(speed_variance, 1.0),
                'throttle_stress': full_throttle_ratio,
                'gear_change_rate': gear_changes / len(telemetry_data),
                'overall_stress_index': self._calculate_stress_index(
                    high_speed_ratio, braking_stress, speed_variance, full_throttle_ratio
                )
            }
        except Exception as e:
            print(f"Error analyzing telemetry for {driver_code}: {e}")
            return self._default_stress_factors()
    
    def _default_stress_factors(self) -> Dict:
        """Return default stress factors when telemetry unavailable"""
        return {
            'high_speed_stress': 0.65,
            'braking_stress': 0.55,
            'cornering_load': 0.60,
            'throttle_stress': 0.70,
            'gear_change_rate': 0.08,
            'overall_stress_index': 0.63
        }
    
    def _calculate_stress_index(self, high_speed: float, braking: float, 
                                cornering: float, throttle: float) -> float:
        """
        Calculate overall tire stress index (0-1 scale)
        Weighted combination of different stress factors
        """
        weights = {
            'high_speed': 0.25,
            'braking': 0.30,
            'cornering': 0.25,
            'throttle': 0.20
        }
        
        stress_index = (
            high_speed * weights['high_speed'] +
            braking * weights['braking'] +
            cornering * weights['cornering'] +
            throttle * weights['throttle']
        )
        
        return min(stress_index, 1.0)
    
    def calculate_temperature_factor(self, compound: str) -> float:
        """
        Calculate temperature impact on tire degradation
        
        Args:
            compound: Tire compound (SOFT, MEDIUM, HARD)
            
        Returns:
            Temperature multiplier for degradation rate
        """
        if compound not in self.COMPOUND_CHARACTERISTICS:
            compound = 'MEDIUM'
        
        optimal_range = self.COMPOUND_CHARACTERISTICS[compound]['optimal_temp_range']
        thermal_sens = self.COMPOUND_CHARACTERISTICS[compound]['thermal_sensitivity']
        
        # Calculate deviation from optimal temperature
        optimal_temp = (optimal_range[0] + optimal_range[1]) / 2
        temp_deviation = abs(self.track_temp - optimal_temp)
        
        # Temperature factor: 1.0 at optimal, increases with deviation
        if self.track_temp < optimal_range[0]:
            # Below optimal: less grip, more sliding wear
            temp_factor = 1.0 + (temp_deviation / 30) * thermal_sens
        elif self.track_temp > optimal_range[1]:
            # Above optimal: overheating, increased degradation
            temp_factor = 1.0 + (temp_deviation / 20) * thermal_sens
        else:
            # Within optimal range
            temp_factor = 1.0
        
        return temp_factor
    
    def predict_degradation_curve(self, compound: str, race_laps: int, 
                                  stress_factors: Dict, 
                                  fuel_load_effect: bool = True) -> List[Dict]:
        """
        Predict tire degradation over race distance
        
        Args:
            compound: Tire compound
            race_laps: Total laps in stint
            stress_factors: Telemetry-derived stress factors
            fuel_load_effect: Account for fuel weight reduction
            
        Returns:
            List of degradation data points per lap
        """
        if compound not in self.COMPOUND_CHARACTERISTICS:
            compound = 'MEDIUM'
        
        char = self.COMPOUND_CHARACTERISTICS[compound]
        base_deg_rate = char['base_degradation_rate']
        
        # Calculate modifiers
        temp_factor = self.calculate_temperature_factor(compound)
        stress_multiplier = 1.0 + (stress_factors['overall_stress_index'] - 0.5) * 0.6
        circuit_multiplier = self.CIRCUIT_FACTORS['abrasive_surface']
        
        degradation_curve = []
        current_degradation = 0.0
        
        for lap in range(1, race_laps + 1):
            # Fuel load effect (car gets lighter, less tire stress)
            if fuel_load_effect:
                fuel_factor = 1.0 - (lap / race_laps) * 0.15
            else:
                fuel_factor = 1.0
            
            # Track evolution (track gets faster, less abrasive)
            evolution_factor = 1.0 - (lap / race_laps) * self.CIRCUIT_FACTORS['track_evolution_factor']
            
            # Non-linear degradation (accelerates as tire wears)
            wear_acceleration = 1.0 + (current_degradation / 100) * 0.5
            
            # Calculate lap degradation
            lap_deg_rate = (
                base_deg_rate * 
                temp_factor * 
                stress_multiplier * 
                circuit_multiplier *
                fuel_factor *
                evolution_factor *
                wear_acceleration
            )
            
            current_degradation += lap_deg_rate
            
            # Calculate performance loss (grip reduction)
            grip_loss = (current_degradation / 100) * char['grip_level']
            lap_time_delta = grip_loss * 0.8  # seconds per lap lost
            
            # Determine tire condition status
            if current_degradation < 40:
                condition = 'GOOD'
                condition_color = '#10b981'
            elif current_degradation < 70:
                condition = 'WORN'
                condition_color = '#f59e0b'
            elif current_degradation < 90:
                condition = 'CRITICAL'
                condition_color = '#ef4444'
            else:
                condition = 'FAILURE RISK'
                condition_color = '#DC0000'
            
            degradation_curve.append({
                'lap': lap,
                'degradation_percent': round(current_degradation, 2),
                'grip_level': round((100 - current_degradation) * char['grip_level'] / 100, 2),
                'lap_time_delta': round(lap_time_delta, 3),
                'condition': condition,
                'condition_color': condition_color,
                'tire_temp_estimate': round(self.track_temp + 15 + (lap * 0.3), 1)
            })
        
        return degradation_curve
    
    def calculate_optimal_pit_windows(self, race_distance: int, 
                                      strategy: List[Dict]) -> List[Dict]:
        """
        Calculate optimal pit stop windows based on degradation predictions
        
        Args:
            race_distance: Total race laps
            strategy: List of stint strategies with compound and target laps
            
        Returns:
            List of pit window recommendations
        """
        pit_windows = []
        cumulative_laps = 0
        
        for stint_idx, stint in enumerate(strategy):
            if stint_idx == len(strategy) - 1:
                # Last stint - no pit stop
                break
            
            compound = stint['compound']
            target_laps = stint['laps']
            
            # Get degradation curve for this stint
            stress_factors = self._default_stress_factors()  # Use default for strategy planning
            deg_curve = self.predict_degradation_curve(compound, target_laps, stress_factors)
            
            # Find optimal pit lap (degradation reaches 70-80%)
            optimal_pit_lap = None
            for lap_data in deg_curve:
                if lap_data['degradation_percent'] >= 70:
                    optimal_pit_lap = lap_data['lap']
                    break
            
            if optimal_pit_lap is None:
                optimal_pit_lap = target_laps
            
            # Calculate pit window (±3 laps from optimal)
            window_start = cumulative_laps + max(1, optimal_pit_lap - 3)
            window_end = cumulative_laps + min(target_laps, optimal_pit_lap + 3)
            window_optimal = cumulative_laps + optimal_pit_lap
            
            pit_windows.append({
                'stint': stint_idx + 1,
                'window_start': window_start,
                'window_optimal': window_optimal,
                'window_end': window_end,
                'compound_current': compound,
                'compound_next': strategy[stint_idx + 1]['compound'],
                'degradation_at_optimal': round(deg_curve[optimal_pit_lap - 1]['degradation_percent'], 1),
                'recommendation': f"Pit on lap {window_optimal} (window: {window_start}-{window_end})"
            })
            
            cumulative_laps += target_laps
        
        return pit_windows
    
    def recommend_tire_strategy(self, race_distance: int, 
                               min_pit_stops: int = 1,
                               weather_condition: str = 'DRY') -> Dict:
        """
        Recommend optimal tire strategy for race
        
        Args:
            race_distance: Total race laps
            min_pit_stops: Minimum required pit stops
            weather_condition: DRY, WET, MIXED
            
        Returns:
            Dictionary with recommended strategy
        """
        if weather_condition != 'DRY':
            return self._wet_weather_strategy(race_distance, min_pit_stops)
        
        # Analyze available strategies
        strategies = []
        
        # Strategy 1: Soft-Medium-Hard (aggressive start)
        if min_pit_stops == 2:
            strategies.append({
                'name': 'Aggressive (S-M-H)',
                'stints': [
                    {'compound': 'SOFT', 'laps': 15},
                    {'compound': 'MEDIUM', 'laps': 22},
                    {'compound': 'HARD', 'laps': race_distance - 37}
                ],
                'type': 'AGGRESSIVE',
                'qualifying_advantage': True
            })
        
        # Strategy 2: Medium-Hard (conservative)
        if min_pit_stops == 1:
            strategies.append({
                'name': 'Conservative (M-H)',
                'stints': [
                    {'compound': 'MEDIUM', 'laps': race_distance // 2 + 2},
                    {'compound': 'HARD', 'laps': race_distance // 2 - 2}
                ],
                'type': 'CONSERVATIVE',
                'qualifying_advantage': False
            })
        
        # Strategy 3: Medium-Medium (balanced)
        if min_pit_stops == 1:
            strategies.append({
                'name': 'Balanced (M-M)',
                'stints': [
                    {'compound': 'MEDIUM', 'laps': race_distance // 2},
                    {'compound': 'MEDIUM', 'laps': race_distance // 2}
                ],
                'type': 'BALANCED',
                'qualifying_advantage': False
            })
        
        # Evaluate each strategy
        for strategy in strategies:
            total_time_loss = 0
            total_pit_time = (len(strategy['stints']) - 1) * 24  # 24s pit stop
            
            for stint in strategy['stints']:
                stress_factors = self._default_stress_factors()
                deg_curve = self.predict_degradation_curve(
                    stint['compound'], 
                    stint['laps'], 
                    stress_factors
                )
                
                # Sum up time loss from degradation
                stint_time_loss = sum([lap['lap_time_delta'] for lap in deg_curve])
                total_time_loss += stint_time_loss
            
            strategy['estimated_time_loss'] = round(total_time_loss, 2)
            strategy['total_race_time_penalty'] = round(total_time_loss + total_pit_time, 2)
            strategy['pit_stops'] = len(strategy['stints']) - 1
        
        # Select best strategy (lowest total race time penalty)
        best_strategy = min(strategies, key=lambda s: s['total_race_time_penalty'])
        
        return {
            'recommended_strategy': best_strategy,
            'all_strategies': strategies,
            'race_distance': race_distance,
            'track_temp': self.track_temp,
            'air_temp': self.air_temp
        }
    
    def _wet_weather_strategy(self, race_distance: int, min_pit_stops: int) -> Dict:
        """Simplified wet weather strategy recommendation"""
        return {
            'recommended_strategy': {
                'name': 'Wet Weather Strategy',
                'stints': [
                    {'compound': 'INTERMEDIATE', 'laps': race_distance}
                ],
                'type': 'WET',
                'pit_stops': 0,
                'note': 'Weather-dependent - monitor conditions'
            },
            'all_strategies': [],
            'race_distance': race_distance,
            'track_temp': self.track_temp,
            'air_temp': self.air_temp
        }
    
    def generate_real_time_insights(self, current_lap: int, 
                                   current_compound: str,
                                   stint_start_lap: int,
                                   telemetry_data: Optional[pd.DataFrame] = None) -> Dict:
        """
        Generate real-time tire degradation insights during race
        
        Args:
            current_lap: Current race lap
            current_compound: Current tire compound
            stint_start_lap: Lap when current tires were fitted
            telemetry_data: Recent telemetry data
            
        Returns:
            Real-time insights and recommendations
        """
        laps_on_tire = current_lap - stint_start_lap + 1
        
        # Analyze telemetry if available
        if telemetry_data is not None and not telemetry_data.empty:
            stress_factors = self.analyze_telemetry(telemetry_data, "CURRENT")
        else:
            stress_factors = self._default_stress_factors()
        
        # Get degradation prediction
        deg_curve = self.predict_degradation_curve(
            current_compound, 
            laps_on_tire, 
            stress_factors
        )
        
        current_deg = deg_curve[-1]
        
        # Generate recommendations
        if current_deg['degradation_percent'] < 40:
            recommendation = "Tire condition GOOD - Continue pushing"
            urgency = 'LOW'
        elif current_deg['degradation_percent'] < 65:
            recommendation = "Tire condition WORN - Consider pit window approaching"
            urgency = 'MEDIUM'
        elif current_deg['degradation_percent'] < 85:
            recommendation = "Tire condition CRITICAL - Pit stop recommended within 3 laps"
            urgency = 'HIGH'
        else:
            recommendation = "URGENT: Severe degradation - Pit immediately"
            urgency = 'CRITICAL'
        
        return {
            'current_lap': current_lap,
            'laps_on_tire': laps_on_tire,
            'compound': current_compound,
            'degradation_percent': current_deg['degradation_percent'],
            'grip_level': current_deg['grip_level'],
            'condition': current_deg['condition'],
            'condition_color': current_deg['condition_color'],
            'lap_time_delta': current_deg['lap_time_delta'],
            'tire_temp_estimate': current_deg['tire_temp_estimate'],
            'stress_index': stress_factors['overall_stress_index'],
            'recommendation': recommendation,
            'urgency': urgency,
            'track_temp': self.track_temp,
            'max_recommended_laps': self.COMPOUND_CHARACTERISTICS[current_compound]['max_stint_laps']
        }


# Global tire degradation service instance
tire_model = TireDegradationModel()


def initialize_tire_model(track_temp: float = 42.0, air_temp: float = 28.0):
    """Initialize tire degradation model with current conditions"""
    global tire_model
    tire_model = TireDegradationModel(track_temp, air_temp)
    print(f">> Tire degradation model initialized (Track: {track_temp}°C, Air: {air_temp}°C)")
    return tire_model
