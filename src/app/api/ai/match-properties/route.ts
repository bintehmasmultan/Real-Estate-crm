import {
  badRequestJson,
  contactContextBundle,
  formatContactBlock,
  formatLeadBlock,
  formatPropertiesBlock,
  loadScopedContact,
  loadScopedLead,
  requireAiSession,
  serverErrorJson,
  unauthorizedJson,
} from "@/lib/ai/access";
import { generateCrmAssist } from "@/lib/ai/generate";
import { listProperties } from "@/lib/db/crm";

export async function POST(request: Request) {
  const session = await requireAiSession();
  if (!session) return unauthorizedJson();

  let body: { contactId?: string; leadId?: string };
  try {
    body = await request.json();
  } catch {
    return badRequestJson("Invalid JSON body");
  }

  try {
    if (body.contactId) {
      const scoped = await loadScopedContact(session, body.contactId);
      if (!scoped) return unauthorizedJson();
      const { properties } = await contactContextBundle(
        scoped.contact.id,
        scoped.agentIds
      );
      const text = await generateCrmAssist(
        `Suggest the best matching listings for this contact from the provided inventory only.\n` +
          `List up to 5 matches with title, city, price, and a one-line reason. If none fit, say so.\n\n` +
          `Contact:\n${JSON.stringify(formatContactBlock(scoped.contact), null, 2)}\n\n` +
          `Inventory:\n${JSON.stringify(formatPropertiesBlock(properties), null, 2)}`
      );
      return Response.json({ text });
    }

    if (body.leadId) {
      const scoped = await loadScopedLead(session, body.leadId);
      if (!scoped) return unauthorizedJson();
      const properties = await listProperties(scoped.agentIds);
      const text = await generateCrmAssist(
        `Suggest the best matching listings for this lead from the provided inventory only.\n` +
          `List up to 5 matches with title, city, price, and a one-line reason. If none fit, say so.\n\n` +
          `Lead:\n${JSON.stringify(formatLeadBlock(scoped.lead), null, 2)}\n\n` +
          `Inventory:\n${JSON.stringify(formatPropertiesBlock(properties), null, 2)}`
      );
      return Response.json({ text });
    }

    return badRequestJson("Provide contactId or leadId");
  } catch (err) {
    console.error("[ai/match-properties]", err);
    return serverErrorJson();
  }
}
