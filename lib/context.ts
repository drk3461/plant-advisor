import { PLANT, SENSORS, SENSOR_ORDER } from "./plantConfig";
import { direction, formatValue, sensorStatus } from "./status";
import { sortNewestFirst, lastWateredAt, type PlantAction } from "./actions";
import type { Snapshot } from "./sensorData";

function ago(iso: string) {
  const h = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} minutes ago`;
  if (h < 48) return `${Math.round(h)} hours ago`;
  return `${Math.round(h / 24)} days ago`;
}

function describeAction(a: PlantAction): string {
  const changes = a.changes
    .map((c) => `${SENSORS[c.key].label} ${formatValue(c.key, c.before)} → ${formatValue(c.key, c.after)} ${SENSORS[c.key].unit}`.trim())
    .join("; ");
  return `- ${ago(a.timestamp)}: ${a.title}. Changes: ${changes || "none"}. Reason: ${a.reason}`;
}

/** Plain-text summary of everything the plant knows, used as AI context. `snap.actions` must be the full history. */
export function describeSnapshot(s: Snapshot): string {
  const { readings: r, camera: c, history, actions } = s;
  const lines = SENSOR_ORDER.map((k) => {
    const m = SENSORS[k];
    const v = r[k];
    const status = sensorStatus(k, v);
    const dir = direction(k, v);
    return `- ${m.label}: ${formatValue(k, v)} ${m.unit} (ideal ${m.ideal[0]}–${m.ideal[1]}) → ${
      status === "ok" ? "in range" : `${dir}, ${status === "watch" ? "slightly off" : "well off"}`
    }`;
  });

  const first = history[0].moisture;
  const last = history[history.length - 1].moisture;
  const watered = lastWateredAt(actions);
  const sorted = sortNewestFirst(actions);

  return [
    `Plant: ${PLANT.name} (${PLANT.species}), ${PLANT.location}.`,
    `Sensor readings now:`,
    ...lines,
    `Soil moisture over the last 24 h: ${first}% → ${last}%.`,
    watered ? `Last watered ${ago(watered)}.` : "No watering on record.",
    `Camera (captured ${ago(c.capturedAt)}): leaf color: ${c.leafColor}; damage: ${c.damage}; growth: ${c.growthCmPerWeek} cm/week; wilting: ${c.wilting}.`,
    ``,
    `Action history, newest first (this is the complete record; nothing else has been done):`,
    ...(sorted.length ? sorted.map(describeAction) : ["- none"]),
  ].join("\n");
}
