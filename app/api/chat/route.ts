import { getSnapshot } from "@/lib/sensorData";
import { describeSnapshot } from "@/lib/context";
import { PLANT } from "@/lib/plantConfig";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Chat uses any OpenAI-compatible LLM API. Defaults to Groq's free tier.
 * - LLM_API_KEY:  your provider's API key (server-side only).
 * - LLM_BASE_URL: provider endpoint, e.g.
 *     Groq        https://api.groq.com/openai/v1   (default)
 *     Cerebras    https://api.cerebras.ai/v1
 *     OpenRouter  https://openrouter.ai/api/v1
 *     Gemini      https://generativelanguage.googleapis.com/v1beta/openai
 * - LLM_MODEL:    model id from that provider.
 * Switching providers only means changing these three variables, not the code.
 */
const BASE_URL = (process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
const MODEL = process.env.LLM_MODEL || "openai/gpt-oss-120b";

const SYSTEM = (context: string) => `You are Plant Advisor, a friendly, knowledgeable gardener who looks after a ${PLANT.name}. You can see the plant's live sensor readings and its camera observations below.

How to answer:
- Answer the user's actual question first, in plain language. Keep it short (under about 120 words) unless they ask for detail.
- Ground advice in the data below. Mention a reading only when it matters to the answer.
- Be specific: amounts, timing, and what to change first. Say what you would do this week.
- If the data can't answer something, say what to check or measure instead of guessing. Never invent readings.
- Write plain text. No markdown headings or tables. Short lists are fine when listing steps.

Current plant data:
${context}`;

type ChatMessage = { role: "user" | "assistant"; content: string };

function textResponse(text: string, status = 200) {
  return new Response(text, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function POST(req: Request) {
  let messages: ChatMessage[] = [];
  try {
    const body = await req.json();
    messages = (body.messages ?? [])
      .filter((m: ChatMessage) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-20);
  } catch {
    return textResponse("Bad request.", 400);
  }
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return textResponse("Ask me something about your plant.", 400);
  }

  const token = process.env.LLM_API_KEY;
  if (!token) {
    return textResponse(
      "The AI isn't connected yet. Add LLM_API_KEY as an environment variable in your hosting settings, then redeploy."
    );
  }

  // Context is built on the server so the client can't tamper with it.
  const snapshot = await getSnapshot();

  const upstream = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      max_tokens: 600,
      temperature: 0.5,
      messages: [{ role: "system", content: SYSTEM(describeSnapshot(snapshot)) }, ...messages],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("LLM API error", upstream.status, detail);
    const hint =
      upstream.status === 401 || upstream.status === 403
        ? "Check that LLM_API_KEY is valid and matches LLM_BASE_URL."
        : upstream.status === 429 || upstream.status === 402
        ? "The free usage limit was reached. Wait a minute and try again, or try again tomorrow."
        : "Check that LLM_MODEL is a valid chat model for this provider.";
    return textResponse(`I couldn't get an answer from the AI service. ${hint}`, 502);
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.body.getReader();

  // Convert the SSE stream into plain text, and drop any <think>…</think> reasoning some models emit.
  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      let pending = "";
      let thinking = false;

      const emit = (chunk: string) => {
        pending += chunk;
        while (true) {
          if (thinking) {
            const end = pending.indexOf("</think>");
            if (end === -1) { pending = pending.slice(-8); return; }
            pending = pending.slice(end + 8).replace(/^\s+/, "");
            thinking = false;
          } else {
            const start = pending.indexOf("<think>");
            if (start === -1) {
              // Hold back a possible partial "<think>" tag at the end.
              const keep = Math.min(pending.length, 6);
              const out = pending.slice(0, pending.length - keep);
              if (out) controller.enqueue(encoder.encode(out));
              pending = pending.slice(pending.length - keep);
              return;
            }
            if (start > 0) controller.enqueue(encoder.encode(pending.slice(0, start)));
            pending = pending.slice(start + 7);
            thinking = true;
          }
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const evt of events) {
            const line = evt.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const text = JSON.parse(data).choices?.[0]?.delta?.content;
              if (text) emit(text);
            } catch {
              /* ignore malformed event */
            }
          }
        }
        if (!thinking && pending) controller.enqueue(encoder.encode(pending));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
