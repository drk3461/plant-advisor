"use client";

import { Area, AreaChart, ReferenceArea, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { SENSORS } from "@/lib/plantConfig";
import type { HistoryPoint } from "@/lib/sensorData";

/** 24 h soil moisture with the ideal range shaded. Uses currentColor so it follows light/dark mode. */
export function MoistureChart({ history }: { history: HistoryPoint[] }) {
  const [lo, hi] = SENSORS.moisture.ideal;
  const data = history.map((p) => ({
    t: new Date(p.time).toLocaleTimeString([], { hour: "numeric" }),
    moisture: p.moisture,
  }));

  return (
    <div className="h-36 w-full text-fern [&_.recharts-cartesian-axis-tick-value]:fill-muted [&_.recharts-cartesian-axis-tick-value]:text-[11px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
          <ReferenceArea y1={lo} y2={hi} fill="currentColor" fillOpacity={0.14} />
          <XAxis dataKey="t" tickLine={false} axisLine={false} interval={5} />
          <YAxis domain={[20, 80]} ticks={[20, 40, 60, 80]} tickLine={false} axisLine={false} />
          <Area type="monotone" dataKey="moisture" stroke="currentColor" strokeWidth={2} fill="currentColor" fillOpacity={0.08} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
