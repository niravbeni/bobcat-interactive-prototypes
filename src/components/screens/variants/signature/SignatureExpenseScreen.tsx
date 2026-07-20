"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRightLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Info,
  Plus,
  X,
} from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { cn } from "@/lib/cn";
import { SignatureShell, NavPill, SIG_DEMO_CLEAR_EVENT } from "./SignatureShell";
import {
  SignatureDetailsSidebar,
  SignatureSummaryRow,
} from "./SignatureDetailsSidebar";
import { SignatureInfoCard } from "./SignatureInfoCard";
import { SectionHeading } from "./SectionHeading";
import { SpendTrendModal } from "./SpendTrendModal";
import {
  SIG_EASE,
  SIG_HERO_GRADIENT,
  SIG_SPRING_SNAPPY,
  fmtMoney,
  fmtMoneyCents,
  useCountUp,
} from "./shared";
import {
  BREAKDOWNS,
  CATEGORIES,
  CUSTOM_CATEGORY_ICON,
  DEFAULT_SAFETY_ID,
  DEFAULT_TREND,
  ENTERED_TOTAL_DEFAULT,
  ESTIMATE_DEFAULTS,
  EXTRA_CATEGORIES,
  FUTURE_COST_PRESETS,
  INITIAL_SAFETY_ID,
  METHODS,
  SAFETY_OPTIONS,
  SEED_FUTURE_COSTS,
  SUPPORT_RANGE_LABEL,
  TAB_HEADINGS,
  TIMING_KIND_LABEL,
  TREND_ROW_LABEL,
  WHEN_OPTIONS,
  type ExtraCategory,
  type FutureCost,
  type SpendCategory,
  type SpendMethod,
  type SpendTab,
  type TimingKind,
  type TrendId,
} from "./signatureSpending";

let addedSeq = 0;
let futureSeq = 0;

/** Base category ids across both tabs (used to seed the values map). */
const BASE_IDS = [...CATEGORIES.essentials, ...CATEGORIES.lifestyle].map(
  (c) => c.id,
);

const zeroValues = (): Record<string, number> =>
  Object.fromEntries(BASE_IDS.map((id) => [id, 0]));

interface AddedCategory {
  key: string;
  /** Extra-catalog id (for break-it-down defaults), or "" for custom. */
  catId: string;
  title: string;
  description: string;
  icon: SpendCategory["icon"];
  tab: SpendTab;
  monthly: number;
  custom?: boolean;
}

/* ------------------------------------------------------------------ */
/* Figma 2165:29651 defaults — the screen renders pre-filled on load  */
/* (double-tapping the AI pill clears everything back to empty).      */
/* ------------------------------------------------------------------ */

/** Per-category monthly amounts for the base "build" categories. */
const seedValues = (): Record<string, number> => ({
  ...zeroValues(),
  home: 3800,
  transport: 750,
  food: 800,
});

/** Extra categories dropped into the essentials tab, with Figma amounts. */
const INITIAL_ADDED_SPEC: { id: string; monthly: number }[] = [
  { id: "health", monthly: 1200 },
  { id: "personal", monthly: 600 },
];

const seedAdded = (): AddedCategory[] =>
  INITIAL_ADDED_SPEC.flatMap(({ id, monthly }) => {
    const extra = EXTRA_CATEGORIES.find((e) => e.id === id);
    if (!extra) return [];
    return [
      {
        key: extra.id,
        catId: extra.id,
        title: extra.title,
        description: extra.description,
        icon: extra.icon,
        tab: extra.tab,
        monthly,
      },
    ];
  });

/** Non-default spend trends (everything else falls back to DEFAULT_TREND). */
const seedTrends = (): Record<string, TrendId> => ({
  food: "flat",
  health: "up",
});

export function SignatureExpenseScreen() {
  const { goTo } = useFlow();

  const [method, setMethod] = useState<SpendMethod | null>("build");
  const [tab, setTab] = useState<SpendTab>("essentials");
  const [values, setValues] = useState<Record<string, number>>(seedValues);
  const [added, setAdded] = useState<AddedCategory[]>(seedAdded);
  const [safetyId, setSafetyId] = useState(INITIAL_SAFETY_ID);
  const [enteredTotal, setEnteredTotal] = useState(ENTERED_TOTAL_DEFAULT);
  const [trends, setTrends] = useState<Record<string, TrendId>>(seedTrends);
  const [futureCosts, setFutureCosts] = useState<FutureCost[]>(SEED_FUTURE_COSTS);
  // Base essential/lifestyle categories the user has removed. Their value is
  // kept in `values` but excluded from the total while hidden.
  const [removedBase, setRemovedBase] = useState<string[]>([]);
  const [trendModal, setTrendModal] = useState<
    { id: string; title: string } | null
  >(null);

  // Hidden demo shortcut: reset the whole spending flow to empty so a presenter
  // can enter values live. Resetting `method` to null unmounts the builder
  // subtree, so each category row's own local state (unit toggle, expanded
  // break-it-down, breakdown items) resets on the next mount. SSR-safe — the
  // listener is only added on the client in useEffect.
  useEffect(() => {
    const clear = () => {
      setMethod(null);
      setTab("essentials");
      setValues(zeroValues());
      setAdded([]);
      setSafetyId(DEFAULT_SAFETY_ID);
      setEnteredTotal(0);
      setTrends({});
      setFutureCosts([]);
      setRemovedBase([]);
      setTrendModal(null);
    };
    window.addEventListener(SIG_DEMO_CLEAR_EVENT, clear);
    return () => window.removeEventListener(SIG_DEMO_CLEAR_EVENT, clear);
  }, []);

  const baseTotal =
    Object.entries(values).reduce(
      (t, [id, n]) => (removedBase.includes(id) ? t : t + (n || 0)),
      0,
    ) + added.reduce((t, a) => t + a.monthly, 0);
  const monthly = method === "total" ? enteredTotal : baseTotal;
  const animated = useCountUp(monthly);
  const safety =
    SAFETY_OPTIONS.find((s) => s.id === safetyId) ?? SAFETY_OPTIONS[1];

  const methodLabel = method
    ? METHODS.find((m) => m.id === method)?.title ?? null
    : null;

  const pickMethod = (m: SpendMethod) => {
    if (m === "build") setValues(zeroValues());
    else if (m === "estimate")
      setValues({ ...zeroValues(), ...ESTIMATE_DEFAULTS });
    setMethod(m);
  };

  const setValue = (id: string, m: number) =>
    setValues((prev) => ({ ...prev, [id]: m }));

  const setTrend = (id: string, t: TrendId) =>
    setTrends((prev) => ({ ...prev, [id]: t }));

  const removeBase = (id: string) =>
    setRemovedBase((prev) => (prev.includes(id) ? prev : [...prev, id]));

  const addedForTab = added.filter((a) => a.tab === tab);
  const availableExtras = EXTRA_CATEGORIES.filter(
    (e) => e.tab === tab && !added.some((a) => a.catId === e.id),
  );

  const addExtra = (e: ExtraCategory) =>
    setAdded((prev) => [
      ...prev,
      {
        key: e.id,
        catId: e.id,
        title: e.title,
        description: e.description,
        icon: e.icon,
        tab: e.tab,
        monthly: e.defaultMonthly,
      },
    ]);

  const addCustom = () =>
    setAdded((prev) => [
      ...prev,
      {
        key: `added-${addedSeq++}`,
        catId: "",
        title: "",
        description: "Add your own spending category.",
        icon: CUSTOM_CATEGORY_ICON,
        tab,
        monthly: 0,
        custom: true,
      },
    ]);

  const removeAdded = (key: string) =>
    setAdded((prev) => prev.filter((a) => a.key !== key));

  const patchAdded = (key: string, patch: Partial<AddedCategory>) =>
    setAdded((prev) => prev.map((a) => (a.key === key ? { ...a, ...patch } : a)));

  return (
    <SignatureShell
      mode="tabs"
      scroll={false}
      askPill={false}
      subBar={{
        left: (
          <button
            type="button"
            onClick={() => goTo("sig-home")}
            className="inline-flex items-center gap-1 text-sm font-medium text-deep-black transition-opacity hover:opacity-60"
          >
            <ChevronLeft className="size-4" strokeWidth={2.2} />
            Back to summary
          </button>
        ),
        center: (
          <p className="text-xs text-[#18181b]">
            Your personalized outlook will update once we have more details in
            each category.
          </p>
        ),
        right: (
          <NavPill secondary="Goals" onClick={() => goTo("sig-goals")}>
            Next Section
          </NavPill>
        ),
      }}
      bodyClassName="p-4"
    >
      <div className="flex min-h-0 w-full flex-1 gap-4">
        <SignatureDetailsSidebar
          selected="spending"
          selectedComplete={method !== null && monthly > 0}
          onNavigate={(section) => {
            if (section === "assets") goTo("sig-assets");
            else if (section === "goals") goTo("sig-goals");
          }}
          subContent={
            <div className="flex flex-col gap-0.5 px-1 pb-2 pt-0.5">
              <SignatureSummaryRow
                label="Calculation approach"
                value={methodLabel ?? "Pending completion"}
              />
              <SignatureSummaryRow
                label="Spending target"
                value={
                  method ? `${fmtMoney(monthly)} per month` : "Pending completion"
                }
                indented
              />
              <SignatureSummaryRow
                label="Safety buffer"
                value={method ? safety.short : "Pending completion"}
                indented
              />
            </div>
          }
        />

        <div className="scrollbar-slim mx-auto flex min-h-0 min-w-0 max-w-[1080px] flex-1 flex-col gap-5 overflow-y-auto pb-24 pr-1">
          {/* Header card (Figma 2026:14047): violet accent heading + two info
              cards, wrapped in a translucent white card (signature look). */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: SIG_EASE }}
            className="flex shrink-0 flex-col gap-6 rounded-card bg-white p-6 sm:p-8"
          >
            <SectionHeading>Your spending target</SectionHeading>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <SignatureInfoCard
                iconSrc="/signature/icon-plan.svg"
                title="What you need to do"
              />
              <SignatureInfoCard
                iconSrc="/signature/icon-info.svg"
                title="How this affects your retirement plan"
              />
            </div>
          </motion.div>

          <AnimatePresence mode="wait" initial={false}>
            {method === null ? (
              <motion.div
                key="chooser"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: SIG_EASE } }}
                transition={{ duration: 0.4, ease: SIG_EASE }}
              >
                <MethodChooser onPick={pickMethod} />
              </motion.div>
            ) : (
              <motion.div
                key="builder"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: SIG_EASE } }}
                transition={{ duration: 0.45, ease: SIG_EASE }}
                className="flex flex-col gap-5"
              >
                {/* Build header + live purple target card. */}
                <div className="flex flex-col gap-6 rounded-card border border-stroke-subtle bg-white p-6">
                  <BuildHeader
                    method={method}
                    onChangeMethod={() => setMethod(null)}
                  />
                  <TargetCard
                    animated={animated}
                    monthly={monthly}
                    safetyId={safetyId}
                    onSafety={setSafetyId}
                  />
                </div>

                {method === "total" ? (
                  <EnterTotalCard value={enteredTotal} onChange={setEnteredTotal} />
                ) : (
                  <>
                    <BuilderCard
                      tab={tab}
                      onTab={setTab}
                      values={values}
                      onValue={setValue}
                      removedBase={removedBase}
                      onRemoveBase={removeBase}
                      addedForTab={addedForTab}
                      onAddedMonthly={(k, m) => patchAdded(k, { monthly: m })}
                      onAddedTitle={(k, t) => patchAdded(k, { title: t })}
                      onRemoveAdded={removeAdded}
                      onAddCustom={addCustom}
                      availableExtras={availableExtras}
                      onAddExtra={addExtra}
                      trends={trends}
                      onEditTrend={(id, title) => setTrendModal({ id, title })}
                    />
                    <AdditionalSpending
                      costs={futureCosts}
                      onAdd={() =>
                        setFutureCosts((prev) => [
                          ...prev,
                          {
                            id: `future-${futureSeq++}`,
                            name: "Custom cost",
                            monthly: 0,
                            timing: "ends",
                            when: "5 years",
                          },
                        ])
                      }
                      onPatch={(id, patch) =>
                        setFutureCosts((prev) =>
                          prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
                        )
                      }
                      onRemove={(id) =>
                        setFutureCosts((prev) => prev.filter((c) => c.id !== id))
                      }
                    />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SpendTrendModal
        open={trendModal !== null}
        categoryTitle={trendModal?.title ?? ""}
        selected={trendModal ? trends[trendModal.id] ?? DEFAULT_TREND : null}
        onSelect={(t) => {
          if (trendModal) setTrend(trendModal.id, t);
        }}
        onClose={() => setTrendModal(null)}
      />
    </SignatureShell>
  );
}

/* ------------------------------------------------------------------ */
/* Screen 1 — method chooser                                          */
/* ------------------------------------------------------------------ */

function MethodChooser({ onPick }: { onPick: (m: SpendMethod) => void }) {
  return (
    <div className="flex flex-col gap-6 rounded-card border border-stroke-subtle bg-white px-6 pb-5 pt-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[20px] font-medium leading-[1.16] tracking-[-0.4px] text-title-ink">
          How would you like to set your spending target?
        </h2>
        <p className="text-base leading-[1.45] tracking-[-0.32px] text-gray-1">
          Choose the approach that feels easiest. You can change this later.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {METHODS.map((m, i) => (
          <motion.button
            key={m.id}
            type="button"
            onClick={() => onPick(m.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: SIG_EASE, delay: 0.06 + i * 0.06 }}
            whileHover={{ y: -2 }}
            className="group flex flex-col gap-4 rounded-card border border-stroke-subtle bg-white px-6 pb-6 pt-7 text-left transition-colors hover:border-violet/50"
          >
            <div className="flex flex-col gap-4">
              <span className="flex h-[26px] items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.iconSrc}
                  alt=""
                  aria-hidden
                  className={m.iconClass}
                />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[20px] leading-[23.25px] text-title-ink">
                  {m.title}
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-xs leading-[1.4] tracking-[-0.12px] text-gray-1">
                    {m.description}
                  </span>
                  <Info className="size-4 shrink-0 text-gray-2" strokeWidth={2} />
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              {m.recommended ? (
                <span className="rounded-full bg-stratosphere/10 px-2.5 py-1 text-xs leading-[18px] text-stratosphere">
                  Recommended
                </span>
              ) : (
                <span aria-hidden />
              )}
              <span className="size-7 shrink-0 rounded-full border-[1.5px] border-black transition-colors group-hover:border-violet" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Build header (title + change method)                               */
/* ------------------------------------------------------------------ */

const BUILD_COPY: Record<SpendMethod, { title: string; subtitle: string }> = {
  build: {
    title: "Build your spending target",
    subtitle:
      "Add the regular costs you expect in retirement. Your total updates automatically.",
  },
  estimate: {
    title: "Your quick estimate",
    subtitle:
      "We've pre-filled typical costs. Adjust anything that doesn't fit you.",
  },
  total: {
    title: "Enter your spending target",
    subtitle: "Tell us the monthly figure you already have in mind.",
  },
};

function BuildHeader({
  method,
  onChangeMethod,
}: {
  method: SpendMethod;
  onChangeMethod: () => void;
}) {
  const copy = BUILD_COPY[method];
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-[20px] font-medium leading-[23.25px] tracking-[-0.4px] text-title-ink">
          {copy.title}
        </h2>
        <p className="text-base leading-[23.25px] tracking-[-0.32px] text-gray-1">
          {copy.subtitle}
        </p>
      </div>
      <button
        type="button"
        onClick={onChangeMethod}
        className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-stratosphere transition-opacity hover:opacity-70"
      >
        Change method
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Purple live target card                                            */
/* ------------------------------------------------------------------ */

function TargetCard({
  animated,
  monthly,
  safetyId,
  onSafety,
}: {
  animated: number;
  monthly: number;
  safetyId: string;
  onSafety: (id: string) => void;
}) {
  return (
    <div
      className="relative flex flex-col gap-[19px] overflow-hidden rounded-card p-6 text-white"
      style={{
        backgroundImage: SIG_HERO_GRADIENT,
      }}
    >
      {/* Figma Banner/Advisor Banner texture, soft-light blended. */}
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

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xl leading-[1.16] text-white">
            Your current spending target
          </span>
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="text-[40px] font-medium leading-[1.1] tracking-[-0.8px]">
              {fmtMoneyCents(animated)}
            </span>
            <span className="text-base text-white">
              per month · ({fmtMoney(monthly * 12)} per year)
            </span>
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-[7px] rounded-full bg-white px-2.5 py-1">
          <span className="grid size-5 place-items-center rounded-full bg-success text-white">
            <Check className="size-3" strokeWidth={3} />
          </span>
          <span className="text-xs leading-[18px] text-black">
            {SUPPORT_RANGE_LABEL}
          </span>
        </span>
      </div>

      <span aria-hidden className="relative h-px w-full bg-white/30" />

      <div className="relative flex flex-wrap items-center gap-1.5 text-xl font-medium tracking-[-0.4px] text-white">
        <span>With a</span>
        <span className="relative inline-flex items-center">
          <select
            value={safetyId}
            onChange={(e) => onSafety(e.target.value)}
            aria-label="Safety buffer"
            className="cursor-pointer appearance-none rounded-[4px] bg-white py-1 pl-2 pr-6 text-base font-normal tracking-[-0.32px] text-black outline-none"
          >
            {SAFETY_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-1.5 size-3 text-black"
            strokeWidth={2.4}
          />
        </span>
        <span>safety buffer kept aside on top.</span>
        <Info className="size-4 text-white/90" strokeWidth={2} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Enter-a-total variant                                              */
/* ------------------------------------------------------------------ */

function EnterTotalCard({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-stroke-subtle bg-white p-6">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-lg font-medium tracking-[-0.01em] text-title-ink">
          Your monthly spending target
        </h3>
        {/* Helper copy is non-essential → shimmer bar. */}
        <span
          className="mt-1 h-2.5 w-[62%] max-w-[420px] rounded-full skeleton-shimmer"
          aria-hidden
        />
      </div>
      <div className="flex h-16 max-w-[420px] items-center gap-2 rounded-field border-[1.5px] border-transparent bg-[#f7f7f7] px-5 focus-within:border-black">
        <span className="text-2xl font-medium text-gray-2">$</span>
        <input
          inputMode="numeric"
          value={value === 0 ? "" : value.toLocaleString("en-US")}
          onChange={(e) =>
            onChange(Number(e.target.value.replace(/[^0-9]/g, "") || 0))
          }
          placeholder="Add amount"
          aria-label="Monthly spending target"
          className="w-full bg-transparent text-2xl font-medium text-black caret-violet outline-none placeholder:text-gray-2"
        />
        <span className="shrink-0 text-sm text-gray-2">per month</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Builder card (tabs + category rows + add-a-cost + chips)           */
/* ------------------------------------------------------------------ */

function BuilderCard({
  tab,
  onTab,
  values,
  onValue,
  removedBase,
  onRemoveBase,
  addedForTab,
  onAddedMonthly,
  onAddedTitle,
  onRemoveAdded,
  onAddCustom,
  availableExtras,
  onAddExtra,
  trends,
  onEditTrend,
}: {
  tab: SpendTab;
  onTab: (t: SpendTab) => void;
  values: Record<string, number>;
  onValue: (id: string, m: number) => void;
  removedBase: string[];
  onRemoveBase: (id: string) => void;
  addedForTab: AddedCategory[];
  onAddedMonthly: (key: string, m: number) => void;
  onAddedTitle: (key: string, t: string) => void;
  onRemoveAdded: (key: string) => void;
  onAddCustom: () => void;
  availableExtras: ExtraCategory[];
  onAddExtra: (e: ExtraCategory) => void;
  trends: Record<string, TrendId>;
  onEditTrend: (id: string, title: string) => void;
}) {
  const list = CATEGORIES[tab].filter((c) => !removedBase.includes(c.id));
  return (
    <div className="flex flex-col rounded-card border border-stroke-subtle bg-white">
      {/* Tab header (underline style, Figma 2046:24977). */}
      <div className="flex items-center gap-8 border-b border-stroke-subtle px-6 pt-4">
        {(["essentials", "lifestyle"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onTab(t)}
              className="relative pb-3 text-sm font-medium tracking-[0.14px] transition-colors"
            >
              <span className={active ? "text-violet" : "text-black/75"}>
                {t === "essentials" ? "Everyday essentials" : "Lifestyle"}
              </span>
              {active ? (
                <motion.span
                  layoutId="sig-spend-tab"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-violet"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 px-6 pb-6 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-medium tracking-[-0.01em] text-title-ink">
            {TAB_HEADINGS[tab]}
          </h3>
          <button
            type="button"
            onClick={onAddCustom}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#e6e6ea] bg-white px-3.5 py-1.5 text-sm font-medium text-black transition-colors hover:border-violet/50 hover:text-violet"
          >
            Add a cost
            <Plus className="size-4" strokeWidth={2.4} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {list.map((cat) => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
                transition={SIG_SPRING_SNAPPY}
              >
                <SigCategoryRow
                  rowId={cat.id}
                  catId={cat.id}
                  category={cat}
                  monthly={values[cat.id] ?? 0}
                  onChange={(m) => onValue(cat.id, m)}
                  onRemove={() => onRemoveBase(cat.id)}
                  trend={trends[cat.id] ?? DEFAULT_TREND}
                  onEditTrend={() => onEditTrend(cat.id, cat.title)}
                  // Home opens pre-expanded (Figma 2165:29651) so the
                  // Rent/Mortgage selector is visible — but only when it has a
                  // seeded value, so the demo-clear reset still starts empty.
                  initialExpanded={cat.id === "home" && (values[cat.id] ?? 0) > 0}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {addedForTab.map((a) => (
              <motion.div
                key={a.key}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
                transition={SIG_SPRING_SNAPPY}
              >
                <SigCategoryRow
                  rowId={a.key}
                  catId={a.catId || a.key}
                  category={{
                    id: a.catId || a.key,
                    title: a.title,
                    description: a.description,
                    icon: a.icon,
                  }}
                  monthly={a.monthly}
                  onChange={(m) => onAddedMonthly(a.key, m)}
                  onRemove={() => onRemoveAdded(a.key)}
                  editableTitle={a.custom}
                  onTitleChange={(t) => onAddedTitle(a.key, t)}
                  trend={trends[a.key] ?? DEFAULT_TREND}
                  onEditTrend={() =>
                    onEditTrend(a.key, a.title || "this cost")
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {availableExtras.length > 0 ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {availableExtras.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => onAddExtra(e)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e6e6ea] bg-white px-3.5 py-2 text-sm font-medium text-black transition-colors hover:border-violet/50 hover:text-violet"
              >
                <Plus className="size-3.5 shrink-0" strokeWidth={2.4} />
                {e.title}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Category row                                                        */
/* ------------------------------------------------------------------ */

interface BreakdownItem {
  id: string;
  label: string;
  monthly: number;
  custom?: boolean;
}

type HousingTenure = "mortgage" | "rent";
const HOUSING_TENURE_LABEL: Record<HousingTenure, string> = {
  mortgage: "Mortgage",
  rent: "Rent",
};
/** Default mortgage term shown on the housing row (Figma: "5 years"). */
const HOUSING_DEFAULT_TERM = "5 years";

let breakdownSeq = 0;
const sumItems = (list: BreakdownItem[]) =>
  list.reduce((t, it) => t + it.monthly, 0);

function SigCategoryRow({
  rowId,
  catId,
  category,
  monthly,
  onChange,
  onRemove,
  editableTitle = false,
  onTitleChange,
  trend,
  onEditTrend,
  initialExpanded = false,
}: {
  rowId: string;
  catId: string;
  category: SpendCategory;
  monthly: number;
  onChange: (m: number) => void;
  onRemove?: () => void;
  editableTitle?: boolean;
  onTitleChange?: (t: string) => void;
  trend: TrendId;
  onEditTrend: () => void;
  /** Start in the "break it down" expanded state (Home does, per Figma). */
  initialExpanded?: boolean;
}) {
  const Icon = category.icon;
  const [unit, setUnit] = useState<"month" | "year">("month");
  const [expanded, setExpanded] = useState(initialExpanded);
  // Housing tenure control (Figma 2202:5742): the first breakdown row of the
  // Home category is a Rent/Mortgage dropdown. Mortgage additionally shows a
  // "that ends in [N years]" term selector (a mortgage gets paid off); Rent is
  // ongoing so the term control is hidden.
  const isHousing = catId === "home";
  const [tenure, setTenure] = useState<HousingTenure>("mortgage");
  const [mortgageTerm, setMortgageTerm] = useState(HOUSING_DEFAULT_TERM);
  const [items, setItems] = useState<BreakdownItem[]>(() =>
    (BREAKDOWNS[catId] ?? [{ label: "", monthly }]).map((c, i) => ({
      id: `${rowId}-${i}`,
      label: c.label,
      monthly: c.monthly,
    })),
  );

  const toShown = (m: number) => (unit === "month" ? m : m * 12);
  const parseToMonthly = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    const num = digits === "" ? 0 : Number(digits);
    return unit === "month" ? num : Math.round(num / 12);
  };

  const openBreakdown = () => {
    setExpanded(true);
    onChange(sumItems(items));
  };

  const setItemMonthly = (id: string, raw: string) => {
    const next = items.map((it) =>
      it.id === id ? { ...it, monthly: parseToMonthly(raw) } : it,
    );
    setItems(next);
    onChange(sumItems(next));
  };

  const setItemLabel = (id: string, label: string) =>
    setItems(items.map((it) => (it.id === id ? { ...it, label } : it)));

  const addCustomRow = () =>
    setItems([
      ...items,
      { id: `bd-${breakdownSeq++}`, label: "", monthly: 0, custom: true },
    ]);

  const removeRow = (id: string) => {
    const next = items.filter((it) => it.id !== id);
    setItems(next);
    onChange(sumItems(next));
  };

  const unitSuffix = unit === "month" ? "per month" : "per year";

  return (
    <div className="rounded-[12px] border border-[#eee] bg-black/[0.03] transition-colors">
      {/* Header row (Figma 2202:5722 / 2202:5359). */}
      <div
        className={cn(
          "flex items-start justify-between gap-4",
          expanded ? "px-5 pb-3 pt-5" : "px-5 pb-4 pt-5",
        )}
      >
        <div className="flex min-w-0 flex-col items-start gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-full border-[0.625px] border-[#eee] bg-white text-deep-black">
              <Icon className="size-6" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              {editableTitle ? (
                <input
                  value={category.title}
                  onChange={(e) => onTitleChange?.(e.target.value)}
                  placeholder="Name this cost"
                  aria-label="Cost name"
                  className="min-w-0 max-w-[220px] border-b border-transparent bg-transparent text-base font-medium leading-tight tracking-[-0.08px] text-title-ink outline-none transition-colors placeholder:text-gray-2 focus:border-violet/50"
                />
              ) : (
                <span className="text-base font-medium leading-tight tracking-[-0.08px] text-title-ink">
                  {category.title}
                </span>
              )}
              <p className="mt-1 text-xs leading-[1.4] text-gray-1">
                {category.description}
              </p>
            </div>
          </div>

          {/* Collapsed: break-it-down + remove live in the left column. */}
          {!expanded ? (
            <div className="flex items-center gap-3 pl-1">
              <button
                type="button"
                onClick={openBreakdown}
                className="inline-flex items-center gap-0.5 text-sm font-medium text-stratosphere transition-opacity hover:opacity-70"
              >
                Break it down
                <ChevronDown className="size-5" strokeWidth={2} />
              </button>
              {onRemove ? (
                <button
                  type="button"
                  onClick={onRemove}
                  className="text-sm font-medium text-gray-2 transition-colors hover:text-deep-black"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {expanded ? (
            <div className="flex w-[288px] items-center justify-end gap-4 pl-4">
              <span className="text-[20px] font-medium leading-6 tracking-[-0.4px] text-black">
                ${fmt(toShown(sumItems(items)))}
              </span>
              <UnitToggle unit={unit} onChange={setUnit} />
            </div>
          ) : (
            <div className="flex w-[288px] items-center justify-between rounded-full bg-white py-1 pl-4 pr-1">
              <span className="text-[20px] font-medium leading-6 text-black">$</span>
              <div className="flex flex-1 items-center justify-end gap-3">
                <input
                  inputMode="numeric"
                  value={fmt(toShown(monthly))}
                  onChange={(e) => onChange(parseToMonthly(e.target.value))}
                  aria-label={`${category.title || "Cost"} amount`}
                  className="w-[84px] bg-transparent text-right text-[20px] font-medium leading-6 text-black caret-violet outline-none"
                />
                <UnitToggle unit={unit} onChange={setUnit} />
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onEditTrend}
            className="flex items-center gap-1 rounded-full pr-2 text-xs leading-[1.4] tracking-[-0.12px] text-stratosphere transition-opacity hover:opacity-70"
          >
            {TREND_ROW_LABEL[trend]}
            <Info className="size-4 shrink-0" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Expanded "break it down" body (Figma 2202:5741). */}
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: SIG_EASE }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-[#eee] px-5 pb-4 pt-3">
              {items.map((it, idx) => {
                const labelEditable = it.custom || editableTitle;
                // Home's first breakdown row is the Rent/Mortgage selector.
                if (isHousing && idx === 0) {
                  return (
                    <div
                      key={it.id}
                      className="flex flex-wrap items-center justify-between gap-3 pl-2.5"
                    >
                      <SelectChip
                        value={tenure}
                        onChange={(v) => setTenure(v as HousingTenure)}
                        options={["mortgage", "rent"]}
                        renderOption={(v) => HOUSING_TENURE_LABEL[v as HousingTenure]}
                        ariaLabel="Rent or mortgage"
                      />
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <div className="flex h-8 w-[180px] items-center justify-between rounded-lg border-[0.816px] border-[#eee] bg-white px-3">
                          <span className="text-sm font-medium tracking-[-0.28px] text-black">
                            $
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              inputMode="numeric"
                              value={fmt(toShown(it.monthly))}
                              onChange={(e) => setItemMonthly(it.id, e.target.value)}
                              aria-label={`${HOUSING_TENURE_LABEL[tenure]} amount`}
                              className="w-[64px] bg-transparent text-right text-sm font-medium tracking-[-0.28px] text-black outline-none"
                            />
                            <span className="text-xs tracking-[-0.24px] text-gray-1">
                              {unitSuffix}
                            </span>
                          </div>
                        </div>
                        {tenure === "mortgage" ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm tracking-[-0.28px] text-black">
                              that ends in
                            </span>
                            <SelectChip
                              value={mortgageTerm}
                              onChange={setMortgageTerm}
                              options={WHEN_OPTIONS}
                              ariaLabel="Mortgage term"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-3 pl-2.5"
                  >
                    {labelEditable ? (
                      <input
                        value={it.label}
                        onChange={(e) => setItemLabel(it.id, e.target.value)}
                        placeholder="Name this item"
                        aria-label="Breakdown item name"
                        className="min-w-0 flex-1 border-b border-transparent bg-transparent text-sm font-medium tracking-[-0.28px] text-black outline-none transition-colors placeholder:text-gray-2 focus:border-violet/50"
                      />
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-sm font-medium tracking-[-0.28px] text-black">
                        {it.label}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-8 w-[180px] items-center justify-between rounded-lg border-[0.816px] border-[#eee] bg-white px-3">
                        <span className="text-sm font-medium tracking-[-0.28px] text-black">
                          $
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            inputMode="numeric"
                            value={fmt(toShown(it.monthly))}
                            onChange={(e) => setItemMonthly(it.id, e.target.value)}
                            aria-label={`${it.label || "Custom item"} amount`}
                            className="w-[64px] bg-transparent text-right text-sm font-medium tracking-[-0.28px] text-black outline-none"
                          />
                          <span className="text-xs tracking-[-0.24px] text-gray-1">
                            {unitSuffix}
                          </span>
                        </div>
                      </div>
                      {it.custom ? (
                        <button
                          type="button"
                          onClick={() => removeRow(it.id)}
                          aria-label="Remove row"
                          className="grid size-6 place-items-center rounded-full text-gray-2 transition-colors hover:bg-black/5 hover:text-deep-black"
                        >
                          <X className="size-4" strokeWidth={2.2} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              <div className="border-t border-[#eee]" />

              <div className="flex items-center justify-between gap-3 pl-2.5">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="inline-flex items-center gap-0.5 text-sm font-medium text-stratosphere transition-opacity hover:opacity-70"
                  >
                    Enter as a single number
                    <ChevronUp className="size-5" strokeWidth={2} />
                  </button>
                  {onRemove ? (
                    <button
                      type="button"
                      onClick={onRemove}
                      className="text-sm font-medium text-gray-2 transition-colors hover:text-deep-black"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={addCustomRow}
                  className="inline-flex items-center gap-0.5 text-sm font-medium text-stratosphere transition-opacity hover:opacity-70"
                >
                  Add custom row
                  <Plus className="size-4" strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Per-month / per-year swap pill (Figma "Per Month" + swap_horiz). */
function UnitToggle({
  unit,
  onChange,
}: {
  unit: "month" | "year";
  onChange: (u: "month" | "year") => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(unit === "month" ? "year" : "month")}
      className="flex w-[120px] shrink-0 items-center justify-center gap-1 rounded-full bg-black/[0.03] px-4 py-1 text-[10px] font-medium uppercase leading-[16.5px] tracking-[0.66px] text-black transition-colors hover:bg-black/[0.06]"
      aria-label={`Showing per ${unit}. Switch to per ${unit === "month" ? "year" : "month"}.`}
    >
      {unit === "month" ? "Per month" : "Per year"}
      <ArrowRightLeft className="size-5 shrink-0" strokeWidth={2} />
    </button>
  );
}

const fmt = (n: number) => n.toLocaleString("en-US");

/* ------------------------------------------------------------------ */
/* Additional spending (future costs)                                 */
/* ------------------------------------------------------------------ */

function AdditionalSpending({
  costs,
  onAdd,
  onPatch,
  onRemove,
}: {
  costs: FutureCost[];
  onAdd: () => void;
  onPatch: (id: string, patch: Partial<FutureCost>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col rounded-card border border-stroke-subtle bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border-[0.625px] border-[#eee] bg-white text-deep-black">
            <Calendar className="size-6" strokeWidth={1.8} />
          </span>
          <span className="text-base font-medium leading-6 tracking-[-0.08px] text-title-ink">
            Additional Spending
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-0.5 text-sm font-medium text-stratosphere transition-opacity hover:opacity-70"
        >
          Add item
          <Plus className="size-5" strokeWidth={2.2} />
        </button>
      </div>
      <div className="border-t border-stroke-subtle px-6 pb-6 pt-2">
        {costs.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-2">
            No future costs yet. Add one-off or time-limited costs above.
          </p>
        ) : (
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {costs.map((c) => (
                <FutureCostRow
                  key={c.id}
                  cost={c}
                  onPatch={(patch) => onPatch(c.id, patch)}
                  onRemove={() => onRemove(c.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function FutureCostRow({
  cost,
  onPatch,
  onRemove,
}: {
  cost: FutureCost;
  onPatch: (patch: Partial<FutureCost>) => void;
  onRemove: () => void;
}) {
  const presetOptions = useMemo(() => {
    const set = new Set(FUTURE_COST_PRESETS);
    set.add(cost.name);
    return Array.from(set);
  }, [cost.name]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
      transition={SIG_SPRING_SNAPPY}
      className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f0f2] py-3 last:border-b-0"
    >
      <div className="flex items-center gap-2">
        <SelectChip
          value={cost.name}
          onChange={(v) => onPatch({ name: v })}
          options={presetOptions}
          ariaLabel="Future cost name"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove future cost"
          className="grid size-6 place-items-center rounded-full text-gray-2 transition-colors hover:bg-black/5 hover:text-deep-black"
        >
          <X className="size-4" strokeWidth={2.2} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex h-8 items-center gap-1 rounded-lg border-[0.816px] border-[#eee] bg-white px-3">
          <span className="text-sm font-medium text-black">$</span>
          <input
            inputMode="numeric"
            value={fmt(cost.monthly)}
            onChange={(e) =>
              onPatch({
                monthly: Number(e.target.value.replace(/[^0-9]/g, "") || 0),
              })
            }
            aria-label={`${cost.name} amount`}
            className="w-[62px] bg-transparent text-right text-sm font-medium text-black outline-none"
          />
          <span className="pl-0.5 text-xs text-gray-1">
            {cost.timing === "oneoff" ? "total" : "per month"}
          </span>
        </div>
        <SelectChip
          value={cost.timing}
          onChange={(v) => onPatch({ timing: v as TimingKind })}
          options={["ends", "starts", "oneoff"]}
          renderOption={(v) => TIMING_KIND_LABEL[v as TimingKind]}
          ariaLabel="Timing"
          plain
        />
        <SelectChip
          value={cost.when}
          onChange={(v) => onPatch({ when: v })}
          options={WHEN_OPTIONS}
          renderOption={(v) => (cost.timing === "oneoff" ? `${v} time` : v)}
          ariaLabel="When"
        />
      </div>
    </motion.div>
  );
}

/** Small bordered select styled as a chip (matches the Figma pill dropdowns). */
function SelectChip({
  value,
  onChange,
  options,
  renderOption,
  ariaLabel,
  plain = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  renderOption?: (v: string) => string;
  ariaLabel: string;
  /** Plain chips (the "that ends in" connector) drop the border/chevron. */
  plain?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex h-8 items-center",
        plain
          ? "text-sm font-medium text-black"
          : "gap-2 rounded-lg border-[0.816px] border-[#eee] bg-white px-3",
      )}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent text-transparent opacity-0 outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {renderOption ? renderOption(o) : o}
          </option>
        ))}
      </select>
      <span className="pointer-events-none text-sm font-medium text-black">
        {renderOption ? renderOption(value) : value}
      </span>
      {plain ? null : (
        <ChevronDown
          className="pointer-events-none size-4 shrink-0 text-gray-2"
          strokeWidth={2}
        />
      )}
    </span>
  );
}
