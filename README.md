# 🌾 FarmLink — Farmer & Worker Connection Platform

A production-ready mobile-first React app that directly connects farmers with farm workers — no middlemen.

---

## 📁 Project Structure

```
farmlink/
├── public/
│   └── index.html
├── src/
│   ├── firebase/
│   │   ├── config.js          ← Firebase init (ADD YOUR CONFIG HERE)
│   │   └── firestore.js       ← All Firestore queries
│   ├── context/
│   │   └── AuthContext.js     ← Global auth state
│   ├── components/
│   │   ├── UI.js              ← Button, Input, Card, Modal, etc.
│   │   ├── BottomNav.js       ← Mobile bottom navigation
│   │   └── WorkerCard.js      ← Worker profile card
│   ├── pages/
│   │   ├── LoginPage.js       ← OTP login
│   │   ├── SetupPage.js       ← Role selection + profile setup
│   │   ├── farmer/
│   │   │   ├── FarmerDashboard.js
│   │   │   ├── FarmerHome.js
│   │   │   ├── SearchWorkers.js
│   │   │   ├── FarmerJobs.js
│   │   │   └── FarmerProfile.js
│   │   └── worker/
│   │       ├── WorkerDashboard.js
│   │       ├── WorkerHome.js
│   │       ├── WorkerRequests.js
│   │       └── WorkerProfile.js
│   ├── utils/
│   │   └── helpers.js         ← Work types, distance calc, formatters
│   ├── App.js                 ← Main router
│   ├── index.js
│   └── index.css
├── firestore.rules            ← Security rules
├── firestore.indexes.json     ← Composite indexes
├── firebase.json              ← Firebase hosting config
├── vercel.json                ← Vercel deploy config
├── tailwind.config.js
└── package.json
```

---

## 🚀 STEP-BY-STEP SETUP

### Step 1 — Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add Project"** → Name it `farmlink`
3. Disable Google Analytics (optional) → **Create Project**

### Step 2 — Enable Firebase Authentication

1. In Firebase Console → **Authentication** → **Get Started**
2. Click **Sign-in method** tab
3. Enable **Phone** provider → Save
4. Under **Authorized domains**, add:
   - `localhost`
   - Your production domain (e.g. `farmlink.vercel.app`)

### Step 3 — Create Firestore Database

1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **Production mode** → Select region (e.g. `asia-south1` for India)
3. Click **Done**

### Step 4 — Get Firebase Config

1. Firebase Console → **Project Settings** (gear icon)
2. Scroll to **"Your apps"** → Click **Web** icon `</>`
3. Register app name: `farmlink-web`
4. Copy the `firebaseConfig` object

### Step 5 — Add Firebase Config to the App

Open `src/firebase/config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← YOUR VALUES
  authDomain: "farmlink-xxx.firebaseapp.com",
  projectId: "farmlink-xxx",
  storageBucket: "farmlink-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 6 — Deploy Firestore Rules & Indexes

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore
```

### Step 7 — Install Dependencies & Run

```bash
# In the farmlink/ directory:
npm install
npm start
```

App opens at http://localhost:3000

---

## 🏗️ Firestore Database Structure

```
users/
  {uid}/
    role: "farmer" | "worker"
    name: "Ramesh Kumar"
    phone: "+919876543210"
    location: { lat: 28.6, lng: 77.2, address: "Meerut, UP" }
    createdAt: Timestamp

workers/
  {uid}/          ← same uid as users/{uid}
    userId: uid
    workType: "harvesting"
    wage: 400
    availability: true
    rating: 4.2
    totalRatings: 5
    totalJobs: 5
    createdAt: Timestamp

jobRequests/
  {auto-id}/
    farmerId: uid
    workerId: uid
    date: "2024-04-15"
    workersNeeded: 2
    offeredWage: 450
    status: "pending" | "accepted" | "completed" | "rejected"
    emergency: true | false
    createdAt: Timestamp

subscriptions/
  {uid}/
    userId: uid
    plan: "free" | "paid"
    startDate: ISO string
    endDate: ISO string
```

---

## ☁️ DEPLOYMENT

### Option A — Vercel (Recommended, Free)

```bash
npm install -g vercel
cd farmlink
npm run build
vercel --prod
```

Or connect GitHub repo to Vercel for auto-deploy on push.

**Environment Variables in Vercel** (optional but recommended):
Set these in Vercel Dashboard → Settings → Environment Variables:
```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```
Then update `config.js` to use `process.env.REACT_APP_FIREBASE_*`.

### Option B — Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

App will be live at `https://farmlink-xxx.web.app`

---

## 📱 FEATURES CHECKLIST

| Feature | Status |
|---------|--------|
| OTP Login (Firebase Phone Auth) | ✅ |
| Role Selection (Farmer/Worker) | ✅ |
| Worker Profile (name, location, work type, wage) | ✅ |
| Worker Availability Toggle | ✅ |
| Farmer Dashboard with Stats | ✅ |
| Search Workers with Filters | ✅ |
| Distance Calculation (GPS) | ✅ |
| Call Worker Button | ✅ |
| Send Job Request | ✅ |
| Emergency Broadcast to All Workers | ✅ |
| Worker Accept/Reject Requests | ✅ |
| Job Status (Pending/Accepted/Completed) | ✅ |
| Rate Worker (1–5 stars) | ✅ |
| Farmer Subscription (Free/Paid ₹99) | ✅ |
| Payment Transparency (no commission) | ✅ |
| Toast Notifications | ✅ |
| Mobile-First Responsive Design | ✅ |
| Bottom Navigation | ✅ |
| Hindi Labels | ✅ |
| Loading States | ✅ |
| Error Handling | ✅ |
| Firestore Security Rules | ✅ |

---

## 💳 Payment Integration (UPI/Razorpay)

The subscription system is wired up with a placeholder. To add real payments:

1. Create account at https://razorpay.com
2. Get API keys
3. Replace the `upgradePlan` function in `FarmerProfile.js`:

```js
const upgradePlan = async () => {
  const options = {
    key: "rzp_live_YOUR_KEY",
    amount: 9900, // ₹99 in paise
    currency: "INR",
    name: "FarmLink Pro",
    description: "2-month unlimited access",
    handler: async (response) => {
      // Payment successful
      await activatePaidPlan(userProfile.id);
      toast.success("Payment successful! Pro plan activated.");
    },
  };
  const rzp = new window.Razorpay(options);
  rzp.open();
};
```

Add Razorpay script in `public/index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## 🔒 Security Notes

- All Firestore rules restrict writes to authenticated users only
- Workers can only modify their own profile
- Job requests are only visible to the farmer or worker involved
- Phone OTP is handled entirely by Firebase (no custom OTP server needed)

---

## 🐛 Common Issues

**"reCAPTCHA" error on OTP send:**
- Make sure your domain is in Firebase Auth → Authorized domains
- For localhost testing, `localhost` must be listed

**Firestore permission denied:**
- Deploy rules: `firebase deploy --only firestore:rules`

**Workers not showing:**
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Wait ~2 minutes for indexes to build

**OTP not received:**
- Check Firebase Billing — Phone Auth requires Blaze plan for production
- For testing, use Firebase Auth test phone numbers

---

## 📞 Support

Built with ❤️ for Indian farmers. 
Tech: React 18 + Firebase 10 + Tailwind CSS 3
