"""Quick training script for testing - uses 500 samples instead of 10000"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from race_prediction_model import AbuDhabiRacePredictionModel
import numpy as np

print("="*60)
print("Quick Training Abu Dhabi GP Predictor (500 samples)")
print("="*60)

# Create model instance
predictor = AbuDhabiRacePredictionModel()

# Override generate_training_data to use fewer samples
original_method = predictor.generate_training_data

def quick_generate_training_data():
    """Generate only 500 samples for quick training"""
    import numpy as np
    training_samples = []
    training_labels = []
    
    np.random.seed(42)
    drivers = list(predictor.driver_skills.keys())
    
    # Generate only 25 races instead of 500
    for race_scenario in range(25):
        track_temp = np.random.uniform(25, 45)
        air_temp = np.random.uniform(20, 35)
        
        race_results = []
        
        for driver in drivers:
            skill = predictor.driver_skills[driver]
            abu_dhabi_perf = predictor.abu_dhabi_history[driver]
            
            qual_position = max(1, min(20, int(np.random.normal(
                loc=21 - (skill / 5),
                scale=3
            ))))
            
            season_points = np.random.normal(loc=skill * 3, scale=50)
            
            team = predictor._get_driver_team(driver)
            team_rating = predictor.team_ratings.get(team, 70)
            reliability = predictor.reliability_index.get(team, 75)
            
            grid_pos = qual_position + np.random.choice([0, 0, 0, 5], p=[0.8, 0.1, 0.05, 0.05])
            pit_efficiency = team_rating * 0.9 + np.random.normal(0, 5)
            tyre_deg = np.random.uniform(0.6, 1.2)
            recent_form = skill + np.random.normal(0, 10)
            
            performance_score = (
                skill * 0.3 +
                (21 - qual_position) * 2 +
                (21 - abu_dhabi_perf) * 3 +
                team_rating * 0.2 +
                reliability * 0.1 +
                pit_efficiency * 0.05 +
                (2 - tyre_deg) * 5 +
                recent_form * 0.1 +
                np.random.normal(0, 10)
            )
            
            race_results.append({
                'driver': driver,
                'performance_score': performance_score,
                'features': [
                    skill, qual_position, abu_dhabi_perf, season_points,
                    team_rating, reliability, track_temp, air_temp,
                    grid_pos, pit_efficiency, tyre_deg, recent_form
                ]
            })
        
        race_results.sort(key=lambda x: x['performance_score'], reverse=True)
        
        for position, result in enumerate(race_results, 1):
            training_samples.append(result['features'])
            training_labels.append(position)
    
    return np.array(training_samples), np.array(training_labels)

# Replace method temporarily
predictor.generate_training_data = quick_generate_training_data

# Train
metrics = predictor.train_model()

# Save
predictor.save_model('abu_dhabi_race_predictor.pkl')

print("\n" + "="*60)
print("QUICK TRAINING COMPLETE!")
print("="*60)
print(f"Accuracy: {metrics['overall_accuracy']}%")
print(f"MAE: {metrics['mean_absolute_error']} positions")
print(f"Podium Accuracy: {metrics['top3_podium_accuracy']}%")
print("="*60)
print("\nModel saved! Use POST /api/race/train for full training.")
