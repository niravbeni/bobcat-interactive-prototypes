import {
  Car,
  CreditCard,
  Gift,
  GraduationCap,
  Hammer,
  HeartHandshake,
  HeartPulse,
  Home,
  Landmark,
  Palette,
  PawPrint,
  Plane,
  ShoppingCart,
  Sparkles,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/**
 * Static catalog + defaults for the Signature "Expense Engine" section. Adapted
 * from the details-flow SpendingDetailsScreen constants, but self-contained so
 * the signature screen keeps its own LOCAL state (no shared answers binding).
 */

export type SpendTab = "essentials" | "lifestyle";
export type TrendId = "down" | "flat" | "up";

export interface SpendCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/** The three method-chooser options on the entry screen (Figma 2026:13943). */
export type SpendMethod = "build" | "total" | "estimate";

export interface MethodOption {
  id: SpendMethod;
  title: string;
  description: string;
  /** Figma-exported material icon (rendered from its committed asset). */
  iconSrc: string;
  /** Natural pixel size of the icon glyph (from the Figma frame). */
  iconClass: string;
  recommended?: boolean;
}

export const METHODS: MethodOption[] = [
  {
    id: "build",
    title: "Build it with me",
    description: "Add up your everyday and lifestyle spending",
    iconSrc: "/signature/sig-method-build.svg",
    iconClass: "size-[26px]",
    recommended: true,
  },
  {
    id: "total",
    title: "Enter a total",
    description: "Use an amount you already have in mind",
    iconSrc: "/signature/sig-method-total.svg",
    iconClass: "h-[23px] w-[30px]",
  },
  {
    id: "estimate",
    title: "Use a quick estimate",
    description: "Start with an estimate and refine it later",
    iconSrc: "/signature/sig-method-estimate.svg",
    iconClass: "h-[25px] w-[28px]",
  },
];

/** Header shown above each tab's category list. */
export const TAB_HEADINGS: Record<SpendTab, string> = {
  essentials: "The essentials you rely on",
  lifestyle: "The extras that make it yours",
};

export const CATEGORIES: Record<SpendTab, SpendCategory[]> = {
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
  ],
};

export interface ExtraCategory extends SpendCategory {
  tab: SpendTab;
  defaultMonthly: number;
}

/** Suggestion-chip categories the user can drop into either tab. */
export const EXTRA_CATEGORIES: ExtraCategory[] = [
  {
    tab: "essentials",
    id: "health",
    title: "Health",
    description: "Premiums, deductibles and out-of-pocket costs.",
    icon: HeartPulse,
    defaultMonthly: 1000,
  },
  {
    tab: "essentials",
    id: "personal",
    title: "Personal & subscriptions",
    description: "Haircuts, gym, memberships and subscriptions.",
    icon: CreditCard,
    defaultMonthly: 600,
  },
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
    id: "gifts",
    title: "Gifts & giving",
    description: "Presents, celebrations and donations.",
    icon: Gift,
    defaultMonthly: 400,
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

/** Fallback icon for user-created "Add a cost" categories. */
export const CUSTOM_CATEGORY_ICON: LucideIcon = Sparkles;

/**
 * Default "Break it down" sub-items per category. Each set sums to the
 * quick-estimate monthly for that category so opening the breakdown never
 * jumps the headline number.
 */
export const BREAKDOWNS: Record<string, { label: string; monthly: number }[]> = {
  // First row is rendered as the Rent/Mortgage tenure selector (Figma
  // 2202:5742); values sum to the seeded home total (3800).
  home: [
    { label: "Rent or mortgage", monthly: 2000 },
    { label: "Utilities", monthly: 300 },
    { label: "Insurance", monthly: 500 },
    { label: "Upkeep & repairs", monthly: 1000 },
  ],
  transport: [
    { label: "Car payment", monthly: 300 },
    { label: "Fuel & charging", monthly: 180 },
    { label: "Insurance, tax & registration", monthly: 120 },
    { label: "Servicing & repairs", monthly: 60 },
    { label: "Public transport", monthly: 40 },
  ],
  food: [
    { label: "Groceries", monthly: 1050 },
    { label: "Household items", monthly: 250 },
    { label: "Clothing", monthly: 200 },
  ],
  travel: [
    { label: "Flights", monthly: 900 },
    { label: "Accommodation", monthly: 800 },
    { label: "Activities & excursions", monthly: 500 },
  ],
  hobbies: [
    { label: "Classes & memberships", monthly: 350 },
    { label: "Equipment & gear", monthly: 300 },
    { label: "Supplies", monthly: 150 },
  ],
  dining: [
    { label: "Restaurants", monthly: 550 },
    { label: "Bars & nights out", monthly: 300 },
    { label: "Coffee & takeout", monthly: 150 },
  ],
  health: [
    { label: "Insurance premiums", monthly: 650 },
    { label: "Prescriptions", monthly: 200 },
    { label: "Out-of-pocket costs", monthly: 150 },
  ],
  personal: [
    { label: "Subscriptions", monthly: 200 },
    { label: "Gym & memberships", monthly: 250 },
    { label: "Haircuts & grooming", monthly: 150 },
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
  gifts: [
    { label: "Gifts", monthly: 200 },
    { label: "Celebrations", monthly: 130 },
    { label: "Donations", monthly: 70 },
  ],
  pets: [
    { label: "Food", monthly: 80 },
    { label: "Vet & insurance", monthly: 80 },
    { label: "Supplies", monthly: 40 },
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

/** Quick-estimate seed amounts (per month) for the base categories. */
export const ESTIMATE_DEFAULTS: Record<string, number> = {
  home: 3800,
  transport: 700,
  food: 1500,
  travel: 2200,
  hobbies: 800,
  dining: 1000,
};

/** Default single number seeded when the user picks "Enter a total". */
export const ENTERED_TOTAL_DEFAULT = 8000;

/** A supportive, fixed range shown as the green pill on the target card. */
export const SUPPORT_RANGE_LABEL =
  "Your assets & income can support about $9,000–$13,000 a month";

/* ---------------------------------------------------------------- */
/* Safety buffer                                                     */
/* ---------------------------------------------------------------- */

export interface SafetyOption {
  id: string;
  /** Label shown in the target-card select. */
  label: string;
  /** Compact label shown in the sidebar sub-content. */
  short: string;
}

export const SAFETY_OPTIONS: SafetyOption[] = [
  { id: "low", label: "Low ($15,000)", short: "$15,000 (Low)" },
  { id: "medium", label: "Medium ($30,000)", short: "$30,000 (Medium)" },
  { id: "high", label: "High ($60,000)", short: "$60,000 (High)" },
  {
    id: "sixMonth",
    label: "6-month buffer of $36,000",
    short: "6-month buffer of $36,000",
  },
];

/** Reset target for the hidden demo-clear shortcut. */
export const DEFAULT_SAFETY_ID = "medium";

/** Value the Expense screen renders pre-filled on load (Figma 2165:29651). */
export const INITIAL_SAFETY_ID = "sixMonth";

/* ---------------------------------------------------------------- */
/* Spend-trend modal (Figma 2046:26006)                              */
/* ---------------------------------------------------------------- */

export interface TrendOption {
  id: TrendId;
  title: string;
  iconSrc: string;
  iconClass: string;
  recommended?: boolean;
}

export const TREND_OPTIONS: TrendOption[] = [
  {
    id: "down",
    title: "Decrease as I age",
    iconSrc: "/signature/sig-trend-down.svg",
    iconClass: "h-[18px] w-[31px]",
    recommended: true,
  },
  {
    id: "flat",
    title: "Keep steady as I age",
    iconSrc: "/signature/sig-trend-flat.svg",
    iconClass: "h-[13px] w-[29px]",
  },
  {
    id: "up",
    title: "Increase quickly as I age",
    iconSrc: "/signature/sig-trend-up.svg",
    iconClass: "h-[18px] w-[31px]",
  },
];

/** Row-level summary of the chosen trend (the chip that opens the modal). */
export const TREND_ROW_LABEL: Record<TrendId, string> = {
  down: "Tends to decrease slowly as you age",
  flat: "Tends to stay steady as you age",
  up: "Tends to increase as you age",
};

export const DEFAULT_TREND: TrendId = "down";

/* ---------------------------------------------------------------- */
/* Additional spending (future costs)                                */
/* ---------------------------------------------------------------- */

export type TimingKind = "ends" | "starts" | "oneoff";

export const TIMING_KIND_LABEL: Record<TimingKind, string> = {
  ends: "that ends in",
  starts: "that starts in",
  oneoff: "in",
};

export const WHEN_OPTIONS = [
  "1 year",
  "2 years",
  "4 years",
  "5 years",
  "10 years",
  "15 years",
];

export const FUTURE_COST_PRESETS = [
  "Personal loan",
  "Assisted living",
  "One-off expense",
  "Retail item financing",
  "Home renovation",
  "Vehicle purchase",
  "Wedding",
  "Custom cost",
];

export interface FutureCost {
  id: string;
  name: string;
  monthly: number;
  timing: TimingKind;
  when: string;
}

/** The pre-filled "Additional Spending" rows on load (Figma 2165:29651). */
export const SEED_FUTURE_COSTS: FutureCost[] = [
  {
    id: "future-seed-1",
    name: "Personal loan",
    monthly: 800,
    timing: "ends",
    when: "4 years",
  },
  {
    id: "future-seed-2",
    name: "Assisted living",
    monthly: 4000,
    timing: "starts",
    when: "10 years",
  },
  {
    id: "future-seed-3",
    name: "One-off expense",
    monthly: 2000,
    timing: "oneoff",
    when: "2 years",
  },
  {
    id: "future-seed-4",
    name: "Retail item financing",
    monthly: 100,
    timing: "ends",
    when: "2 years",
  },
];
