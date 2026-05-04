// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBFBwcQ21rd6tiJXwP7oRqfHcHjsooBew0",
  authDomain: "emotcare.firebaseapp.com",
  projectId: "emotcare",
  storageBucket: "emotcare.firebasestorage.app",
  messagingSenderId: "9799336640",
  appId: "1:9799336640:web:0e5d9dbc63a80e89c0e325",
  measurementId: "G-KYJ58QKDBH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);