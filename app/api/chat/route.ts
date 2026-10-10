import { getSnapshot } from "@/lib/sensorData";
import { describeSnapshot } from "@/lib/context";
import { PLANT, SENSORS } from "@/lib/plantConfig";
import { applyOffsets, runAction, sanitizeOffsets, TOOLS, type Offsets } from "@/lib/effects";
import type { PlantAction } from "@/lib/actions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Chat uses any OpenAI-compatible LLM API with tool calling. Defaults to Groq's free tier.
 * - LLM_API_KEY:  your provider's API key (server-side only).
 * - LLM_BASE_URL: provider endpoint, e.g.
 *     Groq        https://api.groq.com/openai/v1   (default)
 *     Cerebras    https://api.cerebras.ai/v1
 *     OpenRouter  https://openrouter.ai/api/v1
 *     Gemini      https://generativelanguage.googleapis.com/v1beta/openai
 * - LLM_MODEL:    a model id from that provider that supports tool calling.
 */
const BASE_URL = (process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
const MODEL = process.env.LLM_MODEL || "openai/gpt-oss-120b";

const SYSTEM = (context: string) => `You are Plant Advisor, the caretaker of a ${PLANT.name}. You see its live sensors and camera, and you can act on the plant using tools: water it, dose nitrogen/phosphorus/potassium fertilizer salts, adjust pH, flush salts out of the soil, run the humidifier, and turn on the grow light.

Rules:
1. Everything you say must come from the data below. Quote readings and numbers exactly as given. Never invent a reading, an action, a time, or a result.
2. You can answer any question about the plant, its care, or your actions, and you always connect the answer to the data. If a question is unrelated to the plant, say so in one sentence and steer back to what the data shows.
3. "What was the last action you took?" → describe the NEWEST entry of the action history: what you did, the exact before → after values, how long ago, and why. Include actions you take in this conversation, which are the newest.
4. Take an action with a tool when the user asks you to act ("water it", "fix it", "take care of the plant", "do what it needs"), choosing amounts yourself from the data. If the user only asks a question, answer it and offer to act instead of acting.
5. Tools refuse unsafe actions. If a tool says it isn't allowed, tell the user the reason and don't retry the same thing. After a successful action, report exactly the before → after values the tool returned.
6. Be warm and brief: usually 2–5 short sentences, under about 120 words. Plain text, no markdown headings or tables.

Current data:
${context}`;

type ChatMessage = { role: "user" | "assistant"; content: string };
type Evt =
  | { type: "text"; text: string }
  | { type: "action"; action: PlantAction; offsets: Offsets };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  let messages: ChatMessage[] = [];
  let offsets: Offsets = {};
  let sessionActions: PlantAction[] = [];
  try {
    const body = await req.json();
    messages = (body.messages ?? [])
      .filter((m: ChatMessage) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-20);
    offsets = sanitizeOffsets(body.offsets);
    sessionActions = Array.isArray(body.sessionActions) ? body.sessionActions.slice(-50) : [];
  } catch {
    return new Response("Bad request.", { status: 400 });
  }
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return new Response("Ask me something about your plant.", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: Evt) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      const say = (text: string) => send({ type: "text", text });

      try {
        const apiKey = process.env.LLM_API_KEY;
        if (!apiKey) {
          say("The AI isn't connected yet. Add LLM_API_KEY as an environment variable in your hosting settings, then redeploy.");
          return;
        }

        // Context is built on the server from the preset data plus effects of actions taken this session.
        const snap = await getSnapshot();
        let readings = applyOffsets(snap.readings, offsets);
        const allActions: PlantAction[] = [...sessionActions, ...snap.actions];
        const context = () => describeSnapshot({ ...snap, readings, actions: allActions });

        const convo: Record<string, unknown>[] = [
          { role: "system", content: SYSTEM(context()) },
          ...messages,
        ];

        let finalText = "";
        for (let round = 0; round < 4; round++) {
          const res = await fetch(`${BASE_URL}/chat/completions`, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: MODEL,
              messages: convo,
              max_tokens: 700,
              temperature: 0.4,
              ...(round < 3 ? { tools: TOOLS, tool_choice: "auto" } : {}),
            }),
          });

          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            console.error("LLM API error", res.status, detail);
            const hint =
              res.status === 401 || res.status === 403
                ? "Check that LLM_API_KEY is valid and matches LLM_BASE_URL."
                : res.status === 429 || res.status === 402
                ? "The free usage limit was reached. Wait a minute and try again, or try again tomorrow."
                : "Check that LLM_MODEL is a valid chat model that supports tool calling.";
            say(`I couldn't get an answer from the AI service. ${hint}`);
            return;
          }

          const msg = (await res.json()).choices?.[0]?.message;
          const calls = msg?.tool_calls as { id: string; function: { name: string; arguments: string } }[] | undefined;

          if (!calls || calls.length === 0) {
            finalText = String(msg?.content ?? "");
            break;
          }

          convo.push({ role: "assistant", content: msg.content ?? null, tool_calls: calls });
          for (const call of calls) {
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* ignore */ }
            const result = runAction(call.function.name, args, readings);

            if (result.ok) {
              // Record how much each reading moved so the browser can apply the same change.
              const next: Offsets = { ...offsets };
              for (const c of result.action.changes) next[c.key] = (next[c.key] ?? 0) + (c.after - c.before);
              offsets = next;
              readings = result.after;
              allActions.unshift(result.action);
              send({ type: "action", action: result.action, offsets });
              convo.push({
                role: "tool",
                tool_call_id: call.id,
                content: JSON.stringify({
                  ok: true,
                  done: result.action.title,
                  changes: result.action.changes.map((c) => ({
                    reading: SENSORS[c.key].label,
                    before: c.before,
                    after: c.after,
                    unit: SENSORS[c.key].unit,
                  })),
                }),
              });
            } else {
              convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ ok: false, not_allowed: result.reason }) });
            }
          }
        }

        finalText = finalText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        if (!finalText) finalText = "Done. Let me know if you'd like anything else for your plant.";

        // Reveal the answer a few words at a time so it reads like typing.
        const words = finalText.split(/(\s+)/);
        let chunk = "";
        for (let i = 0; i < words.length; i++) {
          chunk += words[i];
          if (i % 6 === 5) { say(chunk); chunk = ""; await sleep(25); }
        }
        if (chunk) say(chunk);
      } catch (err) {
        console.error(err);
        say("Something went wrong on my side. Please try again.");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
