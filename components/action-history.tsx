"use client";

import { Droplets, FlaskConical, Sprout, Sun, Waves, Wind, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { SENSORS } from "@/lib/plantConfig";
import { sortNewestFirst, type ActionType, type PlantAction } from "@/lib/actions";
import { formatValue, sensorStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

const ICONS: Record<ActionType, LucideIcon> = {
  water: Droplets,
  fertilize: Sprout,
  adjust_ph: FlaskConical,
  flush: Waves,
  humidify: Wind,
  light: Sun,
};
const TEXT = { ok: "text-ok", watch: "text-warn", bad: "text-bad" } as const;

export function ago(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

export function ActionHistory({ actions, now }: { actions: PlantAction[]; now: number }) {
  const [all, setAll] = useState(false);
  const sorted = sortNewestFirst(actions);
  const shown = all ? sorted : sorted.slice(0, 4);

  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm" aria-label="Action history">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold">Actions taken</h2>
        <span className="text-xs text-muted">{sorted.length} total</span>
      </div>

      <ol className="mt-3 space-y-4">
        {shown.map((a) => {
          const Icon = ICONS[a.type];
          return (
            <li key={a.id} className={cn("flex gap-3", a.id.startsWith("ai-") && "animate-[fade-in_0.5s_ease-out]")}>
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fern/15 text-fern">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{a.title}</p>
                  <time className="shrink-0 text-xs text-muted" dateTime={a.timestamp}>{ago(a.timestamp, now)}</time>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {a.changes.map((c) => (
                    <span key={c.key} className="rounded-full bg-paper px-2.5 py-1 text-xs tabular-nums text-muted">
                      {SENSORS[c.key].label}{" "}
                      {formatValue(c.key, c.before)} →{" "}
                      <span className={cn("font-semibold", TEXT[sensorStatus(c.key, c.after)])}>{formatValue(c.key, c.after)}</span>{" "}
                      {SENSORS[c.key].unit}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{a.reason}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {sorted.length > 4 && (
        <button onClick={() => setAll(!all)} className="mt-4 text-sm font-medium text-fern hover:underline">
          {all ? "Show fewer" : `Show all ${sorted.length}`}
        </button>
      )}
    </section>
  );
}
