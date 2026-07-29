"use client";

import { BadgeCheck, Lightbulb, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import type { DesignConcept, ProductAnalysis } from "@/types/product";

export function DesignPlanPanel({
  analysis,
  concepts,
  selectedConceptId,
  onGenerate,
  onSelectConcept,
  isLoading
}: {
  analysis: ProductAnalysis | null;
  concepts: DesignConcept[];
  selectedConceptId: string | null;
  onGenerate: () => void;
  onSelectConcept: (id: string) => void;
  isLoading: boolean;
}) {
  return (
    <Panel
      title="AI 设计方案"
      eyebrow="步骤 3"
      action={
        <Button
          icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          disabled={!analysis}
          isLoading={isLoading}
          onClick={onGenerate}
        >
          生成方案
        </Button>
      }
    >
      {concepts.length === 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {["核心升级", "高端角度", "套装系统"].map((item) => (
            <div key={item} className="rounded-md border border-dashed border-graphite/20 bg-white/65 p-4">
              <Lightbulb className="mb-3 h-5 w-5 text-signal" aria-hidden="true" />
              <p className="text-sm font-semibold text-graphite">{item}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {concepts.map((concept) => {
            const selected = selectedConceptId === concept.id;

            return (
              <button
                key={concept.id}
                className={cn(
                  "flex h-full flex-col rounded-lg border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft",
                  selected ? "border-canopy ring-4 ring-canopy/10" : "border-graphite/10"
                )}
                type="button"
                onClick={() => onSelectConcept(concept.id)}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-ink">{concept.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-graphite">{concept.promise}</p>
                  </div>
                  <Badge tone={selected ? "green" : "neutral"}>{concept.score}</Badge>
                </div>

                <p className="mb-4 text-sm leading-6 text-graphite">{concept.rationale}</p>

                <div className="mb-4 flex flex-wrap gap-2">
                  {concept.colorPalette.map((color) => (
                    <Badge key={color} tone="blue">
                      {color}
                    </Badge>
                  ))}
                </div>

                <ul className="mb-4 space-y-2">
                  {concept.featureChanges.map((change) => (
                    <li key={change} className="flex gap-2 text-sm leading-5 text-graphite">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-canopy" aria-hidden="true" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto border-t border-graphite/10 pt-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-graphite/70">上架角度</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{concept.listingAngle}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
