import Link from "next/link";
import { redirect } from "next/navigation";
import { Building } from "lucide-react";
import { auth } from "@/lib/auth";
import { signupAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_45%)]" />
      <Card className="relative z-10 w-full max-w-md border-slate-800 bg-slate-900/90 text-slate-50">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600">
            <Building className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Create agent account</CardTitle>
          <CardDescription className="text-slate-400">
            New signups start with the Agent role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signupAction} className="space-y-4">
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
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
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
