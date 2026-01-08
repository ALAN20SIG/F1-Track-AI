# F1 Live Timing Dashboard - Frontend

React + Vite frontend with dark theme and glowing UI.

## Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Features

- **Live Leaderboard** - Real-time race positions with driver info, tyre compounds, and timing
- **Track Map** - Visual representation of Losail International Circuit
- **Strategy Simulator** - Monte-Carlo simulation with backend integration
- **Dark Theme** - F1-style dark UI with glowing effects
- **Responsive Layout** - Works on desktop and mobile

## Data

All 2025 F1 drivers and teams are included in `src/data/drivers2025.js`:
- 20 drivers
- 10 teams
- Driver codes, numbers, and team colors
- Starting positions and tyre compounds

## Tech Stack

- React 18
- Vite
- Pure CSS (no Tailwind)
- Fetch API for backend communication
