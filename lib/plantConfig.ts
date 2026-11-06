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

export interface PlantProfile {
  id: string;
  name: string;
  species: string;
  location: string;
  description: string;
  accent: string;
}

export const PLANTS: PlantProfile[] = [
  {
    id: "monstera",
    name: "Mona",
    species: "Monstera deliciosa",
    location: "Living room, east window",
    description: "A broad-leafed tropical plant that likes bright, indirect light.",
    accent: "from-emerald-500/25 to-lime-400/10",
  },
  {
    id: "snake-plant",
    name: "Sage",
    species: "Dracaena trifasciata",
    location: "Office, north shelf",
    description: "A resilient architectural plant that prefers drier soil between drinks.",
    accent: "from-teal-500/25 to-cyan-400/10",
  },
  {
    id: "pothos",
    name: "Pip",
    species: "Epipremnum aureum",
    location: "Kitchen, west counter",
    description: "A fast-growing trailing plant that enjoys steady moisture and humidity.",
    accent: "from-lime-500/25 to-yellow-400/10",
  },
];

export const PLANT = PLANTS[0];

export function getPlant(id: string | null | undefined): PlantProfile {
  return PLANTS.find((plant) => plant.id === id) ?? PLANT;
}

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
