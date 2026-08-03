"use client";

import { LogOut, Save } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SellerSession } from "@/types/product";

export function AppHeader({
  session,
  canSave,
  onSave,
  onLogout,
  isSaving
}: {
  session: SellerSession;
  canSave: boolean;
  onSave: () => void;
  onLogout: () => void;
  isSaving: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-graphite/10 bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo size="small" priority />
          <Badge tone="green" className="hidden sm:inline-flex">
            Amazon {session.marketplace}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<Save className="h-4 w-4" aria-hidden="true" />}
            onClick={onSave}
            isLoading={isSaving}
            disabled={!canSave}
          >
            保存
          </Button>
          <Button
            variant="ghost"
            className="px-3"
            title="退出登录"
            icon={<LogOut className="h-4 w-4" aria-hidden="true" />}
            onClick={onLogout}
          >
            <span className="hidden sm:inline">退出</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
