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

try {
    if (typeof window !== "undefined" && !getApps().length) {
      console.log('Initializing Firebase with config:', JSON.stringify(getFirebaseConfig(), null, 2));
      firebaseApp = initializeApp(getFirebaseConfig());
      auth = getAuth(firebaseApp);
      db = getFirestore(firebaseApp);
      storage = getStorage(firebaseApp);
      console.log('Firebase initialized successfully');
    } else {
      console.log('Firebase already initialized or running on server');
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
  
export { firebaseApp, auth, db, storage };