import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
    throw error;
  }
}

export async function signInWithEmail(email: string, pass: string) {
  if (!auth) throw new Error('Auth is not initialized');
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function signUpWithEmail(email: string, pass: string) {
  if (!auth) throw new Error('Auth is not initialized');
  return await createUserWithEmailAndPassword(auth, email, pass);
}

export async function signOut(): Promise<void> {
  if (!auth) {
    console.error('Auth is not initialized');
    return;
  }
  try {
    return auth.signOut();
  } catch (error) {
    console.error("Error signing out", error);
  }
}