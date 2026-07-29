import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass-panel rounded-lg p-5 shadow-soft", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-canopy">{eyebrow}</p> : null}
          <h2 className="text-lg font-bold text-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
