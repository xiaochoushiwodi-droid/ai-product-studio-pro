"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type BrandLogoSize = "small" | "medium" | "large";

const sizeStyles: Record<BrandLogoSize, {
  root: string;
  imageBox: string;
  imageWidth: number;
  imageHeight: number;
  title: string;
  subtitle: string;
  chinese: string;
}> = {
  small: {
    root: "gap-2",
    imageBox: "h-8 w-24",
    imageWidth: 144,
    imageHeight: 40,
    title: "text-sm",
    subtitle: "text-xs",
    chinese: "text-xs"
  },
  medium: {
    root: "gap-3",
    imageBox: "h-10 w-32",
    imageWidth: 176,
    imageHeight: 49,
    title: "text-base",
    subtitle: "text-xs",
    chinese: "text-sm"
  },
  large: {
    root: "flex-col items-start gap-3",
    imageBox: "h-20 w-72",
    imageWidth: 320,
    imageHeight: 89,
    title: "text-5xl md:text-6xl",
    subtitle: "text-sm",
    chinese: "text-xl"
  }
};

export function BrandLogo({
  size = "medium",
  className,
  priority = false,
  showText = true
}: {
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
  showText?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const styles = sizeStyles[size];
  const compact = size !== "large";

  return (
    <div className={cn("flex min-w-0 items-center", compact && styles.root, !compact && styles.root, className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-md border border-cyan-400/30 bg-black/80 p-1.5 shadow-[0_0_26px_rgba(34,211,238,0.16)]",
          styles.imageBox
        )}
      >
        {!loaded && !failed ? <div className="absolute inset-0 animate-pulse bg-cyan-400/10" aria-hidden="true" /> : null}
        {failed ? (
          <div className="flex h-full w-full items-center justify-center rounded bg-cyan-400/10 text-[10px] font-black tracking-[0.16em] text-cyan-100">
            TOGO AI
          </div>
        ) : (
          <Image
            src="/brand/togo-logo.png"
            alt="TOGO AI Logo"
            width={styles.imageWidth}
            height={styles.imageHeight}
            className={cn("h-full w-full object-contain object-left transition-opacity", loaded ? "opacity-100" : "opacity-0")}
            priority={priority}
            sizes={size === "large" ? "288px" : size === "medium" ? "128px" : "96px"}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )}
      </div>

      {showText ? (
        <div className={cn("min-w-0", size === "large" ? "space-y-1" : "")}>
          <p className={cn("truncate font-black leading-tight text-white", styles.title)}>TOGO AI</p>
          {size === "large" ? <p className={cn("font-bold text-zinc-200", styles.chinese)}>图狗</p> : null}
          <p className={cn("truncate font-semibold leading-tight text-cyan-200/85", styles.subtitle)}>
            AI Product Design Engine
          </p>
          {size === "large" ? <p className="text-sm leading-6 text-zinc-400">AI产品设计智能平台</p> : null}
        </div>
      ) : null}
    </div>
  );
}
