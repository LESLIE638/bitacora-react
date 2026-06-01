import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAHXx17-c4SCywuMhldeV8ni3IIN84DeUc",
  authDomain: "bitacora-93672.firebaseapp.com",
  projectId: "bitacora-93672",
  storageBucket: "bitacora-93672.firebasestorage.app",
  messagingSenderId: "310184409931",
  appId: "1:310184409931:web:5acc901f9bd3ce70ac46ce"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);