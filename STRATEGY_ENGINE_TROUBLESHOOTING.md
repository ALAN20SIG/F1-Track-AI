# Strategy Engine Troubleshooting Guide

## Quick Fix Steps

### Step 1: Check what you see in the browser

Open http://localhost:3001 in your browser and navigate to "AI Strategy Engine".

**What do you see?**

#### Option A: "Loading Drivers..." message stuck
- **Cause**: Frontend can't reach backend
- **Fix**: Check browser console (F12 -> Console tab) for CORS or network errors
- **Solution**: Make sure backend is running on port 8000

#### Option B: Red error message "Unable to load drivers..."
- **Cause**: Backend not running or database not populated
- **Fix**: Start backend: `cd backend; python main.py`
- **Check**: Run `python diagnose_strategy_engine.py` to verify backend

#### Option C: Driver dropdown is empty (no options)
- **Cause**: Data transformation issue
- **Fix**: Check browser console (F12) for JavaScript errors
- **Look for**: "Transformed driver list: X drivers" message

#### Option D: Dropdown has drivers, but clicking "Generate Strategies" does nothing
- **Cause**: Strategy fetch failing
- **Fix**: Check browser console for timeout or network errors
- **Note**: Strategy generation takes 2-3 seconds (this is normal)

### Step 2: Open Browser Console

1. Open the page in browser
2. Press **F12** to open Developer Tools
3. Click **Console** tab
4. Look for messages starting with:
   - `Fetching drivers from backend...`
   - `Response status: 200`
   - `Received data:`
   - `Transformed driver list: 20 drivers`

### Step 3: Check Status Line

Look at the header of the Strategy Engine page. You should see:
```
Status: 20 drivers loaded
```

If you see:
- `Status: Loading...` - Frontend is trying to fetch drivers
- `Status: 0 drivers loaded` - Data fetch failed
- `Status: 20 drivers loaded | Error occurred` - Fetch succeeded but something else failed

## Common Issues and Solutions

### Issue 1: CORS Error
**Symptom**: Browser console shows "CORS policy" error

**Solution**:
```bash
# Backend main.py should have CORS enabled
# Check if this line exists in main.py:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 2: Backend Not Running
**Symptom**: Console shows "Failed to fetch" or "Network error"

**Solution**:
```bash
cd backend
python main.py
```

### Issue 3: Frontend on Wrong Port
**Symptom**: Page loads but can't connect to backend

**Solution**: Make sure frontend is accessing http://localhost:8000 for backend
- Check StrategyEngine.jsx line 49: `fetch('http://localhost:8000/api/db/drivers')`

### Issue 4: Database Not Populated
**Symptom**: Error says "No driver data available in database"

**Solution**:
```bash
cd backend
python populate_database.py  # or whatever script populates the DB
```

### Issue 5: React/Vite Cache Issue
**Symptom**: Changes not appearing, stale data

**Solution**:
1. Stop frontend (Ctrl+C)
2. Delete node_modules/.vite cache
3. Restart: `npm run dev`
4. Hard refresh browser (Ctrl+Shift+R)

## Diagnostic Commands

Run these to verify everything is working:

```bash
# 1. Test backend health
curl http://localhost:8000/api/session/info

# 2. Test drivers endpoint
curl http://localhost:8000/api/db/drivers

# 3. Test strategy endpoint
curl "http://localhost:8000/api/analysis/strategy-suggestions/VER?target_position=1"

# 4. Run full diagnostic
cd backend
python diagnose_strategy_engine.py
```

## Expected Behavior

When working correctly, you should see:

1. **Page loads** → Shows "AI Strategy Engine" header
2. **Status shows** → "Status: 20 drivers loaded"
3. **Dropdown populated** → Driver names like "VER - Max Verstappen (Red Bull Racing)"
4. **Click "Generate Strategies"** → Loading indicator for 2-3 seconds
5. **Strategies appear** → 3 strategy cards with details

## Still Not Working?

1. **Take a screenshot** of what you see in the browser
2. **Copy browser console output** (F12 -> Console tab)
3. **Run diagnostic**: `python diagnose_strategy_engine.py`
4. **Share all three** for further assistance

## Debug Mode

The current version has debug logging enabled. Check browser console for:
- `Fetching drivers from backend...`
- `Response status: 200`
- `Received data: { success: true, drivers: [...] }`
- `Transformed driver list: 20 drivers`

These messages will tell you exactly where the process is failing.
