import {
  Gift,
  HeartHandshake,
  HeartPulse,
  Plane,
  ShieldCheck,
  ShieldHalf,
  Umbrella,
  type LucideIcon,
} from "lucide-react";

/**
 * The signature-flow "Goal Blueprint" card sort gradient — verbatim from the
 * Figma Key Card fill (185°, #742CA5 5% → #FBE0C1 195%), matching the standalone
 * Card Sort (High Fidelity) deck so both card sorts read identically.
 */
export const CARD_GRADIENT = "linear-gradient(185deg, #742ca5 5%, #fbe0c1 195%)";

export interface SignatureGoal {
  id: string;
  /** Full card copy (essential content), verbatim from the Figma Key Cards. */
  title: string;
  /** Condensed label for the sidebar "Goal order" ranked list. */
  shortLabel: string;
  icon: LucideIcon;
}

/**
 * The seven retirement goals the user drags onto the least→most-important axis.
 * Order here is the initial deck order (top card first). Copy is the real
 * essential content from the Figma frames; the "Explain this" body is
 * non-essential and rendered as shimmer.
 */
export const SIGNATURE_GOALS: SignatureGoal[] = [
  {
    id: "inflation",
    title: "Protecting my income from inflation.",
    shortLabel: "Inflation protection",
    icon: ShieldCheck,
  },
  {
    id: "spending-stability",
    title: "Keeping my spending steady in a downturn.",
    shortLabel: "Spending stability",
    icon: ShieldHalf,
  },
  {
    id: "health-costs",
    title: "Covering a major health or long-term care cost.",
    shortLabel: "Health/care costs",
    icon: HeartPulse,
  },
  {
    id: "unplanned",
    title: "Covering other big, unplanned expenses.",
    shortLabel: "Unplanned expenses",
    icon: Umbrella,
  },
  {
    id: "spend-healthy",
    title: "Spending more while I'm healthy.",
    shortLabel: "Spend while healthy",
    icon: Plane,
  },
  {
    id: "help-family",
    title: "Helping family financially now, while I'm here to see it.",
    shortLabel: "Helping family",
    icon: HeartHandshake,
  },
  {
    id: "inheritance",
    title: "Leaving an inheritance behind after I'm gone.",
    shortLabel: "Leave an inheritance",
    icon: Gift,
  },
];

export const SIGNATURE_GOAL_BY_ID: Record<string, SignatureGoal> =
  SIGNATURE_GOALS.reduce(
    (acc, g) => {
      acc[g.id] = g;
      return acc;
    },
    {} as Record<string, SignatureGoal>,
  );

export const SIGNATURE_GOAL_COUNT = SIGNATURE_GOALS.length;
