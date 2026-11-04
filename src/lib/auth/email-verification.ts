/** Local demo / bootstrap accounts skip inbox verification. */
export function isEmailVerificationExempt(email?: string | null) {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith("@crm.local");
}

export function verificationContinueUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/verify-email`;
  }
  const base = (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}/verify-email`;
}
