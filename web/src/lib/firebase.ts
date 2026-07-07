import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDtxsujV3gZk61hsCvZxcvDSDhaiIWueE8",
  authDomain: "gamerhub-3ebc5.firebaseapp.com",
  projectId: "gamerhub-3ebc5",
  storageBucket: "gamerhub-3ebc5.firebasestorage.app",
  messagingSenderId: "128404760361",
  appId: "1:128404760361:web:a10b5c490259fcb5763938",
  measurementId: "G-LRTXSP7J4Q",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

if (typeof window !== 'undefined') {
  getAnalytics(app);
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return idToken;
}

export { auth };
