import { History, RotateCcw } from "lucide-react";
import type { DesignVersion } from "@/types/product";

export function DesignVersionHistory({
  versions,
  selectedVersionId,
  onSelectVersion,
  onRestoreVersion
}: {
  versions: DesignVersion[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
  onRestoreVersion: (versionId: string) => void;
}) {
  const selectedVersion = versions.find((version) => version.id === selectedVersionId) ?? versions[0] ?? null;
  const previousVersion = selectedVersion ? versions.find((version) => version.createdAt < selectedVersion.createdAt) ?? null : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-cyan-100" aria-hidden="true" />
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-100">History</p>
        </div>
        <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-zinc-400">{versions.length} versions</span>
      </div>

      {versions.length === 0 ? (
        <div className="rounded-md border border-white/10 bg-black/25 p-3 text-[11px] leading-5 text-zinc-500">
          每次 AI 生成都会保存为 Version A、B、C，可查看、比较和恢复。
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            {versions.map((version) => {
              const selected = version.id === selectedVersion?.id;
              return (
                <button
                  key={version.id}
                  className={`rounded-md border p-2 text-left transition ${
                    selected ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 bg-black/25 hover:bg-white/[0.05]"
                  }`}
                  type="button"
                  onClick={() => onSelectVersion(version.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-zinc-100">{version.label}</p>
                    <span className="text-[10px] text-zinc-500">{new Date(version.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-zinc-500">{version.prompt}</p>
                </button>
              );
            })}
          </div>

          {selectedVersion ? (
            <div className="rounded-md border border-white/10 bg-black/25 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-zinc-100">{selectedVersion.label} / {selectedVersion.resultTitle}</p>
                <button
                  className="inline-flex h-7 items-center gap-1 rounded border border-white/10 bg-white/[0.06] px-2 text-[10px] font-bold text-zinc-200 transition hover:bg-white hover:text-black"
                  type="button"
                  onClick={() => onRestoreVersion(selectedVersion.id)}
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  恢复
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <VersionImage label="Original" imageUrl={selectedVersion.originalImageUrl} />
                <VersionImage label="Result" imageUrl={selectedVersion.resultPreviewUrl ?? selectedVersion.resultImageUrl} />
              </div>
              {previousVersion ? (
                <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                  比较：{previousVersion.label} → {selectedVersion.label}，当前版本锁定 {selectedVersion.designLock.mode}，目标区域 {selectedVersion.targetRegion?.label ?? "全局"}。
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function VersionImage({ label, imageUrl }: { label: string; imageUrl: string }) {
  return (
    <div>
      <div className="aspect-square overflow-hidden rounded bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={label} className="h-full w-full object-contain p-2" />
      </div>
      <p className="mt-1 text-center text-[10px] font-bold text-zinc-500">{label}</p>
    </div>
  );
}
