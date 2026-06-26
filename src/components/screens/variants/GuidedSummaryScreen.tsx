"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { useEnterToContinue } from "@/components/flow/useEnterToContinue";
import { AppShell } from "@/components/chrome/AppShell";
import { DetailsSidebar } from "@/components/chrome/DetailsSidebar";
import { Button } from "@/components/ui/Button";
import {
  narrativeProgress,
  narrativeSidebarItems,
} from "@/components/narrative/sidebarItems";
import { SECTIONS, isSectionComplete } from "@/lib/sections";
import { madlibFieldById, optionLabel } from "@/lib/narrative";
import { cn } from "@/lib/cn";

const moneyOf = (raw: string | undefined): number =>
  Number((raw ?? "").replace(/[^0-9.]/g, "")) || 0;

const fmtMoney = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

/** A labelled, click-to-edit chip used for the summary's key assumptions. */
function EditableChip({
  label,
  value,
  onSave,
  numeric = true,
  placeholder,
}: {
  label: string;
  value: string;
  onSave: (next: string) => void;
  numeric?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const start = () => {
    setDraft(value === "None" ? "" : value);
    setEditing(true);
  };
  const commit = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-1 rounded-field border border-stroke-subtle bg-white px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-gray-2">
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            inputMode={numeric ? "numeric" : "text"}
            value={draft}
            placeholder={placeholder}
            onChange={(e) =>
              setDraft(
                numeric ? e.target.value.replace(/[^0-9]/g, "") : e.target.value,
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-24 rounded border border-stroke-subtle bg-white px-2 py-1 text-base font-semibold text-deep-black outline-none focus:border-deep-black"
          />
          <button
            type="button"
            aria-label="Save"
            onClick={commit}
            className="rounded p-1 text-success transition-colors hover:bg-ghost-white"
          >
            <Check className="size-4" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => setEditing(false)}
            className="rounded p-1 text-gray-2 transition-colors hover:bg-ghost-white"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          className="flex items-center gap-2 text-left text-lg font-semibold text-deep-black transition-colors hover:text-violet"
        >
          {value}
          <Pencil className="size-3.5 text-gray-2" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}

interface IncomeSegment {
  key: string;
  label: string;
  amount: number;
  color: string;
}

/**
 * Guided-path income summary (Figma 679:20748): a recap of the retirement income
 * the user has entered so far, with editable assumptions and a stacked bar of
 * the monthly income sources. Continue is conditional — the first visit (before
 * Spending) routes on to the Spending wizard; the second (after Spending) routes
 * on to Goals.
 */
export function GuidedSummaryScreen() {
  const { answers, setAbout, goTo } = useFlow();
  const router = useRouter();
  const about = answers.about;

  const ssMode = about.ssMode?.value;
  const ssEntered = moneyOf(about.ssAmount?.value);
  // Reflect what was actually entered: an explicit amount when they entered one,
  // a modelled estimate only when they chose "estimate", otherwise nothing.
  const ssAmount =
    ssMode === "enter" ? ssEntered : ssMode === "estimate" ? 1800 : 0;
  const pension =
    about.hasPension?.value === "yes" ? moneyOf(about.pensionAmount?.value) : 0;
  const other = moneyOf(about.otherIncome?.value);
  const spouse = moneyOf(about.spouseSs?.value);

  const segments: IncomeSegment[] = [
    { key: "ss", label: "Social Security", amount: ssAmount, color: "var(--color-seg-1)" },
    { key: "pension", label: "Pension & defined benefits", amount: pension, color: "var(--color-seg-2)" },
    { key: "other", label: "Other income", amount: other, color: "var(--color-seg-3)" },
    { key: "spouse", label: "Spouse Social Security", amount: spouse, color: "var(--color-stratosphere)" },
  ].filter((s) => s.amount > 0);

  const total = segments.reduce((sum, s) => sum + s.amount, 0);

  const claimAge = about.ssClaimAge?.value || "65";
  const definedBenefits = pension > 0 ? fmtMoney(pension) : "None";

  // Savings & accounts recap (so the summary reflects spending info too).
  const totalSavings = moneyOf(about.totalSavings?.value);
  const breakdownYes = about.breakdown?.value === "yes";
  const savingsSegments: IncomeSegment[] = breakdownYes
    ? [
        { key: "preTax", label: "Pre-tax 401(k)/IRA", amount: moneyOf(about.preTax?.value), color: "var(--color-seg-1)" },
        { key: "roth", label: "Roth 401(k)/IRA", amount: moneyOf(about.roth?.value), color: "var(--color-seg-2)" },
        { key: "hsa", label: "HSA", amount: moneyOf(about.hsa?.value), color: "var(--color-seg-3)" },
        { key: "afterTax", label: "After-tax / brokerage", amount: moneyOf(about.afterTax?.value), color: "var(--color-stratosphere)" },
      ].filter((s) => s.amount > 0)
    : [];
  const savingsBarTotal = savingsSegments.reduce((sum, s) => sum + s.amount, 0);
  const allocField = madlibFieldById("allocation");
  const allocationLabel = allocField
    ? optionLabel(allocField, about.allocation?.value)
    : "";
  const hasSavings = totalSavings > 0 || savingsSegments.length > 0;

  const spendingDone = isSectionComplete(SECTIONS.spending, about);

  const handleContinue = () => {
    if (spendingDone) goTo("goals");
    else goTo("spending");
  };

  // This summary is a review page with no required input, so its
  // "Looks good, continue" action is always available — Enter advances to the
  // next section (unless the user is mid-edit in a chip's input).
  useEnterToContinue(true, handleContinue);

  const {
    aboutItems,
    incomeItems,
    spendingItems,
    goalsItems,
  } = narrativeSidebarItems(about);

  return (
    <AppShell
      fill
      customSidebar={
        <DetailsSidebar
          variant="chat"
          aboutItems={aboutItems}
          incomeItems={incomeItems}
          spendingItems={spendingItems}
          goalsItems={goalsItems}
          openSection="income"
          progress={narrativeProgress(about)}
        />
      }
    >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-base font-medium text-deep-black transition-opacity hover:opacity-70"
          >
            Back
          </button>
          <Button variant="primary" size="md" onClick={handleContinue}>
            Looks good, continue
          </Button>
        </div>

        <div className="scrollbar-slim -mx-2 mt-6 flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-2">
          <h1 className="max-w-[680px] text-3xl font-semibold leading-[1.15] tracking-[-0.01em] text-deep-black">
            {spendingDone
              ? "Here\u2019s a summary of everything so far."
              : "Here\u2019s a look at a summary of your retirement income."}
          </h1>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <EditableChip
              label="Social Security claim age"
              value={claimAge}
              placeholder="65"
              onSave={(v) => setAbout("ssClaimAge", v || "65")}
            />
            <EditableChip
              label="Other defined benefits"
              value={definedBenefits}
              placeholder="0"
              onSave={(v) => setAbout("pensionAmount", v)}
            />
          </div>

          <div className="flex flex-col gap-5 rounded-field bg-ghost-white p-6 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="text-base font-medium text-gray-text">
                Additional monthly retirement income
              </p>
              <p className="text-3xl font-semibold tracking-[-0.01em] text-deep-black">
                {fmtMoney(total)}
              </p>
            </div>

            {total > 0 ? (
              <div className="flex h-5 w-full overflow-hidden rounded-pill">
                {segments.map((s) => (
                  <div
                    key={s.key}
                    style={{
                      width: `${(s.amount / total) * 100}%`,
                      background: s.color,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="h-5 w-full rounded-pill bg-divider" />
            )}

            <div className="flex flex-col gap-2.5">
              {segments.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2 text-sm text-deep-black">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: s.color }}
                      aria-hidden
                    />
                    {s.label}
                  </span>
                  <span className="text-sm font-medium text-deep-black">
                    {fmtMoney(s.amount)}
                    <span className="text-gray-2"> / mo</span>
                  </span>
                </div>
              ))}
              {segments.length === 0 ? (
                <p className="text-sm italic text-gray-2">
                  Add your income details to see them broken down here.
                </p>
              ) : null}
            </div>
          </div>

          {hasSavings ? (
            <div className="flex flex-col gap-5 rounded-field bg-ghost-white p-6 sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <p className="text-base font-medium text-gray-text">
                    Savings &amp; accounts
                  </p>
                  {allocationLabel ? (
                    <p className="text-sm text-gray-2">{allocationLabel}</p>
                  ) : null}
                </div>
                <p className="text-3xl font-semibold tracking-[-0.01em] text-deep-black">
                  {fmtMoney(totalSavings || savingsBarTotal)}
                </p>
              </div>

              {savingsSegments.length > 0 ? (
                <>
                  <div className="flex h-5 w-full overflow-hidden rounded-pill">
                    {savingsSegments.map((s) => (
                      <div
                        key={s.key}
                        style={{
                          width: `${(s.amount / savingsBarTotal) * 100}%`,
                          background: s.color,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {savingsSegments.map((s) => (
                      <div
                        key={s.key}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="flex items-center gap-2 text-sm text-deep-black">
                          <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ background: s.color }}
                            aria-hidden
                          />
                          {s.label}
                        </span>
                        <span className="text-sm font-medium text-deep-black">
                          {fmtMoney(s.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          <p
            className={cn(
              "max-w-[560px] text-sm leading-snug text-gray-text",
            )}
          >
            {spendingDone
              ? "Next, let's turn to what matters most in your retirement."
              : "Next, we'll capture your savings and accounts to round out the picture."}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
