'use client';

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
    if (!getApps().length) {
      firebaseApp = initializeApp(getFirebaseConfig());
      auth = getAuth(firebaseApp);
      db = getFirestore(firebaseApp);
      storage = getStorage(firebaseApp);
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

export { firebaseApp, auth, db, storage };