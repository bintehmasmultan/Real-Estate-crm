import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import { hasFirebaseAdminCredentials } from "@/lib/firebase/admin";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  const session = await getSessionUser();
  if (session && !session.emailVerified) redirect("/verify-email");
  if (session?.role === "PENDING") redirect("/pending-approval");
  if (session) redirect("/dashboard");
  const adminReady = hasFirebaseAdminCredentials();

  return (
    <div className="grid min-h-dvh bg-slate-950 lg:grid-cols-2">
      <aside className="relative min-h-48 overflow-hidden sm:min-h-64 lg:min-h-dvh">
        <img
          src="/brand/bintehmas-tower.png"
          alt="BINTEHMAS tower at sunset"
          className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-slate-950/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8 lg:p-12">
          <p className="text-xs font-semibold tracking-[0.28em] text-amber-200">BINTEHMAS</p>
          <h1 className="mt-2 max-w-sm text-3xl font-semibold tracking-tight sm:text-4xl">
            Real Estate CRM
          </h1>
          <p className="mt-3 max-w-sm text-sm text-slate-200">
            Listings, leads, and deals for the BINTEHMAS team.
          </p>
        </div>
      </aside>

      <div className="relative flex items-center justify-center overflow-hidden px-4 py-8 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_42%)]" />
        <Card className="relative z-10 w-full max-w-md border-slate-800 bg-slate-900/90 text-slate-50 shadow-2xl">
          <CardHeader>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600">
              <Building className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Sign in to BINTEHMAS</CardTitle>
            <CardDescription className="text-slate-400">
              BINTEHMAS Real Estate CRM. Team accounts require email verification or Google sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!adminReady ? (
              <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                Add <code>FIREBASE_CLIENT_EMAIL</code> and <code>FIREBASE_PRIVATE_KEY</code> to{" "}
                <code>.env.local</code> from the{" "}
                <a
                  className="underline"
                  href="https://console.firebase.google.com/project/estate-crm-web/settings/serviceaccounts/adminsdk"
                  target="_blank"
                  rel="noreferrer"
                >
                  Firebase service account page
                </a>
                , then run <code>npm run db:seed</code> and restart the server.
              </div>
            ) : null}
            <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
              <LoginForm />
            </Suspense>
            <p className="mt-4 text-center text-sm text-slate-400">
              No account?{" "}
              <Link href="/signup" className="text-emerald-400 hover:underline">
                Create one
              </Link>
            </p>
            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-400">
              Bootstrap admin: admin@crm.local / password123
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
