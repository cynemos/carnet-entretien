import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import getStorage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "<retiré du dépôt>",
  authDomain: "<retiré du dépôt>",
  projectId: "<retiré du dépôt>",
  storageBucket: "<retiré du dépôt>", // Ensure storageBucket is included
  messagingSenderId: "<retiré du dépôt>",
  appId: "<retiré du dépôt>"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app); // Export storage
