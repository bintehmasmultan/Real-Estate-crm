import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";

export default async function HomePage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (!session.emailVerified) redirect("/verify-email");
  if (session.role === "PENDING") redirect("/pending-approval");
  redirect("/dashboard");
}
