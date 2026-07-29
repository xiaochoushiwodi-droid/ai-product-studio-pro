"use client";

import { BarChart3, BrainCircuit, CheckCircle2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import type { ProductAnalysis, UploadedProduct } from "@/types/product";

export function AnalysisPanel({
  product,
  analysis,
  onAnalyze,
  isLoading
}: {
  product: UploadedProduct | null;
  analysis: ProductAnalysis | null;
  onAnalyze: () => void;
  isLoading: boolean;
}) {
  return (
    <Panel
      title="AI 产品分析"
      eyebrow="步骤 2"
      action={
        <Button
          icon={<BrainCircuit className="h-4 w-4" aria-hidden="true" />}
          disabled={!product}
          isLoading={isLoading}
          onClick={onAnalyze}
        >
          开始分析
        </Button>
      }
    >
      {!analysis ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {["机会评分", "买家痛点", "设计杠杆"].map((item) => (
            <div key={item} className="rounded-md border border-dashed border-graphite/20 bg-white/65 p-4">
              <Search className="mb-3 h-5 w-5 text-canopy" aria-hidden="true" />
              <p className="text-sm font-semibold text-graphite">{item}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
          <div className="rounded-lg bg-ink p-5 text-white">
            <p className="text-sm font-semibold text-white/70">机会评分</p>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-5xl font-black">{analysis.opportunityScore}</span>
              <span className="pb-2 text-sm font-bold text-white/65">/100</span>
            </div>
            <Badge tone="amber" className="mt-4 border-0">
              {analysis.estimatedPriceBand}
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-canopy" aria-hidden="true" />
                <h3 className="text-sm font-bold text-ink">定位</h3>
              </div>
              <p className="text-sm leading-6 text-graphite">{analysis.positioning}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SignalList title="痛点" items={analysis.painPoints} />
              <SignalList title="设计杠杆" items={analysis.designLevers} />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-bold text-ink">平台信号</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.competitorSignals.map((item) => (
                  <Badge key={item} tone="blue">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

function SignalList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-graphite/10 bg-white p-4">
      <h3 className="mb-3 text-sm font-bold text-ink">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-5 text-graphite">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-canopy" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
