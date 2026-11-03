import { NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/firebase/session";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { normalizeRole } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const { idToken } = (await req.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const userRef = getAdminDb().collection("users").doc(decoded.uid);
    const existing = await userRef.get();

    // Self-service sign-in never chooses a role. New profiles stay PENDING
    // until an admin assigns ADMIN, MANAGER, or AGENT. Existing roles are kept.
    const role = existing.exists ? normalizeRole(existing.data()?.role) : "PENDING";

    if (!existing.exists) {
      const now = new Date().toISOString();
      await userRef.set({
        name: decoded.name || decoded.email?.split("@")[0] || "New user",
        email: (decoded.email || "").toLowerCase(),
        role,
        teamId: null,
        phone: null,
        avatarUrl: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    await createSessionCookie(idToken);
    return NextResponse.json({ ok: true, role });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
