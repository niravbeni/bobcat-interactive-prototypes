import {
  Banknote,
  Infinity as InfinityIcon,
  PiggyBank,
  HeartPulse,
  Plane,
  Gift,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type PriorityCategory = "need" | "want";

export interface Priority {
  id: string;
  title: string;
  /** Framed as a question for the swipe deck. */
  question: string;
  category: PriorityCategory;
  icon: LucideIcon;
}

/**
 * Retirement priorities used by the swipe-to-prioritize variation. Ported from
 * the Bobcat research prototype so the interaction stays faithful, themed to the
 * WTW palette.
 */
export const RETIREMENT_PRIORITIES: Priority[] = [
  {
    id: "income",
    title: "Reliable monthly income",
    question: "Should your plan guarantee steady monthly income?",
    category: "need",
    icon: Banknote,
  },
  {
    id: "longevity",
    title: "Money that lasts my whole life",
    question: "Should your plan make sure the money never runs out?",
    category: "need",
    icon: InfinityIcon,
  },
  {
    id: "liquidity",
    title: "Access to savings for emergencies",
    question: "Should your plan keep savings easy to access?",
    category: "need",
    icon: PiggyBank,
  },
  {
    id: "healthcare",
    title: "Cover healthcare & long-term care",
    question: "Should your plan cover big healthcare costs?",
    category: "need",
    icon: HeartPulse,
  },
  {
    id: "enjoy",
    title: "Enjoy retirement more now",
    question: "Should your plan let you spend more in early retirement?",
    category: "want",
    icon: Plane,
  },
  {
    id: "legacy",
    title: "Leave money behind for loved ones",
    question: "Should your plan leave money behind for loved ones?",
    category: "want",
    icon: Gift,
  },
  {
    id: "spouse",
    title: "Protect my spouse or family",
    question: "Should your plan protect your spouse or family?",
    category: "want",
    icon: ShieldCheck,
  },
  {
    id: "inflation",
    title: "Keep up with inflation",
    question: "Should your plan keep pace with rising prices?",
    category: "want",
    icon: TrendingUp,
  },
];
