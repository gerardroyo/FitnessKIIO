import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAgbvWpggzgJkM_UihJIK2Tby7TFICmclk",
    authDomain: "fitnesskiio.firebaseapp.com",
    projectId: "fitnesskiio",
    storageBucket: "fitnesskiio.firebasestorage.app",
    messagingSenderId: "624824683305",
    appId: "1:624824683305:web:148698f6ddb9b8c1e44538",
    measurementId: "G-P97JS4DY4H"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics only on client side and if supported
let analytics;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

import { getFirestore } from 'firebase/firestore';

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export { app, analytics };
