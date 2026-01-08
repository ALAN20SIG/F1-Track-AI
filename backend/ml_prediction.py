"""
F1 Race Winner Prediction ML Model
Uses FastF1 API data to train and predict race outcomes
"""

import fastf1
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Enable FastF1 cache
fastf1.Cache.enable_cache('cache')

class F1PredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.driver_encoder = LabelEncoder()
        self.team_encoder = LabelEncoder()
        self.feature_columns = []
        self.model_path = 'models/f1_race_winner_model.pkl'
        
    def collect_training_data(self, years, races_per_year=None):
        """
        Collect training data from multiple seasons
        Args:
            years: List of years to collect data from
            races_per_year: Number of races per year (None = all races)
        """
        all_race_data = []
        
        for year in years:
            print(f"\n📊 Collecting data from {year} season...")
            
            try:
                schedule = fastf1.get_event_schedule(year)
                race_rounds = schedule[schedule['EventFormat'] != 'testing']
                
                if races_per_year:
                    race_rounds = race_rounds.head(races_per_year)
                
                for idx, event in race_rounds.iterrows():
                    try:
                        print(f"  Loading: {event['EventName']}")
                        session = fastf1.get_session(year, event['RoundNumber'], 'R')
                        session.load()
                        
                        # Extract features from this race
                        race_features = self._extract_race_features(session, event)
                        
                        if race_features:
                            all_race_data.extend(race_features)
                            print(f"    ✓ Extracted {len(race_features)} driver records")
                        
                    except Exception as e:
                        print(f"    ✗ Error loading {event['EventName']}: {e}")
                        continue
                        
            except Exception as e:
                print(f"✗ Error loading {year} schedule: {e}")
                continue
        
        print(f"\n✓ Total training samples collected: {len(all_race_data)}")
        return pd.DataFrame(all_race_data)
    
    def _extract_race_features(self, session, event):
        """Extract features from a race session"""
        race_data = []
        
        try:
            results = session.results
            laps = session.laps
            weather = session.weather_data
            
            for idx, driver_result in results.iterrows():
                try:
                    driver_number = driver_result['DriverNumber']
                    driver_abbr = driver_result['Abbreviation']
                    
                    # Get driver laps
                    driver_laps = laps[laps['DriverNumber'] == driver_number]
                    
                    if driver_laps.empty:
                        continue
                    
                    # Calculate features
                    features = {
                        # Race metadata
                        'year': session.event['EventDate'].year,
                        'round': event['RoundNumber'],
                        'circuit': event['Location'],
                        
                        # Driver info
                        'driver': driver_abbr,
                        'team': driver_result['TeamName'],
                        'grid_position': driver_result['GridPosition'],
                        'starting_position': driver_result['GridPosition'],
                        
                        # Qualifying performance
                        'q1_time': self._time_to_seconds(driver_result.get('Q1', pd.NaT)),
                        'q2_time': self._time_to_seconds(driver_result.get('Q2', pd.NaT)),
                        'q3_time': self._time_to_seconds(driver_result.get('Q3', pd.NaT)),
                        
                        # Lap statistics
                        'total_laps': len(driver_laps),
                        'avg_lap_time': driver_laps['LapTime'].mean().total_seconds() if len(driver_laps) > 0 else np.nan,
                        'fastest_lap': driver_laps['LapTime'].min().total_seconds() if len(driver_laps) > 0 else np.nan,
                        'lap_time_std': driver_laps['LapTime'].std().total_seconds() if len(driver_laps) > 1 else 0,
                        
                        # Pit stops
                        'pit_stops': driver_result.get('PitStops', 0) if pd.notna(driver_result.get('PitStops')) else 0,
                        
                        # Position changes
                        'positions_gained': driver_result['GridPosition'] - driver_result['Position'] if pd.notna(driver_result['GridPosition']) else 0,
                        
                        # Tyre strategy
                        'compound_changes': len(driver_laps['Compound'].unique()) if 'Compound' in driver_laps.columns else 1,
                        
                        # Weather (average)
                        'avg_air_temp': weather['AirTemp'].mean() if not weather.empty else 20,
                        'avg_track_temp': weather['TrackTemp'].mean() if not weather.empty else 30,
                        'avg_humidity': weather['Humidity'].mean() if not weather.empty else 50,
                        
                        # Target variable (1 if won, 0 otherwise)
                        'won_race': 1 if driver_result['Position'] == 1 else 0,
                        'final_position': driver_result['Position'],
                        'podium': 1 if driver_result['Position'] <= 3 else 0,
                    }
                    
                    race_data.append(features)
                    
                except Exception as e:
                    print(f"      Error extracting driver {driver_abbr}: {e}")
                    continue
            
            return race_data
            
        except Exception as e:
            print(f"    Error extracting race features: {e}")
            return []
    
    def _time_to_seconds(self, time_value):
        """Convert time to seconds"""
        if pd.isna(time_value):
            return np.nan
        if isinstance(time_value, pd.Timedelta):
            return time_value.total_seconds()
        return 0
    
    def prepare_features(self, df):
        """Prepare features for training"""
        # Create a copy
        data = df.copy()
        
        # Fill missing values
        data = data.fillna({
            'q1_time': data['q1_time'].median(),
            'q2_time': data['q2_time'].median(),
            'q3_time': data['q3_time'].median(),
            'avg_lap_time': data['avg_lap_time'].median(),
            'fastest_lap': data['fastest_lap'].median(),
            'lap_time_std': 0,
            'pit_stops': data['pit_stops'].median(),
            'positions_gained': 0,
        })
        
        # Encode categorical variables
        if 'driver' in data.columns:
            data['driver_encoded'] = self.driver_encoder.fit_transform(data['driver'])
        if 'team' in data.columns:
            data['team_encoded'] = self.team_encoder.fit_transform(data['team'])
        
        # Select feature columns
        self.feature_columns = [
            'grid_position', 'starting_position',
            'q1_time', 'q2_time', 'q3_time',
            'avg_lap_time', 'fastest_lap', 'lap_time_std',
            'pit_stops', 'positions_gained', 'compound_changes',
            'avg_air_temp', 'avg_track_temp', 'avg_humidity',
            'driver_encoded', 'team_encoded'
        ]
        
        # Filter to existing columns
        self.feature_columns = [col for col in self.feature_columns if col in data.columns]
        
        return data
    
    def train_model(self, df, target='won_race'):
        """Train the prediction model"""
        print("\n🤖 Training ML Model...")
        
        # Prepare features
        data = self.prepare_features(df)
        
        # Separate features and target
        X = data[self.feature_columns]
        y = data[target]
        
        print(f"  Features: {len(self.feature_columns)}")
        print(f"  Samples: {len(X)}")
        print(f"  Winners: {y.sum()}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model (Random Forest + Gradient Boosting ensemble)
        print("\n  Training Random Forest...")
        rf_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        rf_model.fit(X_train_scaled, y_train)
        
        print("  Training Gradient Boosting...")
        gb_model = GradientBoostingClassifier(
            n_estimators=150,
            max_depth=10,
            learning_rate=0.1,
            random_state=42
        )
        gb_model.fit(X_train_scaled, y_train)
        
        # Ensemble prediction
        rf_pred = rf_model.predict_proba(X_test_scaled)[:, 1]
        gb_pred = gb_model.predict_proba(X_test_scaled)[:, 1]
        ensemble_pred = (rf_pred + gb_pred) / 2
        final_pred = (ensemble_pred > 0.5).astype(int)
        
        # Evaluate
        accuracy = accuracy_score(y_test, final_pred)
        print(f"\n  ✓ Model Accuracy: {accuracy:.2%}")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': rf_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\n  Top 5 Important Features:")
        for idx, row in feature_importance.head(5).iterrows():
            print(f"    {row['feature']}: {row['importance']:.4f}")
        
        # Store both models
        self.model = {
            'rf': rf_model,
            'gb': gb_model
        }
        
        return accuracy
    
    def predict_race_winner(self, race_data_df):
        """Predict race winner from race data"""
        if self.model is None:
            raise ValueError("Model not trained yet!")
        
        # Prepare features
        data = self.prepare_features(race_data_df)
        X = data[self.feature_columns]
        X_scaled = self.scaler.transform(X)
        
        # Get predictions from both models
        rf_proba = self.model['rf'].predict_proba(X_scaled)[:, 1]
        gb_proba = self.model['gb'].predict_proba(X_scaled)[:, 1]
        
        # Ensemble
        win_probability = (rf_proba + gb_proba) / 2
        
        # Create results dataframe
        results = race_data_df.copy()
        results['win_probability'] = win_probability
        results = results.sort_values('win_probability', ascending=False)
        
        return results[['driver', 'team', 'win_probability', 'grid_position']]
    
    def save_model(self):
        """Save trained model to disk"""
        os.makedirs('models', exist_ok=True)
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'driver_encoder': self.driver_encoder,
            'team_encoder': self.team_encoder,
            'feature_columns': self.feature_columns,
            'trained_at': datetime.now().isoformat()
        }
        
        joblib.dump(model_data, self.model_path)
        print(f"\n💾 Model saved to {self.model_path}")
    
    def load_model(self):
        """Load trained model from disk"""
        if os.path.exists(self.model_path):
            model_data = joblib.load(self.model_path)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.driver_encoder = model_data['driver_encoder']
            self.team_encoder = model_data['team_encoder']
            self.feature_columns = model_data['feature_columns']
            print(f"✓ Model loaded from {self.model_path}")
            print(f"  Trained at: {model_data['trained_at']}")
            return True
        return False


def train_f1_prediction_model():
    """Main training function"""
    print("=" * 70)
    print("F1 RACE WINNER PREDICTION - MODEL TRAINING (2024-2025 DATA)")
    print("=" * 70)
    
    model = F1PredictionModel()
    
    # Collect training data from 2024-2025 seasons only
    years = [2024, 2025]
    print(f"\nCollecting data from seasons: {years}")
    
    training_data = model.collect_training_data(years, races_per_year=None)
    
    if len(training_data) == 0:
        print("✗ No training data collected!")
        return None
    
    # Save raw data
    training_data.to_csv('models/training_data.csv', index=False)
    print(f"\n💾 Training data saved to models/training_data.csv")
    
    # Train model
    accuracy = model.train_model(training_data, target='won_race')
    
    # Save model
    model.save_model()
    
    print("\n" + "=" * 70)
    print(f"✓ TRAINING COMPLETE - Accuracy: {accuracy:.2%}")
    print("=" * 70)
    
    return model


if __name__ == "__main__":
    # Train the model
    model = train_f1_prediction_model()
