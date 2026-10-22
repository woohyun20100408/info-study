import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 👈 추가

const firebaseConfig = {
    apiKey: "AIzaSyBP_GQh6Fm01jXX4R-UaHctWbE6N3aF4DY",
    authDomain: "info-study-9b9a4.firebaseapp.com",
    projectId: "info-study-9b9a4",
    storageBucket: "info-study-9b9a4.firebasestorage.app",
    messagingSenderId: "374066535046",
    appId: "1:374066535046:web:7987596301d00ed3a04f07"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // 👈 export 추가
