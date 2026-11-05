import {
  badRequestJson,
  contactContextBundle,
  formatActivitiesBlock,
  formatContactBlock,
  formatDealBlock,
  formatLeadBlock,
  loadScopedContact,
  loadScopedDeal,
  loadScopedLead,
  requireAiSession,
  serverErrorJson,
  unauthorizedJson,
} from "@/lib/ai/access";
import { generateCrmAssist } from "@/lib/ai/generate";

export async function POST(request: Request) {
  const session = await requireAiSession();
  if (!session) return unauthorizedJson();

  let body: {
    contactId?: string;
    dealId?: string;
    leadId?: string;
    channel?: "email" | "whatsapp";
  };
  try {
    body = await request.json();
  } catch {
    return badRequestJson("Invalid JSON body");
  }

  const channel = body.channel === "whatsapp" ? "whatsapp" : "email";

  try {
    if (body.contactId) {
      const scoped = await loadScopedContact(session, body.contactId);
      if (!scoped) return unauthorizedJson();
      const { activities } = await contactContextBundle(
        scoped.contact.id,
        scoped.agentIds
      );
      const text = await generateCrmAssist(
        `Draft a short ${channel} outreach message for this contact.\n` +
          `Do not invent facts. Keep it ready to send.\n\n` +
          `Contact:\n${JSON.stringify(formatContactBlock(scoped.contact), null, 2)}\n\n` +
          `Recent activity:\n${JSON.stringify(formatActivitiesBlock(activities), null, 2)}`
      );
      return Response.json({ text });
    }

    if (body.dealId) {
      const scoped = await loadScopedDeal(session, body.dealId);
      if (!scoped) return unauthorizedJson();
      const text = await generateCrmAssist(
        `Draft a short ${channel} follow-up about this deal.\n` +
          `Deal:\n${JSON.stringify(formatDealBlock(scoped.deal), null, 2)}\n` +
          `Contact:\n${scoped.contact ? JSON.stringify(formatContactBlock(scoped.contact), null, 2) : "none"}`
      );
      return Response.json({ text });
    }

    if (body.leadId) {
      const scoped = await loadScopedLead(session, body.leadId);
      if (!scoped) return unauthorizedJson();
      const text = await generateCrmAssist(
        `Draft a short ${channel} first-response to this inbound lead.\n` +
          `Lead:\n${JSON.stringify(formatLeadBlock(scoped.lead), null, 2)}`
      );
      return Response.json({ text });
    }

    return badRequestJson("Provide contactId, dealId, or leadId");
  } catch (err) {
    console.error("[ai/draft]", err);
    return serverErrorJson();
  }
}
