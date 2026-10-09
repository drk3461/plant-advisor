import { PLANT, SENSORS, SENSOR_ORDER } from "./plantConfig";
import { direction, formatValue, sensorStatus } from "./status";
import type { Snapshot } from "./sensorData";

/** Plain-text summary of everything the plant knows, used as AI context. */
export function describeSnapshot(s: Snapshot): string {
  const { readings: r, camera: c, history, lastWatered } = s;
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
  const hoursSince = Math.round((Date.now() - new Date(lastWatered).getTime()) / 3_600_000);

  return [
    `Plant: ${PLANT.name} (${PLANT.species}), ${PLANT.location}.`,
    `Sensor readings at ${r.timestamp}:`,
    ...lines,
    `Soil moisture trend over 24 h: ${first}% → ${last}%.`,
    `Last watered about ${hoursSince} hours ago.`,
    `Camera (captured ${c.capturedAt}): leaf color: ${c.leafColor}; damage: ${c.damage}; growth: ${c.growthCmPerWeek} cm/week; wilting: ${c.wilting}.`,
  ].join("\n");
}
