"use client";

import { Check, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  "登录",
  "上传",
  "分析",
  "生成",
  "材质",
  "保存"
];

export function WorkflowRail({ currentIndex }: { currentIndex: number }) {
  return (
    <nav className="overflow-x-auto rounded-lg border border-graphite/10 bg-white/75 p-2">
      <ol className="flex min-w-max items-center gap-2">
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;

          return (
            <li
              key={step}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold",
                active ? "bg-ink text-white" : done ? "bg-mint text-canopy" : "text-graphite"
              )}
            >
              {done ? <Check className="h-4 w-4" aria-hidden="true" /> : <CircleDot className="h-4 w-4" aria-hidden="true" />}
              {step}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
