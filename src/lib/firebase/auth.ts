import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

import { auth } from "./clientApp";

// Export the User type
export type User = FirebaseUser;

export function onAuthStateChanged(cb: (user: User | null) => void): () => void {
  return _onAuthStateChanged(auth, cb);
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
  }
}

export async function signOut(): Promise<void> {
  try {
    return auth.signOut();
  } catch (error) {
    console.error("Error signing out with Google", error);
  }
}