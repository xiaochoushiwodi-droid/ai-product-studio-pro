import { ImagePlus, Trash2, Type } from "lucide-react";
import type { MarketingEditorLayer, MarketingLayerIcon } from "@/types/product";

const fontOptions = ["Inter", "Arial", "Georgia", "Times New Roman"];
const iconOptions: MarketingLayerIcon[] = ["check", "sparkle", "ruler", "gem", "package", "story"];

export function MarketingLayerInspector({
  selectedLayer,
  disabled,
  onAddText,
  onAddIcon,
  onUpdateLayer,
  onDeleteLayer
}: {
  selectedLayer: MarketingEditorLayer | null;
  disabled: boolean;
  onAddText: () => void;
  onAddIcon: (icon: MarketingLayerIcon) => void;
  onUpdateLayer: (patch: Partial<MarketingEditorLayer>) => void;
  onDeleteLayer: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.06] text-xs font-bold text-zinc-200 transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-45"
          type="button"
          disabled={disabled}
          onClick={onAddText}
        >
          <Type className="h-4 w-4" aria-hidden="true" />
          Add Text
        </button>
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.06] text-xs font-bold text-zinc-200 transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-45"
          type="button"
          disabled={disabled}
          onClick={() => onAddIcon("check")}
        >
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          Add Icon
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-zinc-500">Icon Set</p>
        <div className="grid grid-cols-3 gap-1.5">
          {iconOptions.map((icon) => (
            <button
              key={icon}
              className="h-8 rounded-md border border-white/10 bg-black/25 text-[10px] font-bold text-zinc-400 transition hover:bg-white/[0.08] hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-45"
              type="button"
              disabled={disabled}
              onClick={() => onAddIcon(icon)}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {selectedLayer ? (
        <div className="space-y-3 rounded-md border border-cyan-400/20 bg-cyan-400/10 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-cyan-100">Selected Layer</p>
            <button
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-black/25 text-zinc-400 transition hover:bg-red-500/15 hover:text-red-200"
              type="button"
              onClick={onDeleteLayer}
              title="Delete layer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Text</span>
            <textarea
              className="min-h-16 w-full resize-none rounded-md border border-white/10 bg-black/35 px-3 py-2 text-sm leading-5 text-zinc-100 outline-none transition focus:border-cyan-300/60"
              value={selectedLayer.text}
              onChange={(event) => onUpdateLayer({ text: event.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <Field label="X" value={selectedLayer.x} min={0} max={100} onChange={(value) => onUpdateLayer({ x: value })} />
            <Field label="Y" value={selectedLayer.y} min={0} max={100} onChange={(value) => onUpdateLayer({ y: value })} />
            <Field label="Width" value={selectedLayer.width} min={8} max={90} onChange={(value) => onUpdateLayer({ width: value })} />
            <Field label="Size" value={selectedLayer.fontSize} min={10} max={76} onChange={(value) => onUpdateLayer({ fontSize: value })} />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Font</span>
            <select
              className="h-9 w-full rounded-md border border-white/10 bg-black/35 px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60"
              value={selectedLayer.fontFamily}
              onChange={(event) => onUpdateLayer({ fontFamily: event.target.value })}
            >
              {fontOptions.map((font) => (
                <option key={font}>{font}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Color</span>
              <input
                className="h-9 w-full rounded-md border border-white/10 bg-black/35 px-2"
                type="color"
                value={selectedLayer.color}
                onChange={(event) => onUpdateLayer({ color: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Opacity</span>
              <input
                className="h-9 w-full"
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={selectedLayer.opacity}
                onChange={(event) => onUpdateLayer({ opacity: Number(event.target.value) })}
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(["left", "center", "right"] as const).map((align) => (
              <button
                key={align}
                className={`h-8 rounded-md border text-[11px] font-bold transition ${
                  selectedLayer.align === align ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-black/25 text-zinc-500 hover:text-zinc-200"
                }`}
                type="button"
                onClick={() => onUpdateLayer({ align })}
              >
                {align}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-white/10 bg-black/25 p-3 text-[11px] leading-5 text-zinc-500">
          选择画布中的文字或图标图层后，可以修改内容、拖动位置、调整大小、字体、透明度和颜色。
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-zinc-500">{label}</span>
      <input
        className="h-9 w-full rounded-md border border-white/10 bg-black/35 px-2 text-sm text-zinc-100 outline-none transition focus:border-cyan-300/60"
        type="number"
        min={min}
        max={max}
        value={Math.round(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
