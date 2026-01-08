from race_prediction_model import race_predictor

print("Training Abu Dhabi 2025 GP race prediction model...")
metrics = race_predictor.train_model()
race_predictor.save_model('abu_dhabi_race_predictor.pkl')

print("\n" + "="*60)
print("TRAINING COMPLETE!")
print("="*60)
print(f"Overall Accuracy: {metrics['overall_accuracy']}%")
print(f"Mean Absolute Error: {metrics['mean_absolute_error']} positions")
print(f"Podium Accuracy: {metrics['top3_podium_accuracy']}%")
print("="*60)
