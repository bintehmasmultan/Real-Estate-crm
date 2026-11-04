import { cookies } from "next/headers";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { isCrmRole, normalizeRole, type Role } from "@/lib/constants";
import { isEmailVerificationExempt } from "@/lib/auth/email-verification";
import type { AppUser } from "@/lib/types";

export const SESSION_COOKIE = "estate_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  teamId?: string | null;
  emailVerified: boolean;
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
    const email = decoded.email || "";
    const emailVerified =
      Boolean(decoded.email_verified) || isEmailVerificationExempt(email);

    const snap = await getAdminDb().collection("users").doc(decoded.uid).get();
    if (!snap.exists) {
      return {
        id: decoded.uid,
        email,
        name: decoded.name || email || "User",
        role: "PENDING",
        teamId: null,
        emailVerified,
      };
    }
    const data = snap.data() as AppUser;
    return {
      id: decoded.uid,
      email: data.email || email,
      name: data.name || decoded.name || "User",
      role: normalizeRole(data.role),
      teamId: data.teamId ?? null,
      emailVerified,
    };
  } catch {
    return null;
  }
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user || !isCrmRole(user.role) || !user.emailVerified) {
    throw new Error("Unauthorized");
  }
  return user;
}
