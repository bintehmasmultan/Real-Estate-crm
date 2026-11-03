"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const router = useRouter();
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
      const idToken = await cred.user.getIdToken(true);
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error("Session failed");
      const body = (await res.json()) as { role?: string };
      router.push(body.role === "PENDING" ? "/pending-approval" : "/dashboard");
      router.refresh();
    } catch {
      setError("Could not create account");
    } finally {
      setPending(false);
    }
  }

  return (
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
          className="border-slate-700 bg-slate-950 text-white"
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
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating..." : "Request access"}
      </Button>
    </form>
  );
}
