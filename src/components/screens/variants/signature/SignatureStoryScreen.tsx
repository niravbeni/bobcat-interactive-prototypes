"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, Reorder } from "motion/react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  GripVertical,
  Info,
} from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { cn } from "@/lib/cn";
import { SIGNATURE_GOALS, type SignatureGoal } from "@/lib/signatureGoals";
import { SignatureShell, NavPill, SIG_DEMO_CLEAR_EVENT } from "./SignatureShell";
import { SIG_EASE, SIG_HERO_GRADIENT, SIG_SPRING } from "./shared";

type SectionKey = "about" | "assets" | "goals";

const RETIRE_OPTIONS = [
  "less than one year",
  "1 - 2 years",
  "3 - 5 years",
  "5 - 10 years",
  "more than 10 years",
];
const PLAN_FOR_OPTIONS = ["my partner and I", "just myself", "my whole family"];
const INVEST_OPTIONS = ["conservatively", "moderately", "aggressively"];
const GENDER_OPTIONS = ["a woman", "a man", "non-binary", "prefer not to say"];
const MONTH_OPTIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function SignatureStoryScreen() {
  const { goTo, goBack } = useFlow();

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    about: true,
    assets: true,
    goals: false,
  });
  const toggle = (k: SectionKey) =>
    setOpen((prev) => ({ ...prev, [k]: !prev[k] }));

  // Working madlib answers (interactive dropdown chips + money inputs).
  const [retireIn, setRetireIn] = useState(RETIRE_OPTIONS[0]);
  const [planFor, setPlanFor] = useState(PLAN_FOR_OPTIONS[0]);
  const [invest, setInvest] = useState(INVEST_OPTIONS[2]);
  const [savings, setSavings] = useState(2_000_000);
  const [otherAssets, setOtherAssets] = useState(2_500_000);
  const [income, setIncome] = useState(15_000);

  // About you madlib answers (seeded with Gloria's current values).
  const [name, setName] = useState("Gloria");
  const [gender, setGender] = useState(GENDER_OPTIONS[0]);
  const [birthMonth, setBirthMonth] = useState("Aug");
  const [birthDay, setBirthDay] = useState("21");
  const [birthYear, setBirthYear] = useState("1961");
  const [zip, setZip] = useState("91102");

  // Optional goals — drag-to-rank the first 5 goals; state holds ordered ids.
  const [goalOrder, setGoalOrder] = useState<string[]>(() =>
    SIGNATURE_GOALS.slice(0, 5).map((g) => g.id),
  );

  // Hidden demo shortcut: clear every madlib field to empty so a presenter can
  // type live. SSR-safe — the listener is only added on the client in useEffect.
  useEffect(() => {
    const clear = () => {
      setName("");
      setGender("");
      setBirthMonth("");
      setBirthDay("");
      setBirthYear("");
      setZip("");
      setRetireIn("");
      setPlanFor("");
      setInvest("");
      setSavings(0);
      setOtherAssets(0);
      setIncome(0);
      // Goal ranking is intentionally left as-is on demo-clear.
    };
    window.addEventListener(SIG_DEMO_CLEAR_EVENT, clear);
    return () => window.removeEventListener(SIG_DEMO_CLEAR_EVENT, clear);
  }, []);

  return (
    <SignatureShell
      mode="tabs"
      activeTab="Your Details"
      subBar={{
        left: (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1 text-sm font-medium text-deep-black transition-opacity hover:opacity-60"
          >
            <ChevronLeft className="size-4" strokeWidth={2.2} />
            Back
          </button>
        ),
        center: <StepTicks />,
        right: (
          <NavPill shape="rounded" onClick={() => goTo("sig-home")}>
            View initial outlook
          </NavPill>
        ),
      }}
      bodyClassName="px-4 pb-16 pt-6"
    >
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-2">
        {/* Purple gradient hero card. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: SIG_EASE }}
          className="relative mb-2 flex min-h-[148px] flex-col justify-between overflow-hidden rounded-card p-6 text-white"
          style={{ background: SIG_HERO_GRADIENT }}
        >
          <WaveTexture />
          <h1 className="relative text-[28px] font-medium leading-[1.1] tracking-[-0.56px]">
            Let&apos;s capture a couple
            <br />
            of initial details.
          </h1>
          {/* Non-essential supporting copy → shimmer placeholder bars. */}
          <span
            className="relative mt-4 flex max-w-[560px] flex-col gap-1.5"
            aria-hidden
          >
            <span className="h-2.5 w-full rounded-full bg-white/25 skeleton-shimmer" />
            <span className="h-2.5 w-[62%] rounded-full bg-white/25 skeleton-shimmer" />
          </span>
        </motion.div>

        {/* About you (complete, interactive madlib). */}
        <StorySection
          index={0}
          status="complete"
          title="About you"
          whyLabel="Why do we need this info?"
          open={open.about}
          onToggle={() => toggle("about")}
        >
          <div className="flex flex-col gap-5 text-sm text-black">
            <MadlibLine>
              <span>My name is</span>
              <TextChip value={name} onChange={setName} ariaLabel="Name" />
              <span className="-ml-1.5">, I am</span>
              <ChipDropdown
                value={gender}
                options={GENDER_OPTIONS}
                onChange={setGender}
              />
              <span className="-ml-1.5">, and I was born on</span>
              <ChipDropdown
                value={birthMonth}
                options={MONTH_OPTIONS}
                onChange={setBirthMonth}
              />
              <TextChip
                value={birthDay}
                onChange={setBirthDay}
                ariaLabel="Day of birth"
                numeric
                minCh={2}
              />
              <span className="-ml-1.5">,</span>
              <span className="inline-flex items-center whitespace-nowrap">
                <TextChip
                  value={birthYear}
                  onChange={setBirthYear}
                  ariaLabel="Year of birth"
                  numeric
                  minCh={4}
                />
                <span>.</span>
              </span>
              <span>My Zip code is</span>
              <TextChip
                value={zip}
                onChange={setZip}
                ariaLabel="Zip code"
                numeric
                minCh={5}
              />
            </MadlibLine>
          </div>
        </StorySection>

        {/* Your assets (expanded, interactive madlib). */}
        <StorySection
          index={1}
          status="active"
          title="Your assets"
          whyLabel="Why do we need this info?"
          open={open.assets}
          onToggle={() => toggle("assets")}
        >
          <div className="flex flex-col gap-5 text-sm text-black">
            <MadlibLine>
              <span>I&apos;m retiring in</span>
              <ChipDropdown
                value={retireIn}
                options={RETIRE_OPTIONS}
                onChange={setRetireIn}
              />
              <span>and I would like to plan for</span>
              <ChipDropdown
                value={planFor}
                options={PLAN_FOR_OPTIONS}
                onChange={setPlanFor}
              />
            </MadlibLine>
            <MadlibLine>
              <span>We have about</span>
              <MoneyChip value={savings} onChange={setSavings} />
              <span>
                in <span className="font-medium">retirement savings.</span>
              </span>
              <InfoDot />
            </MadlibLine>
            <MadlibLine>
              <span>These savings are invested</span>
              <ChipDropdown
                value={invest}
                options={INVEST_OPTIONS}
                onChange={setInvest}
              />
              <InfoDot />
            </MadlibLine>
            <MadlibLine>
              <span>We also have about</span>
              <MoneyChip value={otherAssets} onChange={setOtherAssets} />
              <span>
                in <span className="font-medium">other assets.</span>
              </span>
              <InfoDot />
            </MadlibLine>
            <MadlibLine>
              <span>We currently receive about</span>
              <MoneyChip value={income} onChange={setIncome} />
              <span>in total pre-tax income each month.</span>
            </MadlibLine>
          </div>
        </StorySection>

        {/* Your goals (optional, collapsed → shimmer body). */}
        <StorySection
          index={2}
          status="optional"
          title="Your goals"
          whyLabel="Why do we want this info?"
          optional
          open={open.goals}
          onToggle={() => toggle("goals")}
        >
          <GoalRankList order={goalOrder} onReorder={setGoalOrder} />
        </StorySection>
      </div>
    </SignatureShell>
  );
}

/* ------------------------------------------------------------------ */
/* Stepper ticks (sub-bar center)                                      */
/* ------------------------------------------------------------------ */

function StepTicks() {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <span className="grid size-5 place-items-center rounded-full bg-violet text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.66px] text-violet">
          About you
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="grid size-5 place-items-center rounded-full bg-black text-[13px] leading-none text-white">
          2
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.66px] text-black">
          Your assets
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="grid size-5 place-items-center rounded-full bg-gray-1 text-[13px] leading-none text-white">
          3
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.66px] text-gray-1">
          Your Goals
        </span>
        <span className="rounded-full border-[0.75px] border-gray-1 px-2 py-0.5 text-[10px] tracking-[-0.2px] text-gray-1">
          Optional
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Collapsible story section                                          */
/* ------------------------------------------------------------------ */

function StorySection({
  index,
  status,
  title,
  whyLabel,
  optional,
  open,
  onToggle,
  children,
}: {
  index: number;
  status: "complete" | "active" | "optional";
  title: string;
  whyLabel: string;
  optional?: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: SIG_EASE, delay: 0.05 + index * 0.07 }}
      className="overflow-hidden rounded-card border-[0.5px] border-stroke-subtle bg-white"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:bg-black/[0.015]"
      >
        <span className="flex items-center gap-3">
          {status === "complete" ? (
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-violet text-white">
              <Check className="size-3" strokeWidth={3} />
            </span>
          ) : (
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-black text-[13px] leading-none text-white">
              {index + 1}
            </span>
          )}
          <span className="text-lg tracking-[-0.32px] text-title-ink">
            {title}
          </span>
          {optional ? (
            <span className="rounded-full border-[0.5px] border-gray-1 px-2 py-0.5 text-[10px] tracking-[-0.2px] text-gray-1">
              Optional
            </span>
          ) : null}
        </span>
        <span className="flex items-center gap-4">
          <span
            className="hidden items-center gap-1.5 text-[11px] tracking-[-0.11px] text-stratosphere sm:flex"
            aria-label={whyLabel}
          >
            {/* Non-essential helper label → shimmer bar (icon kept). */}
            <span className="h-2.5 w-24 rounded-full skeleton-shimmer" aria-hidden />
            <Info className="size-4 shrink-0" strokeWidth={2} />
          </span>
          <motion.span
            animate={{ rotate: open ? 0 : -90 }}
            transition={{ duration: 0.25, ease: SIG_EASE }}
          >
            <ChevronDown className="size-5 text-gray-2" strokeWidth={2} />
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SIG_SPRING}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: SIG_EASE, delay: 0.05 }}
              className="border-t-[0.5px] border-stroke-subtle px-6 py-5"
            >
              {children}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Madlib pieces                                                       */
/* ------------------------------------------------------------------ */

function MadlibLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 leading-[1.7]">
      {children}
    </div>
  );
}

function InfoDot() {
  return (
    <Info className="size-4 shrink-0 text-stratosphere" strokeWidth={2} aria-hidden />
  );
}

function ChipDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  // Fixed-position coordinates for the portaled menu (anchored to the trigger).
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    // Matches the previous `top-full mt-1 left-0` intent, in viewport coords.
    setPos({ top: rect.bottom + 4, left: rect.left });
  }, []);

  // Position before paint when opening to avoid a first-frame flash.
  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  // Keep the menu glued to the trigger on scroll/resize, and close on Escape.
  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // Capture phase so nested scroll containers also trigger repositioning.
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, updatePosition]);

  // Outside-click close — the menu is portaled out of the trigger's subtree,
  // so check both the trigger and the menu explicitly.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  return (
    <span className="relative inline-flex">
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "inline-flex h-6 items-center gap-1 rounded-[4px] bg-black/[0.04] pl-2 pr-1.5 text-sm text-black shadow-[0px_0.765px_0px_rgba(0,0,0,0.02)] transition-colors hover:bg-black/[0.07]",
          open && "bg-black/[0.08] ring-1 ring-violet/40",
        )}
      >
        {value}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="size-3" strokeWidth={2.4} />
        </motion.span>
      </motion.button>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open && pos ? (
                <motion.ul
                  ref={menuRef}
                  role="listbox"
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: SIG_EASE }}
                  style={{
                    position: "fixed",
                    top: pos.top,
                    left: pos.left,
                  }}
                  className="z-[100] w-max min-w-[160px] overflow-hidden rounded-card border border-stroke-subtle bg-white py-1 shadow-[0_12px_36px_rgba(16,24,32,0.16)]"
                >
                  {options.map((opt) => {
                    const active = opt === value;
                    return (
                      <li key={opt}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            onChange(opt);
                            setOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm transition-colors hover:bg-ghost-white",
                            active ? "font-medium text-violet" : "text-deep-black",
                          )}
                        >
                          {opt}
                          {active ? <Check className="size-3.5" strokeWidth={2.6} /> : null}
                        </button>
                      </li>
                    );
                  })}
                </motion.ul>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </span>
  );
}

function MoneyChip({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const display = value.toLocaleString("en-US");
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-[4px] bg-black/[0.04] px-2 text-sm text-black shadow-[0px_0.765px_0px_rgba(0,0,0,0.02)] transition-colors focus-within:bg-black/[0.08] focus-within:ring-1 focus-within:ring-violet/40">
      <span className="text-black/70">$</span>
      <input
        inputMode="numeric"
        value={display}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "");
          onChange(digits === "" ? 0 : Number(digits));
        }}
        aria-label="Amount"
        className="bg-transparent text-right text-sm text-black outline-none"
        style={{ width: `${Math.max(display.length, 3) + 0.5}ch` }}
      />
    </span>
  );
}

function TextChip({
  value,
  onChange,
  ariaLabel,
  numeric,
  minCh = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  numeric?: boolean;
  minCh?: number;
}) {
  return (
    <span className="inline-flex h-6 items-center rounded-[4px] bg-black/[0.04] px-2 text-sm text-black shadow-[0px_0.765px_0px_rgba(0,0,0,0.02)] transition-colors focus-within:bg-black/[0.08] focus-within:ring-1 focus-within:ring-violet/40">
      <input
        inputMode={numeric ? "numeric" : "text"}
        value={value}
        onChange={(e) => {
          const next = numeric
            ? e.target.value.replace(/[^0-9]/g, "")
            : e.target.value;
          onChange(next);
        }}
        aria-label={ariaLabel}
        className="bg-transparent text-sm text-black outline-none"
        style={{ width: `${Math.max(value.length, minCh) + 0.5}ch` }}
      />
    </span>
  );
}

const RANK_GOALS = SIGNATURE_GOALS.slice(0, 5);
const RANK_GOAL_BY_ID = RANK_GOALS.reduce<Record<string, SignatureGoal>>(
  (acc, g) => {
    acc[g.id] = g;
    return acc;
  },
  {},
);

function GoalRankList({
  order,
  onReorder,
}: {
  order: string[];
  onReorder: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-1">
        Drag to rank these in the order that matters most to you.
      </p>
      <Reorder.Group
        axis="y"
        values={order}
        onReorder={onReorder}
        as="div"
        className="flex flex-col gap-2"
      >
        {order.map((id, i) => (
          <GoalRankRow key={id} goal={RANK_GOAL_BY_ID[id]} rank={i + 1} />
        ))}
      </Reorder.Group>
    </div>
  );
}

function GoalRankRow({ goal, rank }: { goal: SignatureGoal; rank: number }) {
  const Icon = goal.icon;
  return (
    <Reorder.Item
      value={goal.id}
      as="div"
      // Position-only layout: rows are uniform height, so animating only the
      // reorder slide (not size) avoids the drop-settle jump that full `layout`
      // causes when combined with the `whileDrag` scale transform.
      layout="position"
      transition={SIG_SPRING}
      // Only scale/shadow on drag — never animate x/y here. Reorder.Item binds
      // its own drag-controlled `y` motion value (with dragSnapToOrigin), so a
      // `y` target in whileDrag fights the pointer and makes the drag jitter.
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 28px rgba(16,24,32,0.14)" }}
      className="flex cursor-grab touch-none select-none items-center gap-3 rounded-[10px] border-[0.5px] border-stroke-subtle bg-white px-3 py-2.5 active:cursor-grabbing"
    >
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-black text-[13px] font-medium leading-none text-white">
        {rank}
      </span>
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-black/[0.04] text-black">
        <Icon className="size-4" strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-black">
        {goal.shortLabel}
      </span>
      <GripVertical
        className="size-4 shrink-0 text-gray-2"
        strokeWidth={2}
        aria-hidden
      />
    </Reorder.Item>
  );
}

/** Figma Banner/Advisor Banner texture image, soft-light blended. */
function WaveTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-soft-light"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/signature/banner-texture.png"
        alt=""
        className="absolute left-0 top-[-84%] h-[275%] w-full max-w-none"
      />
    </div>
  );
}
