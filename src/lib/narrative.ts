import { RETIREMENT_PRIORITIES } from "@/lib/priorities";
import type { AnswerMap, SectionId } from "@/lib/types";

/**
 * Config-driven schema for the Narrative (mad-libs) flow. Each page is a list of
 * sentence "lines"; a line is a sequence of tokens that are either literal copy
 * (a string) or an editable blank (a {@link MadlibField}). Lines can be
 * conditionally revealed inline via {@link MadlibLine.showIf}.
 */

export type MadlibFieldType = "text" | "number" | "select" | "money";

export interface MadlibOption {
  id: string;
  label: string;
}

export interface MadlibField {
  kind: "field";
  /** Stored in `answers.about` keyed by this id. */
  id: string;
  type: MadlibFieldType;
  placeholder?: string;
  default?: string;
  /** Options for `type: "select"`. */
  options?: MadlibOption[];
  /** Rough character width hint for text/number inputs. */
  widthCh?: number;
  /** Short label used in the side panel for this value. */
  sidebarLabel?: string;
}

export type MadlibToken = string | MadlibField;

export interface MadlibLine {
  id: string;
  tokens: MadlibToken[];
  /** Only render this line when the named field currently equals `equals`. */
  showIf?: { field: string; equals: string };
}

/** Which side-panel folder this page feeds (about/income/spending/goals). */
export type NarrativeSection = "about" | SectionId | "goals";

export interface MadlibPage {
  id: string;
  section: NarrativeSection;
  heading: string;
  /** When true, the page is a placeholder stub (built later). */
  stub?: boolean;
  lines: MadlibLine[];
}

const field = (f: Omit<MadlibField, "kind">): MadlibField => ({
  kind: "field",
  ...f,
});

const GENDER_OPTIONS: MadlibOption[] = [
  { id: "female", label: "female" },
  { id: "male", label: "male" },
  { id: "nonbinary", label: "non-binary" },
  { id: "unspecified", label: "prefer not to say" },
];

const MARITAL_OPTIONS: MadlibOption[] = [
  { id: "single", label: "single" },
  { id: "married", label: "married" },
  { id: "partnership", label: "in a civil partnership" },
  { id: "divorced", label: "divorced" },
  { id: "widowed", label: "widowed" },
  { id: "separated", label: "separated" },
];

const YES_NO_OPTIONS: MadlibOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];

const PARTNER_LIVING_OPTIONS: MadlibOption[] = [
  { id: "same", label: "with me at the same address" },
  { id: "separate", label: "at a different address" },
];

const SS_MODE_OPTIONS: MadlibOption[] = [
  { id: "estimate", label: "estimate it for me" },
  { id: "enter", label: "enter my own amount" },
];

const ALLOCATION_OPTIONS: MadlibOption[] = [
  { id: "stocks", label: "mostly stocks" },
  { id: "balanced", label: "a balanced mix" },
  { id: "bonds", label: "mostly bonds and cash" },
];

/** Retirement-priority picks for the Goals primary/secondary selects. */
const GOAL_OPTIONS: MadlibOption[] = RETIREMENT_PRIORITIES.map((p) => ({
  id: p.id,
  label: p.title,
}));

/** The mad-libs "About you" page (fully built). */
const ABOUT_PAGE: MadlibPage = {
  id: "about",
  section: "about",
  heading: "First we need to capture some basic details about you.",
  lines: [
    {
      id: "you",
      tokens: [
        "I\u2019m",
        field({
          id: "age",
          type: "number",
          placeholder: "Age",
          widthCh: 4,
          sidebarLabel: "Age",
        }),
        "and",
        field({
          id: "gender",
          type: "select",
          options: GENDER_OPTIONS,
          placeholder: "Gender",
          sidebarLabel: "Gender",
        }),
      ],
    },
    {
      id: "home",
      tokens: [
        "I live in",
        field({
          id: "zip",
          type: "text",
          placeholder: "Zip code",
          widthCh: 9,
          sidebarLabel: "Location",
        }),
        "and a currently",
        field({
          id: "maritalStatus",
          type: "select",
          options: MARITAL_OPTIONS,
          placeholder: "Marital status",
          sidebarLabel: "Status",
        }),
      ],
    },
    {
      id: "planBoth",
      tokens: [
        "I want to plan for both me and my partner",
        field({
          id: "planBoth",
          type: "select",
          options: YES_NO_OPTIONS,
          placeholder: "Yes / No",
          sidebarLabel: "Planning for partner",
        }),
      ],
    },
    {
      id: "partner",
      showIf: { field: "planBoth", equals: "yes" },
      tokens: [
        "My partner is",
        field({
          id: "partnerAge",
          type: "number",
          placeholder: "Age",
          widthCh: 4,
          sidebarLabel: "Partner age",
        }),
        "and",
        field({
          id: "partnerGender",
          type: "select",
          options: GENDER_OPTIONS,
          placeholder: "Gender",
          sidebarLabel: "Partner gender",
        }),
      ],
    },
    {
      id: "partnerLiving",
      showIf: { field: "planBoth", equals: "yes" },
      tokens: [
        "They live in",
        field({
          id: "partnerLiving",
          type: "select",
          options: PARTNER_LIVING_OPTIONS,
          placeholder: "Living situation",
          sidebarLabel: "Partner lives",
        }),
      ],
    },
    {
      id: "partnerLocation",
      showIf: { field: "partnerLiving", equals: "separate" },
      tokens: [
        "Their postcode is",
        field({
          id: "partnerZip",
          type: "text",
          placeholder: "Zip code",
          widthCh: 9,
          sidebarLabel: "Partner location",
        }),
      ],
    },
  ],
};

/** The mad-libs "Income" page (Income phase from the model). */
const INCOME_PAGE: MadlibPage = {
  id: "income",
  section: "income",
  heading: "Now, the money you expect coming in.",
  lines: [
    {
      id: "incomeLevel",
      tokens: [
        "My most recent annual income was about",
        field({
          id: "incomeLevel",
          type: "money",
          placeholder: "Income",
          widthCh: 10,
          sidebarLabel: "Recent income",
        }),
      ],
    },
    {
      id: "ssMode",
      tokens: [
        "For Social Security, I\u2019ll",
        field({
          id: "ssMode",
          type: "select",
          options: SS_MODE_OPTIONS,
          placeholder: "estimate or enter",
          sidebarLabel: "Social Security",
        }),
      ],
    },
    {
      id: "ssAmount",
      showIf: { field: "ssMode", equals: "enter" },
      tokens: [
        "My Social Security is about",
        field({
          id: "ssAmount",
          type: "money",
          placeholder: "Amount",
          widthCh: 10,
          sidebarLabel: "Social Security",
        }),
        "/ month",
      ],
    },
    {
      id: "hasPension",
      tokens: [
        "I\u2019ll receive a defined-benefit pension",
        field({
          id: "hasPension",
          type: "select",
          options: YES_NO_OPTIONS,
          placeholder: "Yes / No",
          sidebarLabel: "Pension",
        }),
      ],
    },
    {
      id: "pensionAmount",
      showIf: { field: "hasPension", equals: "yes" },
      tokens: [
        "It pays about",
        field({
          id: "pensionAmount",
          type: "money",
          placeholder: "Amount",
          widthCh: 10,
          sidebarLabel: "Pension",
        }),
        "/ month",
      ],
    },
    {
      id: "otherIncome",
      tokens: [
        "My other monthly retirement income totals about",
        field({
          id: "otherIncome",
          type: "money",
          placeholder: "Amount",
          widthCh: 10,
          sidebarLabel: "Other income",
        }),
        "/ month",
      ],
    },
    {
      id: "spouseSs",
      showIf: { field: "planBoth", equals: "yes" },
      tokens: [
        "My spouse\u2019s Social Security is about",
        field({
          id: "spouseSs",
          type: "money",
          placeholder: "Amount",
          widthCh: 10,
          sidebarLabel: "Spouse Social Security",
        }),
        "/ month",
      ],
    },
  ],
};

/** The mad-libs "Spending" page (Accounts phase from the model). */
const SPENDING_PAGE: MadlibPage = {
  id: "spending",
  section: "spending",
  heading: "A snapshot of your savings and investments.",
  lines: [
    {
      id: "totalSavings",
      tokens: [
        "My retirement savings total about",
        field({
          id: "totalSavings",
          type: "money",
          placeholder: "Amount",
          widthCh: 11,
          sidebarLabel: "Total savings",
        }),
      ],
    },
    {
      id: "allocation",
      tokens: [
        "Roughly, it\u2019s",
        field({
          id: "allocation",
          type: "select",
          options: ALLOCATION_OPTIONS,
          placeholder: "asset mix",
          sidebarLabel: "Asset mix",
        }),
      ],
    },
    {
      id: "breakdown",
      tokens: [
        "Want to break it down by account?",
        field({
          id: "breakdown",
          type: "select",
          options: YES_NO_OPTIONS,
          placeholder: "Yes / No",
          sidebarLabel: "Account breakdown",
        }),
      ],
    },
    {
      id: "preTax",
      showIf: { field: "breakdown", equals: "yes" },
      tokens: [
        "Pre-tax 401(k) / IRA:",
        field({
          id: "preTax",
          type: "money",
          placeholder: "Amount",
          widthCh: 11,
          sidebarLabel: "Pre-tax 401(k)/IRA",
        }),
      ],
    },
    {
      id: "roth",
      showIf: { field: "breakdown", equals: "yes" },
      tokens: [
        "Roth 401(k) / IRA:",
        field({
          id: "roth",
          type: "money",
          placeholder: "Amount",
          widthCh: 11,
          sidebarLabel: "Roth 401(k)/IRA",
        }),
      ],
    },
    {
      id: "afterTax",
      showIf: { field: "breakdown", equals: "yes" },
      tokens: [
        "After-tax savings / brokerage:",
        field({
          id: "afterTax",
          type: "money",
          placeholder: "Amount",
          widthCh: 11,
          sidebarLabel: "After-tax savings",
        }),
      ],
    },
    {
      id: "hsa",
      showIf: { field: "breakdown", equals: "yes" },
      tokens: [
        "HSA:",
        field({
          id: "hsa",
          type: "money",
          placeholder: "Amount",
          widthCh: 11,
          sidebarLabel: "HSA",
        }),
      ],
    },
  ],
};

/** The mad-libs "Goals" page: pick the priorities that matter most. */
const GOALS_PAGE: MadlibPage = {
  id: "goals",
  section: "goals",
  heading: "Finally, what matters most in your retirement.",
  lines: [
    {
      id: "primaryGoal",
      tokens: [
        "My primary goal is",
        field({
          id: "primaryGoal",
          type: "select",
          options: GOAL_OPTIONS,
          placeholder: "Pick a goal",
          sidebarLabel: "Primary goal",
        }),
      ],
    },
    {
      id: "secondaryGoal",
      tokens: [
        "and my secondary goal is",
        field({
          id: "secondaryGoal",
          type: "select",
          options: GOAL_OPTIONS,
          placeholder: "Pick a goal",
          sidebarLabel: "Secondary goal",
        }),
      ],
    },
  ],
};

/** Page config keyed by the route step id used in the narrative variant. */
export const NARRATIVE_PAGES: Record<string, MadlibPage> = {
  details: ABOUT_PAGE,
  income: INCOME_PAGE,
  spending: SPENDING_PAGE,
  goals: GOALS_PAGE,
};

/** Ordered step ids of the narrative pages (excludes the shared complete step). */
export const NARRATIVE_PAGE_STEPS = [
  "details",
  "income",
  "spending",
  "goals",
] as const;

/** Resolve the display label for a select field's stored option id. */
export function optionLabel(f: MadlibField, value: string | undefined): string {
  if (!value) return "";
  const opt = f.options?.find((o) => o.id === value);
  return opt?.label ?? value;
}

/** All editable blanks on the About You page, flattened in render order. */
export const ABOUT_FIELDS: MadlibField[] = ABOUT_PAGE.lines.flatMap((line) =>
  line.tokens.filter(
    (t): t is MadlibField => typeof t !== "string" && t.kind === "field",
  ),
);

/** Look up an About You field by its id (used by the sidebar edit modal). */
export function aboutFieldById(id: string): MadlibField | undefined {
  return ABOUT_FIELDS.find((f) => f.id === id);
}

/** Flatten the fields declared on a page, in render order. */
export function pageFields(page: MadlibPage): MadlibField[] {
  return page.lines.flatMap((line) =>
    line.tokens.filter(
      (t): t is MadlibField => typeof t !== "string" && t.kind === "field",
    ),
  );
}

/** Every editable blank across all narrative pages, keyed by id. */
export const MADLIB_FIELDS: MadlibField[] = Object.values(NARRATIVE_PAGES).flatMap(
  (page) => pageFields(page),
);

/** Look up any narrative field by id (used by the sidebar edit modal). */
export function madlibFieldById(id: string): MadlibField | undefined {
  return MADLIB_FIELDS.find((f) => f.id === id);
}

/**
 * Plausible values for the mandatory About/Income/Spending fields. Used by the
 * Help "skip to the goal ranking" shortcut to pre-fill the earlier pages so the
 * user can jump straight to Goals with a populated side panel and outlook. Goals
 * itself is intentionally left blank (that's the part being skipped to).
 */
const NARRATIVE_SAMPLE: Record<string, string> = {
  age: "62",
  gender: "female",
  zip: "94105",
  maritalStatus: "married",
  planBoth: "no",
  incomeLevel: "120000",
  ssMode: "estimate",
  hasPension: "no",
  otherIncome: "500",
  totalSavings: "750000",
  allocation: "balanced",
  breakdown: "no",
};

/** Build an `answers.about` patch of sample values for the skip-to-goals action. */
export function sampleNarrativeAnswers(): AnswerMap {
  const at = Date.now();
  return Object.fromEntries(
    Object.entries(NARRATIVE_SAMPLE).map(([id, value]) => [id, { value, at }]),
  );
}

/** Map every field id to the line that declares it (across all pages). */
const LINE_BY_FIELD: Map<string, MadlibLine> = new Map(
  Object.values(NARRATIVE_PAGES).flatMap((page) =>
    page.lines.flatMap((line) =>
      pageFields({ ...page, lines: [line] }).map(
        (f) => [f.id, line] as [string, MadlibLine],
      ),
    ),
  ),
);

/**
 * Whether a line should render given the current answers. A conditional line is
 * visible only when (a) its trigger field equals the expected value AND (b) the
 * line that *declares* that trigger field is itself visible. The transitive
 * check means turning off an upstream toggle (e.g. "plan for partner" -> No)
 * also hides anything gated on a downstream answer (e.g. the partner postcode),
 * even though that downstream value is still stored.
 */
export function isLineVisible(
  line: MadlibLine,
  valueOf: (fieldId: string) => string | undefined,
  seen: Set<string> = new Set(),
): boolean {
  if (!line.showIf) return true;
  if (seen.has(line.id)) return true; // guard against cycles
  if (valueOf(line.showIf.field) !== line.showIf.equals) return false;
  const owner = LINE_BY_FIELD.get(line.showIf.field);
  if (!owner || owner.id === line.id) return true;
  return isLineVisible(owner, valueOf, new Set(seen).add(line.id));
}
