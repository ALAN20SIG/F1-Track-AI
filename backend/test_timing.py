import requests
import time

# Test Strategy Engine response time
print("Testing Strategy Engine response time...\n")

start = time.time()
try:
    response = requests.get(
        'https://f1-track-ai-backend.onrender.com/api/analysis/strategy-suggestions/VER?target_position=1',
        timeout=30
    )
    end = time.time()
    
    print(f"Response Time: {end-start:.2f} seconds")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Success: {data.get('success')}")
        print(f"Strategies returned: {len(data.get('strategies', []))}")
        print(f"\nStrategy Engine is working properly!")
        print(f"Expected time: 2-3 seconds (depending on backend load)")
    else:
        print(f"HTTP Status: {response.status_code}")
        
except Exception as e:
    print(f"Error: {e}")
