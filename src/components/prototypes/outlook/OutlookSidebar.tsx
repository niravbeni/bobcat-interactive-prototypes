"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, Pencil, CircleHelp } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { SnapSlider } from "@/components/ui/SnapSlider";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { CustomEventsModal } from "@/components/prototypes/outlook/CustomEventsModal";
import { InfoTarget, InfoTipBox } from "@/components/prototypes/outlook/OutlookInfoTip";
import { SPENDING_RANGE } from "@/lib/outlook";
import { cn } from "@/lib/cn";

type SectionId = "About you" | "Assets" | "Income" | "Spending" | "Goals";

const SECTIONS: SectionId[] = [
  "About you",
  "Assets",
  "Income",
  "Spending",
  "Goals",
];

/** Plausible dummy data so every section shows something real when opened. */
const ABOUT_ROWS: [string, string][] = [
  ["Name", "Gloria"],
  ["Age", "63"],
  ["Target retirement", "Age 66 · 2029"],
  ["Location", "Austin, TX"],
  ["Filing status", "Married, jointly"],
];

const ASSET_ROWS: [string, string][] = [
  ["401(k) · Fidelity", "$500,000"],
  ["Roth IRA", "$320,000"],
  ["CDs & money market", "$400,000"],
  ["Cash", "$100,000"],
];

const INCOME_ROWS: [string, string][] = [
  ["Social Security", "$2,400/mo"],
  ["Pension", "$2,000/mo"],
  ["Other", "$1,200/mo"],
];

const GOALS = [
  "Travel abroad each year",
  "Leave an inheritance",
  "Renovate the kitchen",
  "Keep a healthcare cushion",
];

/** Violet check chip shown next to each completed sidebar section. */
function SectionCheck() {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-violet text-white">
      <Check className="size-3" strokeWidth={3} />
    </span>
  );
}

/**
 * A click-to-edit value. Renders as bold text with a pencil affordance; clicking
 * swaps in a text input that commits on Enter/blur (Escape cancels). Purely
 * local prototype editing — the parent owns the persisted value.
 */
function EditableValue({
  value,
  onChange,
  align = "right",
}: {
  value: string;
  onChange: (next: string) => void;
  align?: "left" | "right";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
  };
  const commit = () => {
    onChange(draft.trim() || value);
    setEditing(false);
  };
  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className={cn(
          "w-full min-w-0 rounded border border-violet/50 bg-white px-1.5 py-0.5 text-xs font-semibold text-deep-black focus:outline-none focus:ring-1 focus:ring-violet",
          align === "right" ? "text-right" : "text-left",
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className={cn(
        "group/edit flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-violet/5",
        align === "right" ? "justify-end text-right" : "justify-start text-left",
      )}
    >
      <span className="min-w-0 truncate font-semibold text-deep-black">{value}</span>
      <Pencil
        className="size-3 shrink-0 text-gray-2/70 transition-colors group-hover/edit:text-violet"
        strokeWidth={2}
      />
    </button>
  );
}

/** Definition-list style rows with click-to-edit values. */
function EditableRows({
  rows,
  onChange,
}: {
  rows: [string, string][];
  onChange: (rows: [string, string][]) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map(([label, value], i) => (
        <li key={label} className="flex items-center justify-between gap-3 text-xs">
          <span className="shrink-0 text-gray-1">{label}</span>
          <div className="flex min-w-0 flex-1 justify-end">
            <EditableValue
              value={value}
              onChange={(next) => {
                const copy = rows.map((r) => [...r] as [string, string]);
                copy[i][1] = next;
                onChange(copy);
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * A single collapsible sidebar section: a pill header that toggles open, and an
 * animated content panel. Open sections adopt the dark "active" treatment; the
 * (completed) closed sections keep the green-check white pill.
 */
function AccordionSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex items-center justify-between rounded-full px-4 py-2.5 text-left transition-colors",
          open
            ? "bg-deep-black text-white"
            : "bg-white text-deep-black hover:bg-white/60",
        )}
      >
        <span className="flex items-center gap-2.5">
          {open ? (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-white">
              <span className="size-1.5 rounded-full bg-white" />
            </span>
          ) : (
            <SectionCheck />
          )}
          <span className="text-sm font-semibold">{label}</span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown
            className={cn("size-4 shrink-0", open ? "text-white" : "text-gray-2")}
            strokeWidth={2}
          />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-1 rounded-b-card bg-white/60 px-4 pb-4 pt-3">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * Figma-style left panel for the Outlook flow. Every section is a working
 * accordion filled with plausible dummy data; the Spending section hosts the
 * live spending-aim slider and the "Outlook conditions" card hosts the
 * market-scenario slider — both write to the shared outlook state so every
 * chart on the page recomputes as they move.
 *
 * `complete` renders the refine-screen variant: sections start collapsed and the
 * conditions card is hidden, but every section can still be opened.
 */
export function OutlookSidebar({
  complete = false,
  infoTip = false,
}: {
  complete?: boolean;
  /** Show the hover-help box and enable sidebar hover targets (v2 flow). */
  infoTip?: boolean;
}) {
  const { answers, setOutlook, variant } = useFlow();
  const { spendingAim, marketT, customEvents } = answers.outlook;
  const enhanced =
    variant === "outlook-flow-enhanced" ||
    variant === "outlook-flow-post-feedback" ||
    variant === "outlook-flow-post-feedback-v2" ||
    variant === "details-to-outlook";

  // "Model custom events" opens a compact popover anchored to the trigger.
  // Only one copy of the button is ever mounted (card OR refine dropdown), so a
  // single anchor ref is enough.
  const [eventsOpen, setEventsOpen] = useState(false);
  const eventsAnchorRef = useRef<HTMLButtonElement>(null);
  const eventCount = customEvents.length;

  // Spending is expanded by default in the working screens; everything is
  // collapsed (but still openable) on the refine screen.
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    complete ? {} : ({ Spending: true } as Record<string, boolean>),
  );
  const toggle = (id: string) =>
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  // On the refine screen the conditions live in a collapsed dropdown.
  const [conditionsOpen, setConditionsOpen] = useState(false);

  // Slider position (0..100) ↔ dollars across the allowed spending band.
  const spendT =
    ((spendingAim - SPENDING_RANGE.min) /
      (SPENDING_RANGE.max - SPENDING_RANGE.min)) *
    100;
  const spendFromT = (t: number) =>
    Math.round(
      (SPENDING_RANGE.min +
        (t / 100) * (SPENDING_RANGE.max - SPENDING_RANGE.min)) /
        50,
    ) * 50;

  const [question, setQuestion] = useState("");
  const askQuestion = () => {
    if (!question.trim()) return;
    setQuestion("");
  };

  // Editable copies of the dummy data so every value can be clicked and changed.
  const [aboutRows, setAboutRows] = useState(ABOUT_ROWS);
  const [assetRows, setAssetRows] = useState(ASSET_ROWS);
  const [incomeRows, setIncomeRows] = useState(INCOME_ROWS);
  const [totalSaved, setTotalSaved] = useState("$1,320,000");
  const [monthlyTotal, setMonthlyTotal] = useState("$12,000/mo");
  const [safetyBuffer, setSafetyBuffer] = useState("Medium - $60k");
  const [goals, setGoals] = useState(GOALS);

  const sectionContent = (id: SectionId) => {
    switch (id) {
      case "About you":
        return <EditableRows rows={aboutRows} onChange={setAboutRows} />;
      case "Assets":
        return (
          <>
            <EditableRows rows={assetRows} onChange={setAssetRows} />
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-divider/60 pt-2 text-xs">
              <span className="shrink-0 font-semibold text-deep-black">Total saved</span>
              <div className="flex min-w-0 flex-1 justify-end">
                <EditableValue value={totalSaved} onChange={setTotalSaved} />
              </div>
            </div>
          </>
        );
      case "Income":
        return (
          <>
            <EditableRows rows={incomeRows} onChange={setIncomeRows} />
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-divider/60 pt-2 text-xs">
              <span className="shrink-0 font-semibold text-deep-black">Monthly total</span>
              <div className="flex min-w-0 flex-1 justify-end">
                <EditableValue value={monthlyTotal} onChange={setMonthlyTotal} />
              </div>
            </div>
          </>
        );
      case "Spending":
        return (
          <>
            <InfoTarget tipId="spending-aim" as="div" enabled={infoTip} interactive>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
                  Spending aim
                </span>
                <span className="text-sm font-semibold text-deep-black">
                  ${spendingAim.toLocaleString("en-US")}
                  <span className="text-[11px] font-normal text-gray-2">/mo</span>
                </span>
              </div>
              <SnapSlider
                aria-label="Spending aim"
                value={spendT}
                snapPoints={[0, 50, 100]}
                onChange={(t) => setOutlook({ spendingAim: spendFromT(t) })}
                className="mt-1.5"
                accent="violet"
              />
              <div className="mt-0.5 flex items-center justify-between text-[11px] text-gray-2">
                <span>${SPENDING_RANGE.min.toLocaleString("en-US")}</span>
                <span>${SPENDING_RANGE.max.toLocaleString("en-US")}</span>
              </div>
            </InfoTarget>

            <InfoTarget
              tipId="safety-buffer"
              as="div"
              enabled={infoTip}
              interactive
              className="mt-3 flex w-full flex-col px-1 py-1"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
                Safety buffer
              </span>
              <div className="mt-0.5 flex">
                <EditableValue
                  value={safetyBuffer}
                  onChange={setSafetyBuffer}
                  align="left"
                />
              </div>
            </InfoTarget>
          </>
        );
      case "Goals":
        return (
          <ul className="flex flex-col gap-1.5">
            {goals.map((goal, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-xs text-deep-black"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-violet" />
                <div className="flex min-w-0 flex-1">
                  <EditableValue
                    value={goal}
                    onChange={(next) => {
                      const copy = [...goals];
                      copy[i] = next;
                      setGoals(copy);
                    }}
                    align="left"
                  />
                </div>
              </li>
            ))}
          </ul>
        );
    }
  };

  const conditionsContent = (
    <>
      <p className="mt-0.5 text-xs leading-snug text-gray-1">
        Adjust and watch your outlook adapt.
      </p>
      <InfoTarget tipId="market-scenario" as="div" enabled={infoTip} interactive>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
          Market scenario
        </p>
        <SnapSlider
          aria-label="Market scenario"
          value={marketT}
          snapPoints={[0, 50, 100]}
          onChange={(t) => setOutlook({ marketT: t })}
          className="mt-1.5"
          accent="violet"
        />
        <div className="mt-0.5 flex items-center justify-between text-[11px] text-gray-2">
          <span>Worst case</span>
          <span>Best case</span>
        </div>
      </InfoTarget>
      <InfoTarget tipId="custom-events" as="div" enabled={infoTip} interactive>
        <button
          ref={eventsAnchorRef}
          type="button"
          onClick={() => setEventsOpen((o) => !o)}
          className={cn(
            "mt-3 flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors",
            eventCount > 0
              ? "bg-violet/10 text-violet hover:bg-violet/15"
              : "bg-ghost-white text-deep-black hover:bg-divider/40",
          )}
        >
          <Pencil className="size-3.5 shrink-0" strokeWidth={2} />
          Model custom events
          {eventCount > 0 ? (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-violet text-[11px] font-semibold text-white">
              {eventCount}
            </span>
          ) : null}
        </button>
      </InfoTarget>
    </>
  );

  return (
    <>
    <CustomEventsModal
      open={eventsOpen}
      onClose={() => setEventsOpen(false)}
      anchorRef={eventsAnchorRef}
    />
    <aside className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-field bg-ghost-white 3xl:w-[320px]">
      <div className="scrollbar-slim flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3">
      {SECTIONS.map((id) => (
        <AccordionSection
          key={id}
          label={id}
          open={!!open[id]}
          onToggle={() => toggle(id)}
        >
          {sectionContent(id)}
        </AccordionSection>
      ))}

      {complete ? (
        <div className="mt-2 flex flex-col">
          <button
            type="button"
            onClick={() => setConditionsOpen((o) => !o)}
            aria-expanded={conditionsOpen}
            className={cn(
              "flex items-center justify-between rounded-full px-4 py-2.5 text-left transition-colors",
              conditionsOpen
                ? "bg-deep-black text-white"
                : "bg-white text-deep-black hover:bg-white/60",
            )}
          >
            <span className="text-sm font-semibold">Outlook conditions</span>
            <motion.span
              animate={{ rotate: conditionsOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown
                className={cn(
                  "size-4 shrink-0",
                  conditionsOpen ? "text-white" : "text-gray-2",
                )}
                strokeWidth={2}
              />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {conditionsOpen ? (
              <motion.div
                key="conditions"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mx-1 rounded-b-card bg-white/60 px-4 pb-4 pt-3">
                  {conditionsContent}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-2 rounded-card bg-white/70 px-4 py-4">
          <p className="text-sm font-semibold text-deep-black">
            Outlook conditions
          </p>
          {conditionsContent}
        </div>
      )}

      {/* The v2 flow's hover-help box already covers "learn more", so the
          separate Learn more link is dropped there. */}
      {infoTip ? null : (
        <div className="mt-auto flex flex-col gap-2.5 pt-8">
          <p className="text-sm font-semibold text-deep-black">Learn more</p>
          <button
            type="button"
            className="flex items-center gap-3 rounded-full border border-stroke-subtle bg-white px-4 py-2.5 text-left transition-colors hover:bg-white/60"
          >
            <CircleHelp className="size-4 shrink-0 text-gray-2" strokeWidth={2} />
            <span
              className={cn(
                "h-2.5 w-36 rounded-full",
                enhanced ? "skeleton-shimmer" : "bg-divider",
              )}
              aria-hidden
            />
            <span className="sr-only">How your outlook works</span>
          </button>
        </div>
      )}
      </div>

      {/* Pinned footer: the hover-help box (v2 only) plus the ask-question pill
          stay visible while the section list above scrolls behind them. */}
      <div className="shrink-0 px-3 pb-3">
        {infoTip ? (
          <div className="mb-2.5">
            <InfoTipBox />
          </div>
        ) : null}
        {/* Subtle pulsing AI glow to signal the assistant is ready. */}
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
    </>
  );
}
