import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.note.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.contactProperty.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.property.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const team = await prisma.team.create({
    data: { name: "Lahore Sales Team" },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Ayesha Khan",
      email: "admin@crm.local",
      passwordHash,
      role: "ADMIN",
      phone: "+92 300 1111111",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Bilal Ahmed",
      email: "manager@crm.local",
      passwordHash,
      role: "MANAGER",
      teamId: team.id,
      phone: "+92 300 2222222",
    },
  });

  await prisma.team.update({
    where: { id: team.id },
    data: { managerId: manager.id },
  });

  const agent1 = await prisma.user.create({
    data: {
      name: "Sara Malik",
      email: "agent@crm.local",
      passwordHash,
      role: "AGENT",
      teamId: team.id,
      phone: "+92 300 3333333",
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      name: "Omar Sheikh",
      email: "agent2@crm.local",
      passwordHash,
      role: "AGENT",
      teamId: team.id,
      phone: "+92 300 4444444",
    },
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

  const createdSalesStages = await Promise.all(
    salesStages.map((s) =>
      prisma.pipelineStage.create({
        data: { ...s, pipeline: "SALES" },
      })
    )
  );

  const createdRentalStages = await Promise.all(
    rentalStages.map((s) =>
      prisma.pipelineStage.create({
        data: { ...s, pipeline: "RENTALS" },
      })
    )
  );

  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
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
        tags: JSON.stringify(["hot", "dha"]),
        budgetMin: 25000000,
        budgetMax: 45000000,
        preferredLocation: "DHA Phase 5-6",
        preferredType: "HOUSE",
        beds: 5,
        baths: 5,
        assignedAgentId: agent1.id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: "Fatima",
        lastName: "Noor",
        email: "fatima.noor@email.com",
        phone: "+92 321 5551002",
        city: "Lahore",
        type: "TENANT",
        status: "ACTIVE",
        source: "FACEBOOK",
        tags: JSON.stringify(["rental", "gulberg"]),
        budgetMax: 150000,
        preferredLocation: "Gulberg",
        preferredType: "APARTMENT",
        beds: 2,
        baths: 2,
        assignedAgentId: agent1.id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: "Imran",
        lastName: "Qureshi",
        email: "imran.q@email.com",
        phone: "+92 321 5551003",
        city: "Lahore",
        type: "SELLER",
        status: "CLIENT",
        source: "REFERRAL",
        tags: JSON.stringify(["seller", "bahria"]),
        assignedAgentId: agent2.id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: "Nadia",
        lastName: "Siddiqui",
        email: "nadia.s@email.com",
        phone: "+92 321 5551004",
        city: "Islamabad",
        type: "INVESTOR",
        status: "ACTIVE",
        source: "WALK_IN",
        tags: JSON.stringify(["investor", "commercial"]),
        budgetMin: 50000000,
        budgetMax: 120000000,
        preferredType: "COMMERCIAL",
        assignedAgentId: agent2.id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: "Usman",
        lastName: "Ali",
        email: "usman.ali@email.com",
        phone: "+92 321 5551005",
        city: "Lahore",
        type: "LANDLORD",
        status: "ACTIVE",
        source: "REFERRAL",
        tags: JSON.stringify(["landlord"]),
        assignedAgentId: agent1.id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: "Zara",
        lastName: "Hussain",
        email: "zara.h@email.com",
        phone: "+92 321 5551006",
        city: "Lahore",
        type: "BUYER",
        status: "LEAD",
        source: "ZAMEEN",
        tags: JSON.stringify(["new"]),
        budgetMax: 18000000,
        preferredLocation: "Johar Town",
        preferredType: "APARTMENT",
        beds: 3,
        assignedAgentId: agent2.id,
      },
    }),
  ]);

  const properties = await Promise.all([
    prisma.property.create({
      data: {
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
        photos: JSON.stringify([
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
        ]),
        listingAgentId: agent1.id,
        ownerContactId: contacts[2].id,
      },
    }),
    prisma.property.create({
      data: {
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
        photos: JSON.stringify([
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
        ]),
        listingAgentId: agent1.id,
        ownerContactId: contacts[4].id,
      },
    }),
    prisma.property.create({
      data: {
        title: "10 Marla Corner Plot - Bahria Town",
        address: "Sector C, Bahria Town",
        city: "Lahore",
        type: "PLOT",
        status: "UNDER_OFFER",
        price: 22000000,
        area: 10,
        areaUnit: "marla",
        description: "Corner plot with dual road access.",
        photos: JSON.stringify([
          "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        ]),
        listingAgentId: agent2.id,
        ownerContactId: contacts[2].id,
      },
    }),
    prisma.property.create({
      data: {
        title: "Commercial Plaza Shop - Liberty",
        address: "Liberty Market, Gulberg",
        city: "Lahore",
        type: "COMMERCIAL",
        status: "AVAILABLE",
        price: 75000000,
        area: 1800,
        areaUnit: "sqft",
        description: "Ground floor shop with high footfall.",
        photos: JSON.stringify([
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
        ]),
        listingAgentId: agent2.id,
        ownerContactId: contacts[3].id,
      },
    }),
    prisma.property.create({
      data: {
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
        photos: JSON.stringify([
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        ]),
        listingAgentId: agent1.id,
        ownerContactId: contacts[4].id,
      },
    }),
    prisma.property.create({
      data: {
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
        listingAgentId: agent2.id,
        ownerContactId: contacts[2].id,
      },
    }),
  ]);

  await prisma.contactProperty.createMany({
    data: [
      { contactId: contacts[0].id, propertyId: properties[0].id, interest: "viewing" },
      { contactId: contacts[0].id, propertyId: properties[4].id, interest: "interested" },
      { contactId: contacts[1].id, propertyId: properties[1].id, interest: "viewing" },
      { contactId: contacts[3].id, propertyId: properties[3].id, interest: "offer" },
      { contactId: contacts[5].id, propertyId: properties[5].id, interest: "interested" },
    ],
  });

  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        title: "Hassan – DHA Phase 5 House",
        pipeline: "SALES",
        stageId: createdSalesStages[2].id,
        value: 38500000,
        probability: 60,
        expectedCloseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
        contactId: contacts[0].id,
        propertyId: properties[0].id,
        agentId: agent1.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: "Nadia – Liberty Shop",
        pipeline: "SALES",
        stageId: createdSalesStages[3].id,
        value: 75000000,
        probability: 70,
        expectedCloseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        contactId: contacts[3].id,
        propertyId: properties[3].id,
        agentId: agent2.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: "Imran Plot – Bahria",
        pipeline: "SALES",
        stageId: createdSalesStages[4].id,
        value: 22000000,
        probability: 85,
        expectedCloseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        contactId: contacts[2].id,
        propertyId: properties[2].id,
        agentId: agent2.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: "Zara – Johar Town Flat",
        pipeline: "SALES",
        stageId: createdSalesStages[5].id,
        value: 16500000,
        probability: 100,
        expectedCloseDate: new Date(),
        closedAt: new Date(),
        contactId: contacts[5].id,
        propertyId: properties[5].id,
        agentId: agent2.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: "Fatima – Gulberg Apartment Rent",
        pipeline: "RENTALS",
        stageId: createdRentalStages[2].id,
        value: 125000,
        probability: 55,
        expectedCloseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
        contactId: contacts[1].id,
        propertyId: properties[1].id,
        agentId: agent1.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: "Usman Landlord – New Tenant Search",
        pipeline: "RENTALS",
        stageId: createdRentalStages[1].id,
        value: 180000,
        probability: 40,
        contactId: contacts[4].id,
        propertyId: properties[4].id,
        agentId: agent1.id,
      },
    }),
  ]);

  await prisma.lead.createMany({
    data: [
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
        assignedAgentId: agent1.id,
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
        assignedAgentId: agent1.id,
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
        assignedAgentId: agent2.id,
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
        assignedAgentId: agent2.id,
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Schedule DHA Phase 5 viewing",
        description: "Confirm slot with Hassan Raza",
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        priority: "HIGH",
        status: "TODO",
        assigneeId: agent1.id,
        createdById: manager.id,
        contactId: contacts[0].id,
        propertyId: properties[0].id,
        dealId: deals[0].id,
      },
      {
        title: "Follow up on Liberty shop offer",
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
        priority: "URGENT",
        status: "IN_PROGRESS",
        assigneeId: agent2.id,
        createdById: manager.id,
        contactId: contacts[3].id,
        dealId: deals[1].id,
      },
      {
        title: "Prepare rental agreement draft",
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 72),
        priority: "MEDIUM",
        status: "TODO",
        assigneeId: agent1.id,
        createdById: agent1.id,
        contactId: contacts[1].id,
        dealId: deals[4].id,
      },
      {
        title: "Call new website leads",
        dueAt: new Date(),
        priority: "HIGH",
        status: "TODO",
        assigneeId: agent1.id,
        createdById: manager.id,
      },
      {
        title: "Collect documents for Bahria plot",
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
        priority: "MEDIUM",
        status: "TODO",
        assigneeId: agent2.id,
        createdById: agent2.id,
        propertyId: properties[2].id,
        dealId: deals[2].id,
      },
    ],
  });

  await prisma.activity.createMany({
    data: [
      {
        type: "CALL",
        subject: "Intro call with Hassan",
        body: "Discussed budget and preferred locations in DHA.",
        createdById: agent1.id,
        contactId: contacts[0].id,
        dealId: deals[0].id,
      },
      {
        type: "VIEWING",
        subject: "Site visit – Gulberg apartment",
        body: "Fatima liked the layout; requesting second visit.",
        createdById: agent1.id,
        contactId: contacts[1].id,
        propertyId: properties[1].id,
        dealId: deals[4].id,
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      },
      {
        type: "EMAIL",
        subject: "Sent listing pack to Nadia",
        body: "Shared commercial comps and ROI sheet.",
        createdById: agent2.id,
        contactId: contacts[3].id,
        dealId: deals[1].id,
      },
      {
        type: "MEETING",
        subject: "Contract review – Bahria plot",
        body: "Lawyer review scheduled for Friday.",
        createdById: agent2.id,
        contactId: contacts[2].id,
        dealId: deals[2].id,
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      },
      {
        type: "NOTE",
        subject: "Hot lead from Facebook ads",
        body: "Hina asked for weekend viewing slots.",
        createdById: agent1.id,
        contactId: contacts[1].id,
      },
      {
        type: "STATUS_CHANGE",
        subject: "Deal moved to Closed",
        body: "Johar Town flat sold to Zara Hussain.",
        createdById: agent2.id,
        contactId: contacts[5].id,
        dealId: deals[3].id,
        propertyId: properties[5].id,
      },
    ],
  });

  await prisma.note.createMany({
    data: [
      {
        body: "Prefers corner plots with dual access roads.",
        authorId: agent2.id,
        contactId: contacts[3].id,
      },
      {
        body: "Owner flexible on price by 5% for cash buyers.",
        authorId: agent1.id,
        propertyId: properties[0].id,
      },
      {
        body: "Need NOC copy before under-contract stage.",
        authorId: agent2.id,
        dealId: deals[2].id,
      },
    ],
  });

  console.log("Seed complete");
  console.log("Logins:");
  console.log("  admin@crm.local / password123");
  console.log("  manager@crm.local / password123");
  console.log("  agent@crm.local / password123");
  console.log(`Admin: ${admin.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
