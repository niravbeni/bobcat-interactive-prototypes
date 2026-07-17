"use client";

import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { SIG_EASE } from "./shared";

export type SidebarSection =
  | "about"
  | "assets"
  | "income"
  | "spending"
  | "goals";

/** Ordered top→bottom, matching the Figma sidebar. */
const SECTIONS: { id: SidebarSection; label: string }[] = [
  { id: "about", label: "About you" },
  { id: "assets", label: "Assets" },
  { id: "income", label: "Income" },
  { id: "spending", label: "Spending" },
  { id: "goals", label: "Goals" },
];

/** Sections wired to a built screen; only these are clickable when navigating. */
const NAVIGABLE: SidebarSection[] = ["assets", "spending", "goals"];

/** Ask-panel suggestions — verbatim from the Figma frames. */
const SUGGESTIONS = [
  "What taxes apply in retirement?",
  "Tell me more about how annuities work",
  "What happens if I spend more than planned?",
];

/**
 * Shared "Your details" sidebar for the Signature flow section screens (Assets,
 * Spending/Expense, Goals). Sections before the selected one render as completed
 * violet ticks; the selected section is the filled violet pill (with optional
 * `subContent` beneath); sections after it are pending radio rings. Built
 * sections can be navigated to via `onNavigate`.
 */
export function SignatureDetailsSidebar({
  selected,
  selectedComplete = false,
  subContent,
  onNavigate,
}: {
  selected: SidebarSection;
  /** When true the selected pill shows a check instead of the radio ring. */
  selectedComplete?: boolean;
  /** Live content rendered directly beneath the selected pill. */
  subContent?: React.ReactNode;
  onNavigate?: (section: SidebarSection) => void;
}) {
  const selectedIndex = SECTIONS.findIndex((s) => s.id === selected);

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col overflow-hidden lg:flex 3xl:w-[320px]">
      <div className="scrollbar-slim flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-2">
        {SECTIONS.map((section, i) => {
          const canNavigate =
            onNavigate != null &&
            i !== selectedIndex &&
            NAVIGABLE.includes(section.id);
          const handleClick = canNavigate
            ? () => onNavigate?.(section.id)
            : undefined;

          let pill: React.ReactNode;
          if (i < selectedIndex) {
            pill = <CompletePill label={section.label} onClick={handleClick} />;
          } else if (i === selectedIndex) {
            pill = (
              <SelectedPill label={section.label} complete={selectedComplete} />
            );
          } else {
            pill = <RadioPill label={section.label} onClick={handleClick} />;
          }

          return (
            <div key={section.id} className="contents">
              {i > 0 ? <PillDivider /> : null}
              {pill}
              {i === selectedIndex && subContent ? subContent : null}
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 flex-col gap-2 pb-1">
        <div className="flex flex-col">
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              className="flex items-center justify-between gap-2 pl-4 pr-[15px] text-left transition-opacity hover:opacity-70"
            >
              <span className="min-w-0 text-[11px] leading-6 tracking-[-0.22px] text-gray-2">
                {q}
              </span>
              {/* 4px dot, #A56BCD @ 66% — verbatim from Figma 1996:30952. */}
              <span
                aria-hidden
                className="size-1 shrink-0 rounded-full bg-[#a56bcd]/[0.66]"
              />
            </button>
          ))}
        </div>

        <div className="flex h-10 items-center justify-between rounded-full bg-black/[0.01] py-2 pl-4 pr-2 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <span className="text-sm leading-6 text-gray-2">Ask a question</span>
          {/* Gradient spiral exported verbatim from Figma 2015:56414 (Frame 21). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/signature/ask-spiral.svg"
            alt=""
            aria-hidden
            className="size-[30px] shrink-0"
          />
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Live summary row (used by the Assets sidebar's totals subContent)   */
/* ------------------------------------------------------------------ */

/** A live summary row beneath the selected pill. Indented rows carry the
 *  vertical left rule from Figma 1996:30611. */
export function SignatureSummaryRow({
  label,
  value,
  indented = false,
}: {
  label: string;
  value: string;
  indented?: boolean;
}) {
  return (
    <div className="flex items-stretch gap-4 px-4 py-1">
      {indented ? (
        <span aria-hidden className="w-px shrink-0 self-stretch bg-[#ececee]" />
      ) : null}
      <div className="flex min-w-0 flex-col">
        <span className="text-[10px] font-medium uppercase leading-[16.5px] tracking-[0.66px] text-[#8a8a93]">
          {label}
        </span>
        <motion.span
          key={value}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: SIG_EASE }}
          className="text-sm font-medium leading-6 text-[#18181b]"
        >
          {value}
        </motion.span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section pills                                                       */
/* ------------------------------------------------------------------ */

function PillDivider() {
  return <span className="h-px w-full shrink-0 bg-[#ececee]" aria-hidden />;
}

const CHECK_PATH = (
  <path
    d="M5 13l4 4L19 7"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

/** Completed section: filled violet check + regular-weight label. */
function CompletePill({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-violet text-white">
          <svg viewBox="0 0 24 24" className="size-3" fill="none" aria-hidden>
            {CHECK_PATH}
          </svg>
        </span>
        <span className="truncate text-base tracking-[-0.5px] text-[#171717]">
          {label}
        </span>
      </span>
      <ChevronDown
        className="size-[18px] shrink-0 text-gray-2"
        strokeWidth={2}
        aria-hidden
      />
    </>
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-[14px] px-4 py-2 text-left transition-colors hover:bg-black/[0.03]"
    >
      {inner}
    </button>
  ) : (
    <div className="flex items-center gap-2.5 rounded-[14px] px-4 py-2">{inner}</div>
  );
}

/** The selected section: filled violet pill, white text, chevron pointing up. */
function SelectedPill({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-[12px] bg-violet px-4 py-2">
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {complete ? (
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white text-violet">
            <svg viewBox="0 0 24 24" className="size-3" fill="none" aria-hidden>
              {CHECK_PATH}
            </svg>
          </span>
        ) : (
          // radio_button_checked (white): ring + inner dot per Figma 1984:24518.
          <span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-white">
            <span className="size-2 rounded-full bg-white" />
          </span>
        )}
        <span className="truncate text-base tracking-[-0.5px] text-white">
          {label}
        </span>
      </span>
      <ChevronDown
        className="size-[18px] shrink-0 rotate-180 text-white"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}

/** Not-yet-started section: an empty radio ring + chevron. */
function RadioPill({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="size-5 shrink-0 rounded-full border-2 border-[#c4c4c8]" />
        <span className="truncate text-base tracking-[-0.5px] text-[#171717]">
          {label}
        </span>
      </span>
      <ChevronDown
        className="size-[18px] shrink-0 text-gray-2"
        strokeWidth={2}
        aria-hidden
      />
    </>
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-[12px] px-4 py-2 text-left transition-colors hover:bg-black/[0.03]"
    >
      {inner}
    </button>
  ) : (
    <div className="flex items-center gap-2.5 rounded-[12px] px-4 py-2">{inner}</div>
  );
}
