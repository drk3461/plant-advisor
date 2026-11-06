/**
 * ALL sensor data lives here.
 *
 * Right now every function returns mock values that drift slowly over time,
 * so the dashboard looks alive without any hardware.
 *
 * ▶ WHERE THE REAL HARDWARE PLUGS IN
 * Replace the bodies of getSensorReadings(), getCameraObservations() and
 * getMoistureHistory() with calls to your ESP32/Arduino, e.g.
 *
 *   const res = await fetch("http://<esp32-ip>/readings", { cache: "no-store" });
 *   return await res.json();
 *
 * or read from a database your microcontroller posts into. The rest of the
 * app (API routes, dashboard, AI chat) only talks to this file.
 */

import type { PlantAction } from "./actions";
import { getPresetActions } from "./actionLog";
import { getPlant, type PlantProfile } from "./plantConfig";

export interface SensorReadings {
  moisture: number;     // %
  ph: number;           // pH units
  ec: number;           // mS/cm
  nitrogen: number;     // mg/kg
  phosphorus: number;   // mg/kg
  potassium: number;    // mg/kg
  temperature: number;  // °C
  humidity: number;     // %
  light: number;        // lux
  timestamp: string;    // ISO 8601
}

/** What the plant camera reports after image analysis. */
export interface CameraObservations {
  capturedAt: string;
  leafColor: string;
  damage: string;
  growthCmPerWeek: number;
  wilting: "none" | "slight" | "moderate" | "severe";
}

export interface HistoryPoint {
  time: string;   // ISO 8601
  moisture: number;
}

export interface Snapshot {
  plant: PlantProfile;
  readings: SensorReadings;
  camera: CameraObservations;
  history: HistoryPoint[];
  /** Preset action history (see lib/actionLog.ts). */
  actions: PlantAction[];
}

/** Small smooth wobble so values move a little between polls. */
function wobble(base: number, amp: number, periodMs: number, now: number, phase = 0) {
  return base + amp * Math.sin((now / periodMs) * 2 * Math.PI + phase);
}

export async function getSensorReadings(plantId = "monstera"): Promise<SensorReadings> {
  // TODO(hardware): replace with a fetch to your ESP32 / Arduino endpoint.
  const now = Date.now();
  const presets: Record<string, Omit<SensorReadings, "timestamp">> = {
    monstera: { moisture: 38, ph: 6.2, ec: 1.1, nitrogen: 42, phosphorus: 18, potassium: 130, temperature: 24, humidity: 52, light: 620 },
    "snake-plant": { moisture: 63, ph: 6.8, ec: 0.7, nitrogen: 34, phosphorus: 24, potassium: 115, temperature: 22, humidity: 39, light: 480 },
    pothos: { moisture: 47, ph: 6.1, ec: 1.5, nitrogen: 27, phosphorus: 31, potassium: 92, temperature: 26, humidity: 64, light: 760 },
  };
  const p = presets[plantId] ?? presets.monstera;
  return {
    moisture:    round(wobble(p.moisture, 0.6, 90_000, now), 1),
    ph:          round(wobble(p.ph, 0.04, 140_000, now, 1), 2),
    ec:          round(wobble(p.ec, 0.03, 110_000, now, 2), 2),
    nitrogen:    round(wobble(p.nitrogen, 1, 170_000, now, 3), 0),
    phosphorus:  round(wobble(p.phosphorus, 0.6, 130_000, now, 4), 0),
    potassium:   round(wobble(p.potassium, 2, 150_000, now, 5), 0),
    temperature: round(wobble(p.temperature, 0.3, 120_000, now, 6), 1),
    humidity:    round(wobble(p.humidity, 1.2, 100_000, now, 7), 0),
    light:       round(wobble(p.light, 25, 80_000, now, 8), 0),
    timestamp:   new Date(now).toISOString(),
  };
}

export async function getCameraObservations(plantId = "monstera"): Promise<CameraObservations> {
  // TODO(hardware): return the latest result from your camera / vision pipeline.
  const camera: Record<string, CameraObservations> = {
    monstera: {
      capturedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
      leafColor: "Deep green, slightly paler on the oldest leaves",
      damage: "No spots, holes or browning",
      growthCmPerWeek: 1.4,
      wilting: "slight",
    },
    "snake-plant": {
      capturedAt: new Date(Date.now() - 26 * 60_000).toISOString(),
      leafColor: "Healthy dark green with pale banding",
      damage: "No visible damage",
      growthCmPerWeek: 0.6,
      wilting: "none",
    },
    pothos: {
      capturedAt: new Date(Date.now() - 8 * 60_000).toISOString(),
      leafColor: "Bright green with clear variegation",
      damage: "One small brown edge on an older leaf",
      growthCmPerWeek: 2.1,
      wilting: "none",
    },
  };
  return camera[plantId] ?? camera.monstera;
}

export async function getMoistureHistory(current: number, plantId = "monstera"): Promise<HistoryPoint[]> {
  // TODO(hardware): query the last 24 h of stored moisture readings.
  const now = Date.now();
  const points = 25; // hourly, including now
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const start = plantId === "snake-plant" ? 72 : plantId === "pothos" ? 58 : 65;
    const trend = start + (current - start) * t;
    const noise = Math.sin(i * 1.7) * 0.8;
    return {
      time: new Date(now - (points - 1 - i) * 3_600_000).toISOString(),
      moisture: round(i === points - 1 ? current : trend + noise, 1),
    };
  });
}

export async function getSnapshot(plantId = "monstera"): Promise<Snapshot> {
  const [readings, camera] = await Promise.all([getSensorReadings(plantId), getCameraObservations(plantId)]);
  const history = await getMoistureHistory(readings.moisture, plantId);
  return { plant: getPlant(plantId), readings, camera, history, actions: getPresetActions(plantId) };
}

function round(n: number, d: number) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
