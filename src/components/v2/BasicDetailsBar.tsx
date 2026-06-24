"use client";

import { useFlow } from "@/components/flow/FlowProvider";
import { Button } from "@/components/ui/Button";
import { MANDATORY_QIDS } from "@/lib/questions";

/**
 * Footer bar shown on the Outlook and Details pages: nudges the user to add the
 * mandatory "basic" details and shows how far along they are. The percentage
 * tracks how many mandatory questions have an answer.
 */
export function BasicDetailsBar() {
  const { answers, goTo } = useFlow();

  // Baseline credit for steps completed before this prototype begins; the
  // remaining headroom fills in as the user answers mandatory questions here.
  const BASELINE = 40;
  const ids = [...MANDATORY_QIDS];
  const answered = ids.filter(
    (id) => answers.income[id]?.choice || answers.spending[id]?.choice,
  ).length;
  const progress = ids.length ? answered / ids.length : 0;
  const pct = Math.round(BASELINE + progress * (100 - BASELINE));
  const complete = pct >= 100;

  return (
    <div className="rounded-field bg-ghost-white px-5 pb-3 pt-3.5 sm:px-6">
      <div className="mx-auto w-full max-w-[560px]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base font-medium text-deep-black">
          {complete
            ? "Nice — your basics are in. Keep adding to sharpen your outlook."
            : "Add a few basics to see your updated outlook."}
        </p>
        <Button
          variant="blue"
          size="md"
          className="shrink-0"
          onClick={() => goTo("chat")}
        >
          {complete ? "Add more details" : "Add basic details"}
        </Button>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-deep-black">
            Basic details
          </span>
          <span className="text-xs font-medium tabular-nums text-gray-2">
            {pct}% Complete
          </span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-divider">
          <div
            className="h-full rounded-full bg-success transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
