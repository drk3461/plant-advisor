import { SENSORS, SENSOR_ORDER, type SensorKey } from "./plantConfig";
import type { CameraObservations, SensorReadings } from "./sensorData";

export type Status = "ok" | "watch" | "bad";

/** In range = ok. Slightly outside (within 20% of the range width) = watch. Otherwise bad. */
export function sensorStatus(key: SensorKey, value: number): Status {
  const [lo, hi] = SENSORS[key].ideal;
  if (value >= lo && value <= hi) return "ok";
  const distance = value < lo ? lo - value : value - hi;
  return distance <= (hi - lo) * 0.2 ? "watch" : "bad";
}

export function direction(key: SensorKey, value: number): "low" | "high" | "ideal" {
  const [lo, hi] = SENSORS[key].ideal;
  return value < lo ? "low" : value > hi ? "high" : "ideal";
}

export function cameraStatus(c: CameraObservations): Status {
  if (c.wilting === "severe") return "bad";
  if (c.wilting === "moderate") return "bad";
  if (c.wilting === "slight") return "watch";
  return "ok";
}

export type Health = "Healthy" | "Needs attention" | "Critical";

export function overallHealth(r: SensorReadings, c: CameraObservations): Health {
  const all = [...SENSOR_ORDER.map((k) => sensorStatus(k, r[k])), cameraStatus(c)];
  if (all.includes("bad")) return "Critical";
  if (all.includes("watch")) return "Needs attention";
  return "Healthy";
}

export function formatValue(key: SensorKey, value: number): string {
  return value.toFixed(SENSORS[key].decimals);
}
