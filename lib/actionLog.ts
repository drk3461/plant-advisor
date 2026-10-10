/**
 * PRESET ACTION HISTORY — this is the demo data. Edit it here.
 *
 * It tells a consistent story with the preset readings in lib/sensorData.ts:
 * every "after" value is close to what the sensors read now, and the newest
 * action (watering 25 h ago) matches the 24 h moisture chart that falls
 * from ~65% to ~38%.
 *
 * ▶ HARDWARE LATER: when a real pump/doser runs, append a PlantAction to a
 * database and return it from getPresetActions() instead of this fixed list.
 */
import type { PlantAction } from "./actions";

const H = 3_600_000;

export function getPresetActions(): PlantAction[] {
  const now = Date.now();
  const at = (hoursAgo: number) => new Date(now - hoursAgo * H).toISOString();

  return [
    {
      id: "preset-1",
      type: "water",
      title: "Watered 250 ml",
      reason: "Soil moisture had fallen to 30%, below the 40–60% ideal range.",
      changes: [{ key: "moisture", before: 30, after: 66 }],
      timestamp: at(25),
    },
    {
      id: "preset-2",
      type: "fertilize",
      title: "Added 5 g potassium fertilizer",
      reason: "Potassium was 85 mg/kg, below the 100–200 mg/kg ideal range.",
      changes: [{ key: "potassium", before: 85, after: 128 }],
      timestamp: at(72),
    },
    {
      id: "preset-3",
      type: "flush",
      title: "Flushed soil with 500 ml of plain water",
      reason: "Soil EC had reached 2.1 mS/cm, above the 0.8–1.8 ideal range, which points to salt build-up.",
      changes: [{ key: "ec", before: 2.1, after: 1.2 }],
      timestamp: at(120),
    },
    {
      id: "preset-4",
      type: "adjust_ph",
      title: "Lowered pH with 2 ml of pH-down solution",
      reason: "Soil pH was 7.6, above the 5.5–7.0 ideal range, which makes nutrients harder for roots to absorb.",
      changes: [{ key: "ph", before: 7.6, after: 6.3 }],
      timestamp: at(168),
    },
    {
      id: "preset-5",
      type: "fertilize",
      title: "Added 4 g nitrogen fertilizer",
      reason: "Nitrogen was 28 mg/kg, below the 30–60 mg/kg ideal range.",
      changes: [{ key: "nitrogen", before: 28, after: 44 }],
      timestamp: at(216),
    },
    {
      id: "preset-6",
      type: "humidify",
      title: "Ran the humidifier for 4 hours",
      reason: "Air humidity was 36%, below the 40–70% ideal range.",
      changes: [{ key: "humidity", before: 36, after: 55 }],
      timestamp: at(288),
    },
  ];
}
