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

export async function getSensorReadings(): Promise<SensorReadings> {
  // TODO(hardware): replace with a fetch to your ESP32 / Arduino endpoint.
  const now = Date.now();
  return {
    moisture:    round(wobble(38, 0.6, 90_000, now), 1),
    ph:          round(wobble(6.2, 0.04, 140_000, now, 1), 2),
    ec:          round(wobble(1.1, 0.03, 110_000, now, 2), 2),
    nitrogen:    round(wobble(42, 1, 170_000, now, 3), 0),
    phosphorus:  round(wobble(18, 0.6, 130_000, now, 4), 0),
    potassium:   round(wobble(130, 2, 150_000, now, 5), 0),
    temperature: round(wobble(24, 0.3, 120_000, now, 6), 1),
    humidity:    round(wobble(52, 1.2, 100_000, now, 7), 0),
    light:       round(wobble(620, 25, 80_000, now, 8), 0),
    timestamp:   new Date(now).toISOString(),
  };
}

export async function getCameraObservations(): Promise<CameraObservations> {
  // TODO(hardware): return the latest result from your camera / vision pipeline.
  return {
    capturedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    leafColor: "Deep green, slightly paler on the oldest leaves",
    damage: "No spots, holes or browning",
    growthCmPerWeek: 1.4,
    wilting: "slight",
  };
}

export async function getMoistureHistory(current: number): Promise<HistoryPoint[]> {
  // TODO(hardware): query the last 24 h of stored moisture readings.
  const now = Date.now();
  const points = 25; // hourly, including now
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const trend = 65 + (current - 65) * t;
    const noise = Math.sin(i * 1.7) * 0.8;
    return {
      time: new Date(now - (points - 1 - i) * 3_600_000).toISOString(),
      moisture: round(i === points - 1 ? current : trend + noise, 1),
    };
  });
}

export async function getSnapshot(): Promise<Snapshot> {
  const [readings, camera] = await Promise.all([getSensorReadings(), getCameraObservations()]);
  const history = await getMoistureHistory(readings.moisture);
  return { readings, camera, history, actions: getPresetActions() };
}

function round(n: number, d: number) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
