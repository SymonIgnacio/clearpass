import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'

// Firebase configuration - using environment variables for deployment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBD_5lSqgF-pY8NYo5s5gx1R-gKrS2Cmyk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "clearpass-ed442.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "clearpass-ed442",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "clearpass-ed442.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "529870147692",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:529870147692:web:d1e4f9f0576def7167c849",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Z7EPW6GS3F"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)

// Initialize Analytics (only in browser)
let analytics = null
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app)
  } catch (error) {
    console.warn('Firebase Analytics initialization failed:', error)
  }
}

export { analytics }
export default app
