import {
  FieldValue,
  type Query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { randomUUID } from "crypto";

export function nowIso() {
  return new Date().toISOString();
}

export function newId() {
  return randomUUID();
}

export function col(name: string) {
  return getAdminDb().collection(name);
}

export async function getDoc<T extends { id: string }>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const snap = await col(collectionName).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as object) } as T;
}

export async function setDoc(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
) {
  await col(collectionName).doc(id).set(data, { merge: true });
}

export async function createDoc(
  collectionName: string,
  data: Record<string, unknown>,
  id?: string
) {
  const docId = id || newId();
  const payload = {
    ...data,
    createdAt: (data.createdAt as string) || nowIso(),
    updatedAt: nowIso(),
  };
  await col(collectionName).doc(docId).set(payload);
  return docId;
}

export async function updateDoc(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
) {
  await col(collectionName)
    .doc(id)
    .set({ ...data, updatedAt: nowIso() }, { merge: true });
}

export async function deleteDoc(collectionName: string, id: string) {
  await col(collectionName).doc(id).delete();
}

export async function listDocs<T extends { id: string }>(
  collectionName: string,
  build?: (q: Query<DocumentData>) => Query<DocumentData>
): Promise<T[]> {
  let q: Query<DocumentData> = col(collectionName);
  if (build) q = build(q);
  const snap = await q.get();
  return snap.docs.map(
    (d: QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }) as T
  );
}

export async function countDocs(
  collectionName: string,
  build?: (q: Query<DocumentData>) => Query<DocumentData>
) {
  let q: Query<DocumentData> = col(collectionName);
  if (build) q = build(q);
  const snap = await q.count().get();
  return snap.data().count;
}

export { FieldValue };
