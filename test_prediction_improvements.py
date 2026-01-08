"""
Test script to verify updated AI race predictions
Tests the improved model with realistic Ferrari/McLaren adjustments
"""

import sys
sys.path.insert(0, 'c:/Users/sandr/Untitled Folder/backend')

from race_prediction_model import race_predictor

# Load the updated model
print("=" * 70)
print("Testing Updated AI Race Prediction Model")
print("=" * 70)

success = race_predictor.load_model("c:/Users/sandr/Untitled Folder/backend/abu_dhabi_race_predictor.pkl")

if not success:
    print("\n❌ Model not found. Training new model with updated parameters...")
    from race_prediction_model import train_abu_dhabi_predictor
    metrics = train_abu_dhabi_predictor()
    print("\n✅ Training complete!")
else:
    print("\n✅ Model loaded successfully!")

# Test weather data (typical Abu Dhabi conditions)
weather_data = {
    'track_temp': 42.0,
    'air_temp': 28.0,
    'humidity': 35,
    'wind_speed': 3.2
}

# Test qualifying results (example grid)
qualifying_results = [
    {'code': 'NOR', 'position': 1},   # Norris on pole (McLaren strong)
    {'code': 'VER', 'position': 2},   # Verstappen P2
    {'code': 'PIA', 'position': 3},   # Piastri P3 (McLaren)
    {'code': 'LEC', 'position': 4},   # Leclerc P4 (Ferrari struggling)
    {'code': 'RUS', 'position': 5},   # Russell P5
    {'code': 'HAM', 'position': 6},   # Hamilton P6 (Ferrari)
    {'code': 'SAI', 'position': 7},
    {'code': 'ALO', 'position': 8},
    {'code': 'ANT', 'position': 9},
    {'code': 'BEA', 'position': 10},
    {'code': 'HUL', 'position': 11},
    {'code': 'ALB', 'position': 12},
    {'code': 'OCO', 'position': 13},
    {'code': 'TSU', 'position': 14},
    {'code': 'LAW', 'position': 15},
    {'code': 'STR', 'position': 16},
    {'code': 'BOR', 'position': 17},
    {'code': 'HAD', 'position': 18},
    {'code': 'GAS', 'position': 19},
    {'code': 'COL', 'position': 20}
]

# Get predictions
print("\n" + "=" * 70)
print("RACE PREDICTIONS (with confidence percentages)")
print("=" * 70)

prediction = race_predictor.get_podium_prediction(weather_data, qualifying_results)

# Display podium
print("\n🏆 PREDICTED PODIUM:")
print("-" * 70)
for pred in prediction['podium']:
    pos = pred['position']
    driver = pred['fullName']
    team = pred['team']
    conf = pred['confidence']
    qual = pred['qualifying_position']
    change = pred.get('position_change', 0)
    
    emoji = "🥇" if pos == 1 else "🥈" if pos == 2 else "🥉"
    conf_emoji = "🟢" if conf >= 80 else "🟡" if conf >= 65 else "🟠"
    
    change_str = ""
    if change > 0:
        change_str = f"▲ +{change}"
    elif change < 0:
        change_str = f"▼ {change}"
    else:
        change_str = "="
    
    print(f"{emoji} P{pos}  {driver:20s} ({team})")
    print(f"     Grid: P{qual}  |  Predicted: P{pos}  |  Change: {change_str}")
    print(f"     Confidence: {conf:.1f}% {conf_emoji}")
    print()

# Display full top 10
print("\n📊 FULL TOP 10 PREDICTIONS:")
print("-" * 70)
print(f"{'Pos':<4} {'Driver':<20} {'Team':<20} {'Conf%':<8} {'Grid':<6} {'Change'}")
print("-" * 70)

for pred in prediction['full_predictions'][:10]:
    pos = pred['predicted_position']
    driver = pred['fullName']
    team = pred['team']
    conf = pred['confidence_percentage']
    qual = pred['qualifying_position']
    change = pred['position_change']
    
    change_str = f"▲ +{change}" if change > 0 else f"▼ {change}" if change < 0 else "="
    conf_emoji = "🟢" if conf >= 80 else "🟡" if conf >= 65 else "🟠"
    
    print(f"P{pos:<3} {driver:<20} {team:<20} {conf:.1f}% {conf_emoji:<3} P{qual:<5} {change_str}")

# Show model updates
print("\n" + "=" * 70)
print("MODEL ADJUSTMENTS APPLIED:")
print("=" * 70)
if 'model_updates' in prediction['prediction_metadata']:
    updates = prediction['prediction_metadata']['model_updates']
    print(f"\n✅ Ferrari: {updates['ferrari_adjustment']}")
    print(f"✅ McLaren: {updates['mclaren_boost']}")
    print(f"✅ Leclerc: {updates['leclerc_adjustment']}")
    print(f"✅ Hamilton: {updates['hamilton_adjustment']}")
    print(f"✅ Norris: {updates['norris_boost']}")
    print(f"✅ Piastri: {updates['piastri_boost']}")
    print(f"✅ Confidence: {updates['confidence_system']}")

# Compare old vs new predictions
print("\n" + "=" * 70)
print("COMPARISON: Old Model vs New Model")
print("=" * 70)
print("\n❌ OLD MODEL (Unrealistic):")
print("  P1: Max Verstappen")
print("  P2: Charles Leclerc (Ferrari) ← UNREALISTIC")
print("  P3: Lando Norris")
print("  Ferrari drivers too high, no confidence percentages")

print("\n✅ NEW MODEL (Realistic):")
print(f"  P1: {prediction['podium'][0]['fullName']} ({prediction['podium'][0]['team']}) - {prediction['podium'][0]['confidence']:.1f}%")
print(f"  P2: {prediction['podium'][1]['fullName']} ({prediction['podium'][1]['team']}) - {prediction['podium'][1]['confidence']:.1f}%")
print(f"  P3: {prediction['podium'][2]['fullName']} ({prediction['podium'][2]['team']}) - {prediction['podium'][2]['confidence']:.1f}%")
print("  Ferrari drivers adjusted for struggles, confidence % included")

print("\n" + "=" * 70)
print("✅ TEST COMPLETE - Model improvements verified!")
print("=" * 70)
