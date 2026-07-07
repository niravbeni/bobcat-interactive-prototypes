"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Car,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Gift,
  GraduationCap,
  Hammer,
  HeartHandshake,
  HeartPulse,
  Home,
  Landmark,
  Layers,
  Palette,
  PawPrint,
  Pencil,
  Plane,
  Plus,
  ShoppingCart,
  Sparkles,
  Users,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { DetailsShell } from "@/components/prototypes/details/DetailsShell";
import { cn } from "@/lib/cn";
import type { DetailsSpending } from "@/lib/types";

type SpendMethod = DetailsSpending["method"];

interface MethodOption {
  id: SpendMethod;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Not yet designed — rendered greyed-out and non-clickable. */
  disabled?: boolean;
}

const METHODS: MethodOption[] = [
  {
    id: "know",
    title: "I know the number",
    description: "Enter your own total spending figure.",
    icon: Pencil,
    disabled: true,
  },
  {
    id: "estimate",
    title: "Estimate it for me",
    description: "Set a target within what your plan can support.",
    icon: Sparkles,
    disabled: true,
  },
  {
    id: "workout",
    title: "Help me work it out",
    description: "Build it up category by category.",
    icon: Layers,
  },
];

const SAFETY_OPTIONS = ["Low ($15k)", "Medium ($30k)", "High ($50k)"];

interface SpendCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const CATEGORIES: Record<"essentials" | "lifestyle", SpendCategory[]> = {
  essentials: [
    {
      id: "home",
      title: "Home",
      description: "Rent or mortgage, utilities, insurance and upkeep.",
      icon: Home,
    },
    {
      id: "transport",
      title: "Getting around",
      description: "Payments, fuel, insurance, servicing and transit.",
      icon: Car,
    },
    {
      id: "food",
      title: "Food & household",
      description: "Groceries, clothing and household items.",
      icon: ShoppingCart,
    },
    {
      id: "health",
      title: "Health",
      description: "Premiums, deductibles and out-of-pocket costs.",
      icon: HeartPulse,
    },
    {
      id: "personal",
      title: "Personal & subscriptions",
      description: "Haircuts, gym, memberships and subscriptions.",
      icon: CreditCard,
    },
  ],
  lifestyle: [
    {
      id: "travel",
      title: "Travel & holidays",
      description: "Trips, flights and the getaways you look forward to.",
      icon: Plane,
    },
    {
      id: "hobbies",
      title: "Hobbies & leisure",
      description: "Classes, gear and the things you love to do.",
      icon: Palette,
    },
    {
      id: "dining",
      title: "Dining & going out",
      description: "Restaurants, bars and entertainment.",
      icon: Utensils,
    },
    {
      id: "gifts",
      title: "Gifts & giving",
      description: "Presents, celebrations and donations.",
      icon: Gift,
    },
  ],
};

type SpendTab = "essentials" | "lifestyle";

interface ExtraCategory extends SpendCategory {
  tab: SpendTab;
  defaultMonthly: number;
}

/** Section heading shown above the category list for each tab. */
const TAB_HEADINGS: Record<SpendTab, string> = {
  essentials: "The essentials you rely on",
  lifestyle: "The extras that make it yours",
};

/**
 * Optional categories the user can drop into either tab from the suggestion
 * chips at the bottom. Once added they behave like any other category (editable
 * amount + break-it-down) and can be removed again.
 */
const EXTRA_CATEGORIES: ExtraCategory[] = [
  {
    tab: "essentials",
    id: "childcare",
    title: "Childcare & education",
    description: "Tuition, childcare and school costs.",
    icon: GraduationCap,
    defaultMonthly: 300,
  },
  {
    tab: "essentials",
    id: "debt",
    title: "Debt repayments",
    description: "Loans and credit-card repayments.",
    icon: Landmark,
    defaultMonthly: 250,
  },
  {
    tab: "essentials",
    id: "homeUpgrades",
    title: "Home upgrades",
    description: "Renovations, furniture and improvements.",
    icon: Hammer,
    defaultMonthly: 200,
  },
  {
    tab: "lifestyle",
    id: "pets",
    title: "Pets",
    description: "Food, vet bills, insurance and supplies.",
    icon: PawPrint,
    defaultMonthly: 200,
  },
  {
    tab: "lifestyle",
    id: "occasions",
    title: "Gifts & special occasions",
    description: "Birthdays, holidays and celebrations.",
    icon: Gift,
    defaultMonthly: 150,
  },
  {
    tab: "lifestyle",
    id: "charity",
    title: "Charitable giving",
    description: "Donations and the causes you support.",
    icon: HeartHandshake,
    defaultMonthly: 120,
  },
  {
    tab: "lifestyle",
    id: "family",
    title: "Family support",
    description: "Helping children, parents or relatives.",
    icon: Users,
    defaultMonthly: 300,
  },
];

/**
 * Default sub-components for each category's "Break it down" estimate. Each
 * set sums to the category's seeded monthly total so opening the breakdown
 * doesn't jump the number.
 */
const BREAKDOWNS: Record<string, { label: string; monthly: number }[]> = {
  home: [
    { label: "Rent or mortgage", monthly: 850 },
    { label: "Utilities", monthly: 180 },
    { label: "Insurance", monthly: 90 },
    { label: "Upkeep & repairs", monthly: 80 },
  ],
  transport: [
    { label: "Car payment", monthly: 180 },
    { label: "Fuel & charging", monthly: 110 },
    { label: "Insurance, tax & registration", monthly: 60 },
    { label: "Servicing & repairs", monthly: 30 },
    { label: "Public transport", monthly: 20 },
  ],
  food: [
    { label: "Groceries", monthly: 420 },
    { label: "Household items", monthly: 100 },
    { label: "Clothing", monthly: 80 },
  ],
  health: [
    { label: "Insurance premiums", monthly: 120 },
    { label: "Prescriptions", monthly: 40 },
    { label: "Out-of-pocket costs", monthly: 40 },
  ],
  personal: [
    { label: "Subscriptions", monthly: 70 },
    { label: "Gym & memberships", monthly: 80 },
    { label: "Haircuts & grooming", monthly: 50 },
  ],
  travel: [
    { label: "Flights", monthly: 220 },
    { label: "Accommodation", monthly: 180 },
    { label: "Activities & excursions", monthly: 100 },
  ],
  hobbies: [
    { label: "Classes & memberships", monthly: 110 },
    { label: "Equipment & gear", monthly: 90 },
    { label: "Supplies", monthly: 50 },
  ],
  dining: [
    { label: "Restaurants", monthly: 160 },
    { label: "Bars & nights out", monthly: 90 },
    { label: "Coffee & takeout", monthly: 50 },
  ],
  gifts: [
    { label: "Gifts", monthly: 70 },
    { label: "Celebrations", monthly: 50 },
    { label: "Donations", monthly: 30 },
  ],
  childcare: [
    { label: "Tuition & fees", monthly: 200 },
    { label: "Supplies & books", monthly: 60 },
    { label: "Activities", monthly: 40 },
  ],
  debt: [
    { label: "Loan repayments", monthly: 150 },
    { label: "Credit cards", monthly: 100 },
  ],
  homeUpgrades: [
    { label: "Renovations", monthly: 120 },
    { label: "Furniture", monthly: 50 },
    { label: "Improvements", monthly: 30 },
  ],
  pets: [
    { label: "Food", monthly: 80 },
    { label: "Vet & insurance", monthly: 80 },
    { label: "Supplies", monthly: 40 },
  ],
  occasions: [
    { label: "Gifts", monthly: 90 },
    { label: "Celebrations", monthly: 40 },
    { label: "Cards & wrapping", monthly: 20 },
  ],
  charity: [
    { label: "Regular donations", monthly: 80 },
    { label: "One-off causes", monthly: 40 },
  ],
  family: [
    { label: "Support to family", monthly: 200 },
    { label: "Education help", monthly: 60 },
    { label: "Gifts", monthly: 40 },
  ],
};

let customRowSeq = 0;
let addedCatSeq = 0;

const fmt = (n: number) => n.toLocaleString("en-US");

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/**
 * Spending details page (frames 979-33502 + states). New content styled like
 * Smart Assets, bound to the shared details.spending: a method chooser, a live
 * spend summary and per-category monthly/yearly inputs.
 */
interface AddedCategory {
  key: string;
  /** Extra-catalog id (used for break-it-down defaults), or "" for custom. */
  catId: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tab: SpendTab;
  monthly: number;
  custom?: boolean;
}

export function SpendingDetailsScreen() {
  const { answers, setDetails } = useFlow();
  const spending = answers.details.spending;
  const [added, setAdded] = useState<AddedCategory[]>([]);

  const set = (patch: Partial<DetailsSpending>) =>
    setDetails({ spending: { ...spending, ...patch } });

  const setCategory = (id: string, monthly: number) =>
    set({ categories: { ...spending.categories, [id]: monthly } });

  const tab = spending.tab;
  const list = CATEGORIES[tab];
  const addedForTab = added.filter((a) => a.tab === tab);

  // The headline spend is the live total of every category on the page (both
  // tabs) plus any added extras/custom costs, so it always reflects the numbers
  // shown below.
  const baseTotal = Object.values(spending.categories).reduce(
    (t, n) => t + (n || 0),
    0,
  );
  const addedTotal = added.reduce((t, a) => t + a.monthly, 0);
  const totalMonthly = baseTotal + addedTotal;
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
        key: `added-${addedCatSeq++}`,
        catId: "",
        title: "",
        description: "Add your own spending category.",
        icon: Sparkles,
        tab,
        monthly: 0,
        custom: true,
      },
    ]);

  const removeAdded = (key: string) =>
    setAdded((prev) => prev.filter((a) => a.key !== key));

  const setAddedMonthly = (key: string, monthly: number) =>
    setAdded((prev) =>
      prev.map((a) => (a.key === key ? { ...a, monthly } : a)),
    );

  const setAddedTitle = (key: string, title: string) =>
    setAdded((prev) => prev.map((a) => (a.key === key ? { ...a, title } : a)));

  return (
    <DetailsShell>
      <motion.div {...enter(0)} className="mt-3 max-w-[680px]">
        <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black sm:text-[30px]">
          Spending details
        </h1>
        <p className="mt-1.5 text-sm leading-snug text-black/70">
          Decide how much you want to spend once you retire.
          <br />
          Choose one of the options below to define this amount.
        </p>
      </motion.div>

      {/* Method chooser */}
      <motion.div
        {...enter(0.06)}
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {METHODS.map((m) => {
          const Icon = m.icon;
          const selected = spending.method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              disabled={m.disabled}
              aria-pressed={selected}
              onClick={() => {
                if (!m.disabled) set({ method: m.id });
              }}
              className={cn(
                "group relative flex h-full flex-col items-start gap-2.5 rounded-card border px-4 py-4 text-left transition-colors",
                m.disabled
                  ? "cursor-not-allowed border-divider bg-ghost-white"
                  : selected
                    ? "border-violet bg-white ring-1 ring-violet/40"
                    : "border-stroke-subtle bg-white hover:border-violet/50 hover:bg-violet/5",
              )}
            >
              {selected ? (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-violet text-white">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              ) : null}
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border",
                  m.disabled
                    ? "border-divider bg-ghost-white text-gray-2"
                    : "border-stroke-subtle bg-white text-deep-black",
                )}
              >
                <Icon className="size-5" strokeWidth={1.9} />
              </span>
              <span
                className={cn(
                  "text-base font-semibold",
                  m.disabled ? "text-gray-2" : "text-deep-black",
                )}
              >
                {m.title}
              </span>
              <span
                className={cn(
                  "text-sm leading-snug",
                  m.disabled ? "text-gray-2/80" : "text-gray-1",
                )}
              >
                {m.description}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Spend summary */}
      <motion.div
        {...enter(0.12)}
        className="mt-4 rounded-card border border-stroke-subtle bg-white px-6 py-5"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium text-deep-black">
            I want to be able to spend
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            <span className="size-1.5 rounded-full bg-success" />
            Your assets &amp; income can support about $3,250–$4,250 a month
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[40px] font-semibold leading-none tracking-[-0.02em] text-deep-black">
            ${fmt(totalMonthly)}
          </span>
          <span className="text-base text-gray-2">
            per month · (${fmt(totalMonthly * 12)} per year)
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-base text-deep-black">
          <span>With a</span>
          <div className="relative inline-flex">
            <select
              value={spending.safetyBuffer}
              onChange={(e) => set({ safetyBuffer: e.target.value })}
              className="appearance-none rounded-field border border-stroke-subtle bg-white py-1.5 pl-3 pr-8 text-sm font-semibold text-deep-black outline-none transition-colors focus:border-violet/50"
              aria-label="Safety buffer"
            >
              {SAFETY_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-2" />
          </div>
          <span>safety buffer kept aside on top.</span>
        </div>
      </motion.div>

      {/* Category tabs */}
      <motion.div {...enter(0.18)} className="mt-6 flex items-center gap-2">
        {(["essentials", "lifestyle"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => set({ tab: t })}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-deep-black text-white"
                  : "bg-white text-deep-black hover:bg-ghost-white",
              )}
            >
              {t === "essentials" ? "Everyday essentials" : "Lifestyle"}
            </button>
          );
        })}
      </motion.div>

      {/* Section heading + add-a-cost */}
      <motion.div
        {...enter(0.22)}
        className="mt-5 flex items-center justify-between gap-3"
      >
        <h3 className="text-lg font-semibold tracking-[-0.01em] text-deep-black">
          {TAB_HEADINGS[tab]}
        </h3>
        <button
          type="button"
          onClick={addCustom}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-stroke-subtle bg-white px-3.5 py-1.5 text-sm font-semibold text-deep-black transition-colors hover:border-violet/50 hover:text-violet"
        >
          Add a cost
          <Plus className="size-4" strokeWidth={2.4} />
        </button>
      </motion.div>

      {/* Category rows */}
      <motion.div {...enter(0.24)} className="mt-3 flex flex-col gap-3">
        {list.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            monthly={spending.categories[cat.id] ?? 0}
            onChange={(monthly) => setCategory(cat.id, monthly)}
          />
        ))}
        <AnimatePresence initial={false}>
          {addedForTab.map((a) => (
            <motion.div
              key={a.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <CategoryRow
                category={{
                  id: a.catId || a.key,
                  title: a.title,
                  description: a.description,
                  icon: a.icon,
                }}
                monthly={a.monthly}
                onChange={(monthly) => setAddedMonthly(a.key, monthly)}
                onRemove={() => removeAdded(a.key)}
                editableTitle={a.custom}
                onTitleChange={(title) => setAddedTitle(a.key, title)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Suggestion chips: add more categories to this tab. */}
      {availableExtras.length > 0 ? (
        <motion.div
          {...enter(0.3)}
          className="mt-3 flex flex-wrap items-center gap-2 pb-6"
        >
          {availableExtras.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => addExtra(e)}
              className="inline-flex items-center gap-1.5 rounded-full border border-stroke-subtle bg-white px-3.5 py-2 text-sm font-medium text-deep-black transition-colors hover:border-violet/50 hover:text-violet"
            >
              <Plus className="size-3.5 shrink-0" strokeWidth={2.4} />
              {e.title}
            </button>
          ))}
        </motion.div>
      ) : (
        <div className="pb-6" />
      )}
    </DetailsShell>
  );
}

interface BreakdownItem {
  id: string;
  label: string;
  monthly: number;
  custom?: boolean;
}

const sumItems = (list: BreakdownItem[]) =>
  list.reduce((total, item) => total + item.monthly, 0);

function CategoryRow({
  category,
  monthly,
  onChange,
  onRemove,
  editableTitle = false,
  onTitleChange,
}: {
  category: SpendCategory;
  monthly: number;
  onChange: (monthly: number) => void;
  /** When provided, the row shows a Remove control (used for added extras). */
  onRemove?: () => void;
  /** Renders the title as an editable input (used for custom "Add a cost"). */
  editableTitle?: boolean;
  onTitleChange?: (title: string) => void;
}) {
  const Icon = category.icon;
  const [unit, setUnit] = useState<"month" | "year">("month");
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<BreakdownItem[]>(() =>
    (BREAKDOWNS[category.id] ?? [{ label: "", monthly }]).map((c, i) => ({
      id: `${category.id}-${i}`,
      label: c.label,
      monthly: c.monthly,
    })),
  );

  const toShown = (m: number) => (unit === "month" ? m : m * 12);
  const suffix = unit === "month" ? "/mo" : "/yr";
  const secondary =
    unit === "month"
      ? `($${fmt(monthly * 12)} per year)`
      : `($${fmt(monthly)} per month)`;

  const parseToMonthly = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    const num = digits === "" ? 0 : Number(digits);
    return unit === "month" ? num : Math.round(num / 12);
  };

  const handleSingleInput = (raw: string) => onChange(parseToMonthly(raw));

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

  const addCustomRow = () => {
    setItems([
      ...items,
      { id: `custom-${customRowSeq++}`, label: "", monthly: 0, custom: true },
    ]);
  };

  const removeRow = (id: string) => {
    const next = items.filter((it) => it.id !== id);
    setItems(next);
    onChange(sumItems(next));
  };

  const breakdownTotal = sumItems(items);

  return (
    <div className="rounded-card border border-stroke-subtle bg-white px-5 py-4 shadow-[0_1px_1.5px_rgba(24,24,27,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ghost-white text-deep-black">
            <Icon className="size-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {editableTitle ? (
                <input
                  value={category.title}
                  onChange={(e) => onTitleChange?.(e.target.value)}
                  placeholder="Name this cost"
                  aria-label="Cost name"
                  className="min-w-0 max-w-[220px] border-b border-transparent bg-transparent text-base font-bold tracking-[-0.01em] text-deep-black outline-none transition-colors placeholder:font-semibold placeholder:text-gray-2 focus:border-violet/50"
                />
              ) : (
                <span className="text-base font-bold tracking-[-0.01em] text-deep-black">
                  {category.title}
                </span>
              )}
              <span className="rounded-full bg-ghost-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-2">
                Estimate
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-gray-2">
              {category.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {expanded ? (
            <div className="flex items-center gap-2">
              <span className="text-[22px] font-semibold leading-none tracking-[-0.01em] text-stratosphere">
                ${fmt(toShown(breakdownTotal))}
              </span>
              <UnitToggle unit={unit} onChange={setUnit} />
            </div>
          ) : (
            <div className="flex items-center rounded-[10px] border-[1.5px] border-stroke-subtle bg-white py-1.5 pl-3 pr-1.5">
              <span className="text-base font-semibold text-gray-2">$</span>
              <input
                inputMode="numeric"
                value={fmt(toShown(monthly))}
                onChange={(e) => handleSingleInput(e.target.value)}
                className="w-[68px] bg-transparent text-right text-base font-bold text-deep-black outline-none"
                aria-label={`${category.title} amount`}
              />
              <div className="ml-2">
                <UnitToggle unit={unit} onChange={setUnit} />
              </div>
            </div>
          )}
          {!expanded ? (
            <span className="text-[13px] text-gray-2">{secondary}</span>
          ) : null}
        </div>
      </div>

      {!expanded ? (
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={openBreakdown}
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-stratosphere transition-opacity hover:opacity-70"
          >
            Break it down
            <ChevronDown className="size-4" strokeWidth={2.2} />
          </button>
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="text-[13px] font-bold text-gray-2 transition-colors hover:text-deep-black"
            >
              Remove
            </button>
          ) : null}
        </div>
      ) : null}

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 border-t border-dashed border-stroke-subtle pt-3">
              <ul className="flex flex-col gap-2.5">
                {items.map((it) => {
                  const labelEditable = it.custom || editableTitle;
                  return (
                  <li
                    key={it.id}
                    className="flex items-center justify-between gap-3"
                  >
                    {labelEditable ? (
                      <input
                        value={it.label}
                        onChange={(e) => setItemLabel(it.id, e.target.value)}
                        placeholder="Name this item"
                        aria-label="Breakdown item name"
                        className="min-w-0 flex-1 border-b border-transparent bg-transparent text-sm text-deep-black outline-none transition-colors placeholder:text-gray-2 focus:border-violet/50"
                      />
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-sm text-deep-black">
                        {it.label}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center rounded-[10px] border-[1.5px] border-stroke-subtle bg-white py-1 pl-2.5 pr-2">
                        <span className="text-sm font-semibold text-gray-2">
                          $
                        </span>
                        <input
                          inputMode="numeric"
                          value={fmt(toShown(it.monthly))}
                          onChange={(e) => setItemMonthly(it.id, e.target.value)}
                          className="w-[64px] bg-transparent text-right text-sm font-bold text-deep-black outline-none"
                          aria-label={`${it.label || "Custom item"} amount`}
                        />
                        <span className="ml-1 text-[11px] font-medium text-gray-2">
                          {suffix}
                        </span>
                      </div>
                      {it.custom ? (
                        <button
                          type="button"
                          onClick={() => removeRow(it.id)}
                          aria-label="Remove row"
                          className="flex size-6 items-center justify-center rounded-full text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
                        >
                          <X className="size-4" strokeWidth={2.2} />
                        </button>
                      ) : null}
                    </div>
                  </li>
                  );
                })}
              </ul>

              <div className="mt-3.5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-stratosphere transition-opacity hover:opacity-70"
                  >
                    Use a single total instead
                    <ChevronUp className="size-4" strokeWidth={2.2} />
                  </button>
                  {onRemove ? (
                    <button
                      type="button"
                      onClick={onRemove}
                      className="text-[13px] font-bold text-gray-2 transition-colors hover:text-deep-black"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={addCustomRow}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stroke-subtle bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.04em] text-gray-1 transition-colors hover:border-violet/50 hover:text-violet"
                >
                  <Plus className="size-3.5" strokeWidth={2.5} />
                  Add custom row
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Per-month / per-year segmented toggle used across the spending rows. */
function UnitToggle({
  unit,
  onChange,
}: {
  unit: "month" | "year";
  onChange: (u: "month" | "year") => void;
}) {
  return (
    <div className="flex items-center gap-px">
      {(["month", "year"] as const).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-[0.03em] transition-colors",
            unit === u
              ? "bg-deep-black text-white"
              : "text-gray-2 hover:bg-ghost-white",
          )}
        >
          {u === "month" ? "Per Month" : "Per Year"}
        </button>
      ))}
    </div>
  );
}
