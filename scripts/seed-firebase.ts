/**
 * Seeds Firestore + Firebase Auth demo data for bintehmasmultan-crm.
 * Requires FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * (load from .env.local when running locally).
 * Refuses to run when NODE_ENV, VERCEL_ENV, or FIREBASE_ENV is production
 * unless ALLOW_PROD_SEED=true.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { adminAuth, adminDb } from "../src/lib/firebase/admin";
import { createDoc, nowIso, newId } from "../src/lib/db/firestore";

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

function assertSeedAllowed() {
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
    `Refusing to seed a production target (${signals.join(", ")}).\n` +
      "This script deletes CRM collections and resets demo Auth users.\n" +
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

async function clearAll() {
  for (const name of COLLECTIONS) {
    await clearCollection(name);
  }
}

const DEMO_USERS = [
  {
    email: "admin@crm.local",
    password: "password123",
    name: "Ayesha Khan",
    role: "ADMIN" as const,
    phone: "+92 300 1111111",
    teamId: null as string | null,
  },
  {
    email: "manager@crm.local",
    password: "password123",
    name: "Bilal Ahmed",
    role: "MANAGER" as const,
    phone: "+92 300 2222222",
    teamId: null as string | null,
  },
  {
    email: "agent@crm.local",
    password: "password123",
    name: "Sara Malik",
    role: "AGENT" as const,
    phone: "+92 300 3333333",
    teamId: null as string | null,
  },
  {
    email: "agent2@crm.local",
    password: "password123",
    name: "Omar Sheikh",
    role: "AGENT" as const,
    phone: "+92 300 4444444",
    teamId: null as string | null,
  },
];

async function ensureAuthUser(email: string, password: string, displayName: string) {
  try {
    const existing = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(existing.uid, { password, displayName });
    return existing.uid;
  } catch {
    const created = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });
    return created.uid;
  }
}

async function main() {
  assertSeedAllowed();

  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error(
      "Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (see .env.example)"
    );
  }

  console.log("Clearing Firestore collections…");
  await clearAll();

  const ts = nowIso();
  const teamId = newId();

  await adminDb.collection("teams").doc(teamId).set({
    name: "Lahore Sales Team",
    managerId: null,
    createdAt: ts,
    updatedAt: ts,
  });

  const uids: Record<string, string> = {};
  for (const u of DEMO_USERS) {
    const uid = await ensureAuthUser(u.email, u.password, u.name);
    uids[u.email] = uid;
    await adminDb.collection("users").doc(uid).set({
      name: u.name,
      email: u.email,
      role: u.role,
      teamId: u.teamId,
      phone: u.phone,
      createdAt: ts,
      updatedAt: ts,
    });
  }

  const adminId = uids["admin@crm.local"]!;
  const managerId = uids["manager@crm.local"]!;
  const agent1Id = uids["agent@crm.local"]!;
  const agent2Id = uids["agent2@crm.local"]!;

  await adminDb.collection("teams").doc(teamId).update({
    managerId,
    updatedAt: nowIso(),
  });
  await adminDb.collection("users").doc(managerId).update({
    teamId,
    updatedAt: nowIso(),
  });
  await adminDb.collection("users").doc(agent1Id).update({
    teamId,
    updatedAt: nowIso(),
  });
  await adminDb.collection("users").doc(agent2Id).update({
    teamId,
    updatedAt: nowIso(),
  });

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

  const createdSalesStages: string[] = [];
  for (const s of salesStages) {
    createdSalesStages.push(
      await createDoc("pipelineStages", { ...s, pipeline: "SALES" })
    );
  }
  const createdRentalStages: string[] = [];
  for (const s of rentalStages) {
    createdRentalStages.push(
      await createDoc("pipelineStages", { ...s, pipeline: "RENTALS" })
    );
  }

  const contactIds = await Promise.all([
    createDoc("contacts", {
      firstName: "Hassan",
      lastName: "Raza",
      email: "hassan.raza@email.com",
      phone: "+92 321 5551001",
      whatsapp: "+92 321 5551001",
      city: "Lahore",
      address: "DHA Phase 5",
      type: "BUYER",
      status: "CLIENT",
      source: "WEBSITE",
      tags: ["hot", "dha"],
      budgetMin: 25000000,
      budgetMax: 45000000,
      preferredLocation: "DHA Phase 5-6",
      preferredType: "HOUSE",
      beds: 5,
      baths: 5,
      assignedAgentId: agent1Id,
    }),
    createDoc("contacts", {
      firstName: "Fatima",
      lastName: "Noor",
      email: "fatima.noor@email.com",
      phone: "+92 321 5551002",
      city: "Lahore",
      type: "TENANT",
      status: "ACTIVE",
      source: "FACEBOOK",
      tags: ["rental", "gulberg"],
      budgetMax: 150000,
      preferredLocation: "Gulberg",
      preferredType: "APARTMENT",
      beds: 2,
      baths: 2,
      assignedAgentId: agent1Id,
    }),
    createDoc("contacts", {
      firstName: "Imran",
      lastName: "Qureshi",
      email: "imran.q@email.com",
      phone: "+92 321 5551003",
      city: "Lahore",
      type: "SELLER",
      status: "CLIENT",
      source: "REFERRAL",
      tags: ["seller", "bahria"],
      assignedAgentId: agent2Id,
    }),
    createDoc("contacts", {
      firstName: "Nadia",
      lastName: "Siddiqui",
      email: "nadia.s@email.com",
      phone: "+92 321 5551004",
      city: "Islamabad",
      type: "INVESTOR",
      status: "ACTIVE",
      source: "WALK_IN",
      tags: ["investor", "commercial"],
      budgetMin: 50000000,
      budgetMax: 120000000,
      preferredType: "COMMERCIAL",
      assignedAgentId: agent2Id,
    }),
    createDoc("contacts", {
      firstName: "Usman",
      lastName: "Ali",
      email: "usman.ali@email.com",
      phone: "+92 321 5551005",
      city: "Lahore",
      type: "LANDLORD",
      status: "ACTIVE",
      source: "REFERRAL",
      tags: ["landlord"],
      assignedAgentId: agent1Id,
    }),
    createDoc("contacts", {
      firstName: "Zara",
      lastName: "Hussain",
      email: "zara.h@email.com",
      phone: "+92 321 5551006",
      city: "Lahore",
      type: "BUYER",
      status: "LEAD",
      source: "ZAMEEN",
      tags: ["new"],
      budgetMax: 18000000,
      preferredLocation: "Johar Town",
      preferredType: "APARTMENT",
      beds: 3,
      assignedAgentId: agent2Id,
    }),
  ]);

  const propertyIds = await Promise.all([
    createDoc("properties", {
      title: "5 Marla Modern House - DHA Phase 5",
      address: "Street 12, Block A, DHA Phase 5",
      city: "Lahore",
      type: "HOUSE",
      status: "AVAILABLE",
      price: 38500000,
      area: 5,
      areaUnit: "marla",
      beds: 4,
      baths: 4,
      description: "Newly renovated house with lawn and servant quarter.",
      photos: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      ],
      documents: [],
      listingAgentId: agent1Id,
      ownerContactId: contactIds[2],
    }),
    createDoc("properties", {
      title: "2 Bed Apartment - Gulberg III",
      address: "MM Alam Road, Gulberg III",
      city: "Lahore",
      type: "APARTMENT",
      status: "AVAILABLE",
      price: 125000,
      area: 1200,
      areaUnit: "sqft",
      beds: 2,
      baths: 2,
      description: "Furnished apartment available for rent.",
      photos: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      ],
      documents: [],
      listingAgentId: agent1Id,
      ownerContactId: contactIds[4],
    }),
    createDoc("properties", {
      title: "10 Marla Corner Plot - Bahria Town",
      address: "Sector C, Bahria Town",
      city: "Lahore",
      type: "PLOT",
      status: "UNDER_OFFER",
      price: 22000000,
      area: 10,
      areaUnit: "marla",
      description: "Corner plot with dual road access.",
      photos: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
      ],
      documents: [],
      listingAgentId: agent2Id,
      ownerContactId: contactIds[2],
    }),
    createDoc("properties", {
      title: "Commercial Plaza Shop - Liberty",
      address: "Liberty Market, Gulberg",
      city: "Lahore",
      type: "COMMERCIAL",
      status: "AVAILABLE",
      price: 75000000,
      area: 1800,
      areaUnit: "sqft",
      description: "Ground floor shop with high footfall.",
      photos: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
      ],
      documents: [],
      listingAgentId: agent2Id,
      ownerContactId: contactIds[3],
    }),
    createDoc("properties", {
      title: "1 Kanal Luxury Villa - DHA Phase 6",
      address: "Block C, DHA Phase 6",
      city: "Lahore",
      type: "HOUSE",
      status: "AVAILABLE",
      price: 95000000,
      area: 20,
      areaUnit: "marla",
      beds: 6,
      baths: 7,
      description: "Luxury villa with pool and basement.",
      photos: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
      ],
      documents: [],
      listingAgentId: agent1Id,
      ownerContactId: contactIds[4],
    }),
    createDoc("properties", {
      title: "3 Bed Flat - Johar Town",
      address: "Block H, Johar Town",
      city: "Lahore",
      type: "APARTMENT",
      status: "SOLD",
      price: 16500000,
      area: 1450,
      areaUnit: "sqft",
      beds: 3,
      baths: 3,
      photos: [],
      documents: [],
      listingAgentId: agent2Id,
      ownerContactId: contactIds[2],
    }),
  ]);

  for (const row of [
    { contactId: contactIds[0], propertyId: propertyIds[0], interest: "viewing" },
    { contactId: contactIds[0], propertyId: propertyIds[4], interest: "interested" },
    { contactId: contactIds[1], propertyId: propertyIds[1], interest: "viewing" },
    { contactId: contactIds[3], propertyId: propertyIds[3], interest: "offer" },
    { contactId: contactIds[5], propertyId: propertyIds[5], interest: "interested" },
  ]) {
    await createDoc("contactProperties", { ...row, createdAt: nowIso() });
  }

  const dealIds = await Promise.all([
    createDoc("deals", {
      title: "Hassan – DHA Phase 5 House",
      pipeline: "SALES",
      stageId: createdSalesStages[2],
      value: 38500000,
      probability: 60,
      expectedCloseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
      contactId: contactIds[0],
      propertyId: propertyIds[0],
      agentId: agent1Id,
    }),
    createDoc("deals", {
      title: "Nadia – Liberty Shop",
      pipeline: "SALES",
      stageId: createdSalesStages[3],
      value: 75000000,
      probability: 70,
      expectedCloseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
      contactId: contactIds[3],
      propertyId: propertyIds[3],
      agentId: agent2Id,
    }),
    createDoc("deals", {
      title: "Imran Plot – Bahria",
      pipeline: "SALES",
      stageId: createdSalesStages[4],
      value: 22000000,
      probability: 85,
      expectedCloseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      contactId: contactIds[2],
      propertyId: propertyIds[2],
      agentId: agent2Id,
    }),
    createDoc("deals", {
      title: "Zara – Johar Town Flat",
      pipeline: "SALES",
      stageId: createdSalesStages[5],
      value: 16500000,
      probability: 100,
      expectedCloseDate: new Date().toISOString(),
      closedAt: new Date().toISOString(),
      contactId: contactIds[5],
      propertyId: propertyIds[5],
      agentId: agent2Id,
    }),
    createDoc("deals", {
      title: "Fatima – Gulberg Apartment Rent",
      pipeline: "RENTALS",
      stageId: createdRentalStages[2],
      value: 125000,
      probability: 55,
      expectedCloseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
      contactId: contactIds[1],
      propertyId: propertyIds[1],
      agentId: agent1Id,
    }),
    createDoc("deals", {
      title: "Usman Landlord – New Tenant Search",
      pipeline: "RENTALS",
      stageId: createdRentalStages[1],
      value: 180000,
      probability: 40,
      contactId: contactIds[4],
      propertyId: propertyIds[4],
      agentId: agent1Id,
    }),
  ]);

  for (const lead of [
    {
      firstName: "Ali",
      lastName: "Mehmood",
      email: "ali.m@email.com",
      phone: "+92 321 7771001",
      source: "WEBSITE",
      status: "NEW",
      score: 72,
      message: "Looking for a 5 marla house in DHA.",
      budget: 40000000,
      preferredType: "HOUSE",
      preferredLocation: "DHA",
      assignedAgentId: agent1Id,
    },
    {
      firstName: "Hina",
      lastName: "Bajwa",
      email: "hina.b@email.com",
      phone: "+92 321 7771002",
      source: "FACEBOOK",
      status: "CONTACTED",
      score: 65,
      message: "Need a rental near MM Alam.",
      budget: 140000,
      preferredType: "APARTMENT",
      preferredLocation: "Gulberg",
      assignedAgentId: agent1Id,
    },
    {
      firstName: "Kamran",
      lastName: "Iqbal",
      email: "kamran.i@email.com",
      phone: "+92 321 7771003",
      source: "WALK_IN",
      status: "QUALIFIED",
      score: 80,
      budget: 90000000,
      preferredType: "COMMERCIAL",
      preferredLocation: "Liberty",
      assignedAgentId: agent2Id,
    },
    {
      firstName: "Sana",
      lastName: "Tariq",
      email: "sana.t@email.com",
      phone: "+92 321 7771004",
      source: "REFERRAL",
      status: "NEW",
      score: 58,
      message: "Interested in plots in Bahria.",
      budget: 25000000,
      preferredType: "PLOT",
      preferredLocation: "Bahria Town",
      assignedAgentId: agent2Id,
    },
  ]) {
    await createDoc("leads", lead);
  }

  for (const task of [
    {
      title: "Schedule DHA Phase 5 viewing",
      description: "Confirm slot with Hassan Raza",
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      priority: "HIGH",
      status: "TODO",
      assigneeId: agent1Id,
      createdById: managerId,
      contactId: contactIds[0],
      propertyId: propertyIds[0],
      dealId: dealIds[0],
    },
    {
      title: "Follow up on Liberty shop offer",
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
      priority: "URGENT",
      status: "IN_PROGRESS",
      assigneeId: agent2Id,
      createdById: managerId,
      contactId: contactIds[3],
      dealId: dealIds[1],
    },
    {
      title: "Prepare rental agreement draft",
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      priority: "MEDIUM",
      status: "TODO",
      assigneeId: agent1Id,
      createdById: agent1Id,
      contactId: contactIds[1],
      dealId: dealIds[4],
    },
    {
      title: "Call new website leads",
      dueAt: new Date().toISOString(),
      priority: "HIGH",
      status: "TODO",
      assigneeId: agent1Id,
      createdById: managerId,
    },
    {
      title: "Collect documents for Bahria plot",
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(),
      priority: "MEDIUM",
      status: "TODO",
      assigneeId: agent2Id,
      createdById: agent2Id,
      propertyId: propertyIds[2],
      dealId: dealIds[2],
    },
  ]) {
    await createDoc("tasks", task);
  }

  for (const activity of [
    {
      type: "CALL",
      subject: "Intro call with Hassan",
      body: "Discussed budget and preferred locations in DHA.",
      createdById: agent1Id,
      contactId: contactIds[0],
      dealId: dealIds[0],
    },
    {
      type: "VIEWING",
      subject: "Site visit – Gulberg apartment",
      body: "Fatima liked the layout; requesting second visit.",
      createdById: agent1Id,
      contactId: contactIds[1],
      propertyId: propertyIds[1],
      dealId: dealIds[4],
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
      type: "EMAIL",
      subject: "Sent listing pack to Nadia",
      body: "Shared commercial comps and ROI sheet.",
      createdById: agent2Id,
      contactId: contactIds[3],
      dealId: dealIds[1],
    },
    {
      type: "MEETING",
      subject: "Contract review – Bahria plot",
      body: "Lawyer review scheduled for Friday.",
      createdById: agent2Id,
      contactId: contactIds[2],
      dealId: dealIds[2],
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      type: "NOTE",
      subject: "Hot lead from Facebook ads",
      body: "Hina asked for weekend viewing slots.",
      createdById: agent1Id,
      contactId: contactIds[1],
    },
    {
      type: "STATUS_CHANGE",
      subject: "Deal moved to Closed",
      body: "Johar Town flat sold to Zara Hussain.",
      createdById: agent2Id,
      contactId: contactIds[5],
      dealId: dealIds[3],
      propertyId: propertyIds[5],
    },
  ]) {
    await createDoc("activities", { ...activity, createdAt: nowIso() });
  }

  for (const note of [
    {
      body: "Prefers corner plots with dual access roads.",
      authorId: agent2Id,
      contactId: contactIds[3],
    },
    {
      body: "Owner flexible on price by 5% for cash buyers.",
      authorId: agent1Id,
      propertyId: propertyIds[0],
    },
    {
      body: "Need NOC copy before under-contract stage.",
      authorId: agent2Id,
      dealId: dealIds[2],
    },
  ]) {
    await createDoc("notes", note);
  }

  console.log("Seed complete.");
  console.log("Demo logins (password123):");
  console.log("  admin@crm.local");
  console.log("  manager@crm.local");
  console.log("  agent@crm.local");
  console.log("  agent2@crm.local");
  void adminId;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
