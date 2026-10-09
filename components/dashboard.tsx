"use client";

import { Camera, Leaf } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Chat } from "@/components/chat";
import { MoistureChart } from "@/components/moisture-chart";
import { SensorRow } from "@/components/sensor-row";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLANT, SENSORS, SENSOR_ORDER } from "@/lib/plantConfig";
import type { Snapshot } from "@/lib/sensorData";
import { cameraStatus, overallHealth, sensorStatus, type Health, type Status } from "@/lib/status";

const POLL_MS = 5000;
const HEALTH_TONE: Record<Health, Status> = { Healthy: "ok", "Needs attention": "watch", Critical: "bad" };

function ago(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}

export function Dashboard() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/sensors", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data: Snapshot = await res.json();
        if (alive) { setSnap(data); setError(false); }
      } catch {
        if (alive) setError(true);
      }
      if (alive) setNow(Date.now());
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const health = snap ? overallHealth(snap.readings, snap.camera) : null;
  const attention = snap ? SENSOR_ORDER.filter((k) => sensorStatus(k, snap.readings[k]) !== "ok") : [];

  return (
    <div className="mx-auto min-h-dvh max-w-7xl px-4 pb-8 sm:px-6">
      <header className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          <Leaf className="h-5 w-5 text-fern" aria-hidden />
          Plant Advisor
        </div>
        <ThemeToggle />
      </header>

      <main className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6">
        {/* Plant summary */}
        <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm lg:col-start-2 lg:row-start-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold">{PLANT.name}</h1>
              <p className="text-sm text-muted">{PLANT.location}</p>
            </div>
            {health ? <Badge tone={HEALTH_TONE[health]}>{health}</Badge> : <div className="h-6 w-28 rounded-full bg-line/60" />}
          </div>
          {snap && (
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {attention.length === 0
                ? "Everything is in its ideal range."
                : `Outside ideal range: ${attention.map((k) => SENSORS[k].label.toLowerCase()).join(", ")}.`}{" "}
              Watered {ago(snap.lastWatered, now)}.
            </p>
          )}
        </section>

        {/* Chat: the main part of the page */}
        <Chat className="h-[72dvh] lg:sticky lg:top-4 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:h-[calc(100dvh-6rem)]" />

        {/* Readings + camera */}
        <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm lg:col-start-2 lg:row-start-2">
          {!snap ? (
            <p className="py-10 text-center text-sm text-muted">{error ? "Can't reach the sensors. Retrying…" : "Loading readings…"}</p>
          ) : (
            <>
              {(["Soil", "Air"] as const).map((group, gi) => (
                <div key={group} className={gi > 0 ? "mt-3 border-t border-line pt-3" : ""}>
                  <h2 className="font-display text-base font-semibold">{group}</h2>
                  <div className="divide-y divide-line/60">
                    {SENSOR_ORDER.filter((k) => SENSORS[k].group === group).map((k) => (
                      <SensorRow key={k} sensorKey={k} value={snap.readings[k]} />
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-3 border-t border-line pt-3">
                <h2 className="font-display text-base font-semibold">Soil moisture, last 24 hours</h2>
                <div className="mt-2"><MoistureChart history={snap.history} /></div>
              </div>

              <div className="mt-3 border-t border-line pt-3">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-base font-semibold">
                    <Camera className="h-4 w-4 text-muted" aria-hidden /> Leaves
                  </h2>
                  <Badge tone={cameraStatus(snap.camera)}>
                    {snap.camera.wilting === "none" ? "No wilting" : `${snap.camera.wilting[0].toUpperCase()}${snap.camera.wilting.slice(1)} wilting`}
                  </Badge>
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-muted">Color</dt><dd className="text-right">{snap.camera.leafColor}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted">Damage</dt><dd className="text-right">{snap.camera.damage}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted">Growth</dt><dd className="text-right">{snap.camera.growthCmPerWeek} cm per week</dd></div>
                </dl>
                <p className="mt-3 text-xs text-muted">Photo taken {ago(snap.camera.capturedAt, now)}</p>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
