import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential) throw new Error("No credentials found");
    
    // Store access token in session storage for the current session
    if (credential.accessToken) {
      sessionStorage.setItem('google_drive_token', credential.accessToken);
    }
    
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}
