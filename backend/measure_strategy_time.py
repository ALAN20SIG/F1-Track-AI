import requests
import time

print("Testing Strategy Engine actual response time...\n")

for driver in ['VER', 'LEC', 'ALB']:
    print(f"Testing {driver}...")
    start = time.time()
    
    try:
        response = requests.get(
            f'http://localhost:8000/api/analysis/strategy-suggestions/{driver}?target_position=1',
            timeout=120
        )
        elapsed = time.time() - start
        
        print(f"  ✓ Response in {elapsed:.2f} seconds")
        print(f"    Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"    Strategies: {len(data.get('strategies', []))}")
        
    except requests.exceptions.Timeout:
        elapsed = time.time() - start
        print(f"  ✗ TIMEOUT after {elapsed:.2f} seconds")
    except Exception as e:
        elapsed = time.time() - start
        print(f"  ✗ ERROR after {elapsed:.2f} seconds: {e}")
    
    print()

print("\nIf response times are > 10 seconds, the frontend timeout was too short.")
print("If response times are < 10 seconds, there's a CORS/network issue.")
