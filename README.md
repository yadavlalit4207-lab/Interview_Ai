# Interview_Ai - AI Video Interview Platform

An intelligent, interactive AI-powered technical and behavioral interview platform. Experience real-time video interviews with a photorealistic interviewer avatar, natural speech synthesis, speech-to-text candidate responses, intelligent answer evaluation, and instant constructive feedback.

---

## 🌟 Key Features

- **👩‍💼 Photorealistic Interviewer (Sarah Jenkins)**:
  - Natural mouth and lip syncing in direct synchrony with verbal utterances.
  - Expressive head gestures, listening nods, and realistic eye contact.
- **🎙️ Speech-to-Text & Real-time Voice Flow**:
  - Voice-driven dialogue where the candidate's speech is automatically transcribed into answers in real time.
  - Flawless, lifelike voice synthesis with smooth intonation and natural pacing.
- **💡 Real-time Evaluation & Corrective Guidance**:
  - Automatically identifies incomplete or incorrect answers and delivers constructive hints on how to correct them.
- **🔒 Automatic Camera & Microphone Lifecycle**:
  - Automatically requests camera and microphone permissions when the interview begins.
  - Instantly closes all hardware media tracks when the call ends, ensuring candidate privacy.
- **📊 Analytics & Performance Breakdown**:
  - Comprehensive score breakdown across technical knowledge, communication, and problem-solving.

---

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Icons & UI**: Lucide React, Canvas Confetti
- **State & Data**: React Router 7, TanStack React Query, React Hook Form, Zod
- **Backend / API**: Express 5, SQLite, JWT Authentication
- **Testing**: Vitest, React Testing Library, jsdom
- **Deployment**: Vercel ready (`vercel.json` included)

---

## 💻 Local Development

### 1. Clone the repository
```bash
git clone https://github.com/yadavlalit4207-lab/Interview_Ai.git
cd Interview_Ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

### 4. Run Locally
Run both the frontend and backend concurrently:
```bash
npm run dev:all
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://localhost:5000](http://localhost:5000)

### 5. Running Tests & Builds
```bash
# Run unit & component tests
npm run test

# Build client for production
npm run build:client

# Full build (client + server)
npm run build
```

---

## ☁️ Deploying to Vercel

1. Push your code to GitHub (already configured with `vercel.json` for SPA routing).
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
3. Import the `Interview_Ai` repository.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build:client`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add any variables required from `.env.example` (such as `VITE_API_URL`).
6. Click **Deploy**!

---

## 📄 License
MIT License.
