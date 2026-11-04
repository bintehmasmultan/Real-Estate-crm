import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { adminDb } from "../src/lib/firebase/admin";

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

async function main() {
  const [teams, invites] = await Promise.all([
    adminDb.collection("teams").get(),
    adminDb.collection("invites").get(),
  ]);
  console.log("teams", teams.size);
  teams.docs.forEach((d) => console.log(" team", d.id, d.data().name));
  console.log("invites", invites.size);
  invites.docs.forEach((d) =>
    console.log(" invite", JSON.stringify({ id: d.id, ...d.data() }))
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
