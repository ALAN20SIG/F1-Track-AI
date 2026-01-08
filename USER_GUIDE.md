# F1 Dashboard - Quick User Guide

## 🎯 Getting Started

### Open the Dashboard
Click the **preview button** above to open the F1 Dashboard in your browser.

---

## 🎮 NEW FEATURES

### 1. **Collapsible Sidebar** ⚡ NEW!
- **Location:** Left side of screen
- **How to Use:**
  - Click the **◀** button to collapse sidebar (icons only, 60px)
  - Click the **▶** button to expand sidebar (full labels, 250px)
  - Hover over icons when collapsed to see tooltips
- **Benefit:** More screen space for dashboard content

### 2. **Strategy Simulator** 🎯 NEW PAGE!
- **Location:** Main menu → Strategy Simulator (moved from Dashboard)
- **How to Use:**
  1. Select drivers (click driver codes, max 5)
  2. Set race laps (default: 57)
  3. Set number of simulations (100-10,000)
  4. Click "Run Simulation"
  5. Wait 2-3 seconds for results
  6. View win %, podium %, and average positions
  7. Click "New Simulation" to reset

### 3. **Strategy Comparison** ⚡ ENHANCED!
- **Location:** Main menu → Strategy Comparison
- **New Capability:** Compare up to **10 drivers** (was 5)
- **All 20 Drivers Available:** Full 2025 F1 grid
- **How to Use:**
  1. Click driver codes to select (up to 10)
  2. Configure each driver individually:
     - **Base Lap Time:** Driver's pace (83.3s - 84.5s)
     - **Pit Stop 1:** First pit lap (15-25)
     - **Pit Stop 2:** Second pit lap (35-45)
     - **Stint 1 Tyre:** Soft/Medium/Hard
     - **Stint 2/3 Tyre:** Remaining stints compound
     - **Fuel Load:** Starting fuel weight (105-115 kg)
     - **Risk Level:** Low/Medium/High (affects pace)
  3. Click "Calculate & Compare Strategies"
  4. View predicted race results
  5. Analyze performance chart

---

## 📊 Dashboard Features

### Live Timing
- **10 Columns:**
  - **POS:** Race position
  - **CODE:** Driver 3-letter code
  - **DRIVER:** Full name
  - **BEST:** Best lap time (blue)
  - **LAST:** Last lap time
  - **S1, S2, S3:** Sector times
  - **TYRE:** Compound + age
  - **GAP:** Time to leader
- **Status Indicators:**
  - ● PIT (orange) - In pit lane
  - ✕ OUT (red) - Retired
  - ◁ OUT (green) - Exiting pits
- **Race Status Banner:** Shows track status (Track Clear, Yellow Flag, DRS, Safety Car)

### Live Track Map
- **Features:**
  - Animated Qatar GP circuit
  - All 20 drivers as colored dots
  - Real-time overtakes (gold highlight)
  - Team colors
  - Position labels
- **Controls:**
  - **▶ Start Race / ⏸ Pause:** Toggle simulation
  - **Speed:** 0.5x, 1x, 2x, 5x, 10x
  - **Lap Counter:** Shows current lap / 57
- **Live Position Tower:** Top 10 drivers with tyre info

### Race Control
- **Flag Messages:** Live updates (Green, Yellow, Red, Blue, DRS)
- **Team Radio:** Driver-team communications
- **Auto-Update:** Every 15 seconds

---

## 🧪 Testing Strategy Comparison

### Example Scenario 1: Aggressive vs Conservative
**VER (Aggressive):**
- Base Lap: 83.3s
- Pits: Lap 15, 32 (early)
- Tyres: Soft → Medium
- Risk: High

**NOR (Conservative):**
- Base Lap: 83.5s
- Pits: Lap 25, 45 (late)
- Tyres: Medium → Hard
- Risk: Low

**Expected Result:** Aggressive strategy wins if lap time advantage outweighs extra pit stop time

### Example Scenario 2: Same Strategy, Different Pace
**All 5 drivers:**
- Same pit laps (20, 40)
- Same tyres (Medium → Hard)
- Same risk (Medium)
- **Different base lap times:** 83.3s, 83.5s, 83.7s, 83.9s, 84.1s

**Expected Result:** Driver with fastest base lap wins

### Example Scenario 3: Tyre Compound Test
**Test soft vs medium vs hard:**
- **Soft:** Fast (+5%) but degrades quickly
- **Medium:** Balanced (baseline)
- **Hard:** Slow (-4%) but lasts longer

---

## 📍 Navigation Menu

### Main Pages
1. **Dashboard** - Live timing + Track map
2. **Live Track Map** - Full-screen animated track
3. **Race Control** - Flags + Team radio
4. **Strategy Simulator** - Monte-Carlo simulation
5. **Strategy Comparison** - Compare up to 10 drivers
6. **Standings** - Championship points
7. **Weather** - Track conditions
8. **Schedule** - 2025 F1 calendar

---

## 💡 Tips & Tricks

### Maximize Screen Space
1. Click **◀** to collapse sidebar
2. Content area expands automatically
3. Tooltips show on hover

### Compare Multiple Strategies
1. Select 5-10 drivers
2. Try different pit stop timings
3. Mix tyre compounds
4. Adjust risk levels
5. Compare results instantly

### Watch Race Simulation
1. Go to Live Track Map
2. Click "Start Race"
3. Set speed to 5x or 10x for faster action
4. Watch overtakes happen in real-time
5. Monitor Live Position Tower

### Test Extreme Strategies
- **Ultra-Aggressive:** Early pits (Lap 12, 28), Soft tyres, High risk
- **Ultra-Conservative:** Late pits (Lap 30, 50), Hard tyres, Low risk
- **Balanced:** Standard pits (Lap 20, 40), Medium tyres, Medium risk

---

## 🔧 Troubleshooting

### Sidebar Won't Toggle
- Refresh the page (Ctrl+R or Cmd+R)

### Simulation Not Starting
- Check if backend is running on port 8000
- Wait a few seconds and try again

### Columns Misaligned
- **Fixed!** All columns now properly aligned
- If issue persists, clear browser cache

### Animation Too Fast/Slow
- Use the speed dropdown (0.5x to 10x)
- 1x = real-time, 10x = fast-forward

---

## ✅ Validation Status

**All features tested and validated:**
- ✅ Sidebar collapse/expand
- ✅ Strategy Simulator (separate page)
- ✅ Strategy Comparison (10 drivers)
- ✅ Column alignment
- ✅ Live track animation
- ✅ Backend simulation (1000 runs)
- ✅ CORS configuration
- ✅ All 20 drivers supported

**Test Results:** 5/5 automated tests passed (100%)

---

## 🎉 Enjoy Your F1 Dashboard!

**Quick Start:**
1. Collapse sidebar for more space (◀)
2. Watch live race on Track Map
3. Test strategies in Strategy Comparison
4. Compare 10 drivers at once
5. Find the optimal Qatar GP strategy!

**Have fun exploring! 🏎️💨**
