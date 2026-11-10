
// Import Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

// Import Firebase Realtime Database
import { getDatabase } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-database.js";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD7BY_NEBLXuYPTnCxCtKr2ImzHar_FzFg",
  authDomain: "smart-plant-iot-1.firebaseapp.com",
  databaseURL: "https://smart-plant-iot-1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-plant-iot-1",
  storageBucket: "smart-plant-iot-1.firebasestorage.app",
  messagingSenderId: "565016167155",
  appId: "1:565016167155:web:ea6cd7998b679f48c3ad86",
  measurementId: "G-S71Z7WBQ3P"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Realtime Database
const db = getDatabase(app);

// Export agar bisa digunakan file JavaScript lain
export { app, db };
