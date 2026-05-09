# STAI — AI-Powered Study Platform

## Structure
```
stai/
├── frontend/   React + Vite + Tailwind CSS
└── backend/    Express.js + JSON storage + Python AI model
```

## Start in 3 steps

### 1. Backend
```bash
cd backend
npm install
npm run setup-ai          # pip installs scikit-learn, pandas, joblib
cp .env.example .env      # add your keys
npm run dev               # http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

### 3. Open http://localhost:5173 and register

## How the AI model works

Every time you open the Timetable page, the backend:
1. Reads your saved **study_hours** from the timetable setting
2. Reads today's **focus_level** and **breaks** from session tracking (heartbeats sent while you're online)
3. Reads your latest **quiz scores** per subject, calculates `difficulty = 5 − (accuracy × 4)`
4. Uses the **previous_score** from your last quiz (or current score if first-time)
5. Runs all 5 values through the trained **RandomForest model** (sklearn)
6. Returns: `recommended_hours`, `predicted_performance`, per-subject hour allocation

The more quizzes you take → the better the personalisation.
