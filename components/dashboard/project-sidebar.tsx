"use client";

import { FolderOpen, Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { shortDate } from "@/lib/utils";
import type { SavedProject } from "@/types/product";

export function ProjectSidebar({
  projects,
  onOpenProject
}: {
  projects: SavedProject[];
  onOpenProject: (project: SavedProject) => void;
}) {
  return (
    <aside className="glass-panel rounded-lg p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-canopy">项目库</p>
          <h2 className="text-lg font-bold text-ink">已保存项目</h2>
        </div>
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-mint text-canopy">
          <FolderOpen className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-md border border-dashed border-graphite/20 bg-white/65 p-4 text-sm text-graphite">
          保存后的设计项目会显示在这里。
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <button
              key={project.id}
              className="w-full rounded-md border border-graphite/10 bg-white p-3 text-left transition hover:border-canopy/40 hover:shadow-sm"
              type="button"
              onClick={() => onOpenProject(project)}
            >
              <div className="flex items-start gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-mist">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={project.product.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{project.product.name}</p>
                  <p className="text-xs text-graphite">{shortDate(project.savedAt)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge tone={project.status === "Ready for sampling" ? "green" : "neutral"}>
                      {project.status}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-ocean">
                      <Layers3 className="h-3 w-3" aria-hidden="true" />
                      {project.concepts.length}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
