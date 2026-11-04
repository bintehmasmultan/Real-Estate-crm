import { generateText } from "ai";
import {
  AI_GATEWAY_MODEL,
  AI_MAX_OUTPUT_TOKENS,
  AI_SYSTEM_PROMPT,
} from "@/lib/ai/config";

export async function generateCrmAssist(prompt: string) {
  const { text } = await generateText({
    model: AI_GATEWAY_MODEL,
    instructions: AI_SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: AI_MAX_OUTPUT_TOKENS,
  });
  return text.trim();
}
