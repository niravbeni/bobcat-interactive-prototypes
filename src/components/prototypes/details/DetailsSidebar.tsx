"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CircleHelp } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { DETAILS_GOAL_BY_ID } from "@/lib/detailsGoals";
import { computeDetailsCompletion, computeDetailsProgress } from "@/lib/detailsProgress";
import type { AssetRow, DetailsAbout, StepId } from "@/lib/types";
import { AccordionSection, EditableRows, EditableValue } from "./editable";

type DetailsSectionId =
  | "About you"
  | "Assets"
  | "Income"
  | "Spending"
  | "Goals";

const SECTIONS: DetailsSectionId[] = [
  "About you",
  "Assets",
  "Income",
  "Spending",
  "Goals",
];

/** Which sidebar section corresponds to each detail step. */
const STEP_TO_SECTION: Partial<Record<StepId, DetailsSectionId>> = {
  "details-about": "About you",
  "details-assets": "Assets",
  "details-spending": "Spending",
  "details-goals": "Goals",
};

/** Detail step each sidebar section links to (Income has no page → not listed). */
const SECTION_TO_STEP: Partial<Record<DetailsSectionId, StepId>> = {
  "About you": "details-about",
  Assets: "details-assets",
  Spending: "details-spending",
  Goals: "details-goals",
};

const fmtMoney = (n: number | null): string =>
  n === null ? "$0" : `$${Math.round(n).toLocaleString("en-US")}`;

/** Field order for the About-you editable rows in the sidebar. */
const ABOUT_FIELDS: [keyof DetailsAbout, string][] = [
  ["firstName", "First name"],
  ["lastName", "Last name"],
  ["dob", "Date of birth"],
  ["zip", "Zip code"],
  ["relationship", "Relationship status"],
];

/**
 * Figma-style left panel for the Details flow, modeled on OutlookSidebar. Every
 * section is a working accordion bound to the shared `details` state so edits
 * here persist and mirror what each detail page shows. The section matching the
 * active step is auto-expanded. Income is locked (greyed, non-expandable).
 */
export function DetailsSidebar() {
  const { answers, setDetails, step, goTo } = useFlow();
  const details = answers.details;

  const completion = computeDetailsCompletion(details);
  const progress = computeDetailsProgress(details);
  const sectionComplete: Record<DetailsSectionId, boolean> = {
    "About you": completion.about,
    Assets: completion.assets,
    Income: completion.income,
    Spending: completion.spending,
    Goals: completion.goals,
  };

  const activeSection = STEP_TO_SECTION[step];
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    activeSection ? ({ [activeSection]: true } as Record<string, boolean>) : {},
  );
  const toggle = (id: string) =>
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const [question, setQuestion] = useState("");
  const askQuestion = () => {
    if (!question.trim()) return;
    setQuestion("");
  };

  const setAbout = (patch: Partial<DetailsAbout>) =>
    setDetails({ about: { ...details.about, ...patch } });

  const setAccountBalance = (id: string, balance: number | null) =>
    setDetails({
      accounts: details.accounts.map((a) =>
        a.id === id ? { ...a, balance } : a,
      ),
    });

  // Top ranked goal titles, high → low (timeline stores low → high).
  const topGoals = [...details.goals.order]
    .reverse()
    .map((id) => DETAILS_GOAL_BY_ID[id]?.title)
    .filter((t): t is string => Boolean(t));

  const aboutRows: [string, string][] = ABOUT_FIELDS.map(([key, label]) => [
    label,
    details.about[key],
  ]);

  const sectionContent = (id: DetailsSectionId) => {
    switch (id) {
      case "About you":
        return (
          <EditableRows
            rows={aboutRows}
            onChange={(rows) => {
              const patch: Partial<DetailsAbout> = {};
              rows.forEach(([, value], i) => {
                patch[ABOUT_FIELDS[i][0]] = value;
              });
              setAbout(patch);
            }}
          />
        );
      case "Assets":
        return (
          <ul className="flex flex-col gap-2.5">
            {details.accounts.map((account: AssetRow) => (
              <li key={account.id} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
                  {account.provider}
                  {account.accountType ? ` · ${account.accountType}` : ""}
                </span>
                <div className="flex min-w-0">
                  <EditableValue
                    value={fmtMoney(account.balance)}
                    align="left"
                    onChange={(next) => {
                      const digits = next.replace(/[^0-9]/g, "");
                      setAccountBalance(
                        account.id,
                        digits === "" ? null : Number(digits),
                      );
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        );
      case "Income":
        return null;
      case "Spending":
        return (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
                Spending aim
              </span>
              <div className="flex min-w-0">
                <EditableValue
                  value={`$${details.spending.aim.toLocaleString("en-US")}/mo`}
                  align="left"
                  onChange={(next) => {
                    const digits = next.replace(/[^0-9]/g, "");
                    if (digits !== "")
                      setDetails({
                        spending: { ...details.spending, aim: Number(digits) },
                      });
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
                Safety buffer
              </span>
              <div className="flex min-w-0">
                <EditableValue
                  value={details.spending.safetyBuffer}
                  align="left"
                  onChange={(next) =>
                    setDetails({
                      spending: { ...details.spending, safetyBuffer: next },
                    })
                  }
                />
              </div>
            </div>
          </div>
        );
      case "Goals":
        return (
          <ul className="flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
                  Top aim {i + 1}
                </span>
                <span className="min-w-0 truncate text-xs font-semibold text-deep-black">
                  {topGoals[i] ?? (
                    <span className="font-normal text-gray-2">
                      Rank your goals to fill this in
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        );
    }
  };

  return (
    <aside className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-field bg-ghost-white 3xl:w-[320px]">
      <div className="scrollbar-slim flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3">
        {SECTIONS.map((id) => (
          <AccordionSection
            key={id}
            label={id}
            open={!!open[id]}
            active={activeSection === id}
            onToggle={() => toggle(id)}
            onOpenPage={
              SECTION_TO_STEP[id]
                ? () => goTo(SECTION_TO_STEP[id] as StepId)
                : undefined
            }
            readOnly={id === "Income"}
            complete={sectionComplete[id]}
          >
            {sectionContent(id)}
          </AccordionSection>
        ))}

        {/* Mandatory-data nudge with the REQUIRED DETAILS progress bar. */}
        <div className="mt-2 rounded-card bg-white/70 px-4 py-4">
          <p className="text-sm font-semibold leading-snug text-deep-black">
            Your plan will update once we have initial mandatory data.
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-divider">
              <motion.div
                className="h-full rounded-full bg-violet"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
              Required details
            </span>
            <span className="text-[11px] font-medium text-gray-2">{progress}%</span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2.5 pt-8">
          <p className="text-sm font-semibold text-deep-black">Learn more</p>
          <button
            type="button"
            className="flex items-center gap-3 rounded-full border border-stroke-subtle bg-white px-4 py-2.5 text-left transition-colors hover:bg-white/60"
          >
            <CircleHelp className="size-4 shrink-0 text-gray-2" strokeWidth={2} />
            <span className="h-2.5 w-36 rounded-full skeleton-shimmer" aria-hidden />
            <span className="sr-only">How your details shape your plan</span>
          </button>
        </div>
      </div>

      {/* Pinned footer: the ask-question pill stays visible while the section
          list above scrolls behind it. */}
      <div className="shrink-0 px-3 pb-3">
        <motion.div
          className="flex items-center justify-between rounded-full bg-white py-1.5 pl-4 pr-1.5"
          animate={{
            boxShadow: [
              "0 6px 20px -8px rgba(0,0,0,0.25), 0 0 0 0 rgba(127,53,178,0)",
              "0 6px 20px -8px rgba(0,0,0,0.25), 0 0 18px 2px rgba(127,53,178,0.38)",
              "0 6px 20px -8px rgba(0,0,0,0.25), 0 0 0 0 rgba(127,53,178,0)",
            ],
          }}
          transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") askQuestion();
            }}
            placeholder="Ask a question"
            aria-label="Ask a question"
            className="min-w-0 flex-1 bg-transparent text-sm text-deep-black placeholder:text-gray-2 focus:outline-none"
          />
          <button
            type="button"
            onClick={askQuestion}
            className="shrink-0 rounded-full transition-opacity hover:opacity-80"
            aria-label="Send question"
          >
            <AskSendIcon className="size-7" />
          </button>
        </motion.div>
      </div>
    </aside>
  );
}
