/**
 * Plain-language descriptions surfaced in the Details Flow v2 hover-help box.
 * Keyed so any hoverable element (a section header, an editable value, a
 * highlighted term, a control) can point at a shared, editable definition.
 */
import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  Landmark,
  ListChecks,
  PiggyBank,
  Receipt,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  User,
  Wallet,
} from "lucide-react";

export interface DetailsInfoTip {
  title: string;
  body: string;
  /** Icon shown in the help box header while this tip is active. */
  icon?: LucideIcon;
  /** When true, the box nudges the user to discuss this with their advisor. */
  advisor?: boolean;
}

export type DetailsInfoTipId =
  | "about-you"
  | "assets"
  | "income"
  | "spending"
  | "goals"
  | "spending-aim"
  | "safety-buffer"
  | "progress"
  | "tax-treatment"
  | "break-it-down"
  | "spend-estimate"
  | "method-chooser"
  | "goal-importance";

export const DETAILS_INFO_TIPS: Record<DetailsInfoTipId, DetailsInfoTip> = {
  "about-you": {
    title: "About you",
    body: "Basic personal details — name, date of birth, location and household — that let us tailor your plan to your situation.",
    icon: User,
  },
  assets: {
    title: "Your assets",
    body: "Everything you own that will fund retirement: savings, investments and retirement accounts. We use these as the starting point for your plan.",
    icon: PiggyBank,
  },
  income: {
    title: "Your income",
    body: "Employer and benefit income we sync automatically. It's read-only here because it comes straight from your linked sources.",
    icon: Landmark,
  },
  spending: {
    title: "Your spending",
    body: "What you expect to spend each month in retirement. This drives how long your savings need to last.",
    icon: Wallet,
  },
  goals: {
    title: "Your goals",
    body: "What matters most to you in retirement. Ranking them tunes how your plan balances growth, protection and spending.",
    icon: Target,
  },
  "spending-aim": {
    title: "Spending aim",
    body: "How much you plan to spend each month in retirement. Higher spending means your savings need to work harder.",
    icon: Wallet,
  },
  "safety-buffer": {
    title: "Safety buffer",
    body: "Money kept aside for surprises, so one unexpected year doesn't derail the rest of your plan.",
    icon: ShieldCheck,
  },
  progress: {
    title: "Required details",
    body: "How much of the mandatory information you've added so far. Your plan updates automatically as this fills in.",
    icon: ListChecks,
  },
  "tax-treatment": {
    title: "Tax treatment",
    body: "How an account is taxed — pre-tax, Roth or taxable. It affects how and when you can withdraw the money.",
    icon: Receipt,
    advisor: true,
  },
  "break-it-down": {
    title: "Break it down",
    body: "Split an estimate into its parts for a more accurate number. The components add back up to your category total.",
    icon: SlidersHorizontal,
  },
  "spend-estimate": {
    title: "Monthly spending estimate",
    body: "Your total expected monthly spend, summed from every category on this page. Edit any category and this updates.",
    icon: Calculator,
  },
  "method-chooser": {
    title: "How you set spending",
    body: "Choose how to estimate your spending. Building it up from categories is the most accurate; the other options are coming soon.",
    icon: SlidersHorizontal,
  },
  "goal-importance": {
    title: "Goal importance",
    body: "How much a goal matters to you. More important goals are ranked higher and weigh more heavily in your plan.",
    icon: Target,
  },
};
