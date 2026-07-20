import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { firstStep, pathFor } from "@/lib/variants";
import type { VariantMeta } from "@/lib/variants";
import { cn } from "@/lib/cn";

/** Exact day/month/year, e.g. "7 Jul 2026". */
function formatExact(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function VariationCard({ v }: { v: VariantMeta }) {
  const ready = v.status === "ready";
  const featured = Boolean(v.featured) && ready;
  const href = pathFor(v.id, firstStep(v.id));

  const inner = (
    <div
      className={cn(
        "flex h-full flex-col rounded-card p-6 transition-all",
        featured
          ? "border-2 border-violet bg-gradient-to-br from-violet/[0.08] to-white shadow-[0_10px_40px_rgba(127,53,178,0.12)]"
          : "border border-stroke-subtle bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-deep-black">{v.title}</h2>
        {featured ? (
          <StatusBadge tone="brand">{v.featuredLabel ?? "Ready for testing"}</StatusBadge>
        ) : null}
      </div>
      <p className="mt-3 flex-1 text-base leading-[1.5] text-gray-text">{v.description}</p>

      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-2">
        <div className="flex items-center gap-1">
          <dt className="font-medium">Created</dt>
          <dd>{formatExact(v.created)}</dd>
        </div>
        <div className="flex items-center gap-1">
          <dt className="font-medium">Updated</dt>
          <dd>{formatExact(v.modified)}</dd>
        </div>
      </dl>

      {featured ? (
        <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-pill bg-violet px-5 py-2.5 text-base font-semibold text-white transition-opacity group-hover:opacity-90">
          Start
          <ArrowRight className="size-5" strokeWidth={2} />
        </span>
      ) : (
        <span
          className={
            ready
              ? "mt-5 inline-flex items-center gap-2 text-base font-semibold text-violet"
              : "mt-5 inline-flex items-center gap-2 text-base font-medium text-gray-2"
          }
        >
          {ready ? "Start" : "Not built yet"}
          {ready ? <ArrowRight className="size-5" strokeWidth={2} /> : null}
        </span>
      )}
    </div>
  );

  if (!ready) {
    return <div className="cursor-not-allowed opacity-70">{inner}</div>;
  }
  return (
    <Link
      href={href}
      className="group block rounded-card outline-none transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(16,24,32,0.08)] focus-visible:ring-2 focus-visible:ring-violet"
    >
      {inner}
    </Link>
  );
}
