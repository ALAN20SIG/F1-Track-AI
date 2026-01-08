"""Quick test to train the model and diagnose issues"""
import sys
print("Starting model training test...")
sys.stdout.flush()

from race_prediction_model import train_abu_dhabi_predictor

print("Imported successfully, starting training...")
sys.stdout.flush()

try:
    metrics = train_abu_dhabi_predictor()
    print("\n✓ Training completed successfully!")
    print(f"Metrics: {metrics}")
except Exception as e:
    print(f"\n✗ Training failed: {e}")
    import traceback
    traceback.print_exc()
