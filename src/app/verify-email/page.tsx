import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { BrandMark } from "@/components/brand-mark";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function VerifyEmailPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (session.emailVerified) {
    if (session.role === "PENDING") redirect("/pending-approval");
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 text-slate-50">
        <CardHeader>
          <BrandMark className="mb-3" />
          <CardTitle className="text-2xl text-white">Verify your email</CardTitle>
          <CardDescription className="text-slate-400">
            Team access requires a verified inbox before you can open the CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VerifyEmailPanel email={session.email} />
        </CardContent>
      </Card>
    </div>
  );
}
