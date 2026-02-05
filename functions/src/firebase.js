// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB7_OSRnhXPuAnCXPSgCm4bfLk0rTdouf8",
  authDomain: "docfinder-49324.firebaseapp.com",
  projectId: "docfinder-49324",
  storageBucket: "docfinder-49324.firebasestorage.app",
  messagingSenderId: "552233764986",
  appId: "1:552233764986:web:b5d591212fed723cd753c3",
  measurementId: "G-5816X0NG4X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);