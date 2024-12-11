import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getFirebaseConfig } from "./config";

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== "undefined") {
  try {
    const config = getFirebaseConfig();
    // Check if all required fields have values
    if (config.apiKey && config.authDomain && config.projectId) {
      if (!getApps().length) {
        firebaseApp = initializeApp(config);
        auth = getAuth(firebaseApp);
        db = getFirestore(firebaseApp);
        storage = getStorage(firebaseApp);
      } else {
        firebaseApp = getApps()[0];
        auth = getAuth(firebaseApp);
        db = getFirestore(firebaseApp);
        storage = getStorage(firebaseApp);
      }
    } else {
      console.warn('Incomplete Firebase configuration');
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

export { firebaseApp, auth, db, storage };