import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv(relativePath: string) {
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

loadEnv(".env.local");
loadEnv(".env");

async function main() {
  const { getAdminAuth, getAdminDb, hasFirebaseAdminCredentials } =
    await import("../src/lib/firebase/admin");

  console.log("adminCredentials:", hasFirebaseAdminCredentials());
  const db = getAdminDb();
  const auth = getAdminAuth();
  const collections = [
    "users",
    "contacts",
    "properties",
    "leads",
    "deals",
    "pipelineStages",
    "tasks",
    "activities",
  ];

  for (const name of collections) {
    const snap = await db.collection(name).count().get();
    console.log(`${name}: ${snap.data().count}`);
  }

  const users = await auth.listUsers(10);
  console.log(
    "authUsers:",
    users.users.map((u) => u.email).join(", ")
  );
  console.log("OK");
}

main().catch((e) => {
  console.error("FAIL", e instanceof Error ? e.message : e);
  process.exit(1);
});
