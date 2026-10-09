import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/sensorData";

export const dynamic = "force-dynamic";

/** The frontend polls this. Swap the data source in lib/sensorData.ts, not here. */
export async function GET() {
  return NextResponse.json(await getSnapshot(), { headers: { "Cache-Control": "no-store" } });
}
