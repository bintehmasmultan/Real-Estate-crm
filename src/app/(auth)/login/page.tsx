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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.2),_transparent_40%)]" />
      <Card className="relative z-10 w-full max-w-md border-slate-800 bg-slate-900/90 text-slate-50 shadow-2xl">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600">
            <Building className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Sign in to EstateCRM</CardTitle>
          <CardDescription className="text-slate-400">
            Team accounts require email verification (or Google sign-in)
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
  );
}
