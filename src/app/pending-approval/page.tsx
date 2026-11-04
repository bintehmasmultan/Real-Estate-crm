import { redirect } from "next/navigation";
import { Building } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PendingApprovalPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!session.emailVerified) redirect("/verify-email");
  if (session.role !== "PENDING") redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 text-slate-50">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600">
            <Building className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Waiting for approval</CardTitle>
          <CardDescription className="text-slate-400">
            {session.name}, your account is signed in but does not have CRM access yet.
            An admin needs to assign Admin, Manager, or Agent before you can open the workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}
