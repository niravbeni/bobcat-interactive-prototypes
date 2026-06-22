"use client";

import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";

export function PrioritiesSummaryScreen() {
  const { answers, variant, goNext, goBack } = useFlow();
  const ranked = answers.goalCards;
  const verdicts = answers.goalVerdicts;

  // Swipe sorts into buckets (essential / nice / skip), so a numbered rank is
  // not meaningful — surface the cards marked "essential" instead. The card
  // sort is drag-ranked, so its order genuinely reflects priority.
  const isSwipe = variant === "swipe";
  const essentials = ranked.filter((c) => verdicts[c.id] === "essential");
  const nice = ranked.filter((c) => verdicts[c.id] === "nice");
  const swipeTop = essentials.length > 0 ? essentials : nice;

  const shown = isSwipe ? swipeTop : ranked.slice(0, 3);
  const topPhrase = (isSwipe ? swipeTop : ranked.slice(0, 2))
    .map((t) => t.label.toLowerCase())
    .join(", ")
    .replace(/,([^,]*)$/, " and$1");

  const subtitle = isSwipe
    ? essentials.length > 0
      ? "These are the goals you marked as essential. We\u2019ll weight your plan around them."
      : "Here are the goals you leaned towards. We\u2019ll weight your plan around them."
    : "Based on everything you told us, these are the goals that matter most. We\u2019ll weight your plan around the ones at the top.";

  return (
    <AppShell
      fill
      sidebar={{
        planBadge: { label: "Updated", tone: "success" },
        detailsBadges: [{ label: "Required 90%", tone: "warning" }],
        subSections: [
          { label: "About You" },
          { label: "Assets" },
          { label: "Income" },
          { label: "Spending" },
          { label: "Goals", active: true },
        ],
      }}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <BackButton onClick={goBack} />

        <div className="mt-6 flex items-center gap-2 text-violet">
          <Sparkles className="size-5" strokeWidth={2} />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">
            Your priorities
          </span>
        </div>
        <h1 className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black xl:text-[32px]">
          Here&rsquo;s what matters most to you.
        </h1>
        <p className="mt-3 max-w-[620px] text-sm tracking-[-0.28px] text-black/75">
          {subtitle}
        </p>

        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
          <ol className="flex flex-col gap-2">
            {shown.map((card, i) => {
              const isTop = isSwipe || i < 2;
              return (
                <li
                  key={card.id}
                  className={cn(
                    "flex items-center gap-3 rounded-card border px-4 py-3",
                    isTop
                      ? "border-violet/30 bg-violet/5"
                      : "border-stroke-subtle bg-white",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      isTop
                        ? "bg-violet text-white"
                        : "bg-ghost-white text-gray-1",
                    )}
                  >
                    {isSwipe ? (
                      <CheckCheck className="size-4" strokeWidth={2.5} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="text-base font-medium text-deep-black">
                    {card.label}
                  </span>
                  {!isSwipe && isTop ? (
                    <span className="ml-auto rounded-full bg-violet px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                      Top priority
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>

          <div className="mt-5 rounded-card border border-stroke-subtle bg-ghost-white p-5">
            <div className="flex items-center gap-2 text-deep-black">
              <SlidersHorizontal className="size-5 text-violet" strokeWidth={2} />
              <h2 className="text-base font-semibold">What happens next</h2>
            </div>
            <p className="mt-2 text-sm leading-[1.5] text-gray-1">
              Bobcat feeds these priorities into your personalised model. The
              ones you flagged as most important shape your projections, your
              recommended contributions, and where we look to cut fees, so your
              plan reflects {topPhrase ? `${topPhrase} first` : "what you care about most"}.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-success">
              <TrendingUp className="size-4" strokeWidth={2} />
              Your plan will update to reflect this.
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-stroke-subtle pt-4">
          <span className="text-sm text-gray-text">
            {isSwipe
              ? `${shown.length} ${shown.length === 1 ? "priority" : "priorities"} flagged`
              : `Top ${shown.length} of ${ranked.length} priorities`}
          </span>
          <Button variant="blue" size="md" onClick={goNext}>
            Continue
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
