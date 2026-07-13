"use client";

import { SHOW_WTW } from "@/lib/brand";
import { cn } from "@/lib/cn";

/**
 * Shared brand wordmark. Renders the WTW wordmark SVG when `SHOW_WTW` is true;
 * otherwise renders a plain "Bobcat" text wordmark so the app keeps a clickable
 * home logo. The single `SHOW_WTW` toggle makes the branding fully reversible.
 */
export function BrandWordmark({
  width = 90,
  height = 29,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  if (!SHOW_WTW) {
    return (
      <span
        className={cn("font-bold tracking-tight whitespace-nowrap", className)}
        style={{ fontSize: Math.round(height * 0.82), lineHeight: 1 }}
      >
        Bobcat
      </span>
    );
  }
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 90 29"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M90 5.70254L81.1742 28.4837H73.7419L70.0258 15.7617L66.2806 28.4837H58.8542L52.3277 11.4921H48.2632V19.1438C48.2632 22.7347 49.7148 23.3265 51.7006 23.3265C52.2268 23.316 52.7504 23.2499 53.2626 23.1292L55.2948 28.4199C53.7119 28.8074 52.0878 29.0022 50.4581 29C43.6529 29 40.7497 26.2212 40.7497 19.7181V11.4921H37.649L31.0703 28.4837H23.6381L19.9277 15.7617L16.171 28.4837H8.74452L0 5.70254H8.42516L12.8206 19.4687L17.0129 5.70254H22.8194L27.0523 19.4687L31.4245 5.70254H40.7497V1.60692L48.2632 0V5.70254H58.5348L62.9245 19.4687L67.1168 5.70254H72.9232L77.1561 19.4687L81.511 5.70254H90Z"
        fill="currentColor"
      />
    </svg>
  );
}
