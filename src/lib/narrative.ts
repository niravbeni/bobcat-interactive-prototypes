import { RETIREMENT_PRIORITIES } from "@/lib/priorities";
import type { AnswerMap, SectionId } from "@/lib/types";

/**
 * Config-driven schema for the Narrative (mad-libs) flow. Each page is a list of
 * sentence "lines"; a line is a sequence of tokens that are either literal copy
 * (a string) or an editable blank (a {@link MadlibField}). Lines can be
 * conditionally revealed inline via {@link MadlibLine.showIf}.
 */

export type MadlibFieldType = "text" | "number" | "select" | "money" | "date";

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
  /** When true, the field never gates a Continue button (nice-to-have detail). */
  optional?: boolean;
  /**
   * Standalone question heading used when the field is rendered as a
   * base-linear question block (the hybrid section screens) rather than as an
   * inline mad-libs blank. Optional so mad-lib screens are unaffected.
   */
  question?: string;
  /** Optional helper/subtitle shown under the question heading. */
  helper?: string;
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

const RETIRED_STATUS_OPTIONS: MadlibOption[] = [
  { id: "retired", label: "I\u2019m currently retired" },
  { id: "not-retired", label: "not yet retired" },
];

const PLANNING_FOR_OPTIONS: MadlibOption[] = [
  { id: "self", label: "myself only" },
  { id: "partner", label: "myself and my partner" },
];

/** US states (+ DC) for the profile location picker. */
const US_STATE_OPTIONS: MadlibOption[] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"],
  ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
  ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"],
  ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"],
  ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"],
  ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"],
  ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"],
].map(([id, label]) => ({ id, label }));

/** Retirement-priority picks for the Goals primary/secondary selects. */
const GOAL_OPTIONS: MadlibOption[] = RETIREMENT_PRIORITIES.map((p) => ({
  id: p.id,
  label: p.title,
}));

const HEALTH_OPTIONS: MadlibOption[] = [
  { id: "excellent", label: "excellent" },
  { id: "good", label: "good" },
  { id: "fair", label: "fair" },
  { id: "poor", label: "poor" },
];

const LONGEVITY_OPTIONS: MadlibOption[] = [
  { id: "below", label: "shorter than average" },
  { id: "average", label: "about average" },
  { id: "above", label: "longer than average" },
];

const EMPLOYMENT_OPTIONS: MadlibOption[] = [
  { id: "full-time", label: "working full-time" },
  { id: "part-time", label: "working part-time" },
  { id: "self-employed", label: "self-employed" },
  { id: "retired", label: "retired" },
  { id: "not-working", label: "not currently working" },
];

const INHERITANCE_OPTIONS: MadlibOption[] = [
  { id: "not", label: "not important" },
  { id: "somewhat", label: "somewhat important" },
  { id: "very", label: "very important" },
];

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
          question: "What's your marital status?",
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
          question: "What was your most recent annual income?",
          helper: "A rough figure is fine \u2014 you can refine it later.",
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
          question: "How should we handle your Social Security?",
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
          question: "What's your monthly Social Security?",
          helper: "The amount you expect each month.",
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
          question: "Will you receive a defined-benefit pension?",
          helper: "A pension that pays a set amount each month.",
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
          question: "How much does your pension pay each month?",
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
          question: "Any other monthly retirement income?",
          helper: "Rental income, annuities, part-time work \u2014 leave blank if none.",
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
          question: "What's your spouse's monthly Social Security?",
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
          question: "How much have you saved for retirement?",
          helper: "Across all your accounts \u2014 a rough total is fine.",
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
          question: "How is it roughly invested?",
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
          question: "Want to break it down by account?",
          helper: "Optional \u2014 a per-account split sharpens your outlook.",
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
          question: "How much is in pre-tax 401(k) / IRA accounts?",
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
          question: "How much is in Roth 401(k) / IRA accounts?",
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
          question: "How much is in after-tax / brokerage accounts?",
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
          question: "How much is in your HSA?",
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
          question: "What's your primary goal for retirement?",
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
          question: "And your secondary goal?",
        }),
      ],
    },
  ],
};

/**
 * The rich "Profile" page used by the hybrid quick-draft persona: a single
 * mad-libs page that captures enough About/Income/Spending detail in one pass
 * to render a draft outlook immediately. Reuses the `gender` and `zip` ids so
 * the values align with the shared about store; every other blank uses a new id.
 */
const PROFILE_PAGE: MadlibPage = {
  id: "profile",
  section: "about",
  heading: "Tell us about yourself so we can draft a first outlook.",
  lines: [
    {
      id: "intro",
      tokens: [
        "Hi, I\u2019m",
        field({
          id: "name",
          type: "text",
          placeholder: "Name",
          widthCh: 10,
          sidebarLabel: "Name",
        }),
        "and",
        field({
          id: "retiredStatus",
          type: "select",
          options: RETIRED_STATUS_OPTIONS,
          placeholder: "retirement status",
          sidebarLabel: "Retirement status",
        }),
      ],
    },
    {
      id: "born",
      tokens: [
        "I was born on",
        field({
          id: "dob",
          type: "date",
          placeholder: "MM/DD/YYYY",
          sidebarLabel: "Date of birth",
        }),
        ", am",
        field({
          id: "gender",
          type: "select",
          options: GENDER_OPTIONS,
          placeholder: "Gender",
          sidebarLabel: "Gender",
        }),
        ", and live in",
        field({
          id: "location",
          type: "select",
          options: US_STATE_OPTIONS,
          placeholder: "State",
          sidebarLabel: "Location",
        }),
        ", with zip code",
        field({
          id: "zip",
          type: "text",
          placeholder: "Zip code",
          widthCh: 9,
          sidebarLabel: "Zip code",
        }),
      ],
    },
    {
      id: "planningFor",
      tokens: [
        "I\u2019m seeking retirement planning for",
        field({
          id: "planningFor",
          type: "select",
          options: PLANNING_FOR_OPTIONS,
          placeholder: "who you're planning for",
          sidebarLabel: "Planning for",
        }),
      ],
    },
    {
      id: "partner",
      showIf: { field: "planningFor", equals: "partner" },
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
      id: "savings",
      tokens: [
        "I have about",
        field({
          id: "savings",
          type: "money",
          placeholder: "Amount",
          widthCh: 11,
          sidebarLabel: "Retirement savings",
        }),
        "in retirement savings currently invested in approximately",
        field({
          id: "pctEquities",
          type: "number",
          placeholder: "0",
          widthCh: 4,
          sidebarLabel: "% equities",
        }),
        "% equities and other growth assets and",
        field({
          id: "pctBonds",
          type: "number",
          placeholder: "0",
          widthCh: 4,
          sidebarLabel: "% bonds & cash",
        }),
        "% in bonds and cash",
      ],
    },
    {
      id: "monthly",
      tokens: [
        "I expect to (or currently) receive about",
        field({
          id: "monthlyIncome",
          type: "money",
          placeholder: "Amount",
          widthCh: 10,
          sidebarLabel: "Monthly income",
        }),
        "of income per month in retirement and expect that I need roughly",
        field({
          id: "monthlyNeed",
          type: "money",
          placeholder: "Amount",
          widthCh: 10,
          sidebarLabel: "Monthly need",
        }),
        "per month to cover my essential and lifestyle needs",
      ],
    },
  ],
};

/**
 * Additional "About you" detail captured on the section screens (not on the
 * quick-draft Profile page or the guided About madlib). Grouped into parts by
 * {@link "@/lib/sections"}; every field folds into the About sidebar folder.
 */
export const ABOUT_MORE_PAGE: MadlibPage = {
  id: "aboutMore",
  section: "about",
  heading: "A little more about you",
  lines: [
    {
      id: "maritalMore",
      tokens: [
        "I\u2019m currently",
        field({
          id: "maritalStatus",
          type: "select",
          options: MARITAL_OPTIONS,
          placeholder: "Marital status",
          sidebarLabel: "Status",
          question: "What's your marital status?",
        }),
        "with",
        field({
          id: "dependents",
          type: "number",
          placeholder: "0",
          widthCh: 3,
          sidebarLabel: "Dependents",
          question: "How many dependents do you have?",
          helper: "Anyone who relies on you financially. Enter 0 if none.",
        }),
        "dependents",
      ],
    },
    {
      id: "healthMore",
      tokens: [
        "My health is",
        field({
          id: "healthStatus",
          type: "select",
          options: HEALTH_OPTIONS,
          placeholder: "Health",
          sidebarLabel: "Health",
          question: "How would you describe your health?",
        }),
        "and my family tends to live",
        field({
          id: "familyLongevity",
          type: "select",
          options: LONGEVITY_OPTIONS,
          placeholder: "Longevity",
          sidebarLabel: "Family longevity",
          question: "How long does your family tend to live?",
          helper: "This helps us plan for how long your money needs to last.",
        }),
      ],
    },
    {
      id: "workMore",
      tokens: [
        "Right now I\u2019m",
        field({
          id: "employmentStatus",
          type: "select",
          options: EMPLOYMENT_OPTIONS,
          placeholder: "Employment",
          sidebarLabel: "Employment",
          question: "What's your current employment status?",
        }),
        "and I\u2019m aiming to retire by age",
        field({
          id: "retireTargetAge",
          type: "number",
          placeholder: "Age",
          widthCh: 4,
          sidebarLabel: "Target retirement age",
          question: "What age are you aiming to retire?",
        }),
      ],
    },
  ],
};

/**
 * The "few more details" goal questions shared by both persona goal flows. These
 * sit alongside the primary/secondary selects ({@link GOALS_PAGE}) and the
 * priority-rank deck. The one-off expense and legacy target are optional.
 */
export const GOALS_EXTRA_PAGE: MadlibPage = {
  id: "goalsExtra",
  section: "goals",
  heading: "A few more details",
  lines: [
    {
      id: "inheritance",
      tokens: [
        "Leaving an inheritance is",
        field({
          id: "inheritanceImportance",
          type: "select",
          options: INHERITANCE_OPTIONS,
          placeholder: "How important",
          sidebarLabel: "Inheritance",
          question: "How important is leaving an inheritance?",
        }),
        "to me",
      ],
    },
    {
      id: "bigExpense",
      tokens: [
        "I\u2019m planning a one-off big expense of about",
        field({
          id: "bigExpense",
          type: "money",
          placeholder: "Amount",
          widthCh: 11,
          sidebarLabel: "One-off expense",
          optional: true,
          question: "Any one-off big expense you're planning?",
          helper: "Optional \u2014 a new car, a dream trip, helping family.",
        }),
      ],
    },
    {
      id: "legacyTarget",
      tokens: [
        "and I\u2019d like to leave behind around",
        field({
          id: "legacyTarget",
          type: "money",
          placeholder: "Amount",
          widthCh: 11,
          sidebarLabel: "Legacy target",
          optional: true,
          question: "How much would you like to leave behind?",
          helper: "Optional \u2014 a legacy or inheritance target.",
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
  profile: PROFILE_PAGE,
};

/**
 * The four core narrative pages, in Continue order. Used for the narrative
 * progress bar and step dots so the standalone Profile page (hybrid quick
 * draft) doesn't dilute those counts.
 */
export const CORE_NARRATIVE_PAGES: MadlibPage[] = [
  ABOUT_PAGE,
  INCOME_PAGE,
  SPENDING_PAGE,
  GOALS_PAGE,
];

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

/**
 * Every page that declares editable blanks, including the section-only pages
 * (About more / Goals extra) that aren't routed steps. Used to build the global
 * field + line lookups so {@link madlibFieldById} and {@link fieldLineVisible}
 * resolve the section-screen fields too.
 */
const ALL_PAGES: MadlibPage[] = [
  ...Object.values(NARRATIVE_PAGES),
  ABOUT_MORE_PAGE,
  GOALS_EXTRA_PAGE,
];

/** Every editable blank across all narrative pages, keyed by id. */
export const MADLIB_FIELDS: MadlibField[] = ALL_PAGES.flatMap((page) =>
  pageFields(page),
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

/** Per-field-id sample values for the Shift+Enter prototype auto-fill. */
const SAMPLE_BY_ID: Record<string, string> = {
  name: "Alex",
  age: "65",
  partnerAge: "63",
  dob: "1965-03-15",
  zip: "10001",
  partnerZip: "10001",
  location: "NY",
  pctEquities: "60",
  pctBonds: "40",
  savings: "750000",
  totalSavings: "750000",
  monthlyIncome: "4000",
  monthlyNeed: "6500",
  incomeLevel: "85000",
  otherIncome: "1500",
  dependents: "2",
  retireTargetAge: "67",
  bigExpense: "25000",
  legacyTarget: "100000",
};

/**
 * A plausible sample value for a single field, used by the Shift+Enter
 * "auto-fill this page" testing shortcut. Selects prefer the option that does
 * NOT expand extra conditional lines (e.g. Yes/No picks "no", plan-for picks
 * "myself only") so one keypress fills the whole page.
 */
export function sampleValueFor(field: MadlibField): string {
  const override = SAMPLE_BY_ID[field.id];
  if (override) return override;
  switch (field.type) {
    case "select": {
      const opts = field.options ?? [];
      const yesNo =
        opts.length === 2 && opts[0]?.id === "yes" && opts[1]?.id === "no";
      return (yesNo ? opts[1] : opts[0])?.id ?? "";
    }
    case "money":
      return "2000";
    case "number":
      return "50";
    case "date":
      return "1965-03-15";
    default:
      return "Sample";
  }
}

/** Map every field id to the line that declares it (across all pages). */
const LINE_BY_FIELD: Map<string, MadlibLine> = new Map(
  ALL_PAGES.flatMap((page) =>
    page.lines.flatMap((line) =>
      pageFields({ ...page, lines: [line] }).map(
        (f) => [f.id, line] as [string, MadlibLine],
      ),
    ),
  ),
);

/** The madlib line that declares a given field id (across all pages). */
export function lineForField(id: string): MadlibLine | undefined {
  return LINE_BY_FIELD.get(id);
}

/**
 * Whether the line declaring a field is currently visible given the answers.
 * Lets the section screens render conditional fields (e.g. the Social Security
 * amount only after "enter my own amount") by field id alone.
 */
export function fieldLineVisible(
  id: string,
  valueOf: (fieldId: string) => string | undefined,
): boolean {
  const line = LINE_BY_FIELD.get(id);
  return line ? isLineVisible(line, valueOf) : true;
}

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
