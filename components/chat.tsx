"use client";

import { ArrowUp, Check, Leaf } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PlantAction } from "@/lib/actions";
import type { Offsets } from "@/lib/effects";
import { PLANT, SENSORS } from "@/lib/plantConfig";
import { formatValue } from "@/lib/status";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string; actions?: PlantAction[] };

const SUGGESTIONS = [
  "What was the last action you took?",
  "Does the plant need anything right now?",
  "Take care of whatever the plant needs",
  "Why did you add potassium earlier?",
];

interface ChatProps {
  className?: string;
  offsets: Offsets;
  sessionActions: PlantAction[];
  onAction: (action: PlantAction, offsets: Offsets) => void;
}

export function Chat({ className, offsets, sessionActions, onAction }: ChatProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    const patchLast = (fn: (m: Msg) => Msg) =>
      setMessages((all) => [...all.slice(0, -1), fn(all[all.length - 1])]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          offsets,
          sessionActions,
        }),
      });
      if (!res.body) throw new Error("No response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let got = false;

      const handle = (line: string) => {
        if (!line.trim()) return;
        const evt = JSON.parse(line);
        if (evt.type === "text") {
          got = true;
          patchLast((m) => ({ ...m, content: m.content + evt.text }));
        } else if (evt.type === "action") {
          got = true;
          onAction(evt.action, evt.offsets);
          patchLast((m) => ({ ...m, actions: [...(m.actions ?? []), evt.action] }));
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach(handle);
      }
      if (buffer) handle(buffer);
      if (!got) patchLast((m) => ({ ...m, content: "I didn't get an answer back. Try asking again." }));
    } catch {
      patchLast((m) => ({ ...m, content: "Something went wrong sending that. Check your connection and try again." }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cn("flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm", className)} aria-label="Chat with Plant Advisor">
      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-8" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-center">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-fern/15 text-fern">
              <Leaf className="h-6 w-6" aria-hidden />
            </div>
            <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Ask anything about your {PLANT.name}
            </h2>
            <p className="mt-3 max-w-md text-muted">
              I watch its soil, air and leaves, and I can water it, dose nutrients and more. Ask what I've done, or tell me to take care of it.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-line px-4 py-2 text-left text-sm transition-colors hover:bg-line/50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
              {m.actions?.map((a) => (
                <div key={a.id} className="max-w-[85%] rounded-2xl border border-fern/40 bg-fern/10 px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-2 font-medium text-fern">
                    <Check className="h-4 w-4" aria-hidden /> {a.title}
                  </div>
                  <div className="mt-1 text-xs tabular-nums text-muted">
                    {a.changes
                      .map((c) => `${SENSORS[c.key].label} ${formatValue(c.key, c.before)} → ${formatValue(c.key, c.after)} ${SENSORS[c.key].unit}`.trim())
                      .join(" · ")}
                  </div>
                </div>
              ))}
              {(m.content || m.role === "user" || !m.actions?.length) && (
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                    m.role === "user" ? "bg-moss text-paper" : "bg-paper text-ink",
                    busy && i === messages.length - 1 && m.role === "assistant" && "caret"
                  )}
                >
                  {m.content || (busy && i === messages.length - 1 ? "Checking the plant…" : "")}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-end gap-2 border-t border-line p-3 sm:p-4"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
          }}
          rows={1}
          placeholder="Ask a question or tell me what to do…"
          aria-label="Your message"
          className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-line bg-paper px-4 py-3 text-[15px] placeholder:text-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-fern"
        />
        <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send message" className="h-11 w-11 rounded-2xl">
          <ArrowUp className="h-5 w-5" />
        </Button>
      </form>
    </section>
  );
}
