"""
Abu Dhabi 2025 GP Database Storage System
Optimized SQLite database for fast retrieval of all race data
"""

import sqlite3
import json
import pickle
from datetime import datetime
from pathlib import Path
import pandas as pd
from typing import Dict, List, Optional, Any


class AbuDhabiGPDatabase:
    """
    High-performance database for Abu Dhabi 2025 GP data
    Stores telemetry, lap times, weather, strategy, and position data
    """
    
    def __init__(self, db_path: str = "abu_dhabi_2025_gp.db"):
        self.db_path = db_path
        self.conn = None
        self._initialize_database()
    
    def _initialize_database(self):
        """Create database tables with optimized indexes"""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row  # Dict-like access
        
        cursor = self.conn.cursor()
        
        # Drivers table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS drivers (
                driver_code TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                team_name TEXT NOT NULL,
                team_color TEXT NOT NULL,
                number INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Lap times table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS lap_times (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                driver_code TEXT NOT NULL,
                lap_number INTEGER NOT NULL,
                lap_time_seconds REAL NOT NULL,
                sector_1_seconds REAL,
                sector_2_seconds REAL,
                sector_3_seconds REAL,
                tire_compound TEXT,
                tire_age INTEGER,
                position INTEGER,
                is_personal_best BOOLEAN DEFAULT 0,
                FOREIGN KEY (driver_code) REFERENCES drivers(driver_code),
                UNIQUE(driver_code, lap_number)
            )
        ''')
        
        # Telemetry data table (sampled for performance)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                driver_code TEXT NOT NULL,
                lap_number INTEGER NOT NULL,
                distance REAL NOT NULL,
                speed REAL,
                throttle REAL,
                brake BOOLEAN,
                gear INTEGER,
                rpm INTEGER,
                drs INTEGER,
                FOREIGN KEY (driver_code) REFERENCES drivers(driver_code)
            )
        ''')
        
        # Weather data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS weather (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                air_temp REAL,
                track_temp REAL,
                humidity REAL,
                wind_speed REAL,
                wind_direction TEXT,
                conditions TEXT
            )
        ''')
        
        # Session info table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS session_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_type TEXT NOT NULL,
                year INTEGER NOT NULL,
                event_name TEXT NOT NULL,
                circuit_name TEXT NOT NULL,
                total_laps INTEGER,
                session_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Position tracking table (for track map)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                driver_code TEXT NOT NULL,
                lap_number INTEGER NOT NULL,
                position INTEGER NOT NULL,
                x_coordinate REAL,
                y_coordinate REAL,
                timestamp TIMESTAMP,
                FOREIGN KEY (driver_code) REFERENCES drivers(driver_code)
            )
        ''')
        
        # Strategy data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS strategies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                driver_code TEXT NOT NULL,
                pit_stop_lap INTEGER NOT NULL,
                tire_compound_before TEXT,
                tire_compound_after TEXT,
                pit_duration_seconds REAL,
                position_before INTEGER,
                position_after INTEGER,
                FOREIGN KEY (driver_code) REFERENCES drivers(driver_code)
            )
        ''')
        
        # Performance metrics cache
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS performance_metrics (
                driver_code TEXT PRIMARY KEY,
                avg_lap_time REAL,
                fastest_lap_time REAL,
                std_deviation REAL,
                total_laps INTEGER,
                avg_sector_1 REAL,
                avg_sector_2 REAL,
                avg_sector_3 REAL,
                top_speed REAL,
                avg_speed REAL,
                tire_management_score REAL,
                consistency_score REAL,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (driver_code) REFERENCES drivers(driver_code)
            )
        ''')
        
        # Create indexes for fast queries
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_lap_times_driver ON lap_times(driver_code)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_lap_times_lap ON lap_times(lap_number)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_telemetry_driver ON telemetry(driver_code)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_telemetry_lap ON telemetry(driver_code, lap_number)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_positions_driver ON positions(driver_code)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_positions_lap ON positions(lap_number)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_strategies_driver ON strategies(driver_code)')
        
        self.conn.commit()
        print(f"✓ Abu Dhabi GP database initialized: {self.db_path}")
    
    def import_from_fastf1(self, session, laps_data: pd.DataFrame):
        """Import data from FastF1 session into database"""
        cursor = self.conn.cursor()
        
        print("Importing FastF1 data to database...")
        
        # Import session info
        event_date = session.event.get('EventDate', pd.Timestamp.now())
        cursor.execute('''
            INSERT OR REPLACE INTO session_info 
            (session_type, year, event_name, circuit_name, total_laps, session_date)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            session.event.get('EventName', 'Unknown'),
            event_date.year if hasattr(event_date, 'year') else 2025,
            session.event.get('EventName', 'Unknown'),
            session.event.get('Location', 'Unknown'),
            len(laps_data),
            str(event_date) if hasattr(event_date, 'strftime') else str(event_date)
        ))
        
        # Import drivers
        unique_drivers = laps_data['Driver'].unique()
        for driver_code in unique_drivers:
            driver_info = session.get_driver(driver_code)
            if driver_info is not None:
                cursor.execute('''
                    INSERT OR REPLACE INTO drivers 
                    (driver_code, full_name, team_name, team_color, number)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    driver_code,
                    driver_info.get('FullName', driver_code),
                    driver_info.get('TeamName', 'Unknown'),
                    driver_info.get('TeamColor', 'FFFFFF'),
                    driver_info.get('DriverNumber', 0)
                ))
        
        # Import lap times with batch insert
        lap_records = []
        for _, lap in laps_data.iterrows():
            if pd.notna(lap.get('LapTime')):
                lap_records.append((
                    lap['Driver'],
                    int(lap['LapNumber']),
                    lap['LapTime'].total_seconds(),
                    lap.get('Sector1Time', pd.Timedelta(0)).total_seconds() if pd.notna(lap.get('Sector1Time')) else None,
                    lap.get('Sector2Time', pd.Timedelta(0)).total_seconds() if pd.notna(lap.get('Sector2Time')) else None,
                    lap.get('Sector3Time', pd.Timedelta(0)).total_seconds() if pd.notna(lap.get('Sector3Time')) else None,
                    lap.get('Compound', 'MEDIUM').upper() if pd.notna(lap.get('Compound')) else 'MEDIUM',
                    int(lap.get('TyreLife', 0)) if pd.notna(lap.get('TyreLife')) else 0,
                    int(lap.get('Position', 0)) if pd.notna(lap.get('Position')) else None,
                    lap.get('IsPersonalBest', 0)
                ))
        
        cursor.executemany('''
            INSERT OR REPLACE INTO lap_times 
            (driver_code, lap_number, lap_time_seconds, sector_1_seconds, sector_2_seconds, 
             sector_3_seconds, tire_compound, tire_age, position, is_personal_best)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', lap_records)
        
        # Calculate and cache performance metrics
        for driver_code in unique_drivers:
            driver_laps = laps_data[laps_data['Driver'] == driver_code]
            valid_laps = driver_laps[driver_laps['LapTime'].notna()]
            
            if not valid_laps.empty:
                lap_times = valid_laps['LapTime'].apply(lambda x: x.total_seconds())
                
                cursor.execute('''
                    INSERT OR REPLACE INTO performance_metrics
                    (driver_code, avg_lap_time, fastest_lap_time, std_deviation, total_laps,
                     avg_sector_1, avg_sector_2, avg_sector_3)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    driver_code,
                    lap_times.mean(),
                    lap_times.min(),
                    lap_times.std(),
                    len(valid_laps),
                    valid_laps['Sector1Time'].apply(lambda x: x.total_seconds() if pd.notna(x) else 0).mean(),
                    valid_laps['Sector2Time'].apply(lambda x: x.total_seconds() if pd.notna(x) else 0).mean(),
                    valid_laps['Sector3Time'].apply(lambda x: x.total_seconds() if pd.notna(x) else 0).mean()
                ))
        
        self.conn.commit()
        print(f"✓ Imported {len(lap_records)} lap records for {len(unique_drivers)} drivers")
        return len(lap_records)
    
    def get_driver_lap_times(self, driver_code: str) -> List[Dict]:
        """Fast retrieval of driver lap times"""
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT lap_number, lap_time_seconds, sector_1_seconds, sector_2_seconds, 
                   sector_3_seconds, tire_compound, tire_age, position
            FROM lap_times
            WHERE driver_code = ?
            ORDER BY lap_number
        ''', (driver_code,))
        
        return [dict(row) for row in cursor.fetchall()]
    
    def get_all_drivers(self) -> List[Dict]:
        """Get all drivers with team info"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT * FROM drivers ORDER BY driver_code')
        return [dict(row) for row in cursor.fetchall()]
    
    def get_performance_metrics(self, driver_code: str) -> Optional[Dict]:
        """Get cached performance metrics"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT * FROM performance_metrics WHERE driver_code = ?', (driver_code,))
        row = cursor.fetchone()
        return dict(row) if row else None
    
    def get_fastest_laps(self, limit: int = 20) -> List[Dict]:
        """Get fastest laps across all drivers"""
        cursor = self.conn.cursor()
        cursor.execute('''
            SELECT l.driver_code, d.full_name, d.team_name, l.lap_number, 
                   l.lap_time_seconds, l.tire_compound
            FROM lap_times l
            JOIN drivers d ON l.driver_code = d.driver_code
            ORDER BY l.lap_time_seconds ASC
            LIMIT ?
        ''', (limit,))
        return [dict(row) for row in cursor.fetchall()]
    
    def get_session_info(self) -> Optional[Dict]:
        """Get session information"""
        cursor = self.conn.cursor()
        cursor.execute('SELECT * FROM session_info ORDER BY id DESC LIMIT 1')
        row = cursor.fetchone()
        return dict(row) if row else None
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("✓ Database connection closed")


# Singleton instance
_db_instance = None

def get_database() -> AbuDhabiGPDatabase:
    """Get or create database instance"""
    global _db_instance
    if _db_instance is None:
        _db_instance = AbuDhabiGPDatabase()
    return _db_instance
