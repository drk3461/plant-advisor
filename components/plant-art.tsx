import { cn } from "@/lib/utils";

export function PlantArt({ emoji, className }: { emoji: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center rounded-2xl bg-gradient-to-br from-fern/25 via-fern/10 to-moss/10 text-5xl", className)} aria-hidden>
      <span className="drop-shadow-sm">{emoji}</span>
    </div>
  );
}
