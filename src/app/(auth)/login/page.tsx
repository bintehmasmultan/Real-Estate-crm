import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { hasFirebaseAdminCredentials } from "@/lib/firebase/admin";
import { BrandMark } from "@/components/brand-mark";
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
      <aside className="relative min-h-72 overflow-hidden sm:min-h-80 lg:min-h-dvh">
        <img
          src="/brand/bintehmas-tower.png"
          alt="BINTEHMAS tower at sunset"
          className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-slate-950/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8 lg:p-12">
          <BrandMark alt="" className="mb-4 h-16 w-16 rounded-2xl border border-white/15 shadow-lg sm:h-20 sm:w-20" />
          <p className="text-xs font-semibold tracking-[0.28em] text-amber-200">BINTEHMAS</p>
          <h1 className="mt-2 max-w-sm text-3xl font-semibold tracking-tight sm:text-4xl">
            Real Estate CRM
          </h1>
          <p className="mt-3 max-w-sm text-sm text-slate-200">
            Listings, leads, and deals for the BINTEHMAS team.
          </p>
        </div>
      </aside>

      <div className="relative flex flex-col lg:min-h-dvh">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_42%)]" />
        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 text-slate-50 shadow-2xl">
            <CardHeader>
              <BrandMark className="mb-3" />
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
                    href="https://console.firebase.google.com/project/bintehmasmultan-crm/settings/serviceaccounts/adminsdk"
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
        <p className="relative z-10 flex flex-wrap items-center justify-end gap-2 px-4 pb-4 text-[11px] leading-snug text-slate-400 sm:px-8 sm:pb-6 sm:text-xs">
          <span>powered by:</span>
          <a
            href="https://gauharaxe.org"
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center rounded-md border border-slate-600 bg-slate-900 px-2.5 py-1 text-right font-medium text-slate-100 transition hover:border-emerald-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Axe&apos;s Era Enterprises
          </a>
        </p>
      </div>
    </div>
  );
}
