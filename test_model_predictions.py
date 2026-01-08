"""
Quick test to verify model predictions after retraining
"""
import sys
import time
sys.path.insert(0, 'c:/Users/sandr/Untitled Folder/backend')

print("=" * 70)
print("TESTING UPDATED RACE PREDICTION MODEL")
print("=" * 70)

# Wait for training to complete
print("\nWaiting for model training to complete...")
time.sleep(5)

from race_prediction_model import race_predictor

# Try to load the newly trained model
print("\nLoading freshly trained model...")
success = race_predictor.load_model("c:/Users/sandr/Untitled Folder/backend/abu_dhabi_race_predictor.pkl")

if not success:
    print("❌ Model file not found! Training may still be in progress.")
    print("Please wait for training to complete and run this script again.")
    sys.exit(1)

print("✅ Model loaded successfully!")

# Check team ratings
print("\n" + "=" * 70)
print("TEAM RATINGS IN LOADED MODEL:")
print("=" * 70)
print(f"Ferrari: {race_predictor.team_ratings.get('Ferrari', 'N/A')}")
print(f"McLaren: {race_predictor.team_ratings.get('McLaren', 'N/A')}")
print(f"Mercedes: {race_predictor.team_ratings.get('Mercedes', 'N/A')}")
print(f"Red Bull Racing: {race_predictor.team_ratings.get('Red Bull Racing', 'N/A')}")

# Check driver skills  
print("\n" + "=" * 70)
print("DRIVER SKILL RATINGS IN LOADED MODEL:")
print("=" * 70)
print(f"Leclerc (LEC): {race_predictor.driver_skills.get('LEC', 'N/A')}")
print(f"Hamilton (HAM): {race_predictor.driver_skills.get('HAM', 'N/A')}")
print(f"Norris (NOR): {race_predictor.driver_skills.get('NOR', 'N/A')}")
print(f"Piastri (PIA): {race_predictor.driver_skills.get('PIA', 'N/A')}")
print(f"Verstappen (VER): {race_predictor.driver_skills.get('VER', 'N/A')}")

# Test weather data
weather_data = {
    'track_temp': 42.0,
    'air_temp': 28.0,
    'humidity': 35,
    'wind_speed': 3.2
}

# Test qualifying (realistic grid based on current form)
qualifying_results = [
    {'code': 'NOR', 'position': 1},   # Norris pole (McLaren strong)
    {'code': 'VER', 'position': 2},   # Verstappen P2
    {'code': 'PIA', 'position': 3},   # Piastri P3 (McLaren)
    {'code': 'LEC', 'position': 4},   # Leclerc P4 (Ferrari)
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

print("\n" + "=" * 70)
print("GENERATING PREDICTIONS WITH UPDATED MODEL")
print("=" * 70)

try:
    prediction = race_predictor.get_podium_prediction(weather_data, qualifying_results)
    
    print("\n🏆 PREDICTED PODIUM:")
    print("-" * 70)
    for pred in prediction['podium']:
        print(f"{pred['position']}. {pred['fullName']:20s} ({pred['team']})")
        print(f"   Confidence: {pred['confidence']:.1f}%")
        print(f"   Grid: P{pred['qualifying_position']}  →  Predicted: P{pred['position']}")
        if 'position_change' in pred:
            change = pred['position_change']
            if change > 0:
                print(f"   ▲ Gains {change} position(s)")
            elif change < 0:
                print(f"   ▼ Loses {abs(change)} position(s)")
        print()
    
    print("\n📊 FULL TOP 10:")
    print("-" * 70)
    for idx, pred in enumerate(prediction['full_predictions'][:10], 1):
        conf = pred.get('confidence_percentage', pred.get('confidence', 0))
        print(f"P{idx:<2} {pred['driver']:4s} {pred['fullName']:20s} "
              f"({pred['team']:<20s}) - {conf:.1f}%")
    
    # Check if Leclerc is still P2
    leclerc_pred = next((p for p in prediction['full_predictions'] if p['driver'] == 'LEC'), None)
    if leclerc_pred:
        print("\n" + "=" * 70)
        print(f"🔍 LECLERC ANALYSIS:")
        print("=" * 70)
        print(f"Predicted Position: P{leclerc_pred['predicted_position']}")
        print(f"Confidence: {leclerc_pred.get('confidence_percentage', leclerc_pred.get('confidence', 0)):.1f}%")
        print(f"Skill Rating: {leclerc_pred['skill_rating']}")
        print(f"Team (Ferrari) Rating: {race_predictor.team_ratings.get('Ferrari')}")
        
        if leclerc_pred['predicted_position'] == 2:
            print("\n❌ PROBLEM: Leclerc still predicted P2!")
            print("   This is unrealistic given Ferrari's struggles.")
        elif leclerc_pred['predicted_position'] >= 5:
            print("\n✅ FIXED: Leclerc now realistically predicted P5+")
        else:
            print(f"\n⚠️  Leclerc predicted P{leclerc_pred['predicted_position']} (borderline)")
    
    # Check confidence percentages
    print("\n" + "=" * 70)
    print("🔍 CONFIDENCE PERCENTAGE CHECK:")
    print("=" * 70)
    
    all_have_conf = all(
        'confidence_percentage' in p or 'confidence' in p 
        for p in prediction['full_predictions']
    )
    
    if all_have_conf:
        print("✅ All predictions have confidence percentages!")
        
        # Show confidence distribution
        high_conf = sum(1 for p in prediction['full_predictions'] 
                       if (p.get('confidence_percentage', p.get('confidence', 0))) >= 70)
        med_conf = sum(1 for p in prediction['full_predictions'] 
                      if 50 <= (p.get('confidence_percentage', p.get('confidence', 0))) < 70)
        low_conf = sum(1 for p in prediction['full_predictions'] 
                      if (p.get('confidence_percentage', p.get('confidence', 0))) < 50)
        
        print(f"   High confidence (≥70%): {high_conf} drivers")
        print(f"   Medium confidence (50-69%): {med_conf} drivers")
        print(f"   Low confidence (<50%): {low_conf} drivers")
    else:
        print("❌ Some predictions missing confidence percentages!")
        missing = [p['driver'] for p in prediction['full_predictions'] 
                  if 'confidence_percentage' not in p and 'confidence' not in p]
        print(f"   Missing for: {', '.join(missing)}")

except Exception as e:
    print(f"\n❌ ERROR generating predictions: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)
