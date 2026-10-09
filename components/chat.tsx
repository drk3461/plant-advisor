"use client";

import { ArrowUp, Leaf } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PLANT } from "@/lib/plantConfig";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What should I do for my plant this week?",
  "Is my soil nutrient balance okay?",
  "Why are the lower leaves drooping?",
  "How can I get faster growth?",
];

export function Chat({ className }: { className?: string }) {
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

    const setReply = (content: string) =>
      setMessages((m) => [...m.slice(0, -1), { role: "assistant", content }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.body) throw new Error("No response");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setReply(acc);
      }
      if (!acc.trim()) setReply("I didn't get an answer back. Try asking again.");
    } catch {
      setReply("Something went wrong sending that. Check your connection and try again.");
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
              I can see its soil, air and leaves right now, so answers are based on what your plant is actually doing.
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
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                  m.role === "user" ? "bg-moss text-paper" : "bg-paper text-ink",
                  busy && i === messages.length - 1 && m.role === "assistant" && "caret"
                )}
              >
                {m.content}
              </div>
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
          placeholder="Ask about watering, nutrients, light, growth…"
          aria-label="Your question"
          className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-line bg-paper px-4 py-3 text-[15px] placeholder:text-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-fern"
        />
        <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send question" className="h-11 w-11 rounded-2xl">
          <ArrowUp className="h-5 w-5" />
        </Button>
      </form>
    </section>
  );
}
