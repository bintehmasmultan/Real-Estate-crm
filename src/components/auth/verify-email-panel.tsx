"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  reload,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { verificationContinueUrl } from "@/lib/auth/email-verification";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function VerifyEmailPanel({ email }: { email: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function refreshSession() {
    const user = auth.currentUser;
    if (!user) {
      // Session cookie exists but client auth may have cleared — ask them to sign in again after verifying.
      router.push("/login");
      return;
    }
    await reload(user);
    if (!user.emailVerified) {
      setError("Email is still unverified. Open the link in your inbox, then try again.");
      return;
    }
    const idToken = await user.getIdToken(true);
    const inviteToken =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("invite")
        : null;
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, inviteToken }),
    });
    if (!res.ok) throw new Error("Session failed");
    const body = (await res.json()) as { role?: string };
    router.push(body.role === "PENDING" ? "/pending-approval" : "/dashboard");
    router.refresh();
  }

  async function onResend() {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      let user = auth.currentUser;
      if (!user) {
        user = await new Promise((resolve) => {
          const unsub = onAuthStateChanged(auth, (u) => {
            unsub();
            resolve(u);
          });
        });
      }
      if (!user) {
        setError("Sign in again, then resend the verification email.");
        router.push("/login");
        return;
      }
      await sendEmailVerification(user, {
        url: verificationContinueUrl(),
        handleCodeInApp: false,
      });
      setMessage("Verification email sent. Check your inbox (and spam).");
    } catch {
      setError("Could not send verification email. Wait a minute and try again.");
    } finally {
      setPending(false);
    }
  }

  async function onContinue() {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await refreshSession();
    } catch {
      setError("Could not confirm verification yet.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-300">
        We sent a verification link to{" "}
        <span className="font-medium text-white">{email || "your email"}</span>.
        Verify it to finish team sign-in.
      </p>
      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="flex flex-col gap-2">
        <Button onClick={onContinue} disabled={pending} className="w-full">
          {pending ? "Checking…" : "I've verified — continue"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onResend}
          disabled={pending}
          className="w-full border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800"
        >
          Resend verification email
        </Button>
        <SignOutButton />
      </div>
    </div>
  );
}
