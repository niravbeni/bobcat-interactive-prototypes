import {
  CreditCard,
  GraduationCap,
  Gift,
  Home,
  Plane,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/** The three importance buckets, low to high. */
export type PriorityBucket = "low" | "medium" | "high";

export interface BucketMeta {
  id: PriorityBucket;
  /** The button label shown to the user. */
  label: string;
  /** Accent color used for tiles, dots and tinted button backgrounds. */
  color: string;
}

/**
 * Ordered low to high. The order doubles as the left to right layout on the
 * timeline: "Not as important" sits on the low-priority (left) side and
 * "Very important" on the high-priority (right) side.
 */
export const BUCKETS: BucketMeta[] = [
  { id: "low", label: "Not as important", color: "#b59bd4" },
  { id: "medium", label: "Important", color: "#9145c4" },
  { id: "high", label: "Very important", color: "#7f35b2" },
];

const BUCKET_BY_ID: Record<PriorityBucket, BucketMeta> = BUCKETS.reduce(
  (acc, b) => {
    acc[b.id] = b;
    return acc;
  },
  {} as Record<PriorityBucket, BucketMeta>,
);

export function bucketMeta(bucket: PriorityBucket): BucketMeta {
  return BUCKET_BY_ID[bucket];
}

export interface PriorityCard {
  id: string;
  title: string;
  /** A short, single-sentence description shown under the title. */
  description: string;
  icon: LucideIcon;
}

/**
 * The financial priorities the user places onto the timeline. Reused in spirit
 * from the earlier swipe/rank flow, reframed as plain goals (no em-dashes).
 */
export const CARDS: PriorityCard[] = [
  {
    id: "debt",
    title: "Pay off debt",
    description: "Clear credit cards, loans and lingering balances.",
    icon: CreditCard,
  },
  {
    id: "emergency",
    title: "Build an emergency fund",
    description: "Set aside a cushion for the unexpected.",
    icon: ShieldCheck,
  },
  {
    id: "retirement",
    title: "Save for retirement",
    description: "Grow a nest egg for life after work.",
    icon: TrendingUp,
  },
  {
    id: "home",
    title: "Buy a home",
    description: "Save toward a down payment and a place of your own.",
    icon: Home,
  },
  {
    id: "travel",
    title: "Travel more",
    description: "Budget for trips and time away.",
    icon: Plane,
  },
  {
    id: "education",
    title: "Fund kids' education",
    description: "Help cover tuition and school costs.",
    icon: GraduationCap,
  },
  {
    id: "inheritance",
    title: "Leave an inheritance",
    description: "Pass something on to the people you love.",
    icon: Gift,
  },
];

/**
 * The importance bucket for a card at a given position along the low to high
 * timeline. The placed cards are split into thirds: the leftmost third is low,
 * the middle third is medium and the rightmost third is high. Any remainder
 * goes to the middle, so 6 cards split 2/2/2, 7 split 2/3/2 and 8 split 2/4/2.
 */
export function bucketForIndex(index: number, total: number): PriorityBucket {
  const lowCount = Math.floor(total / 3);
  const highCount = Math.floor(total / 3);
  const medCount = total - lowCount - highCount;
  if (index < lowCount) return "low";
  if (index < lowCount + medCount) return "medium";
  return "high";
}
