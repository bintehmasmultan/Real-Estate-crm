import { NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/firebase/session";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const { idToken } = (await req.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const userRef = getAdminDb().collection("users").doc(decoded.uid);
    const existing = await userRef.get();

    if (!existing.exists) {
      await userRef.set({
        name: decoded.name || decoded.email?.split("@")[0] || "Agent",
        email: (decoded.email || "").toLowerCase(),
        role: "AGENT",
        teamId: null,
        phone: null,
        avatarUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await createSessionCookie(idToken);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
