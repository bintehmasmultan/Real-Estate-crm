"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch {
      // The session cookie is cleared next even if the client SDK is unavailable.
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" className="w-full" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
