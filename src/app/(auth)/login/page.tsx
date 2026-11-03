import Link from "next/link";
import { redirect } from "next/navigation";
import { Building } from "lucide-react";
import { auth } from "@/lib/auth";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

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
            Use a seeded demo account or your own credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Email</Label>
              <Input
                name="email"
                type="email"
                required
                defaultValue="admin@crm.local"
                className="border-slate-700 bg-slate-950 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Password</Label>
              <Input
                name="password"
                type="password"
                required
                defaultValue="password123"
                className="border-slate-700 bg-slate-950 text-white"
              />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-400">
            No account?{" "}
            <Link href="/signup" className="text-emerald-400 hover:underline">
              Create one
            </Link>
          </p>
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-400">
            Demo: admin@crm.local / manager@crm.local / agent@crm.local — password123
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
