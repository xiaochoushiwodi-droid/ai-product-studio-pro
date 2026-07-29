import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "green" | "amber" | "blue" | "coral";

const tones: Record<BadgeTone, string> = {
  neutral: "border-graphite/15 bg-white text-graphite",
  green: "border-canopy/20 bg-mint text-canopy",
  amber: "border-signal/30 bg-signal/15 text-ink",
  blue: "border-ocean/20 bg-ocean/10 text-ocean",
  coral: "border-coral/20 bg-coral/10 text-coral"
};

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
