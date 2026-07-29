"use client";

import { PointerEvent, useRef, useState } from "react";
import { CheckCircle2, Gem, Package, Ruler, Sparkles, Type, Workflow } from "lucide-react";
import type { MarketingAutoLayout, MarketingEditorLayer, MarketingLayerIcon } from "@/types/product";

const iconMap: Record<MarketingLayerIcon, typeof Sparkles> = {
  sparkle: Sparkles,
  check: CheckCircle2,
  ruler: Ruler,
  gem: Gem,
  package: Package,
  story: Workflow
};

export function MarketingImageEditor({
  layout,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer
}: {
  layout: MarketingAutoLayout;
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string | null) => void;
  onUpdateLayer: (layerId: string, patch: Partial<MarketingEditorLayer>) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingLayerId || !stageRef.current) return;

    const bounds = stageRef.current.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    onUpdateLayer(draggingLayerId, {
      x: Math.max(2, Math.min(92, x)),
      y: Math.max(2, Math.min(92, y))
    });
  }

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between rounded-md border border-white/10 bg-black/45 px-3 py-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">AI Marketing Image Studio</p>
          <p className="mt-1 text-[11px] text-zinc-500">{layout.imageIndex}. {layout.templateName} / 1600 x 1600</p>
        </div>
        <span className="rounded border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-100">
          original_reference locked
        </span>
      </div>

      <div
        ref={stageRef}
        className="relative mx-auto aspect-square overflow-hidden rounded-md border border-white/10 bg-white shadow-[0_30px_120px_rgba(0,0,0,0.55)]"
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDraggingLayerId(null)}
        onPointerLeave={() => setDraggingLayerId(null)}
      >
        {layout.layoutPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={layout.layoutPreviewUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={layout.imageUrl}
          alt={layout.templateName}
          className="absolute inset-0 h-full w-full object-contain p-[10%]"
        />

        {layout.layers.map((layer) => (
          <LayerNode
            key={layer.id}
            layer={layer}
            selected={layer.id === selectedLayerId}
            onSelect={() => onSelectLayer(layer.id)}
            onStartDrag={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDraggingLayerId(layer.id);
              onSelectLayer(layer.id);
            }}
          />
        ))}

        <button
          className="absolute inset-0 -z-10"
          type="button"
          aria-label="Deselect layer"
          onClick={() => onSelectLayer(null)}
        />
      </div>
    </div>
  );
}

function LayerNode({
  layer,
  selected,
  onSelect,
  onStartDrag
}: {
  layer: MarketingEditorLayer;
  selected: boolean;
  onSelect: () => void;
  onStartDrag: (event: PointerEvent<HTMLButtonElement>) => void;
}) {
  const Icon = layer.icon ? iconMap[layer.icon] : Type;

  return (
    <button
      className={`absolute cursor-move rounded-md border px-2 py-1 text-left transition ${
        selected ? "border-cyan-400 bg-cyan-100/70 shadow-[0_0_32px_rgba(34,211,238,0.35)]" : "border-transparent hover:border-cyan-300/40 hover:bg-white/35"
      }`}
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        width: `${layer.width}%`,
        color: layer.color,
        opacity: layer.opacity,
        textAlign: layer.align,
        fontFamily: layer.fontFamily,
        fontSize: `${layer.fontSize}px`,
        fontWeight: layer.fontWeight,
        transform: "translate(-2%, -2%)"
      }}
      type="button"
      onClick={onSelect}
      onPointerDown={onStartDrag}
    >
      {layer.type === "icon" ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-2 shadow-sm">
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="leading-tight">{layer.text}</span>
        </span>
      ) : (
        <span className="block leading-tight">{layer.text}</span>
      )}
    </button>
  );
}
