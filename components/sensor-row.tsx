import { Droplets, FlaskConical, Zap, Sprout, Thermometer, Wind, Sun, type LucideIcon } from "lucide-react";
import { SENSORS, type SensorKey } from "@/lib/plantConfig";
import { formatValue, sensorStatus, type Status } from "@/lib/status";
import { cn } from "@/lib/utils";

const ICONS: Record<SensorKey, LucideIcon> = {
  moisture: Droplets,
  ph: FlaskConical,
  ec: Zap,
  nitrogen: Sprout,
  phosphorus: Sprout,
  potassium: Sprout,
  temperature: Thermometer,
  humidity: Wind,
  light: Sun,
};

const TEXT: Record<Status, string> = { ok: "text-ok", watch: "text-warn", bad: "text-bad" };
const BG: Record<Status, string> = { ok: "bg-ok", watch: "bg-warn", bad: "bg-bad" };

/** One reading on a bar: the shaded band is the ideal range, the dot is the current value. */
export function SensorRow({ sensorKey, value }: { sensorKey: SensorKey; value: number }) {
  const meta = SENSORS[sensorKey];
  const Icon = ICONS[sensorKey];
  const status = sensorStatus(sensorKey, value);
  const [smin, smax] = meta.scale;
  const pct = (n: number) => Math.min(100, Math.max(0, ((n - smin) / (smax - smin)) * 100));

  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Icon className="h-4 w-4" aria-hidden />
          {meta.label}
        </div>
        <div className={cn("font-display text-lg font-semibold tabular-nums transition-colors duration-500", TEXT[status])}>
          {formatValue(sensorKey, value)}
          {meta.unit && <span className="ml-1 text-xs font-normal text-muted">{meta.unit}</span>}
        </div>
      </div>
      <div
        className="relative mt-2 h-2 rounded-full bg-line/70"
        role="img"
        aria-label={`${meta.label} ${formatValue(sensorKey, value)} ${meta.unit}, ideal ${meta.ideal[0]} to ${meta.ideal[1]}`}
      >
        <div
          className="absolute inset-y-0 rounded-full bg-fern/30"
          style={{ left: `${pct(meta.ideal[0])}%`, width: `${pct(meta.ideal[1]) - pct(meta.ideal[0])}%` }}
        />
        <div
          className={cn("absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface transition-all duration-700", BG[status])}
          style={{ left: `${pct(value)}%` }}
        />
      </div>
    </div>
  );
}
