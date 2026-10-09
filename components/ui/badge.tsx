import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-500",
  {
    variants: {
      tone: {
        ok: "bg-ok/15 text-ok",
        watch: "bg-warn/15 text-warn",
        bad: "bg-bad/15 text-bad",
      },
    },
    defaultVariants: { tone: "ok" },
  }
);

export function Badge({
  className,
  tone,
  children,
}: { className?: string; children: React.ReactNode } & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}
