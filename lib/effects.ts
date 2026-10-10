/**
 * What each action DOES to the readings in the simulation, plus the safety
 * rules for when the AI may act. The AI never sets numbers itself: it calls a
 * tool, and this file decides if the action is allowed and what changes.
 *
 * ▶ HARDWARE LATER: replace the body of each action with a real command
 * (run the pump, dose the nutrient pump...) and read the new sensor values.
 */
import { SENSORS, type SensorKey } from "./plantConfig";
import type { MetricChange, PlantAction } from "./actions";
import type { SensorReadings } from "./sensorData";

export type Offsets = Partial<Record<SensorKey, number>>;

const KEYS = Object.keys(SENSORS) as SensorKey[];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (key: SensorKey, v: number) => {
  const f = 10 ** SENSORS[key].decimals;
  return Math.round(v * f) / f;
};
const fmt = (key: SensorKey, v: number) => `${v.toFixed(SENSORS[key].decimals)}${SENSORS[key].unit ? (SENSORS[key].unit === "%" ? "%" : ` ${SENSORS[key].unit}`) : ""}`;

/** Readings after the effects of actions taken during this session. */
export function applyOffsets(r: SensorReadings, offsets: Offsets): SensorReadings {
  const out = { ...r };
  for (const k of KEYS) {
    const [lo, hi] = SENSORS[k].scale;
    out[k] = round(k, clamp(r[k] + (offsets[k] ?? 0), lo, hi));
  }
  return out;
}

export function sanitizeOffsets(raw: unknown): Offsets {
  const out: Offsets = {};
  if (raw && typeof raw === "object") {
    for (const k of KEYS) {
      const v = (raw as Record<string, unknown>)[k];
      if (typeof v === "number" && Number.isFinite(v)) out[k] = clamp(v, -5000, 5000);
    }
  }
  return out;
}

export type ActionResult =
  | { ok: true; action: PlantAction; after: SensorReadings }
  | { ok: false; reason: string };

let counter = 0;

function done(
  type: PlantAction["type"],
  title: string,
  reason: string,
  before: SensorReadings,
  patch: Partial<SensorReadings>
): ActionResult {
  const after = { ...before, ...patch };
  const changes: MetricChange[] = [];
  for (const k of KEYS) {
    if (patch[k] !== undefined && after[k] !== before[k]) changes.push({ key: k, before: before[k], after: after[k] });
  }
  return {
    ok: true,
    after,
    action: {
      id: `ai-${Date.now()}-${counter++}`,
      type,
      title,
      reason: reason.trim() || "Chosen from the current readings.",
      changes,
      timestamp: new Date().toISOString(),
    },
  };
}

const refuse = (reason: string): ActionResult => ({ ok: false, reason });
const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

export function runAction(name: string, args: Record<string, unknown>, r: SensorReadings): ActionResult {
  const reason = typeof args.reason === "string" ? args.reason : "";

  switch (name) {
    case "water_plant": {
      const [lo] = SENSORS.moisture.ideal;
      if (r.moisture >= lo)
        return refuse(`Soil moisture is ${fmt("moisture", r.moisture)}, which is not below the ${lo}% minimum. Watering isn't needed.`);
      const wanted = clamp(Math.round(num(args.amount_ml, 250)), 50, 500);
      const room = Math.floor((68 - r.moisture) / 0.14); // never push soil above ~68%
      const ml = Math.min(wanted, room);
      if (ml < 50) return refuse("Any more water would push the soil past a safe moisture level.");
      return done("water", `Watered ${ml} ml`, reason, r, { moisture: round("moisture", r.moisture + ml * 0.14) });
    }

    case "add_nutrient": {
      const nutrient = args.nutrient;
      if (nutrient !== "nitrogen" && nutrient !== "phosphorus" && nutrient !== "potassium")
        return refuse("Nutrient must be nitrogen, phosphorus or potassium.");
      const meta = SENSORS[nutrient];
      if (r[nutrient] >= meta.ideal[0])
        return refuse(`${meta.label} is ${fmt(nutrient, r[nutrient])}, which is not below the ${meta.ideal[0]} ${meta.unit} minimum. It doesn't need more.`);
      if (r.ec >= SENSORS.ec.ideal[1])
        return refuse(`Soil EC is ${fmt("ec", r.ec)}, already at the top of its range. Adding fertilizer would worsen salt build-up. Flush the soil first.`);
      const gain = { nitrogen: 6, phosphorus: 4, potassium: 8 }[nutrient];
      const grams = clamp(Math.round(num(args.grams, 3)), 1, 10);
      const label = { nitrogen: "nitrogen", phosphorus: "phosphorus", potassium: "potassium" }[nutrient];
      return done("fertilize", `Added ${grams} g ${label} fertilizer`, reason, r, {
        [nutrient]: round(nutrient, Math.min(r[nutrient] + grams * gain, meta.ideal[1])),
        ec: round("ec", r.ec + grams * 0.04),
      } as Partial<SensorReadings>);
    }

    case "adjust_ph": {
      const [lo, hi] = SENSORS.ph.ideal;
      const dir = args.direction;
      if (dir !== "up" && dir !== "down") return refuse("Direction must be 'up' or 'down'.");
      if (dir === "down" && r.ph <= hi) return refuse(`Soil pH is ${fmt("ph", r.ph)}, not above the ${hi} maximum. Lowering it isn't needed.`);
      if (dir === "up" && r.ph >= lo) return refuse(`Soil pH is ${fmt("ph", r.ph)}, not below the ${lo} minimum. Raising it isn't needed.`);
      const ml = clamp(Math.round(num(args.amount_ml, 2)), 1, 5);
      const delta = ml * 0.3 * (dir === "down" ? -1 : 1);
      return done("adjust_ph", `${dir === "down" ? "Lowered" : "Raised"} pH with ${ml} ml of pH-${dir} solution`, reason, r, {
        ph: round("ph", r.ph + delta),
      });
    }

    case "flush_soil": {
      const hi = SENSORS.ec.ideal[1];
      if (r.ec <= hi) return refuse(`Soil EC is ${fmt("ec", r.ec)}, within its range (max ${hi}). A flush isn't needed and would wash out nutrients.`);
      const ml = clamp(Math.round(num(args.amount_ml, 500)), 200, 1000);
      const wash = 1 - 0.1 * (ml / 500);
      return done("flush", `Flushed soil with ${ml} ml of plain water`, reason, r, {
        ec: round("ec", Math.max(0.6, r.ec - 0.8 * (ml / 500))),
        nitrogen: round("nitrogen", r.nitrogen * wash),
        phosphorus: round("phosphorus", r.phosphorus * wash),
        potassium: round("potassium", r.potassium * wash),
      });
    }

    case "run_humidifier": {
      const [lo] = SENSORS.humidity.ideal;
      if (r.humidity >= lo) return refuse(`Air humidity is ${fmt("humidity", r.humidity)}, not below the ${lo}% minimum. The humidifier isn't needed.`);
      const minutes = clamp(Math.round(num(args.minutes, 120)), 15, 480);
      const hours = minutes >= 60 ? `${+(minutes / 60).toFixed(1)} hours` : `${minutes} minutes`;
      return done("humidify", `Ran the humidifier for ${hours}`, reason, r, {
        humidity: round("humidity", Math.min(65, r.humidity + minutes * 0.08)),
      });
    }

    case "turn_on_grow_light": {
      const [lo] = SENSORS.light.ideal;
      if (r.light >= lo) return refuse(`Light is ${fmt("light", r.light)}, not below the ${lo} lux minimum. Extra light isn't needed.`);
      return done("light", "Turned on the grow light", reason, r, { light: round("light", Math.min(900, r.light + 300)) });
    }

    default:
      return refuse(`Unknown action "${name}".`);
  }
}

/** Tool definitions the model can call (OpenAI-compatible format). */
export const TOOLS = [
  {
    type: "function",
    function: {
      name: "water_plant",
      description: "Run the watering pump. Only allowed when soil moisture is below its ideal minimum.",
      parameters: {
        type: "object",
        properties: {
          amount_ml: { type: "number", description: "Millilitres of water, 50–500." },
          reason: { type: "string", description: "One sentence: why, citing the current reading." },
        },
        required: ["amount_ml", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_nutrient",
      description: "Dose a fertilizer salt into the soil. Only allowed when that nutrient is below its ideal minimum and salt level (EC) is not too high.",
      parameters: {
        type: "object",
        properties: {
          nutrient: { type: "string", enum: ["nitrogen", "phosphorus", "potassium"] },
          grams: { type: "number", description: "Grams of fertilizer, 1–10." },
          reason: { type: "string", description: "One sentence: why, citing the current reading." },
        },
        required: ["nutrient", "grams", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "adjust_ph",
      description: "Add pH-up or pH-down solution. Only allowed when pH is outside its ideal range, in the matching direction.",
      parameters: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["up", "down"] },
          amount_ml: { type: "number", description: "Millilitres of solution, 1–5." },
          reason: { type: "string", description: "One sentence: why, citing the current reading." },
        },
        required: ["direction", "amount_ml", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "flush_soil",
      description: "Flush the soil with plain water to remove salt build-up. Only allowed when EC is above its ideal maximum.",
      parameters: {
        type: "object",
        properties: {
          amount_ml: { type: "number", description: "Millilitres of water, 200–1000." },
          reason: { type: "string", description: "One sentence: why, citing the current reading." },
        },
        required: ["amount_ml", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_humidifier",
      description: "Run the humidifier. Only allowed when air humidity is below its ideal minimum.",
      parameters: {
        type: "object",
        properties: {
          minutes: { type: "number", description: "Minutes to run, 15–480." },
          reason: { type: "string", description: "One sentence: why, citing the current reading." },
        },
        required: ["minutes", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "turn_on_grow_light",
      description: "Turn on the grow light. Only allowed when light is below its ideal minimum.",
      parameters: {
        type: "object",
        properties: { reason: { type: "string", description: "One sentence: why, citing the current reading." } },
        required: ["reason"],
      },
    },
  },
] as const;
