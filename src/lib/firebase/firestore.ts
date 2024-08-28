import {
  collection,
  onSnapshot,
  query,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  orderBy,
  Timestamp,
  runTransaction,
  where,
  addDoc,
  CollectionReference,
  DocumentReference,
  Query,
} from "firebase/firestore";

import { db } from "./clientApp";

export {
  collection,
  onSnapshot,
  query,
  getDocs,
  doc,
  getDoc,
  orderBy,
  Timestamp,
  runTransaction,
  where,
  addDoc,
  db,
};

export type { CollectionReference, DocumentReference, Query };