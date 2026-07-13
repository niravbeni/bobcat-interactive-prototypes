"use client";

import { motion } from "motion/react";
import {
  Check,
  ChevronRight,
  LineChart,
  Lock,
  Receipt,
  Target,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { DetailsShell } from "@/components/prototypes/details/DetailsShell";
import {
  computeDetailsCompletion,
  computeDetailsProgress,
  type DetailsCompletion,
} from "@/lib/detailsProgress";
import { cn } from "@/lib/cn";
import { isDetailsV2Variant } from "@/lib/variants";
import type { StepId } from "@/lib/types";

type RowStatus = "complete" | "in-progress" | "not-started" | "locked";

interface HubRow {
  /** Target step; null means the row is not clickable. */
  step: StepId | null;
  title: string;
  icon: LucideIcon;
  /** Which completion flag drives this row's status. */
  completionKey: keyof DetailsCompletion;
}

const ROWS: HubRow[] = [
  {
    step: "details-about",
    title: "About you",
    icon: User,
    completionKey: "about",
  },
  {
    step: "details-assets",
    title: "Your assets",
    icon: Wallet,
    completionKey: "assets",
  },
  {
    // Income is present visually but non-clickable (no detail page).
    step: null,
    title: "Your income",
    icon: LineChart,
    completionKey: "income",
  },
  {
    step: "details-spending",
    title: "Your spending",
    icon: Receipt,
    completionKey: "spending",
  },
  {
    step: "details-goals",
    title: "Your goals",
    icon: Target,
    completionKey: "goals",
  },
];

const STATUS_LABEL_CLASS: Record<RowStatus, string> = {
  complete: "text-violet",
  "in-progress": "text-stratosphere",
  "not-started": "text-gray-2",
  locked: "text-gray-2",
};

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/** Trailing status indicator matching the hub frame. */
function StatusIndicator({ status }: { status: RowStatus }) {
  if (status === "complete") {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-violet text-white">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="flex size-6 items-center justify-center rounded-full border-2 border-deep-black">
        <span className="size-2 rounded-full bg-deep-black" />
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="flex size-6 items-center justify-center rounded-full border border-divider text-gray-2">
        <Lock className="size-3" strokeWidth={2.2} />
      </span>
    );
  }
  return <span className="size-6 rounded-full border-2 border-divider" />;
}

/**
 * Details hub (frame 979-30329). A "Your details" summary listing five
 * sections; every row is clickable to open its detail page except "Your income"
 * which stays locked. Rendered with the sidebar-less shell.
 */
export function DetailsHomeScreen() {
  const { answers, goTo, variant } = useFlow();
  const completion = computeDetailsCompletion(answers.details);
  const progress = computeDetailsProgress(answers.details);
  const isV2 = isDetailsV2Variant(variant);

  return (
    <DetailsShell withSidebar={false}>
      <div className="mx-auto my-auto flex w-full max-w-[540px] flex-col py-10">
        <motion.div
          {...enter(0)}
          className="flex items-end justify-between gap-6"
        >
          <div className="min-w-0">
            <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black">
              Your details
            </h1>
            <p className="mt-1.5 text-sm leading-snug text-black/70">
              Add a few more details and we&apos;ll complete your plan.
            </p>
          </div>
          <div className="w-[200px] shrink-0 pb-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-divider">
              <motion.div
                className="h-full rounded-full bg-violet"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
                Required details
              </span>
              <span className="text-[11px] font-medium text-gray-2">
                {progress}%
              </span>
            </div>
          </div>
        </motion.div>

        <div className="mt-10 flex flex-col gap-4">
          {ROWS.map((row, i) => {
            const clickable = row.step !== null;
            const Icon = row.icon;
            const status: RowStatus = completion[row.completionKey]
              ? "complete"
              : "not-started";
            const statusLabel = completion[row.completionKey]
              ? "Complete"
              : "Not started";
            const body = (
              <>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ghost-white text-deep-black">
                  <Icon className="size-5" strokeWidth={1.9} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-lg font-semibold leading-tight text-deep-black">
                    {row.title}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 text-[13px] font-medium",
                      STATUS_LABEL_CLASS[status],
                    )}
                  >
                    {statusLabel}
                  </span>
                </span>
                <StatusIndicator status={status} />
                <ChevronRight
                  className="size-5 shrink-0 text-gray-2"
                  strokeWidth={2}
                />
              </>
            );

            return (
              <motion.div key={row.title} {...enter(0.06 + i * 0.05)}>
                {clickable ? (
                  <motion.button
                    type="button"
                    onClick={() => goTo(row.step as StepId)}
                    whileTap={isV2 ? { scale: 0.98 } : undefined}
                    className="flex w-full items-center gap-4 rounded-card border border-stroke-subtle bg-white px-5 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-violet/50 hover:shadow-[0_8px_24px_-16px_rgba(127,53,178,0.5)]"
                  >
                    {body}
                  </motion.button>
                ) : (
                  <div
                    className="flex w-full cursor-not-allowed items-center gap-4 rounded-card border border-dashed border-stroke-subtle bg-white/70 px-5 py-4 text-left"
                    aria-disabled
                  >
                    {body}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </DetailsShell>
  );
}
