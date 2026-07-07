"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, Pencil, CircleHelp } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { SnapSlider } from "@/components/ui/SnapSlider";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { CustomEventsModal } from "@/components/prototypes/outlook/CustomEventsModal";
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
  ["Name", "Gloria Present"],
  ["Age", "63"],
  ["Target retirement", "Age 66 · 2029"],
  ["Location", "Austin, TX"],
  ["Filing status", "Married, jointly"],
];

const ASSET_ROWS: [string, string][] = [
  ["401(k) · Fidelity", "$820,000"],
  ["Roth IRA", "$145,000"],
  ["Brokerage", "$260,000"],
  ["Cash & savings", "$42,000"],
];

const INCOME_ROWS: [string, string][] = [
  ["Social Security (67)", "$2,480/mo"],
  ["Pension", "$1,150/mo"],
  ["Rental income", "$900/mo"],
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

/** Definition-list style rows used inside the data sections. */
function DataRows({ rows }: { rows: [string, string][] }) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map(([label, value]) => (
        <li key={label} className="flex items-center justify-between gap-3 text-xs">
          <span className="text-gray-1">{label}</span>
          <span className="font-semibold text-deep-black">{value}</span>
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
export function OutlookSidebar({ complete = false }: { complete?: boolean }) {
  const { answers, setOutlook, variant } = useFlow();
  const { spendingAim, marketT, customEvents } = answers.outlook;
  const enhanced =
    variant === "outlook-flow-enhanced" ||
    variant === "outlook-flow-post-feedback";

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

  const sectionContent = (id: SectionId) => {
    switch (id) {
      case "About you":
        return <DataRows rows={ABOUT_ROWS} />;
      case "Assets":
        return (
          <>
            <DataRows rows={ASSET_ROWS} />
            <div className="mt-2 flex items-center justify-between border-t border-divider/60 pt-2 text-xs">
              <span className="font-semibold text-deep-black">Total saved</span>
              <span className="font-semibold text-deep-black">$1,267,000</span>
            </div>
          </>
        );
      case "Income":
        return (
          <>
            <DataRows rows={INCOME_ROWS} />
            <div className="mt-2 flex items-center justify-between border-t border-divider/60 pt-2 text-xs">
              <span className="font-semibold text-deep-black">Monthly total</span>
              <span className="font-semibold text-deep-black">$4,530/mo</span>
            </div>
          </>
        );
      case "Spending":
        return (
          <>
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

            <div className="mt-3 flex w-full items-center justify-between px-1 py-1">
              <span className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-2">
                  Safety buffer
                </span>
                <span className="mt-0.5 text-sm font-medium text-deep-black">
                  Medium - $30k
                </span>
              </span>
            </div>
          </>
        );
      case "Goals":
        return (
          <ul className="flex flex-col gap-1.5">
            {GOALS.map((goal) => (
              <li
                key={goal}
                className="flex items-center gap-2 text-xs text-deep-black"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-violet" />
                {goal}
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
      </div>

      {/* Pinned footer: only the ask-question pill itself stays visible while the
          section list above scrolls behind it. */}
      <div className="shrink-0 px-3 pb-3">
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
