"use client";

import { cn } from "@/lib/cn";

/**
 * Shared Signature-flow brand mark. Renders the real WTW wordmark logo exported
 * from the Figma signature navbar (node 2165:33126, "WTW Logo") — a stylised
 * purple "wtw" vector, not the plain Inter wordmark used previously. The Figma
 * mark measures 54.78 x 18px and sits 32px from the left, vertically centered in
 * the 64px bar. Kept as an SVG asset (`/signature/wtw-logo.svg`) so it stays
 * crisp at any size, and in one component so both the stepper-mode nav
 * (SignatureShell) and the tabs-mode nav (SignatureTopNav) stay consistent.
 * The mark's purple (#7F35B2) matches the theme `violet`.
 */
export function SignatureBrand({
  height = 24,
  className,
}: {
  /** Rendered height of the logo mark in px. Width scales to keep aspect. */
  height?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/signature/wtw-logo.svg"
      alt="WTW"
      className={cn("block w-auto select-none", className)}
      style={{ height }}
    />
  );
}
