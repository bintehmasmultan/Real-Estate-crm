import nodemailer from "nodemailer";

export function isGmailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendGmailInvite(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "Gmail not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local"
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `Estate CRM <${user}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}

export function appBaseUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/** Opens Gmail compose in the browser (works without SMTP app password). */
export function gmailComposeUrl(opts: {
  to: string;
  subject: string;
  body: string;
}) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: opts.to,
    su: opts.subject,
    body: opts.body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}
