"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { isEmailVerificationExempt, verificationContinueUrl } from "@/lib/auth/email-verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function SignupForm({
  invitedEmail,
}: {
  invitedEmail?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "");
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });

      if (!isEmailVerificationExempt(email)) {
        await sendEmailVerification(cred.user, {
          url: verificationContinueUrl(),
          handleCodeInApp: false,
        });
      }

      const idToken = await cred.user.getIdToken(true);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, inviteToken }),
      });
      if (!res.ok) throw new Error("Session failed");
      const body = (await res.json()) as {
        role?: string;
        emailVerified?: boolean;
      };

      if (!body.emailVerified) {
        router.push(
          inviteToken
            ? `/verify-email?invite=${encodeURIComponent(inviteToken)}`
            : "/verify-email"
        );
      } else if (body.role === "PENDING") {
        router.push("/pending-approval");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("Could not create account");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-slate-200">Full name</Label>
          <Input name="name" required className="border-slate-700 bg-slate-950 text-white" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Email</Label>
          <Input
            name="email"
            type="email"
            required
            defaultValue={invitedEmail || ""}
            readOnly={Boolean(invitedEmail)}
            className="border-slate-700 bg-slate-950 text-white read-only:opacity-80"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Password</Label>
          <Input
            name="password"
            type="password"
            required
            minLength={6}
            className="border-slate-700 bg-slate-950 text-white"
          />
        </div>
        {inviteToken ? (
          <p className="text-xs text-emerald-400">
            Team invite: after signup you&apos;ll verify this email, then join with your assigned role.
          </p>
        ) : (
          <p className="text-xs text-slate-400">
            We&apos;ll email a verification link before CRM access is granted.
          </p>
        )}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating..." : inviteToken ? "Join team" : "Request access"}
        </Button>
      </form>
      <div className="relative py-1 text-center text-xs text-slate-500">
        <span className="bg-slate-900/90 px-2">or</span>
      </div>
      <GoogleSignInButton label="Verify with Google" />
    </div>
  );
}
