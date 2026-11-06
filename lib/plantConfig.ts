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
  emoji: string;
}

export const PLANTS: PlantProfile[] = [
  {
    id: "monstera",
    name: "Mona",
    species: "Monstera deliciosa",
    location: "Living room, east window",
    description: "A broad-leafed tropical plant that likes bright, indirect light.",
    accent: "from-emerald-500/25 to-lime-400/10",
    emoji: "🌿",
  },
  {
    id: "snake-plant",
    name: "Sage",
    species: "Dracaena trifasciata",
    location: "Office, north shelf",
    description: "A resilient architectural plant that prefers drier soil between drinks.",
    accent: "from-teal-500/25 to-cyan-400/10",
    emoji: "🪴",
  },
  {
    id: "pothos",
    name: "Pip",
    species: "Epipremnum aureum",
    location: "Kitchen, west counter",
    description: "A fast-growing trailing plant that enjoys steady moisture and humidity.",
    accent: "from-lime-500/25 to-yellow-400/10",
    emoji: "🌱",
  },
];

export const PLANT = PLANTS[0];

export function getPlant(id: string | null | undefined): PlantProfile {
  return PLANTS.find((plant) => plant.id === id) ?? PLANT;
}

export interface LibraryPlant {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  emoji: string;
  light: string;
  temperature: string;
  humidity: string;
  watering: string;
  soil: string;
}

export const PLANT_LIBRARY: LibraryPlant[] = [
  { id: "monstera-deliciosa", name: "Monstera", scientificName: "Monstera deliciosa", description: "A statement tropical with iconic split leaves.", emoji: "🌿", light: "Bright, indirect", temperature: "18–29°C", humidity: "60–80%", watering: "When top 5 cm is dry", soil: "Rich, well-draining mix" },
  { id: "snake-plant", name: "Snake Plant", scientificName: "Dracaena trifasciata", description: "An architectural, drought-tolerant houseplant.", emoji: "🪴", light: "Low to bright indirect", temperature: "15–29°C", humidity: "30–50%", watering: "When soil is fully dry", soil: "Sandy, fast-draining mix" },
  { id: "pothos", name: "Golden Pothos", scientificName: "Epipremnum aureum", description: "A forgiving trailing vine with heart-shaped leaves.", emoji: "🌱", light: "Medium to bright indirect", temperature: "18–30°C", humidity: "50–70%", watering: "When top 3 cm is dry", soil: "Airy, well-draining mix" },
  { id: "ficus", name: "Fiddle Leaf Fig", scientificName: "Ficus lyrata", description: "Large sculptural leaves bring a canopy feel indoors.", emoji: "🍃", light: "Bright filtered", temperature: "18–27°C", humidity: "40–65%", watering: "When top 5 cm is dry", soil: "Loamy, well-draining mix" },
  { id: "rubber", name: "Rubber Plant", scientificName: "Ficus elastica", description: "Glossy foliage and a naturally upright form.", emoji: "🌳", light: "Bright indirect", temperature: "18–29°C", humidity: "40–60%", watering: "When top half is dry", soil: "Peaty, well-draining mix" },
  { id: "peace-lily", name: "Peace Lily", scientificName: "Spathiphyllum wallisii", description: "Elegant white blooms and expressive leaves.", emoji: "🌸", light: "Medium indirect", temperature: "18–29°C", humidity: "50–70%", watering: "Keep lightly moist", soil: "Moisture-retentive mix" },
  { id: "calathea", name: "Calathea", scientificName: "Goeppertia orbifolia", description: "Patterned leaves with a tropical, high-humidity preference.", emoji: "🌿", light: "Medium indirect", temperature: "18–27°C", humidity: "60–80%", watering: "When top 2 cm is dry", soil: "Moist, well-draining mix" },
  { id: "zz", name: "ZZ Plant", scientificName: "Zamioculcas zamiifolia", description: "Glossy, resilient foliage for low-maintenance spaces.", emoji: "🌴", light: "Low to bright indirect", temperature: "15–30°C", humidity: "30–50%", watering: "When fully dry", soil: "Cactus-style mix" },
  { id: "philodendron", name: "Heartleaf Philodendron", scientificName: "Philodendron hederaceum", description: "A classic trailing plant with lush heart-shaped leaves.", emoji: "💚", light: "Medium indirect", temperature: "18–30°C", humidity: "50–70%", watering: "When top 3 cm is dry", soil: "Loose, organic mix" },
  { id: "aloe", name: "Aloe Vera", scientificName: "Aloe barbadensis", description: "A sun-loving succulent with practical character.", emoji: "🌵", light: "Bright direct", temperature: "16–29°C", humidity: "30–50%", watering: "After soil dries completely", soil: "Very fast-draining mix" },
  { id: "spider", name: "Spider Plant", scientificName: "Chlorophytum comosum", description: "A lively arching plant that produces baby offsets.", emoji: "🌾", light: "Bright indirect", temperature: "15–27°C", humidity: "40–60%", watering: "When top 3 cm is dry", soil: "Light, well-draining mix" },
  { id: "fern", name: "Boston Fern", scientificName: "Nephrolepis exaltata", description: "Feathery fronds that thrive with consistent moisture.", emoji: "🌿", light: "Bright indirect", temperature: "16–24°C", humidity: "60–80%", watering: "Keep evenly moist", soil: "Peaty moisture-retaining mix" },
  { id: "orchid", name: "Moth Orchid", scientificName: "Phalaenopsis amabilis", description: "Long-lasting blooms with elegant aerial roots.", emoji: "🌺", light: "Bright filtered", temperature: "18–29°C", humidity: "50–70%", watering: "When roots turn silver", soil: "Orchid bark mix" },
  { id: "basil", name: "Basil", scientificName: "Ocimum basilicum", description: "A fragrant edible herb for a sunny kitchen window.", emoji: "🌿", light: "Bright direct", temperature: "18–30°C", humidity: "40–60%", watering: "When surface dries", soil: "Rich, fertile mix" },
  { id: "lavender", name: "Lavender", scientificName: "Lavandula angustifolia", description: "Aromatic silver foliage and small purple flowers.", emoji: "💜", light: "Bright direct", temperature: "15–27°C", humidity: "30–50%", watering: "When soil is dry", soil: "Gritty, alkaline mix" },
  { id: "jade", name: "Jade Plant", scientificName: "Crassula ovata", description: "A long-lived succulent with thick, glossy leaves.", emoji: "🌱", light: "Bright direct", temperature: "16–27°C", humidity: "30–50%", watering: "After full dry-out", soil: "Succulent mix" },
  { id: "anthurium", name: "Anthurium", scientificName: "Anthurium andraeanum", description: "Colorful waxy blooms and lush tropical foliage.", emoji: "🌹", light: "Bright indirect", temperature: "18–29°C", humidity: "60–80%", watering: "When top 3 cm is dry", soil: "Chunky, airy mix" },
  { id: "bamboo", name: "Lucky Bamboo", scientificName: "Dracaena sanderiana", description: "A graceful, water-friendly plant for calm interiors.", emoji: "🎋", light: "Low to medium indirect", temperature: "18–29°C", humidity: "40–60%", watering: "Keep roots in clean water", soil: "Water or airy potting mix" },
  { id: "parlor", name: "Parlor Palm", scientificName: "Chamaedorea elegans", description: "A refined palm that adapts beautifully to indoor light.", emoji: "🌴", light: "Medium indirect", temperature: "18–27°C", humidity: "50–70%", watering: "When top 3 cm is dry", soil: "Peaty, well-draining mix" },
  { id: "pilea", name: "Chinese Money Plant", scientificName: "Pilea peperomioides", description: "Round leaves and an easygoing compact habit.", emoji: "🍀", light: "Bright indirect", temperature: "16–24°C", humidity: "40–60%", watering: "When top half is dry", soil: "Light, well-draining mix" },
];

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
