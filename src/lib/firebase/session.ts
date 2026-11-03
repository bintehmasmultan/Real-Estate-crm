import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import type { Role } from "@/lib/constants";
import type { AppUser } from "@/lib/types";

export const SESSION_COOKIE = "estate_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  teamId?: string | null;
};

export async function createSessionCookie(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expiresIn / 1000,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    const snap = await getAdminDb().collection("users").doc(decoded.uid).get();
    if (!snap.exists) {
      return {
        id: decoded.uid,
        email: decoded.email || "",
        name: decoded.name || decoded.email || "User",
        role: "AGENT",
        teamId: null,
      };
    }
    const data = snap.data() as AppUser;
    return {
      id: decoded.uid,
      email: data.email || decoded.email || "",
      name: data.name || decoded.name || "User",
      role: (data.role as Role) || "AGENT",
      teamId: data.teamId ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
