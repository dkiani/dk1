import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { JournalEntry } from "@/types";

const COLLECTION = "journalEntries";

export async function getJournalEntries(userId: string): Promise<JournalEntry[]> {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as JournalEntry);
}

export async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as JournalEntry;
}

export async function getJournalEntryByDate(userId: string, date: string): Promise<JournalEntry | null> {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    where("date", "==", date)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as JournalEntry;
}

export async function createJournalEntry(
  data: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateJournalEntry(id: string, data: Partial<JournalEntry>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
