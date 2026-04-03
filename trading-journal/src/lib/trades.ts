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
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Trade } from "@/types";

const COLLECTION = "trades";

export async function getTrades(userId: string): Promise<Trade[]> {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    orderBy("entryTime", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Trade);
}

export async function getTrade(id: string): Promise<Trade | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Trade;
}

export async function createTrade(data: Omit<Trade, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateTrade(id: string, data: Partial<Trade>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTrade(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export function calculatePnl(entry: number, exit: number, qty: number, direction: "long" | "short"): number {
  if (direction === "long") return (exit - entry) * qty;
  return (entry - exit) * qty;
}

export function getTradesByDate(trades: Trade[]): Record<string, Trade[]> {
  const grouped: Record<string, Trade[]> = {};
  for (const trade of trades) {
    const date = trade.entryTime.split("T")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(trade);
  }
  return grouped;
}
