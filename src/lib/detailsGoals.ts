import {
  Coins,
  Gift,
  Home,
  Infinity as InfinityIcon,
  Plane,
  ShieldCheck,
  ShieldHalf,
  TrendingUp,
  Umbrella,
  type LucideIcon,
} from "lucide-react";

/** The three importance buckets, low to high. */
export type DetailsBucket = "low" | "medium" | "high";

export interface DetailsBucketMeta {
  id: DetailsBucket;
  /** The button label shown to the user. */
  label: string;
  /** Accent color used for tiles, dots and tinted button backgrounds. */
  color: string;
}

/**
 * Ordered low → high. The order doubles as the left → right layout on the
 * timeline. Per the Details-flow decision: brighter purple reads as more
 * important, grey reads as not important.
 */
export const DETAILS_BUCKETS: DetailsBucketMeta[] = [
  { id: "low", label: "Not important", color: "#9aa2ad" },
  { id: "medium", label: "Important", color: "#9145c4" },
  { id: "high", label: "Very important", color: "#7f35b2" },
];

const BUCKET_BY_ID: Record<DetailsBucket, DetailsBucketMeta> =
  DETAILS_BUCKETS.reduce(
    (acc, b) => {
      acc[b.id] = b;
      return acc;
    },
    {} as Record<DetailsBucket, DetailsBucketMeta>,
  );

export function detailsBucketMeta(bucket: DetailsBucket): DetailsBucketMeta {
  return BUCKET_BY_ID[bucket];
}

export interface DetailsGoalCard {
  id: string;
  title: string;
  /** A short, single-sentence description shown under the title. */
  description: string;
  icon: LucideIcon;
}

/**
 * The nine action-worded retirement goals the user ranks onto the timeline.
 * These are Details-flow-only and intentionally distinct from the standalone
 * Card Sort data in cardSort.ts.
 */
export const DETAILS_GOAL_CARDS: DetailsGoalCard[] = [
  {
    id: "late-surprises",
    title: "Cover late-retirement surprises",
    description: "Keep a cushion for big costs towards the end of retirement.",
    icon: Umbrella,
  },
  {
    id: "legacy",
    title: "Leave a meaningful legacy",
    description: "Pass on an inheritance or give to causes you care about.",
    icon: Gift,
  },
  {
    id: "protect-lifestyle",
    title: "Protect my current lifestyle",
    description: "Keep living the way I do throughout retirement.",
    icon: Home,
  },
  {
    id: "last-for-life",
    title: "Make my money last for life",
    description: "Ensure my savings never run out while I'm alive.",
    icon: InfinityIcon,
  },
  {
    id: "grow-wealth",
    title: "Grow my wealth",
    description: "Keep building my assets over time.",
    icon: TrendingUp,
  },
  {
    id: "outpace-inflation",
    title: "Outpace inflation",
    description: "Stay ahead of rising costs year after year.",
    icon: Coins,
  },
  {
    id: "shield-savings",
    title: "Shield my savings from market swings",
    description: "Protect my nest egg from market ups and downs.",
    icon: ShieldCheck,
  },
  {
    id: "steady-spending",
    title: "Keep my spending steady in downturns",
    description: "Hold my lifestyle steady even when markets dip.",
    icon: ShieldHalf,
  },
  {
    id: "spend-healthy",
    title: "Spend more while I'm healthy",
    description: "Enjoy my money during my active, healthy years.",
    icon: Plane,
  },
];

export const DETAILS_GOAL_BY_ID: Record<string, DetailsGoalCard> =
  DETAILS_GOAL_CARDS.reduce(
    (acc, c) => {
      acc[c.id] = c;
      return acc;
    },
    {} as Record<string, DetailsGoalCard>,
  );

/**
 * The importance bucket for a card at a given position along the low → high
 * timeline. Cards split into thirds: leftmost third low, middle medium, right
 * high; any remainder goes to the middle.
 */
export function detailsBucketForIndex(
  index: number,
  total: number,
): DetailsBucket {
  const lowCount = Math.floor(total / 3);
  const highCount = Math.floor(total / 3);
  const medCount = total - lowCount - highCount;
  if (index < lowCount) return "low";
  if (index < lowCount + medCount) return "medium";
  return "high";
}
