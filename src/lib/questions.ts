import type { GoalCard, QAnswer } from "./types";

export type RevealKind = "money" | "detail" | "placeholder";

export interface QOption {
  id: string;
  label: string;
  /** What to reveal beneath the options when this option is selected. */
  reveal?: RevealKind;
  /** Mandarin badge shown inside a revealed money field. */
  badge?: string;
  /** Helper text shown under a revealed money field. */
  helper?: string;
}

export interface QuestionDef {
  id: string;
  /** First (neutral) part of the heading. */
  lead: string;
  /** Optional trailing part of the heading, rendered in the violet accent. */
  highlight?: string;
  subtitle?: string;
  options: QOption[];
  /** Show a money field above the options (e.g. a pre-filled estimate). */
  prefill?: { value: string; badge?: string };
  /** Default value used when a money field is first revealed. */
  moneyDefault?: string;
  /** Label for the summary chip this question feeds. */
  chipLabel: string;
  /** Render the stored answer as a short chip value. */
  chipValue: (a: QAnswer | undefined) => string;
}

const money = (v?: string) => (v && v.trim() ? `$${v}` : "$0");

/**
 * Question ids that count as "mandatory" data for the V2 chat. Once all of
 * these are answered, the plan-updated milestone fires and the remaining
 * questions become optional follow-ups.
 */
export const MANDATORY_QIDS: ReadonlySet<string> = new Set([
  "ssBenefit",
  "pension",
  "claimAge",
  "savings",
]);

export const INCOME_QUESTIONS: QuestionDef[] = [
  {
    id: "ssBenefit",
    lead: "Now we need to find out your",
    highlight: "Social Security Monthly Benefit.",
    subtitle: "Select one of the options below",
    moneyDefault: "4,000.00",
    options: [
      { id: "know", label: "I know it already", reveal: "money", helper: "You can edit this later" },
      { id: "help", label: "Help me work it out", reveal: "placeholder" },
      { id: "estimate", label: "Estimate it for now", reveal: "money", badge: "Estimate" },
    ],
    chipLabel: "Social Security benefit",
    chipValue: (a) => {
      if (a?.choice === "help") return "To work out";
      return a?.choice ? `${money(a.value)}/mo` : "—";
    },
  },
  {
    id: "pension",
    lead: "Do you have a",
    highlight: "defined benefit pension?",
    subtitle: "A pension that pays a set amount each month",
    moneyDefault: "1,200.00",
    options: [
      { id: "yes", label: "Yes, I know the amount", reveal: "money", helper: "Monthly pension amount" },
      { id: "unsure", label: "I have one but I'm not sure how much" },
      { id: "no", label: "No defined benefit pension" },
    ],
    chipLabel: "Defined benefit pension",
    chipValue: (a) => {
      if (a?.choice === "yes") return `${money(a.value)}/mo`;
      if (a?.choice === "unsure") return "Not sure";
      if (a?.choice === "no") return "None";
      return "—";
    },
  },
  {
    id: "claimAge",
    lead: "When do you plan to",
    highlight: "claim Social Security?",
    subtitle: "Pick the age you expect to start taking it",
    options: [
      { id: "62", label: "At 62 — as early as possible" },
      { id: "67", label: "At 67 — full retirement age" },
      { id: "70", label: "At 70 — for the maximum benefit" },
      { id: "unsure", label: "I haven't decided yet" },
    ],
    chipLabel: "Social Security claim age",
    chipValue: (a) => {
      if (!a?.choice) return "—";
      if (a.choice === "unsure") return "Not sure";
      return a.choice;
    },
  },
  {
    id: "otherIncome",
    lead: "Will you have any",
    highlight: "other income in retirement?",
    subtitle: "Think rental income, part-time work or annuities",
    moneyDefault: "800.00",
    options: [
      { id: "yes", label: "Yes, regular extra income", reveal: "money", helper: "Approximate monthly amount" },
      { id: "some", label: "A little, now and then" },
      { id: "no", label: "No other income" },
    ],
    chipLabel: "Other income",
    chipValue: (a) => {
      if (a?.choice === "yes") return `${money(a.value)}/mo`;
      if (a?.choice === "some") return "Occasional";
      if (a?.choice === "no") return "None";
      return "—";
    },
  },
  {
    id: "savings",
    lead: "Roughly how much have you",
    highlight: "saved for retirement so far?",
    subtitle: "Across 401(k)s, IRAs and other retirement accounts",
    moneyDefault: "250,000.00",
    options: [
      { id: "know", label: "I know the total", reveal: "money", helper: "Total saved to date" },
      { id: "estimate", label: "Estimate it for now", reveal: "money", badge: "Estimate" },
      { id: "link", label: "Help me work it out", reveal: "placeholder" },
    ],
    chipLabel: "Retirement savings",
    chipValue: (a) => {
      if (a?.choice === "know" || a?.choice === "estimate") return money(a.value);
      if (a?.choice === "link") return "To work out";
      return "—";
    },
  },
];

export const SPENDING_QUESTIONS: QuestionDef[] = [
  {
    id: "monthlyNeed",
    lead: "How much do you think you'll",
    highlight: "need each month in retirement?",
    subtitle: "Select one of the options below",
    prefill: { value: "4,000.00", badge: "Your previous estimate" },
    options: [
      { id: "correct", label: "This number is correct" },
      { id: "help", label: "Help me figure it out more", reveal: "detail" },
    ],
    chipLabel: "Monthly spending",
    chipValue: (a) => (a?.choice ? "$4,000/mo" : "—"),
  },
  {
    id: "housing",
    lead: "Will your home be",
    highlight: "paid off by retirement?",
    subtitle: "Housing is usually the biggest line item",
    moneyDefault: "1,500.00",
    options: [
      { id: "paid", label: "Yes, fully paid off" },
      { id: "mortgage", label: "No, still paying it off", reveal: "money", helper: "Remaining monthly payment" },
      { id: "rent", label: "I'll be renting", reveal: "money", helper: "Expected monthly rent" },
    ],
    chipLabel: "Housing",
    chipValue: (a) => {
      if (a?.choice === "paid") return "Paid off";
      if (a?.choice === "mortgage") return `$${a.value ?? "0"}/mo`;
      if (a?.choice === "rent") return `Rent $${a.value ?? "0"}`;
      return "—";
    },
  },
  {
    id: "healthcare",
    lead: "How would you describe your expected",
    highlight: "healthcare costs?",
    subtitle: "We'll stress-test your plan against this",
    options: [
      { id: "low", label: "Low — I'm in good health" },
      { id: "average", label: "About average" },
      { id: "high", label: "Higher than average" },
    ],
    chipLabel: "Healthcare costs",
    chipValue: (a) => {
      if (a?.choice === "low") return "Low";
      if (a?.choice === "average") return "Average";
      if (a?.choice === "high") return "Higher";
      return "—";
    },
  },
  {
    id: "travel",
    lead: "How much do you want to set aside for",
    highlight: "travel & leisure?",
    subtitle: "This is the fun part of the plan",
    moneyDefault: "6,000.00",
    options: [
      { id: "modest", label: "Keep it modest" },
      { id: "comfortable", label: "A comfortable amount", reveal: "money", helper: "Per year" },
      { id: "generous", label: "Travel is a top priority", reveal: "money", helper: "Per year" },
    ],
    chipLabel: "Travel & leisure",
    chipValue: (a) => {
      if (a?.choice === "modest") return "Modest";
      if (a?.choice === "comfortable") return `$${a.value ?? "0"}/yr`;
      if (a?.choice === "generous") return `$${a.value ?? "0"}/yr`;
      return "—";
    },
  },
  {
    id: "oneOff",
    lead: "Any big",
    highlight: "one-off expenses you're planning for?",
    subtitle: "A new car, home upgrades, or helping family",
    moneyDefault: "20,000.00",
    options: [
      { id: "yes", label: "Yes, I have something in mind", reveal: "money", helper: "Approximate total" },
      { id: "no", label: "Nothing major planned" },
    ],
    chipLabel: "One-off expenses",
    chipValue: (a) => {
      if (a?.choice === "yes") return `$${a.value ?? "0"}`;
      if (a?.choice === "no") return "None";
      return "—";
    },
  },
];

export const KNOWN_GOAL_KEYWORDS = [
  "travel",
  "family",
  "grandchildren",
  "grandkids",
  "children",
  "health",
  "fitness",
  "hobbies",
  "golf",
  "garden",
  "gardening",
  "volunteering",
  "charity",
  "home",
  "friends",
  "relaxing",
  "relax",
  "adventure",
  "learning",
  "reading",
  "cooking",
  "fishing",
  "music",
  "community",
  "freedom",
  "independence",
  "security",
];

/** Return the known goal keywords that appear in the given text. */
export function findKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return KNOWN_GOAL_KEYWORDS.filter((k) => lower.includes(k));
}

/** Pick up to two priority keywords from free-text goals input. */
export function derivePriorities(text: string): string[] {
  const found = findKeywords(text);
  const picks = found.slice(0, 2);
  if (picks.length >= 2) return picks;

  // Fall back to the longest distinct words the user actually wrote.
  const words = Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3),
    ),
  ).sort((a, b) => b.length - a.length);

  for (const w of words) {
    if (!picks.includes(w)) picks.push(w);
    if (picks.length >= 2) break;
  }
  while (picks.length < 2) picks.push(picks.length === 0 ? "travel" : "family");
  return picks.slice(0, 2);
}

/**
 * The Bobcat assistant conversation for the Time and Goals step. Each entry is a
 * bot question; the assistant asks them one at a time, acknowledging each answer
 * and building context before summarizing and confirming.
 */
export const GOAL_PROMPTS: string[] = [
  "In your own words, what are your main goals for retirement?",
  "When you picture an ideal week in retirement, what are you doing day to day?",
  "Who do you most want to spend your time with, or be there for?",
  "Is there anything you're worried about, or want to make sure you avoid?",
  "If money were no object, what's one dream you'd love to make happen?",
];

/**
 * Example "answer pearls" aligned to each GOAL_PROMPT. Shown as tappable chips
 * above the composer so users can see what kind of answer fits, or just click
 * one instead of typing.
 */
export const GOAL_SUGGESTIONS: string[][] = [
  ["Travel the world", "Spend time with family", "Retire comfortably", "Stay healthy and active"],
  ["Slow mornings and walks", "Golf and hobbies", "Volunteering", "Looking after grandkids"],
  ["My partner", "My children and grandkids", "Close friends", "My community"],
  ["Running out of money", "Healthcare costs", "Being a burden", "Market downturns"],
  ["A big family trip", "A holiday home", "Help my kids buy a home", "Give to a cause I love"],
];

/** Fallback pearls for open-ended follow-ups (e.g. "what did I miss?"). */
export const GOAL_EXTRA_SUGGESTIONS: string[] = [
  "Leaving an inheritance",
  "Traveling more",
  "Healthcare security",
  "Helping my family",
];

/** Preset retirement goals used to seed the card-sort interactions. */
export const RETIREMENT_GOALS: { id: string; label: string }[] = [
  { id: "travel", label: "Travel & adventure" },
  { id: "family", label: "Time with family" },
  { id: "health", label: "Health & fitness" },
  { id: "hobbies", label: "Hobbies & passions" },
  { id: "legacy", label: "Leaving a legacy" },
  { id: "security", label: "Financial security" },
  { id: "community", label: "Giving back" },
  { id: "learning", label: "Learning new things" },
];

/** Map a detected keyword to a preset goal id where one exists. */
const KEYWORD_TO_PRESET: Record<string, string> = {
  travel: "travel",
  adventure: "travel",
  family: "family",
  grandchildren: "family",
  grandkids: "family",
  children: "family",
  friends: "family",
  health: "health",
  fitness: "health",
  hobbies: "hobbies",
  golf: "hobbies",
  garden: "hobbies",
  gardening: "hobbies",
  fishing: "hobbies",
  music: "hobbies",
  reading: "learning",
  learning: "learning",
  cooking: "hobbies",
  volunteering: "community",
  charity: "community",
  community: "community",
  security: "security",
  freedom: "security",
  independence: "security",
};

/**
 * Build the hybrid working set of goal cards: every preset, with any extra
 * goals detected from the user's chat that don't map onto a preset appended as
 * "chat" cards. Detected presets are sorted to the front so what the user
 * actually mentioned leads.
 */
export function buildGoalCards(chatText: string): GoalCard[] {
  const found = findKeywords(chatText);
  const detectedPresetIds = new Set<string>();
  const extras: GoalCard[] = [];

  for (const k of found) {
    const presetId = KEYWORD_TO_PRESET[k];
    if (presetId) {
      detectedPresetIds.add(presetId);
    } else {
      const id = `chat-${k}`;
      if (!extras.some((c) => c.id === id)) {
        extras.push({ id, label: cap(k), source: "chat" });
      }
    }
  }

  const presetCards: GoalCard[] = RETIREMENT_GOALS.map((g) => ({
    id: g.id,
    label: g.label,
    source: "preset" as const,
  }));

  presetCards.sort((a, b) => {
    const aHit = detectedPresetIds.has(a.id) ? 0 : 1;
    const bHit = detectedPresetIds.has(b.id) ? 0 : 1;
    return aHit - bHit;
  });

  return [...extras, ...presetCards];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
