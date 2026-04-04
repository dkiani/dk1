import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const COLLECTION = "trades";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }

  const db = getAdminDb();
  const snapshot = await db
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .orderBy("entryTime", "desc")
    .get();

  const trades = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return Response.json({ trades });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  if (!data.userId || !data.symbol) {
    return Response.json({ error: "userId and symbol required" }, { status: 400 });
  }

  const db = getAdminDb();
  const now = new Date().toISOString();
  const ref = await db.collection(COLLECTION).add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  return Response.json({ id: ref.id }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { id, ...data } = await request.json();
  if (!id) {
    return Response.json({ error: "id required" }, { status: 400 });
  }

  const db = getAdminDb();
  await db
    .collection(COLLECTION)
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });

  return Response.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "id required" }, { status: 400 });
  }

  const db = getAdminDb();
  await db.collection(COLLECTION).doc(id).delete();

  return Response.json({ success: true });
}
