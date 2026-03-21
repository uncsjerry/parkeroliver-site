// ============================================
// Shared Firebase Config — Gutierrez-Rose Family
// ============================================
// WHY: All 5 family sites share the same Firebase project and Firestore database.
// Each site filters photos by its own SITE_ID in the visibility array.
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// WHY: Config is safe to expose client-side — security is enforced by Firestore rules, not by hiding these keys
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "gutierrez-rose-family.firebaseapp.com",
  projectId: "gutierrez-rose-family",
  storageBucket: "gutierrez-rose-family.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
