import { getSnapshot } from "@/lib/sensorData";
import { describeSnapshot } from "@/lib/context";
import { PLANT } from "@/lib/plantConfig";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Chat runs on Hugging Face Inference Providers (OpenAI-compatible API).
 * - HF_TOKEN: a Hugging Face access token with "Make calls to Inference Providers".
 * - HF_MODEL: any chat model available to you. Browse https://huggingface.co/models?inference_provider=all&pipeline_tag=text-generation
 *   You can append ":fastest" or ":cheapest" to let the router choose the backend.
 */
const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";

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

  const token = process.env.HF_TOKEN;
  if (!token) {
    return textResponse(
      "The AI isn't connected yet. Add HF_TOKEN as an environment variable in your hosting settings, then redeploy."
    );
  }

  // Context is built on the server so the client can't tamper with it.
  const snapshot = await getSnapshot();

  const upstream = await fetch(HF_URL, {
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
    console.error("Hugging Face API error", upstream.status, detail);
    const hint =
      upstream.status === 401 || upstream.status === 403
        ? "Check that HF_TOKEN is valid and allowed to call Inference Providers."
        : upstream.status === 429 || upstream.status === 402
        ? "The free usage limit may be used up. Try again later or pick another model."
        : "Check that HF_MODEL is a chat model available to your account.";
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
