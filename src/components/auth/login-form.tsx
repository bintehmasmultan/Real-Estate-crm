"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { isEmailVerificationExempt, verificationContinueUrl } from "@/lib/auth/email-verification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function LoginForm() {
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
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (!cred.user.emailVerified && !isEmailVerificationExempt(email)) {
        try {
          await sendEmailVerification(cred.user, {
            url: verificationContinueUrl(),
            handleCodeInApp: false,
          });
        } catch {
          // rate limits are fine — user can resend on verify page
        }
      }

      const idToken = await cred.user.getIdToken(true);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, inviteToken }),
      });
      if (!res.ok) {
        throw new Error("session");
      }
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        message === "session"
          ? "Signed in, but the server could not start your session."
          : "Invalid email or password"
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-slate-200">Email</Label>
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="border-slate-700 bg-slate-950 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Password</Label>
          <Input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="border-slate-700 bg-slate-950 text-white"
          />
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <div className="relative py-1 text-center text-xs text-slate-500">
        <span className="bg-slate-900/90 px-2">or</span>
      </div>
      <GoogleSignInButton />
    </div>
  );
}
