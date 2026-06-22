"use client";

import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { EditableChip } from "@/components/ui/EditableChip";
import { SegmentedBar, type Segment } from "@/components/ui/SegmentedBar";
import { INCOME_QUESTIONS } from "@/lib/questions";
import { PiggyBank } from "lucide-react";

const SEG_COLORS = ["var(--color-seg-1)", "var(--color-seg-2)", "var(--color-seg-3)"];

function parseMoney(v?: string): number {
  if (!v) return 0;
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export function SummaryScreen() {
  const { answers, goBack, goNext, goTo, setSectionIdx } = useFlow();
  const income = answers.income;

  // Build the monthly income breakdown from the user's actual answers.
  const sources: { label: string; value: number }[] = [];
  if (income.ssBenefit?.choice) {
    sources.push({ label: "Social Security", value: parseMoney(income.ssBenefit.value) });
  }
  if (income.pension?.choice === "yes") {
    sources.push({ label: "Pension", value: parseMoney(income.pension.value) });
  }
  if (income.otherIncome?.choice === "yes") {
    sources.push({ label: "Other income", value: parseMoney(income.otherIncome.value) });
  }
  if (sources.length === 0) {
    sources.push({ label: "Social Security", value: 4000 });
  }

  const total = sources.reduce((s, x) => s + x.value, 0);
  const segments: Segment[] = sources.map((s, i) => ({
    label: s.label,
    value: s.value || 1,
    display: `$${fmt(s.value)}`,
    color: SEG_COLORS[i % SEG_COLORS.length],
  }));

  const editQuestion = (i: number) => {
    setSectionIdx("income", i);
    goTo("income");
  };

  const startSpending = () => {
    setSectionIdx("spending", 0);
    goNext();
  };

  const footer = (
    <div className="flex items-center gap-5 rounded-[7px] bg-card px-7 py-5 xl:gap-10">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-xs font-medium tracking-[-0.24px] text-black">
          <span>All required Details</span>
          <span className="shrink-0">40% Complete</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-[#cbcaca]">
          <div className="h-full rounded-full bg-success" style={{ width: "40%" }} />
        </div>
      </div>
      <Button
        variant="blue"
        size="md"
        onClick={startSpending}
        className="shrink-0 xl:px-8 xl:py-4 xl:text-2xl"
      >
        Continue adding details
      </Button>
    </div>
  );

  return (
    <AppShell
      footer={footer}
      sidebar={{
        planBadge: { label: "Updated", tone: "success" },
        detailsBadges: [
          { label: "Required 40%", tone: "warning" },
          { label: "Optional 0%", tone: "neutral" },
        ],
        subSections: [
          { label: "About You" },
          { label: "Assets" },
          { label: "Income", active: true },
          { label: "Goals" },
        ],
      }}
    >
      <div className="flex w-full flex-col">
        <BackButton onClick={goBack} />

        <h1 className="mt-6 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black xl:text-[32px]">
          Here&rsquo;s a look at a summary of your retirement income. Make any changes
        </h1>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {INCOME_QUESTIONS.map((q, i) => (
            <EditableChip
              key={q.id}
              label={q.chipLabel}
              value={q.chipValue(income[q.id])}
              onEdit={() => editQuestion(i)}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center gap-4">
          <span className="flex size-11 items-center justify-center rounded-full bg-violet/15 text-violet">
            <PiggyBank className="size-6" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col">
            <span className="text-xl font-semibold tracking-[-0.72px] text-ink xl:text-2xl">
              Additional monthly retirement income
            </span>
            <span className="text-sm tracking-[-0.48px] text-gray-2 xl:text-base">
              Based on the answers you just gave
            </span>
          </div>
          <span className="ml-auto text-xl font-semibold tracking-[-0.72px] text-ink xl:text-2xl">
            ${fmt(total)}
          </span>
        </div>

        <SegmentedBar className="mt-6" segments={segments} />
      </div>
    </AppShell>
  );
}
