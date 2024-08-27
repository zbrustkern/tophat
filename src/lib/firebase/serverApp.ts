import "server-only";

import { headers } from "next/headers";
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

import { firebaseConfig } from "./config";

export async function getAuthenticatedAppForUser(): Promise<{ app: FirebaseApp; auth: Auth }> {
  throw new Error('not implemented');
}