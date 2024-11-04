// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkrA20JOHpa6IKFGBCZzirtkZL6O_2XGQ",
  authDomain: "inting-tracker.firebaseapp.com",
  projectId: "inting-tracker",
  storageBucket: "inting-tracker.firebasestorage.app",
  messagingSenderId: "1077214680586",
  appId: "1:1077214680586:web:ea19512c00f6006a90b1f3",
  measurementId: "G-MW5FQR98QX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Conditionally initialize Analytics (This warning means that Firebase Analytics requires cookies, which aren’t always
// available in certain environments (e.g., server-side rendering, incognito mode, or environments where cookies are restricted).
// To address this, you can check if Firebase Analytics is supported in the current environment before initializing it.)
let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log("Firebase Analytics initialized successfully");
  } else {
    console.log("Firebase Analytics is not supported in this environment.");
  }
}).catch(error => {
  console.error("Error checking Analytics support:", error);
});

console.log("Firebase initialized: " + app.name);