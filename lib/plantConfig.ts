/**
 * Per-plant configuration: name and ideal ranges for every sensor.
 * Change these values (or load them from a database) to support other plants.
 */

export type SensorKey =
  | "moisture"
  | "ph"
  | "ec"
  | "nitrogen"
  | "phosphorus"
  | "potassium"
  | "temperature"
  | "humidity"
  | "light";

export type Range = readonly [min: number, max: number];

export interface SensorMeta {
  label: string;
  unit: string;
  /** Ideal range for this plant. */
  ideal: Range;
  /** Full scale shown on the range bar (not the same as ideal). */
  scale: Range;
  decimals: number;
  group: "Soil" | "Air";
}

export const PLANT = {
  name: "Monstera",
  species: "Monstera deliciosa",
  location: "Living room, east window",
};

export const SENSORS: Record<SensorKey, SensorMeta> = {
  moisture:    { label: "Soil moisture", unit: "%",        ideal: [40, 60],    scale: [0, 100],   decimals: 0, group: "Soil" },
  ph:          { label: "Soil pH",       unit: "",         ideal: [5.5, 7.0],  scale: [4, 9],     decimals: 1, group: "Soil" },
  ec:          { label: "Soil EC",       unit: "mS/cm",    ideal: [0.8, 1.8],  scale: [0, 3],     decimals: 2, group: "Soil" },
  nitrogen:    { label: "Nitrogen (N)",  unit: "mg/kg",    ideal: [30, 60],    scale: [0, 100],   decimals: 0, group: "Soil" },
  phosphorus:  { label: "Phosphorus (P)",unit: "mg/kg",    ideal: [20, 40],    scale: [0, 80],    decimals: 0, group: "Soil" },
  potassium:   { label: "Potassium (K)", unit: "mg/kg",    ideal: [100, 200],  scale: [0, 300],   decimals: 0, group: "Soil" },
  temperature: { label: "Temperature",   unit: "°C",       ideal: [18, 27],    scale: [5, 40],    decimals: 1, group: "Air" },
  humidity:    { label: "Air humidity",  unit: "%",        ideal: [40, 70],    scale: [0, 100],   decimals: 0, group: "Air" },
  light:       { label: "Sunlight",      unit: "lux",      ideal: [400, 1000], scale: [0, 2000],  decimals: 0, group: "Air" },
};

export const SENSOR_ORDER = Object.keys(SENSORS) as SensorKey[];
