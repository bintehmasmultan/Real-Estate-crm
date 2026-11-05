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
import { listActivities } from "@/lib/db/crm";

export async function POST(request: Request) {
  const session = await requireAiSession();
  if (!session) return unauthorizedJson();

  let body: { contactId?: string; dealId?: string; leadId?: string };
  try {
    body = await request.json();
  } catch {
    return badRequestJson("Invalid JSON body");
  }

  try {
    if (body.contactId) {
      const scoped = await loadScopedContact(session, body.contactId);
      if (!scoped) return unauthorizedJson();
      const { activities } = await contactContextBundle(
        scoped.contact.id,
        scoped.agentIds
      );
      const text = await generateCrmAssist(
        `Summarize this contact for a busy real-estate agent. Cover status, preferences, and recent activity. Use bullets.\n\n` +
          `Contact:\n${JSON.stringify(formatContactBlock(scoped.contact), null, 2)}\n\n` +
          `Activity:\n${JSON.stringify(formatActivitiesBlock(activities), null, 2)}`
      );
      return Response.json({ text });
    }

    if (body.dealId) {
      const scoped = await loadScopedDeal(session, body.dealId);
      if (!scoped) return unauthorizedJson();
      const activities = scoped.contact
        ? await listActivities({ contactId: scoped.contact.id, limit: 12 })
        : [];
      const text = await generateCrmAssist(
        `Summarize this deal and related contact activity. Use bullets.\n\n` +
          `Deal:\n${JSON.stringify(formatDealBlock(scoped.deal), null, 2)}\n` +
          `Contact:\n${scoped.contact ? JSON.stringify(formatContactBlock(scoped.contact), null, 2) : "none"}\n` +
          `Activity:\n${JSON.stringify(formatActivitiesBlock(activities), null, 2)}`
      );
      return Response.json({ text });
    }

    if (body.leadId) {
      const scoped = await loadScopedLead(session, body.leadId);
      if (!scoped) return unauthorizedJson();
      const text = await generateCrmAssist(
        `Summarize this lead for qualification. Use bullets.\n\n` +
          `Lead:\n${JSON.stringify(formatLeadBlock(scoped.lead), null, 2)}`
      );
      return Response.json({ text });
    }

    return badRequestJson("Provide contactId, dealId, or leadId");
  } catch (err) {
    console.error("[ai/summarize]", err);
    return serverErrorJson();
  }
}
