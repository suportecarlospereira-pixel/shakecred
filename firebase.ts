import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCdMUaskh5_ZmKKDDwIZIRJo8Ddky3r-lQ",
  authDomain: "shakecred.firebaseapp.com",
  projectId: "shakecred",
  storageBucket: "shakecred.firebasestorage.app",
  messagingSenderId: "219662305304",
  appId: "1:219662305304:web:1fe78f2ae36522be6c1b6d",
  measurementId: "G-9GHRPVMDR5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firestore
export const db = getFirestore(app);
// Initialize Auth
export const auth = getAuth(app);