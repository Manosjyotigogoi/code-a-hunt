# STAI — Smart Study AI 🎓

An AI-powered study assistant built with React + Vite.

## 🚀 Quick Setup

### 1. Install dependencies
```bash
cd frontend/stai
npm install
```

### 2. Add your API Key
Open `src/utils/ai.js` and replace the placeholder:
```js
const ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';
```
Get your key from https://console.anthropic.com

### 3. Start the dev server
```bash
npm run dev
```
Visit http://localhost:5173

---

## Project Structure

```
frontend/stai/src/
├── context/AuthContext.jsx       # User + edu data state
├── utils/ai.js                   # ALL AI calls — paste key here
├── components/
│   ├── LandingNav.jsx
│   ├── Sidebar.jsx
│   └── DashHeader.jsx
└── pages/
    ├── Landing.jsx               # Landing page with animations
    ├── Login.jsx / Register.jsx
    ├── DataCollection.jsx        # 3-step onboarding form
    ├── Dashboard.jsx             # Notebook cards + global ask
    ├── SubjectPage.jsx           # Upload, summarize, questions
    ├── StudyMaterials.jsx        # AI-recommended resources
    ├── QuestionGenerator.jsx     # Practice questions
    ├── Timetable.jsx             # AI study schedule
    ├── ExamDates.jsx             # Exam countdown tracker
    ├── GrowthAnalysis.jsx        # Performance + AI insights
    └── Profile.jsx               # Edit profile & edu data
```

## Design Colors
- Baby Pink: #FFB6C1
- Neon Yellow: #FFFF66  
- Sky Blue: #87CEEB
- Black: #0D0D0D
- Fonts: Syne (display) + DM Sans (body)

## Notes
- Auth is frontend-only (no backend). For production, add a real auth layer.
- API calls go directly from browser using anthropic-dangerous-direct-browser-access header.
- For production, proxy API calls through your own backend to protect your key.
