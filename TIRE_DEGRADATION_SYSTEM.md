# Tire Degradation Prediction System

## Overview
The F1 Tire Degradation Prediction System analyzes real-time telemetry data to model tire wear rates, predict optimal pit stop windows, and recommend race strategies based on compound characteristics and track conditions.

## System Architecture

### Backend Components

#### 1. **TireDegradationModel** (`tire_degradation_model.py`)
Core prediction engine that analyzes:
- **Telemetry Stress Factors**: Speed, braking intensity, cornering loads, throttle application
- **Temperature Effects**: Track and air temperature impact on degradation rates
- **Compound Characteristics**: Soft, Medium, Hard tire properties
- **Circuit Factors**: Abu Dhabi-specific wear characteristics

#### 2. **API Endpoints** (`main.py`)

##### GET `/api/tire/degradation/predict`
Predict tire degradation curve for a stint
- **Parameters**:
  - `compound`: SOFT, MEDIUM, HARD
  - `race_laps`: Number of laps in stint
  - `driver_code`: Optional driver for telemetry analysis
- **Returns**: Lap-by-lap degradation data with grip loss and time delta

##### POST `/api/tire/strategy/recommend`
Recommend optimal tire strategy
- **Parameters**:
  - `race_distance`: Total race laps (default: 58)
  - `min_pit_stops`: Minimum required stops (default: 1)
  - `weather_condition`: DRY, WET, MIXED
- **Returns**: Best strategy with stint breakdown and performance metrics

##### POST `/api/tire/pitstop/windows`
Calculate optimal pit stop windows
- **Body**: `{ "race_distance": 58, "strategy": [...] }`
- **Returns**: Optimal pit windows with degradation levels

##### GET `/api/tire/realtime/insights`
Real-time degradation insights during race
- **Parameters**: `current_lap`, `current_compound`, `stint_start_lap`, `driver_code`
- **Returns**: Live degradation %, grip level, recommendations, urgency level

##### POST `/api/tire/temperature/update`
Update track/air temperatures
- **Body**: `{ "track_temp": 42.0, "air_temp": 28.0 }`

##### GET `/api/tire/compounds/info`
Get tire compound characteristics and circuit factors

### Frontend Component

#### **TireDegradation.jsx**
Interactive tire analysis dashboard featuring:
- **Degradation Curve Visualization**: Real-time SVG chart showing wear progression
- **Compound Selector**: Choose between Soft, Medium, Hard compounds
- **Stint Length Control**: Adjust race laps for prediction
- **Strategy Recommendation**: Get optimal tire strategies with pit windows
- **Performance Metrics**: Max laps, track temp, stress index, final degradation

## Tire Compound Characteristics

### Soft (C5)
- **Base Degradation**: 0.085% per lap
- **Optimal Temp**: 90-110°C
- **Grip Level**: 1.0 (100%)
- **Max Stint**: 18 laps
- **Color**: Ferrari Red (#FF1E1E)

### Medium (C4)
- **Base Degradation**: 0.055% per lap
- **Optimal Temp**: 85-105°C
- **Grip Level**: 0.92 (92%)
- **Max Stint**: 28 laps
- **Color**: Yellow (#FFD700)

### Hard (C3)
- **Base Degradation**: 0.035% per lap
- **Optimal Temp**: 80-100°C
- **Grip Level**: 0.85 (85%)
- **Max Stint**: 40 laps
- **Color**: White (#F0F0F0)

## Abu Dhabi Circuit Factors

- **Tire Wear Severity**: Medium
- **Abrasive Surface**: 0.7 (scale 0-1)
- **High-Speed Corners**: 8
- **Heavy Braking Zones**: 9
- **Track Evolution**: 0.15 (15% improvement over race)

## Degradation Calculation Model

### Base Formula
```
lap_degradation = base_rate × temp_factor × stress_multiplier × 
                 circuit_multiplier × fuel_factor × evolution_factor × 
                 wear_acceleration
```

### Stress Factor Analysis
```python
overall_stress_index = (
    high_speed_stress × 0.25 +
    braking_stress × 0.30 +
    cornering_load × 0.25 +
    throttle_stress × 0.20
)
```

### Telemetry Metrics
- **High-Speed Stress**: Ratio of speed > 250 km/h
- **Braking Intensity**: Heavy braking events (brake > 80%)
- **Cornering Load**: Speed variance in corners
- **Throttle Stress**: Full throttle application ratio (> 95%)

### Non-Linear Degradation
- Degradation accelerates as tire wears
- Wear acceleration = `1.0 + (current_deg / 100) × 0.5`

### Fuel Load Effect
- Car gets lighter over race distance
- Fuel factor = `1.0 - (lap / total_laps) × 0.15`
- Reduces tire stress by up to 15%

### Temperature Impact
- **Below Optimal**: Increased sliding wear, higher degradation
- **Within Range**: Optimal performance (factor = 1.0)
- **Above Optimal**: Overheating, accelerated degradation
- Temperature factor increases with thermal sensitivity of compound

## Condition States

| Degradation % | Condition      | Color  | Action                     |
|--------------|----------------|--------|----------------------------|
| 0-40%        | GOOD           | Green  | Continue pushing           |
| 40-70%       | WORN           | Yellow | Monitor, pit window opens  |
| 70-90%       | CRITICAL       | Orange | Pit stop recommended       |
| 90-100%      | FAILURE RISK   | Red    | URGENT: Pit immediately    |

## Strategy Types

### Aggressive (S-M-H)
- **Stints**: Soft (15 laps) → Medium (22 laps) → Hard (21 laps)
- **Best For**: Qualifying advantage, track position critical
- **Risk**: High early degradation, requires clean air

### Conservative (M-H)
- **Stints**: Medium (30 laps) → Hard (28 laps)
- **Best For**: Reliability, uncertain weather, traffic
- **Advantage**: Lower overall degradation, fewer pit stops

### Balanced (M-M)
- **Stints**: Medium (29 laps) → Medium (29 laps)
- **Best For**: Predictable race pace, similar compound performance
- **Trade-off**: Moderate risk/reward balance

## Performance Metrics

### Grip Loss Calculation
```python
grip_loss = (degradation_percent / 100) × compound_grip_level
lap_time_delta = grip_loss × 0.8  # seconds per lap
```

### Pit Window Optimization
- Optimal pit lap: Degradation reaches 70-80%
- Window: ±3 laps from optimal
- Considers compound transition and track position

## API Usage Examples

### 1. Get Degradation Prediction
```javascript
fetch('https://f1-track-ai-production.up.railway.app/api/tire/degradation/predict?compound=MEDIUM&race_laps=30&driver_code=VER')
  .then(res => res.json())
  .then(data => {
    console.log('Degradation curve:', data.degradation_curve);
    console.log('Stress factors:', data.stress_factors);
  });
```

### 2. Request Strategy Recommendation
```javascript
fetch('https://f1-track-ai-production.up.railway.app/api/tire/strategy/recommend?race_distance=58&min_pit_stops=1&weather_condition=DRY', {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => {
    const strategy = data.recommended_strategy;
    console.log('Best strategy:', strategy.name);
    console.log('Stints:', strategy.stints);
    console.log('Total time penalty:', strategy.total_race_time_penalty);
  });
```

### 3. Calculate Pit Windows
```javascript
fetch('https://f1-track-ai-production.up.railway.app/api/tire/pitstop/windows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    race_distance: 58,
    strategy: [
      { compound: 'MEDIUM', laps: 30 },
      { compound: 'HARD', laps: 28 }
    ]
  })
})
  .then(res => res.json())
  .then(data => {
    console.log('Pit windows:', data.pit_windows);
  });
```

### 4. Real-Time Insights
```javascript
fetch('https://f1-track-ai-production.up.railway.app/api/tire/realtime/insights?current_lap=25&current_compound=SOFT&stint_start_lap=15&driver_code=HAM')
  .then(res => res.json())
  .then(data => {
    console.log('Current degradation:', data.degradation_percent);
    console.log('Recommendation:', data.recommendation);
    console.log('Urgency:', data.urgency);
  });
```

## Integration with Existing Features

### Strategy Simulator Integration
- Tire degradation data enhances Monte Carlo simulations
- Provides realistic lap time variance based on tire wear
- Optimizes pit stop timing in strategy comparisons

### Live Telemetry Integration
- Analyzes real-time driver telemetry from FastF1 API
- Calculates stress factors from speed, braking, throttle data
- Updates predictions based on actual driving style

### Weather Integration
- Temperature data from OpenWeatherMap API
- Adjusts degradation models for track/air temperature
- Supports wet weather strategy recommendations

## Visualization Features

### Degradation Chart
- **SVG-based curve**: Smooth gradient from green → yellow → red
- **Grid lines**: 0%, 25%, 50%, 75%, 100% markers
- **Critical threshold**: 70% degradation line highlighted
- **Lap axis**: Displays lap numbers for reference

### Performance Dashboard
- **Real-time stats**: Max laps, track temp, stress index
- **Condition indicator**: Color-coded tire state
- **Strategy cards**: Visual stint breakdown with compound colors
- **Ferrari theme**: Consistent red/black/yellow styling

## Technical Implementation Details

### Initialization
```python
# Backend startup (main.py)
@app.on_event("startup")
async def startup_event():
    initialize_tire_model(track_temp=42.0, air_temp=28.0)
```

### Data Flow
1. User selects compound and stint length in UI
2. Frontend requests prediction from `/api/tire/degradation/predict`
3. Backend analyzes telemetry (if available) for stress factors
4. TireDegradationModel calculates lap-by-lap degradation
5. Results returned with curve data, metrics, recommendations
6. Frontend renders SVG chart and performance stats

### State Management
- React useState for compound, raceLaps, degradation data
- useEffect for automatic prediction updates
- Async/await for API calls with loading states

## Future Enhancements

1. **Machine Learning Integration**
   - Train models on historical tire performance data
   - Predict degradation based on driver patterns
   - Adaptive learning from race results

2. **Multi-Driver Comparison**
   - Compare degradation rates between drivers
   - Analyze driving style impact on tire life
   - Team strategy optimization

3. **Live Race Updates**
   - Real-time degradation tracking during races
   - Automated pit stop recommendations
   - Dynamic strategy adjustments

4. **Historical Analysis**
   - Store degradation data across sessions
   - Identify trends and patterns
   - Improve prediction accuracy

5. **Compound Selection Optimizer**
   - Recommend best compounds for qualifying
   - Account for tire allocation rules
   - Optimize for specific grid positions

## Known Limitations

- Predictions based on Abu Dhabi circuit characteristics
- Limited to 2025 Pirelli tire compounds (C3-C5)
- Requires FastF1 telemetry data for accurate stress analysis
- Does not account for safety car periods or red flags
- Weather prediction limited to dry/wet conditions

## Troubleshooting

### Issue: Inaccurate Predictions
- **Solution**: Ensure track temperature is updated via `/api/tire/temperature/update`
- **Verify**: Driver telemetry data available for stress factor analysis

### Issue: Missing Degradation Data
- **Solution**: Check backend logs for API errors
- **Verify**: FastF1 session data loaded successfully

### Issue: Strategy Not Loading
- **Solution**: Ensure `min_pit_stops` matches race regulations
- **Verify**: Race distance parameter within valid range (1-70 laps)

## Performance Considerations

- Degradation calculations: O(n) where n = race laps
- Typical response time: < 100ms for predictions
- Strategy recommendations: ~200ms (analyzes multiple scenarios)
- Frontend rendering: Optimized SVG charts for smooth visualization

## Conclusion

The Tire Degradation Prediction System provides advanced tire management capabilities for the F1 Strategy Dashboard, enabling data-driven decisions for race strategy, pit stop timing, and compound selection. By leveraging real-time telemetry, temperature data, and sophisticated degradation models, the system delivers actionable insights for optimal race performance.

**System Status**: ✅ Fully Operational
**Last Updated**: 2025-12-14
**Version**: 1.0.0
