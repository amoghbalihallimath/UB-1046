# JanSeva — Citizen Services & AI Grievance Redressal Portal

A production-grade, government-style web application for district-level citizen services, AI-powered grievance submission, real-time tracking, and admin-controlled department coordination.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Firebase project (Firestore, Auth, Storage enabled)
- A Gemini API key (for AI enhancement)
- A Gmail account with App Password (for official emails)

---

## 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create a project
2. Enable **Authentication** → Email/Password provider
3. Enable **Firestore Database** (start in test mode, then apply rules)
4. Enable **Storage**
5. Go to **Project Settings → Your Apps → Web App** → Copy `firebaseConfig`
6. Paste your config into `frontend/src/firebase.js`

**Apply Firestore Security Rules:**
1. Open Firestore → Rules tab
2. Copy-paste the contents of `firestore.rules`
3. Click Publish

**Set Admin Role:**
After creating your admin account via sign-up, go to:
Firestore → `users` collection → your user's document → Edit → set `role: "admin"`

---

## 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your GEMINI_API_KEY and GMAIL_APP_PASSWORD in .env
npm install
npm start
```

The backend runs on `http://localhost:3001`

**Gmail App Password:**
1. Enable 2-Step Verification on `jansevaaiportal@gmail.com`
2. Go to: Google Account → Security → App Passwords
3. Generate a 16-character password → paste as `GMAIL_APP_PASSWORD`

---

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in Chrome (required for voice input).

---

## 📁 Project Structure

```
janseva/
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Auth.jsx        # Login / Sign Up
│   │   │   ├── Dashboard.jsx   # Citizen/Admin dashboard
│   │   │   ├── OfficialServices.jsx  # Gov. service cards
│   │   │   ├── RaiseGrievance.jsx    # AI + Voice complaint form
│   │   │   ├── TrackGrievance.jsx    # Real-time tracking
│   │   │   └── AdminPanel.jsx  # Admin complaint management
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Firebase Auth + Role
│   │   ├── styles/             # Page-specific CSS
│   │   ├── firebase.js         # ← FILL YOUR CREDENTIALS
│   │   └── index.css           # Global design system
│   └── vite.config.js          # Proxies /api → backend
│
├── backend/                    # Express AI + Email proxy
│   ├── server.js               # Gemini AI + Nodemailer endpoints
│   └── .env.example            # ← COPY TO .env AND FILL IN
│
└── firestore.rules             # Security rules (apply in Console)
```

---

## 🔑 Key Features

| Feature | Technology |
|---|---|
| Auth (login/signup) | Firebase Authentication |
| Role-based access | Firestore `role` field |
| Real-time tracking | Firestore `onSnapshot` |
| AI text enhancement | Google Gemini 1.5 Flash |
| Voice input | Web Speech API (Chrome/Edge) |
| Languages | English, Hindi (EN/HI), Kannada |
| File uploads | Firebase Storage |
| Official email | Nodemailer via Gmail SMTP |
| Location detection | Browser Geolocation + Nominatim |

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Citizen** | Dashboard, Official Services, Raise/Track own complaints |
| **Admin** | All of the above + Admin Panel (all complaints, status updates, email) |

---

## 🛡️ Security

- Firebase Auth handles password hashing and secure sessions
- Firestore rules prevent citizens from reading others' complaints
- Role is stored server-side in Firestore (not client-controlled)
- All official links are .gov.in only — no unofficial portals
- No admin actions possible without `role: "admin"` in Firestore

---

## 📞 Official Contact

**JanSeva Grievance Cell:** jansevaaiportal@gmail.com
