# 🌾 FarmLink — Farmer & Worker Connection Platform

A modern **mobile-first + Android APK** platform that directly connects farmers with farm workers — no middlemen.

Built using **React + Firebase + Capacitor (Android)**.

---

# 🚀 LIVE STATUS

* 🌐 Web App (Vercel) ✅
* 📱 Android APK (Capacitor) ✅
* 🔐 Firebase Backend ✅

---

# 📁 Project Structure

```
farmlink/
├── android/                 ← Android APK project (Capacitor)
├── public/
├── src/
│   ├── components/         ← UI Components
│   ├── pages/              ← Screens (Login, Setup, Dashboard)
│   ├── utils/              ← Helpers (distance, location)
│   ├── firebase/           ← Firebase config & logic
│   └── App.js
├── capacitor.config.ts     ← Capacitor config
├── package.json
├── firebase.json
├── firestore.rules
└── firestore.indexes.json
```

---

# 🔥 KEY FEATURES

## 🔐 Authentication

* Google Sign-In (Web)
* Email/Password Login
* Forgot Password
* (Phone OTP removed for simplicity)

---

## 📍 Location System (Core Feature)

* Native GPS using Capacitor
* Auto-detect location (Android APK)
* Reverse geocoding (lat/lng → address)
* Manual fallback input
* Permission handling + retry system

---

## 👨‍🌾 Farmer Features

* Search nearby workers
* View worker profiles
* Send job requests
* Distance-based filtering (10km radius)

---

## 👷 Worker Features

* Create worker profile
* Set work type & wage
* Accept / reject jobs
* Availability toggle

---

## 📏 Smart Matching System

* Haversine distance calculation
* Nearby workers within radius
* Accurate time/distance display

---

## 🎨 UI / UX Improvements

* Mobile-first clean design
* Premium input fields & buttons
* Smooth animations & micro-interactions
* Fixed status bar overlap (APK)
* Toast notifications (success/error)

---

## 📱 Android APK Support

* Built using Capacitor
* Native permissions (GPS)
* Firebase integrated
* Installable APK

---

# ⚙️ SETUP GUIDE

## 1️⃣ Install dependencies

```bash
npm install
```

---

## 2️⃣ Run web app

```bash
npm start
```

---

## 3️⃣ Build project

```bash
npm run build
```

---

## 4️⃣ Run Android APK

```bash
npx cap sync
npx cap open android
```

Then build APK in Android Studio:

```
Build → Generate APK
```

---

# 🔥 FIREBASE SETUP

1. Create project in Firebase
2. Enable:

   * Authentication (Google + Email)
   * Firestore Database
3. Add config in:

```
src/firebase/config.js
```

---

## 📱 Android Setup (IMPORTANT)

1. Add Android app in Firebase
2. Add SHA-1 key
3. Download:

```
google-services.json
```

4. Paste here:

```
android/app/google-services.json
```

---

# ☁️ DEPLOYMENT

## 🌐 Vercel (Web)

```bash
npm run build
vercel --prod
```

---

## 📱 APK (Android)

Use Android Studio:

```
Build → Generate APK
```

---

# 🧠 TECH STACK

* React 18
* Firebase (Auth + Firestore)
* Capacitor (Android)
* Tailwind CSS

---

# ⚠️ IMPORTANT NOTES

* Location requires:

  * GPS ON
  * Permission allowed
* Firebase Google login requires SHA-1 (Android)
* First location fetch may take few seconds

---

# 🐛 COMMON ISSUES

### ❌ Location not detected

* Enable GPS
* Allow location permission
* Retry once

---

### ❌ Google login not working (APK)

* Add SHA-1 in Firebase
* Download updated `google-services.json`

---

### ❌ Workers not showing

* Check Firestore data
* Ensure location is saved

---

# 🚀 FUTURE IMPROVEMENTS

* Real-time chat (Farmer ↔ Worker)
* Push notifications
* Payment integration
* Rating & reviews system

---

# 💡 VISION

FarmLink aims to:

* Remove middlemen
* Help farmers find workers quickly
* Provide fair wages to workers

---

# ❤️ Built With Passion

Made for real-world impact in agriculture 🚜
