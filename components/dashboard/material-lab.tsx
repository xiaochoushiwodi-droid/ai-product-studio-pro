"use client";

import { Box, Factory, FlaskConical, Leaf } from "lucide-react";
import { FormEvent, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import type { DesignConcept, MaterialRecommendation } from "@/types/product";

const materialFamilies = ["再生聚合物", "食品级硅胶", "阳极氧化铝", "竹纤维复合材"];
const finishes = ["柔和哑光", "细腻纹理", "缎面阳极氧化", "温润天然", "高光点缀"];

export function MaterialLab({
  concepts,
  selectedConceptId,
  recommendation,
  onModifyMaterial,
  isLoading
}: {
  concepts: DesignConcept[];
  selectedConceptId: string | null;
  recommendation: MaterialRecommendation | null;
  onModifyMaterial: (input: { materialFamily: string; finish: string }) => void;
  isLoading: boolean;
}) {
  const [materialFamily, setMaterialFamily] = useState(materialFamilies[0]);
  const [finish, setFinish] = useState(finishes[0]);

  const selectedConcept = concepts.find((concept) => concept.id === selectedConceptId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onModifyMaterial({ materialFamily, finish });
  }

  return (
    <Panel title="材质修改" eyebrow="步骤 4">
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <form className="rounded-lg border border-graphite/10 bg-white p-4" onSubmit={handleSubmit}>
          <div className="mb-4 flex items-center gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-mint text-canopy">
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">材质实验室</h3>
              <p className="text-xs text-graphite">{selectedConcept?.title ?? "请先选择一个方案"}</p>
            </div>
          </div>

          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-semibold text-graphite">材质类别</span>
            <select
              className="h-10 w-full rounded-md border border-graphite/15 bg-white px-3 text-sm outline-none transition focus:border-canopy focus:ring-4 focus:ring-canopy/10"
              value={materialFamily}
              onChange={(event) => setMaterialFamily(event.target.value)}
            >
              {materialFamilies.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="mb-5 block">
            <span className="mb-2 block text-sm font-semibold text-graphite">表面处理</span>
            <select
              className="h-10 w-full rounded-md border border-graphite/15 bg-white px-3 text-sm outline-none transition focus:border-canopy focus:ring-4 focus:ring-canopy/10"
              value={finish}
              onChange={(event) => setFinish(event.target.value)}
            >
              {finishes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <Button
            className="w-full"
            icon={<Factory className="h-4 w-4" aria-hidden="true" />}
            disabled={!selectedConceptId}
            isLoading={isLoading}
          >
            修改材质
          </Button>
        </form>

        {!recommendation ? (
          <div className="grid gap-3 md:grid-cols-3">
            {["表面触感", "成本信号", "供应商简报"].map((item) => (
              <div key={item} className="rounded-md border border-dashed border-graphite/20 bg-white/65 p-4">
                <Box className="mb-3 h-5 w-5 text-ocean" aria-hidden="true" />
                <p className="text-sm font-semibold text-graphite">{item}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-graphite/10 bg-white p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge tone="green">{recommendation.materialFamily}</Badge>
              <Badge tone="amber">{recommendation.finish}</Badge>
              <Badge tone="blue">{recommendation.costSignal}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoBlock icon={<Box className="h-4 w-4" aria-hidden="true" />} title="外壳材质" value={recommendation.shellMaterial} />
              <InfoBlock icon={<FlaskConical className="h-4 w-4" aria-hidden="true" />} title="表面处理" value={recommendation.surfaceTreatment} />
              <InfoBlock icon={<Factory className="h-4 w-4" aria-hidden="true" />} title="耐用性" value={recommendation.durability} />
              <InfoBlock icon={<Leaf className="h-4 w-4" aria-hidden="true" />} title="可持续性" value={recommendation.sustainability} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <BulletBlock title="供应商简报" items={recommendation.supplierBrief} />
              <BulletBlock title="合规检查" items={recommendation.complianceChecks} />
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

function InfoBlock({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-md bg-paper p-4">
      <div className="mb-2 flex items-center gap-2 text-canopy">
        {icon}
        <h3 className="text-sm font-bold text-ink">{title}</h3>
      </div>
      <p className="text-sm leading-6 text-graphite">{value}</p>
    </div>
  );
}

function BulletBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-ink">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-graphite">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
