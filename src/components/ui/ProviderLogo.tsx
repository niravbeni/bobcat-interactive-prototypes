"use client";

import { useMemo, useState } from "react";
import {
  PROVIDER_DOMAINS,
  PROVIDER_LOGO_BG,
  PROVIDER_LOGO_OFFSET_Y,
  PROVIDER_LOGO_SCALE,
  PROVIDER_LOGO_SRC,
} from "@/lib/institutions";
import { cn } from "@/lib/cn";

/**
 * Provider brand logo in a round tile. Prefers a bundled local logo, then a
 * real logo from a CDN (Clearbit, then a Google favicon), and falls back to the
 * accent-colored initials chip if none of the images resolve.
 */
export function ProviderLogo({
  provider,
  accentColor,
  className,
  textClassName,
}: {
  provider: string;
  accentColor?: string;
  /** Sizing classes for the tile, e.g. "size-10". */
  className?: string;
  /** Text sizing for the initials fallback, e.g. "text-sm". */
  textClassName?: string;
}) {
  const domain = PROVIDER_DOMAINS[provider];
  const localSrc = PROVIDER_LOGO_SRC[provider];
  const sources = useMemo(() => {
    const list: string[] = [];
    if (localSrc) list.push(localSrc);
    if (domain) {
      list.push(
        `https://logo.clearbit.com/${domain}`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      );
    }
    return list;
  }, [domain, localSrc]);
  const [idx, setIdx] = useState(0);

  if (idx >= sources.length) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
          textClassName,
          className,
        )}
        style={{ background: accentColor ?? "var(--color-violet)" }}
        aria-hidden
      >
        {provider.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  const tileBg = PROVIDER_LOGO_BG[provider];
  const scale = PROVIDER_LOGO_SCALE[provider];
  const offsetY = PROVIDER_LOGO_OFFSET_Y[provider];
  const transform =
    scale || offsetY
      ? `scale(${scale ?? 1}) translateY(${offsetY ?? 0}%)`
      : undefined;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-stroke-subtle",
        tileBg ? null : "bg-white",
        className,
      )}
      style={tileBg ? { background: tileBg } : undefined}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sources[idx]}
        alt=""
        loading="lazy"
        onError={() => setIdx((i) => i + 1)}
        className="size-full object-contain p-1"
        style={transform ? { transform } : undefined}
      />
    </span>
  );
}
