import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

import { auth } from "./clientApp";

export type User = FirebaseUser;

export function onAuthStateChanged(cb: (user: User | null) => void): () => void {
  if (!auth) {
    console.error('Auth is not initialized');
    return () => {};
  }
  return _onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle(): Promise<void> {
  if (!auth) {
    console.error('Auth is not initialized');
    return;
  }
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
  }
}

export async function signOut(): Promise<void> {
  if (!auth) {
    console.error('Auth is not initialized');
    return;
  }
  try {
    return auth.signOut();
  } catch (error) {
    console.error("Error signing out with Google", error);
  }
}