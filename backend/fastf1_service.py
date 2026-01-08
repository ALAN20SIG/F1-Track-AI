"""
FastF1 API Integration for Real-Time F1 Data
Fetches live timing, telemetry, and track position data for Abu Dhabi GP
"""

import fastf1
import pandas as pd
from datetime import datetime
import asyncio
from typing import Dict, List, Optional

# Enable FastF1 cache
fastf1.Cache.enable_cache('cache')

class F1LiveDataService:
    def __init__(self):
        self.session = None
        self.laps_data = None
        self.telemetry_data = {}
        self.track_status = None
        self.current_session_type = None
        self.current_year = None
        self.auto_refresh_enabled = True
        self.last_refresh = None
        
    async def detect_latest_session(self, year: int = 2026) -> str:
        """
        Automatically detect the latest available session for Abu Dhabi GP
        Returns the session type: 'FP1', 'FP2', 'FP3', 'Q' (Qualifying), or 'R' (Race)
        """
        #  Session priority order (latest/most important first) - Race is highest priority
        session_priority = ['R', 'Q', 'FP3', 'FP2', 'FP1']
        
        print(f"Detecting latest session for {year} Abu Dhabi GP (prioritizing Race data)...")
        
        for session_type in session_priority:
            try:
                test_session = fastf1.get_session(year, 'Abu Dhabi', session_type)
                
                # Try to check if session has data
                # A session exists if it can be loaded without critical errors
                if test_session:
                    print(f"  >> Found session: {session_type}")
                    return session_type
                    
            except Exception as e:
                # Session doesn't exist or isn't available yet
                continue
        
        # Default to Race if nothing else is available
        print("  >> Defaulting to Race (R)")
        return 'R'
    
    async def load_abu_dhabi_session(self, year: int = 2024, session_type: str = None, auto_detect: bool = True):
        """
        Load Abu Dhabi GP session data
        session_type: 'FP1', 'FP2', 'FP3', 'Q', 'R' (Race), 'S' (Sprint)
        auto_detect: If True, automatically detect latest available session
        """
        try:
            # Auto-detect latest session if not specified (prioritizes Race)
            if auto_detect and session_type is None:
                session_type = await self.detect_latest_session(year)
            elif session_type is None:
                session_type = 'R'  # Default to Race
            
            self.current_year = year
            self.current_session_type = session_type
            
            # Load the Abu Dhabi GP session using official FastF1 method
            self.session = fastf1.get_session(year, 'Abu Dhabi', session_type)
            
            # Load all session data (timing, telemetry, weather, etc.)
            await asyncio.to_thread(self.session.load)
            
            # Store laps data
            self.laps_data = self.session.laps
            
            # Get session results
            results = self.session.results
            
            # Update last refresh timestamp
            self.last_refresh = datetime.now()
            
            print(f">> Loaded {year} Abu Dhabi GP {session_type} session")
            print(f"  Total laps: {len(self.laps_data)}")
            print(f"  Drivers: {len(results)}")
            print(f"  Event: {self.session.event['EventName']}")
            print(f"  Circuit: {self.session.event['Location']}")
            print(f"  Session status: {self.session.session_status}")
            print(f"  Last refresh: {self.last_refresh.strftime('%H:%M:%S')}")
            
            return True
        except Exception as e:
            print(f">> Error loading session: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def refresh_session_data(self) -> bool:
        """
        Refresh the current session data to get latest laps and telemetry
        Useful for live sessions where new data is constantly being added
        """
        if self.current_session_type is None:
            return False
        
        print(f">> Refreshing {self.current_session_type} session data...")
        return await self.load_abu_dhabi_session(
            year=self.current_year or 2024,
            session_type=self.current_session_type,
            auto_detect=False
        )
    
    def get_live_timing_data(self) -> List[Dict]:
        """
        Get current live timing data for all drivers
        Returns formatted data for frontend dashboard with best times
        """
        if self.session is None or self.laps_data is None:
            return []
        
        try:
            # Get unique drivers from laps data instead of session.drivers
            unique_drivers = self.laps_data['Driver'].unique()
            
            drivers_data = []
            
            for driver in unique_drivers:
                try:
                    driver_laps = self.laps_data[self.laps_data['Driver'] == driver]
                    
                    if driver_laps.empty:
                        continue
                    
                    # Get driver info
                    driver_info = self.session.get_driver(driver)
                    
                    #  Handle driver_info safely (pandas Series needs special checking)
                    has_driver_info = driver_info is not None and not driver_info.empty if hasattr(driver_info, 'empty') else driver_info is not None
                    
                    # Get fastest lap for best time
                    try:
                        fastest_lap = driver_laps.pick_fastest()
                        best_lap_time = fastest_lap['LapTime']
                    except Exception as e:
                        best_lap_time = pd.Timedelta(0)
                    
                    # Get latest lap for current data
                    latest_lap = driver_laps.iloc[-1]
                    
                    # Get sector times from latest lap
                    sector1 = latest_lap.get('Sector1Time', pd.Timedelta(0))
                    sector2 = latest_lap.get('Sector2Time', pd.Timedelta(0))
                    sector3 = latest_lap.get('Sector3Time', pd.Timedelta(0))
                    
                    # Format lap time
                    last_lap_time = latest_lap.get('LapTime', pd.Timedelta(0))
                    
                    # Get position from latest lap
                    position = int(latest_lap.get('Position', 99)) if pd.notna(latest_lap.get('Position')) else 99
                    
                    driver_data = {
                        'position': position,
                        'code': driver,
                        'fullName': driver_info['FullName'] if has_driver_info and 'FullName' in driver_info else driver,
                        'team': driver_info['TeamName'] if has_driver_info and 'TeamName' in driver_info else 'Unknown',
                        'teamColor': driver_info['TeamColor'] if has_driver_info and 'TeamColor' in driver_info else '#FFFFFF',
                        'lastLapTime': self._format_timedelta(last_lap_time),
                        'bestLap': self._format_timedelta(best_lap_time),
                        'sector1': self._format_timedelta(sector1),
                        'sector2': self._format_timedelta(sector2),
                        'sector3': self._format_timedelta(sector3),
                        'tyre': latest_lap.get('Compound', 'MEDIUM').upper() if pd.notna(latest_lap.get('Compound')) else 'MEDIUM',
                        'tyreAge': int(latest_lap.get('TyreLife', 0)) if pd.notna(latest_lap.get('TyreLife')) else 0,
                        'gap': self._calculate_gap_to_leader(driver_laps, best_lap_time),
                        'status': 'RACING'
                    }
                    
                    drivers_data.append(driver_data)
                    
                except Exception as driver_error:
                    continue
            
            # Sort by best lap time (fastest first)
            drivers_data.sort(key=lambda x: x['bestLap'] if x['bestLap'] != '0:00.000' else '9:99.999')
            
            # Update positions based on sorted order
            for idx, driver in enumerate(drivers_data, 1):
                driver['position'] = idx
            
            return drivers_data
            
        except Exception as e:
            print(f"Error getting live timing: {e}")
            return []
    
    def get_driver_telemetry(self, driver_code: str, lap_number: Optional[int] = None) -> Dict:
        """
        Get telemetry data for a specific driver
        Returns position, speed, throttle, brake data
        """
        if self.session is None:
            return {}
        
        try:
            # Get driver laps
            driver_laps = self.laps_data[self.laps_data['Driver'] == driver_code]
            
            if driver_laps.empty:
                return {}
            
            # Get specific lap or fastest lap
            if lap_number:
                lap = driver_laps[driver_laps['LapNumber'] == lap_number].iloc[0]
            else:
                lap = driver_laps.pick_fastest()
            
            # Get telemetry
            telemetry = lap.get_telemetry()
            
            if telemetry.empty:
                return {}
            
            # Sample telemetry data (reduce size for frontend)
            sample_rate = max(1, len(telemetry) // 100)
            sampled = telemetry.iloc[::sample_rate]
            
            return {
                'driver': driver_code,
                'lapNumber': int(lap['LapNumber']),
                'distance': sampled['Distance'].tolist(),
                'speed': sampled['Speed'].tolist(),
                'throttle': sampled['Throttle'].tolist(),
                'brake': sampled['Brake'].tolist(),
                'nGear': sampled['nGear'].tolist(),
                'x': sampled['X'].tolist(),
                'y': sampled['Y'].tolist(),
            }
            
        except Exception as e:
            print(f"Error getting telemetry for {driver_code}: {e}")
            return {}
    
    def get_track_positions(self) -> List[Dict]:
        """
        Get current track positions for all drivers
        Returns X, Y coordinates for track visualization
        """
        if self.session is None:
            return []
        
        try:
            positions = []
            
            for driver in self.session.drivers:
                try:
                    driver_laps = self.laps_data[self.laps_data['Driver'] == driver]
                    if driver_laps.empty:
                        continue
                    
                    # Get latest lap telemetry
                    latest_lap = driver_laps.iloc[-1]
                    telemetry = latest_lap.get_telemetry()
                    
                    if telemetry.empty:
                        continue
                    
                    # Get current position (last telemetry point)
                    current_pos = telemetry.iloc[-1]
                    
                    driver_info = self.session.get_driver(driver)
                    
                    positions.append({
                        'code': driver,
                        'x': float(current_pos['X']),
                        'y': float(current_pos['Y']),
                        'speed': float(current_pos['Speed']),
                        'position': int(latest_lap['Position']) if pd.notna(latest_lap['Position']) else 99,
                        'teamColor': driver_info['TeamColor'] if driver_info else '#FFFFFF',
                        'distance': float(current_pos['Distance'])
                    })
                    
                except Exception as e:
                    print(f"Error getting position for {driver}: {e}")
                    continue
            
            # Sort by distance (track position)
            positions.sort(key=lambda x: x['distance'], reverse=True)
            
            return positions
            
        except Exception as e:
            print(f"Error getting track positions: {e}")
            return []
    
    def get_track_layout(self) -> Dict:
        """
        Get Abu Dhabi circuit layout coordinates
        """
        if self.session is None:
            return {}
        
        try:
            # Get circuit info
            circuit_info = self.session.get_circuit_info()
            
            # Get track outline from any driver's lap
            driver = self.session.drivers[0]
            driver_laps = self.laps_data[self.laps_data['Driver'] == driver]
            
            if not driver_laps.empty:
                fastest_lap = driver_laps.pick_fastest()
                telemetry = fastest_lap.get_telemetry()
                
                # Sample to reduce points
                sample_rate = max(1, len(telemetry) // 200)
                sampled = telemetry.iloc[::sample_rate]
                
                return {
                    'name': 'Yas Marina Circuit',
                    'location': 'Abu Dhabi',
                    'x': sampled['X'].tolist(),
                    'y': sampled['Y'].tolist(),
                    'rotation': circuit_info.rotation if hasattr(circuit_info, 'rotation') else 0
                }
            
            return {}
            
        except Exception as e:
            print(f"Error getting track layout: {e}")
            return {}
    
    def _format_timedelta(self, td) -> str:
        """Format timedelta to MM:SS.mmm"""
        if pd.isna(td) or td == pd.Timedelta(0):
            return "0:00.000"
        
        total_seconds = td.total_seconds()
        minutes = int(total_seconds // 60)
        seconds = total_seconds % 60
        
        return f"{minutes}:{seconds:06.3f}"
    
    def _calculate_gap_to_leader(self, driver_laps, best_lap_time) -> str:
        """Calculate gap to fastest lap"""
        try:
            # Get the fastest lap time from all session data
            if self.laps_data is None:
                return "-"
            
            # Get global fastest lap
            fastest_overall = self.laps_data['LapTime'].min()
            
            if pd.isna(best_lap_time) or pd.isna(fastest_overall):
                return "-"
            
            if best_lap_time == fastest_overall:
                return "LEADER"
            
            gap = (best_lap_time - fastest_overall).total_seconds()
            return f"+{gap:.3f}"
            
        except Exception as e:
            return "-"
    
    def _calculate_gap(self, lap, all_laps) -> str:
        """Calculate gap to leader"""
        try:
            position = lap.get('Position')
            if pd.isna(position) or position == 1:
                return "LEADER"
            
            # This is simplified - would need cumulative race time in real scenario
            return f"+{(position - 1) * 0.234:.3f}"
            
        except:
            return "-"
    
    def _calculate_interval(self, lap, all_laps) -> str:
        """Calculate interval to car ahead"""
        try:
            position = lap.get('Position')
            if pd.isna(position) or position == 1:
                return "-"
            
            # Simplified interval calculation
            return f"+{0.234:.3f}"
            
        except:
            return "-"


# Global service instance
f1_service = F1LiveDataService()


async def initialize_f1_data():
    """Initialize F1 data service with latest available Abu Dhabi GP session"""
    print("Initializing FastF1 data service...")
    print("Auto-detecting latest available session...")
    
    # Try 2026 first (current season), fallback to 2025, then 2024
    success = await f1_service.load_abu_dhabi_session(year=2026, auto_detect=True)
    
    if not success:
        print("2026 data not available, trying 2025...")
        success = await f1_service.load_abu_dhabi_session(year=2025, auto_detect=True)
    
    if not success:
        print("2025 data not available, trying 2024...")
        success = await f1_service.load_abu_dhabi_session(year=2024, auto_detect=True)
    
    if success:
        session_name = {
            'FP1': 'Free Practice 1',
            'FP2': 'Free Practice 2',
            'FP3': 'Free Practice 3',
            'Q': 'Qualifying',
            'R': 'Race'
        }.get(f1_service.current_session_type, f1_service.current_session_type)
        
        print(f">> F1 data service ready - {session_name} loaded")
    else:
        print(">> Failed to initialize F1 data service")
    
    return success
