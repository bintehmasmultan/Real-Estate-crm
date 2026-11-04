import Link from "next/link";
import { redirect } from "next/navigation";
import { Building } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SignupPage() {
  const session = await getSessionUser();
  if (session?.role === "PENDING") redirect("/pending-approval");
  if (session) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_45%)]" />
      <Card className="relative z-10 w-full max-w-md border-slate-800 bg-slate-900/90 text-slate-50">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600">
            <Building className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Request an account</CardTitle>
          <CardDescription className="text-slate-400">
            New signups stay pending until an admin assigns a role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
          <p className="mt-4 text-center text-sm text-slate-400">
            Already registered?{" "}
            <Link href="/login" className="text-emerald-400 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
