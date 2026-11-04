/**
 * Wipes Firestore CRM data + Firebase Auth users, then creates a bootstrap admin
 * and empty pipeline stages so new accounts can be created cleanly.
 *
 * Requires FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID.
 * Refuses production targets unless ALLOW_PROD_SEED=true.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { adminAuth, adminDb } from "../src/lib/firebase/admin";
import { createDoc, nowIso } from "../src/lib/db/firestore";

function loadEnvFile(relativePath: string) {
  const path = resolve(process.cwd(), relativePath);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val.replace(/\\n/g, "\n");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

function assertResetAllowed() {
  const signals: string[] = [];
  if (process.env.NODE_ENV === "production") signals.push("NODE_ENV=production");
  if (process.env.VERCEL_ENV === "production") signals.push("VERCEL_ENV=production");
  if (process.env.FIREBASE_ENV === "production") signals.push("FIREBASE_ENV=production");

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
  const blockedProjects = (process.env.PRODUCTION_FIREBASE_PROJECT_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (projectId && blockedProjects.includes(projectId)) {
    signals.push(`${projectId} is listed in PRODUCTION_FIREBASE_PROJECT_IDS`);
  }

  if (signals.length === 0) return;

  if (process.env.ALLOW_PROD_SEED === "true") {
    console.warn(
      `ALLOW_PROD_SEED=true set; continuing despite production signals: ${signals.join(", ")}`
    );
    return;
  }

  console.error(
    `Refusing to reset a production target (${signals.join(", ")}).\n` +
      "Set ALLOW_PROD_SEED=true only when you intend to wipe that data."
  );
  process.exit(1);
}

const COLLECTIONS = [
  "notes",
  "activities",
  "tasks",
  "deals",
  "pipelineStages",
  "contactProperties",
  "leads",
  "properties",
  "contacts",
  "invites",
  "messages",
  "users",
  "teams",
];

async function clearCollection(name: string) {
  const snap = await adminDb.collection(name).get();
  if (snap.empty) return;
  const batch = adminDb.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

async function deleteAllAuthUsers() {
  let nextPageToken: string | undefined;
  do {
    const page = await adminAuth.listUsers(1000, nextPageToken);
    await Promise.all(page.users.map((u) => adminAuth.deleteUser(u.uid)));
    nextPageToken = page.pageToken;
  } while (nextPageToken);
}

async function seedPipelineStages() {
  const salesStages = [
    { name: "New Lead", order: 0, color: "#94a3b8" },
    { name: "Contacted", order: 1, color: "#3b82f6" },
    { name: "Viewing Scheduled", order: 2, color: "#8b5cf6" },
    { name: "Offer Made", order: 3, color: "#f59e0b" },
    { name: "Under Contract", order: 4, color: "#10b981" },
    { name: "Closed", order: 5, color: "#059669" },
  ];
  const rentalStages = [
    { name: "New Inquiry", order: 0, color: "#94a3b8" },
    { name: "Contacted", order: 1, color: "#3b82f6" },
    { name: "Viewing Scheduled", order: 2, color: "#8b5cf6" },
    { name: "Application", order: 3, color: "#f59e0b" },
    { name: "Lease Signed", order: 4, color: "#10b981" },
    { name: "Moved In", order: 5, color: "#059669" },
  ];

  for (const s of salesStages) {
    await createDoc("pipelineStages", { ...s, pipeline: "SALES" });
  }
  for (const s of rentalStages) {
    await createDoc("pipelineStages", { ...s, pipeline: "RENTALS" });
  }
}

async function main() {
  assertResetAllowed();

  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error(
      "Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (see .env.example)"
    );
  }

  console.log("Deleting Firebase Auth users…");
  await deleteAllAuthUsers();

  console.log("Clearing Firestore collections…");
  for (const name of COLLECTIONS) {
    await clearCollection(name);
  }

  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@crm.local").toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || "password123";
  const name = process.env.BOOTSTRAP_ADMIN_NAME || "Admin";

  console.log("Creating bootstrap admin…");
  const created = await adminAuth.createUser({
    email,
    password,
    displayName: name,
    emailVerified: true,
  });

  const ts = nowIso();
  await adminDb.collection("users").doc(created.uid).set({
    name,
    email,
    role: "ADMIN",
    teamId: null,
    phone: null,
    avatarUrl: null,
    createdAt: ts,
    updatedAt: ts,
  });

  console.log("Seeding empty pipeline stages…");
  await seedPipelineStages();

  console.log("Reset complete. Bootstrap admin:");
  console.log(`  ${email} / ${password}`);
  console.log("Sign up new accounts at /signup, or invite via Admin → Teams.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
