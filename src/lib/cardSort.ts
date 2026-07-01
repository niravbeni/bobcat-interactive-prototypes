import {
  Activity,
  AlertTriangle,
  Flame,
  Gift,
  HeartPulse,
  LineChart,
  PiggyBank,
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
 * The retirement concerns and priorities the user ranks onto the timeline.
 * Titles are shortened from the source list for a card-sized read, with a plain
 * one-line description under each.
 */
export const CARDS: PriorityCard[] = [
  {
    id: "late-expenses",
    title: "Unexpected costs later in retirement",
    description: "Cover big surprises towards the end of retirement.",
    icon: HeartPulse,
  },
  {
    id: "legacy",
    title: "Leave a meaningful legacy",
    description: "Pass on an inheritance or give to causes you care about.",
    icon: Gift,
  },
  {
    id: "secure-spending",
    title: "Secure my current spending",
    description: "Keep up my lifestyle throughout retirement.",
    icon: ShieldCheck,
  },
  {
    id: "not-run-out",
    title: "Not running out of money",
    description: "Make my savings last for the rest of my life.",
    icon: PiggyBank,
  },
  {
    id: "grow-assets",
    title: "Grow my assets",
    description: "Keep building my wealth over time.",
    icon: TrendingUp,
  },
  {
    id: "inflation",
    title: "Keeping up with inflation",
    description: "Protect my money from rising costs.",
    icon: Flame,
  },
  {
    id: "market-savings",
    title: "Market swings hitting my savings",
    description: "Shield my nest egg from market ups and downs.",
    icon: LineChart,
  },
  {
    id: "market-spending",
    title: "Market swings affecting my spending",
    description: "Keep my spending steady despite market changes.",
    icon: Activity,
  },
  {
    id: "early-expenses",
    title: "Unexpected costs early in retirement",
    description: "Handle big surprises in the first years of retirement.",
    icon: AlertTriangle,
  },
  {
    id: "spend-healthy",
    title: "Spend more while I'm healthy",
    description: "Enjoy my money during my active, healthy years.",
    icon: Plane,
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
