import type { SensorKey } from "./plantConfig";

export type ActionType = "water" | "fertilize" | "adjust_ph" | "flush" | "humidify" | "light";

/** One reading that an action changed. */
export interface MetricChange {
  key: SensorKey;
  before: number;
  after: number;
}

/** Something Plant Advisor did to the plant (a pump ran, nutrients were dosed, ...). */
export interface PlantAction {
  id: string;
  type: ActionType;
  title: string;          // e.g. "Watered 250 ml"
  reason: string;         // why the AI did it, based on the readings at the time
  changes: MetricChange[];
  timestamp: string;      // ISO 8601
}

/** Latest watering in a list of actions (used for "watered X ago"). */
export function lastWateredAt(actions: PlantAction[]): string | null {
  const waters = actions.filter((a) => a.type === "water");
  if (waters.length === 0) return null;
  return waters.reduce((a, b) => (new Date(a.timestamp) > new Date(b.timestamp) ? a : b)).timestamp;
}

export function sortNewestFirst(actions: PlantAction[]): PlantAction[] {
  return [...actions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
