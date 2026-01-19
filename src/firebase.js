import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    apiKey: "AIzaSyDxnx91UTmO4x394_UA00sACWrOm9De9Uc",
    authDomain: "tennisscorer-5476e.firebaseapp.com",
    projectId: "tennisscorer-5476e",
    storageBucket: "tennisscorer-5476e.firebasestorage.app",
    messagingSenderId: "334878153903",
    appId: "1:334878153903:web:aa8dfb80ac70c33329885a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});
export const db = getFirestore(app);
