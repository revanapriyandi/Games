import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZIMfhBzWdhhRVDb488w1EgoTZ0-wrSvE",
  authDomain: "finre-d6107.firebaseapp.com",
  projectId: "finre-d6107",
  storageBucket: "finre-d6107.firebasestorage.app",
  messagingSenderId: "875853588352",
  appId: "1:875853588352:web:09fcd333833f7e20570365",
  measurementId: "G-KZ33MEP7T9",
  databaseURL: "https://finre-d6107-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getDatabase(app); // For Realtime Database (presence, game state)
export const firestore = getFirestore(app); // For persistent data if needed

export default app;
