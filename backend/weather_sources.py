"""
Multi-source Weather API Integration with Integrity Testing
Supports: OpenWeatherMap, WeatherAPI, Visual Crossing, FastF1 session weather
"""

import httpx
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
from abc import ABC, abstractmethod


class WeatherSource(ABC):
    """Base class for weather API sources"""
    
    def __init__(self, name: str, priority: int = 5):
        self.name = name
        self.priority = priority
        self.response_time = 0.0
        self.success_rate = 1.0
        self.data_completeness = 1.0
        self.last_update = None
        self.error_count = 0
        self.total_requests = 0
    
    @abstractmethod
    async def fetch_weather(self, location: str) -> Dict:
        """Fetch weather data"""
        pass
    
    def calculate_integrity_score(self) -> float:
        """Calculate weather data integrity score (0-100)"""
        time_score = max(0, (5000 - self.response_time) / 5000) * 30
        success_score = self.success_rate * 40
        completeness_score = self.data_completeness * 30
        return round(time_score + success_score + completeness_score, 2)
    
    def update_stats(self, success: bool, response_time_ms: float, data_quality: float):
        """Update source statistics"""
        self.total_requests += 1
        self.response_time = response_time_ms
        self.data_completeness = data_quality
        
        if success:
            self.error_count = max(0, self.error_count - 1)
        else:
            self.error_count += 1
        
        self.success_rate = max(0, 1 - (self.error_count / max(10, self.total_requests)))
        self.last_update = datetime.now()


class OpenWeatherMapSource(WeatherSource):
    """OpenWeatherMap API"""
    
    def __init__(self, api_key: str = "5f82849afb36c04c6ce3379fed9d9e58"):
        super().__init__("OpenWeatherMap", priority=9)
        self.api_key = api_key
        self.base_url = "http://api.openweathermap.org/data/2.5/weather"
    
    async def fetch_weather(self, location: str = "Abu Dhabi,ae") -> Dict:
        """Fetch weather from OpenWeatherMap"""
        try:
            start_time = datetime.now()
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "q": location,
                        "units": "metric",
                        "APPID": self.api_key
                    }
                )
                
                if response.status_code != 200:
                    self.update_stats(False, 5000, 0.0)
                    return {"success": False, "error": f"HTTP {response.status_code}"}
                
                data = response.json()
                weather_data = self._process_openweather_data(data)
                
                elapsed = (datetime.now() - start_time).total_seconds() * 1000
                self.update_stats(True, elapsed, self._calculate_data_quality(weather_data))
                
                return {
                    "success": True,
                    "source": "OpenWeatherMap",
                    "data": weather_data,
                    "timestamp": datetime.now().isoformat()
                }
        
        except Exception as e:
            self.update_stats(False, 5000, 0.0)
            return {"success": False, "error": str(e)}
    
    def _process_openweather_data(self, data: Dict) -> Dict:
        """Process OpenWeatherMap response"""
        return {
            "air_temp": round(data["main"]["temp"], 1),
            "feels_like": round(data["main"]["feels_like"], 1),
            "humidity": data["main"]["humidity"],
            "pressure": data["main"]["pressure"],
            "wind_speed": round(data["wind"]["speed"], 1),
            "wind_direction": data["wind"].get("deg", 0),
            "conditions": data["weather"][0]["main"],
            "description": data["weather"][0]["description"],
            "track_temp": None  # Not available
        }
    
    def _calculate_data_quality(self, data: Dict) -> float:
        """Calculate data quality"""
        required_fields = ["air_temp", "humidity", "wind_speed", "conditions"]
        present = sum(1 for f in required_fields if data.get(f) is not None)
        return present / len(required_fields)


class WeatherAPISource(WeatherSource):
    """WeatherAPI.com source"""
    
    def __init__(self, api_key: str = "demo"):
        super().__init__("WeatherAPI", priority=7)
        self.api_key = api_key
        self.base_url = "http://api.weatherapi.com/v1/current.json"
    
    async def fetch_weather(self, location: str = "Abu Dhabi") -> Dict:
        """Fetch weather from WeatherAPI.com"""
        try:
            start_time = datetime.now()
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "key": self.api_key,
                        "q": location,
                        "aqi": "no"
                    }
                )
                
                if response.status_code != 200:
                    self.update_stats(False, 5000, 0.0)
                    return {"success": False, "error": "API key required"}
                
                data = response.json()
                weather_data = self._process_weatherapi_data(data)
                
                elapsed = (datetime.now() - start_time).total_seconds() * 1000
                self.update_stats(True, elapsed, self._calculate_data_quality(weather_data))
                
                return {
                    "success": True,
                    "source": "WeatherAPI",
                    "data": weather_data,
                    "timestamp": datetime.now().isoformat()
                }
        
        except Exception as e:
            self.update_stats(False, 5000, 0.0)
            return {"success": False, "error": str(e)}
    
    def _process_weatherapi_data(self, data: Dict) -> Dict:
        """Process WeatherAPI response"""
        current = data.get("current", {})
        return {
            "air_temp": round(current.get("temp_c", 0), 1),
            "feels_like": round(current.get("feelslike_c", 0), 1),
            "humidity": current.get("humidity", 0),
            "pressure": current.get("pressure_mb", 0),
            "wind_speed": round(current.get("wind_kph", 0) / 3.6, 1),  # Convert to m/s
            "wind_direction": current.get("wind_degree", 0),
            "conditions": current.get("condition", {}).get("text", "Unknown"),
            "description": current.get("condition", {}).get("text", "Unknown"),
            "track_temp": None
        }
    
    def _calculate_data_quality(self, data: Dict) -> float:
        """Calculate data quality"""
        required_fields = ["air_temp", "humidity", "wind_speed"]
        present = sum(1 for f in required_fields if data.get(f))
        return present / len(required_fields)


class FastF1WeatherSource(WeatherSource):
    """FastF1 session weather data"""
    
    def __init__(self):
        super().__init__("FastF1Weather", priority=8)
    
    async def fetch_weather(self, location: str = "session") -> Dict:
        """Fetch weather from FastF1 session data"""
        try:
            start_time = datetime.now()
            
            from fastf1_service import f1_service
            
            if f1_service.session is None:
                self.update_stats(False, 100, 0.0)
                return {"success": False, "error": "Session not loaded"}
            
            session_weather = f1_service.session.weather_data
            
            if session_weather is None or session_weather.empty:
                self.update_stats(False, 100, 0.0)
                return {"success": False, "error": "No weather data"}
            
            weather_data = self._process_fastf1_weather(session_weather)
            
            elapsed = (datetime.now() - start_time).total_seconds() * 1000
            self.update_stats(True, elapsed, self._calculate_data_quality(weather_data))
            
            return {
                "success": True,
                "source": "FastF1Weather",
                "data": weather_data,
                "timestamp": datetime.now().isoformat()
            }
        
        except Exception as e:
            self.update_stats(False, 100, 0.0)
            return {"success": False, "error": str(e)}
    
    def _process_fastf1_weather(self, weather_df) -> Dict:
        """Process FastF1 weather dataframe"""
        avg_air_temp = weather_df['AirTemp'].mean() if 'AirTemp' in weather_df.columns else None
        avg_track_temp = weather_df['TrackTemp'].mean() if 'TrackTemp' in weather_df.columns else None
        avg_humidity = weather_df['Humidity'].mean() if 'Humidity' in weather_df.columns else None
        avg_pressure = weather_df['Pressure'].mean() if 'Pressure' in weather_df.columns else None
        avg_wind_speed = weather_df['WindSpeed'].mean() if 'WindSpeed' in weather_df.columns else None
        
        return {
            "air_temp": round(avg_air_temp, 1) if avg_air_temp else None,
            "track_temp": round(avg_track_temp, 1) if avg_track_temp else None,
            "humidity": round(avg_humidity, 1) if avg_humidity else None,
            "pressure": round(avg_pressure, 1) if avg_pressure else None,
            "wind_speed": round(avg_wind_speed, 1) if avg_wind_speed else None,
            "wind_direction": 0,
            "conditions": "Clear",
            "description": "Session weather data"
        }
    
    def _calculate_data_quality(self, data: Dict) -> float:
        """Calculate data quality"""
        required_fields = ["air_temp", "track_temp", "humidity"]
        present = sum(1 for f in required_fields if data.get(f) is not None)
        return present / len(required_fields)


class WeatherAggregator:
    """
    Aggregates multiple weather sources with integrity testing
    """
    
    def __init__(self):
        self.sources: List[WeatherSource] = [
            OpenWeatherMapSource(),
            FastF1WeatherSource(),
            # WeatherAPISource()  # Requires API key
        ]
        self.best_source = None
        self.last_ranking_update = None
    
    async def fetch_all_sources(self, location: str = "Abu Dhabi,ae") -> Dict[str, Dict]:
        """Fetch weather from all sources in parallel"""
        tasks = []
        for source in self.sources:
            if isinstance(source, FastF1WeatherSource):
                tasks.append(source.fetch_weather("session"))
            else:
                tasks.append(source.fetch_weather(location))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_data = {}
        for source, result in zip(self.sources, results):
            if isinstance(result, Exception):
                all_data[source.name] = {"success": False, "error": str(result)}
            else:
                all_data[source.name] = result
        
        return all_data
    
    def rank_sources(self) -> List[Dict]:
        """Rank weather sources by integrity score"""
        rankings = []
        
        for source in self.sources:
            score = source.calculate_integrity_score()
            rankings.append({
                "name": source.name,
                "score": score,
                "response_time": f"{source.response_time:.0f}ms",
                "success_rate": f"{source.success_rate * 100:.1f}%",
                "data_completeness": f"{source.data_completeness * 100:.1f}%",
                "priority": source.priority,
                "last_update": source.last_update.isoformat() if source.last_update else None
            })
        
        rankings.sort(key=lambda x: x["score"], reverse=True)
        self.last_ranking_update = datetime.now()
        return rankings
    
    async def get_best_weather(self, location: str = "Abu Dhabi,ae") -> Dict:
        """
        Get weather from highest-ranked source
        Combines data from multiple sources intelligently
        """
        all_data = await self.fetch_all_sources(location)
        rankings = self.rank_sources()
        
        # Combine data from all successful sources
        combined_weather = {}
        successful_sources = []
        
        for rank in rankings:
            source_name = rank["name"]
            source_data = all_data.get(source_name, {})
            
            if source_data.get("success"):
                successful_sources.append(source_name)
                data = source_data.get("data", {})
                
                # Prioritize track_temp from FastF1
                if source_name == "FastF1Weather" and data.get("track_temp"):
                    combined_weather["track_temp"] = data["track_temp"]
                
                # Use first successful source for air temp
                if "air_temp" not in combined_weather and data.get("air_temp"):
                    combined_weather["air_temp"] = data["air_temp"]
                
                # Use first successful source for other fields
                for field in ["humidity", "wind_speed", "conditions", "description", "pressure"]:
                    if field not in combined_weather and data.get(field):
                        combined_weather[field] = data[field]
        
        if combined_weather:
            self.best_source = successful_sources[0] if successful_sources else None
            return {
                "success": True,
                "source": "Combined",
                "primary_source": self.best_source,
                "data": combined_weather,
                "rankings": rankings,
                "all_sources": all_data
            }
        
        return {
            "success": False,
            "error": "All weather sources failed",
            "rankings": rankings,
            "all_sources": all_data
        }
    
    def get_source_status(self) -> Dict:
        """Get status of all weather sources"""
        return {
            "sources": [
                {
                    "name": s.name,
                    "priority": s.priority,
                    "integrity_score": s.calculate_integrity_score(),
                    "response_time": f"{s.response_time:.0f}ms",
                    "success_rate": f"{s.success_rate * 100:.1f}%",
                    "total_requests": s.total_requests,
                    "error_count": s.error_count
                }
                for s in self.sources
            ],
            "best_source": self.best_source,
            "last_update": self.last_ranking_update.isoformat() if self.last_ranking_update else None
        }


# Global instance
weather_aggregator = WeatherAggregator()
