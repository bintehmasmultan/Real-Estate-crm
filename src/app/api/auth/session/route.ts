import { NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/firebase/session";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { normalizeRole } from "@/lib/constants";
import { isEmailVerificationExempt } from "@/lib/auth/email-verification";
import {
  getInviteByToken,
  getPendingInviteByEmail,
  updateInvite,
} from "@/lib/db/crm";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      idToken?: string;
      inviteToken?: string | null;
    };
    const { idToken } = body;
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const userRef = getAdminDb().collection("users").doc(decoded.uid);
    const existing = await userRef.get();
    const email = (decoded.email || "").toLowerCase();
    const now = new Date().toISOString();
    const emailVerified =
      Boolean(decoded.email_verified) || isEmailVerificationExempt(email);

    let invite =
      (body.inviteToken
        ? await getInviteByToken(body.inviteToken)
        : null) || (email ? await getPendingInviteByEmail(email) : null);

    if (!(invite && invite.status === "PENDING" && invite.email === email)) {
      invite = null;
    }

    // Hold invite until the inbox is verified, then apply role + team.
    const applyInvite = Boolean(invite && emailVerified);

    const role = existing.exists
      ? normalizeRole(existing.data()?.role)
      : applyInvite && invite
        ? normalizeRole(invite.role)
        : "PENDING";
    const teamId = existing.exists
      ? (existing.data()?.teamId ?? null)
      : applyInvite && invite
        ? invite.teamId
        : null;

    let finalRole = role;

    if (!existing.exists) {
      await userRef.set({
        name: decoded.name || email.split("@")[0] || "New user",
        email,
        role,
        teamId,
        phone: null,
        avatarUrl: null,
        createdAt: now,
        updatedAt: now,
      });
      finalRole = role;
    } else if (applyInvite && invite) {
      finalRole = normalizeRole(invite.role);
      await userRef.set(
        {
          role: finalRole,
          teamId: invite.teamId,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    if (applyInvite && invite) {
      await updateInvite(invite.id, {
        status: "ACCEPTED",
        acceptedAt: now,
      });
      finalRole = normalizeRole(invite.role);
    }

    await createSessionCookie(idToken);
    return NextResponse.json({
      ok: true,
      role: finalRole,
      emailVerified,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
