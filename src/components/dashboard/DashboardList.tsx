"use client";

import { useMemo, useState } from "react";
import {
  VARIANTS,
  COMPONENT_PROTOTYPE_ORDER,
  FLOW_ORDER,
} from "@/lib/variants";
import type { VariantId, VariantMeta } from "@/lib/variants";
import { cn } from "@/lib/cn";
import { VariationCard } from "./VariationCard";

type TypeFilter = "all" | "flow" | "component";
type Sort = "edited" | "az";

const GRID_CLASS =
  "mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 3xl:grid-cols-3 3xl:gap-6";
const SECTION_TITLE_CLASS =
  "text-sm font-semibold uppercase tracking-[0.16em] text-gray-2";

/** Base ordering: component prototypes then flows. */
const BASE_ORDER: VariantId[] = [...COMPONENT_PROTOTYPE_ORDER, ...FLOW_ORDER];

const PINNED_IDS = FLOW_ORDER.filter((id) => VARIANTS[id].featured);
const PROTOTYPE_IDS = BASE_ORDER.filter((id) => !VARIANTS[id].featured);

function applyFilterSort(
  ids: VariantId[],
  typeFilter: TypeFilter,
  sort: Sort,
): VariantMeta[] {
  const filtered = ids
    .map((id) => VARIANTS[id])
    .filter((v) => typeFilter === "all" || v.kind === typeFilter);
  if (sort === "az") {
    return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  }
  // Last edited (default): most recently modified first.
  return [...filtered].sort((a, b) => b.modified.localeCompare(a.modified));
}

function SegmentedButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-pill px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet",
        active
          ? "bg-violet text-white shadow-[0_2px_8px_rgba(127,53,178,0.25)]"
          : "text-gray-2 hover:text-deep-black",
      )}
    >
      {children}
    </button>
  );
}

export function DashboardList() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<Sort>("edited");

  const pinned = useMemo(() => PINNED_IDS.map((id) => VARIANTS[id]), []);
  const prototypes = useMemo(
    () => applyFilterSort(PROTOTYPE_IDS, typeFilter, sort),
    [typeFilter, sort],
  );

  return (
    <div className="mt-10">
      <section>
        <h2 className={SECTION_TITLE_CLASS}>Ready for testing</h2>
        <div className={GRID_CLASS}>
          {pinned.map((v) => (
            <VariationCard key={v.id} v={v} />
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <div
          role="radiogroup"
          aria-label="Filter by type"
          className="inline-flex items-center gap-1 rounded-pill border border-stroke-subtle bg-white p-1"
        >
          <SegmentedButton
            active={typeFilter === "all"}
            onClick={() => setTypeFilter("all")}
          >
            All
          </SegmentedButton>
          <SegmentedButton
            active={typeFilter === "flow"}
            onClick={() => setTypeFilter("flow")}
          >
            Flows
          </SegmentedButton>
          <SegmentedButton
            active={typeFilter === "component"}
            onClick={() => setTypeFilter("component")}
          >
            Components
          </SegmentedButton>
        </div>

        <div
          role="radiogroup"
          aria-label="Sort order"
          className="inline-flex items-center gap-1 rounded-pill border border-stroke-subtle bg-white p-1"
        >
          <SegmentedButton
            active={sort === "edited"}
            onClick={() => setSort("edited")}
          >
            Last edited
          </SegmentedButton>
          <SegmentedButton active={sort === "az"} onClick={() => setSort("az")}>
            A–Z
          </SegmentedButton>
        </div>
      </div>

      {prototypes.length > 0 ? (
        <section className="mt-8">
          <h2 className={SECTION_TITLE_CLASS}>Prototypes</h2>
          <div className={GRID_CLASS}>
            {prototypes.map((v) => (
              <VariationCard key={v.id} v={v} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
