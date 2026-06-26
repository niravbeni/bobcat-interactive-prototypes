import type { SectionItem } from "@/components/chrome/DetailsSidebar";
import {
  ABOUT_MORE_PAGE,
  CORE_NARRATIVE_PAGES,
  GOALS_EXTRA_PAGE,
  NARRATIVE_PAGES,
  isLineVisible,
  optionLabel,
  type MadlibField,
  type MadlibPage,
} from "@/lib/narrative";
import type { AnswerMap } from "@/lib/types";

/** Money raw digits -> "$x,xxx" for side-panel display. */
function formatMoneyDisplay(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? `$${Number(digits).toLocaleString("en-US")}` : raw;
}

/**
 * Which sidebar folder each rich Profile-page field belongs to, so the
 * hybrid quick-draft persona's single page folds into the same About/Income/
 * Spending folders as the guided flow.
 */
const PROFILE_ABOUT_IDS = new Set([
  "name",
  "retiredStatus",
  "dob",
  "gender",
  "location",
  "zip",
  "partnerAge",
  "partnerGender",
]);
const PROFILE_INCOME_IDS = new Set([
  "savings",
  "pctEquities",
  "pctBonds",
  "monthlyIncome",
]);
const PROFILE_SPENDING_IDS = new Set(["monthlyNeed"]);

/** Live side-panel rows for one page: only filled, currently-visible fields. */
function liveItemsFor(page: MadlibPage, about: AnswerMap): SectionItem[] {
  const valueGetter = (id: string) => about[id]?.value;
  return page.lines
    .filter((line) => isLineVisible(line, valueGetter))
    .flatMap((line) =>
      line.tokens.filter(
        (t): t is MadlibField => typeof t !== "string" && t.kind === "field",
      ),
    )
    .map((f, i) => {
      const raw = about[f.id]?.value;
      if (!raw) return null;
      const display =
        f.type === "select"
          ? optionLabel(f, raw)
          : f.type === "money"
            ? formatMoneyDisplay(raw)
            : raw;
      return {
        key: f.id,
        label: f.sidebarLabel ?? f.id,
        value: display,
        at: -i,
      } satisfies SectionItem;
    })
    .filter((it): it is SectionItem => it !== null);
}

export interface NarrativeSidebarItems {
  aboutItems: SectionItem[];
  incomeItems: SectionItem[];
  spendingItems: SectionItem[];
  goalsItems: SectionItem[];
}

/**
 * Derive the four DetailsSidebar section lists from the narrative `answers.about`
 * map. Shared by the narrative pages and the Outlook dashboard so both panels
 * always show the same live data.
 */
export function narrativeSidebarItems(about: AnswerMap): NarrativeSidebarItems {
  // Profile-page values (hybrid quick draft) fold into the same folders as the
  // guided flow. Base rows come first so a shared id (e.g. gender/zip) is never
  // double-counted.
  const profilePage = NARRATIVE_PAGES.profile;
  const profileItems = profilePage ? liveItemsFor(profilePage, about) : [];
  const pickProfile = (ids: Set<string>) =>
    profileItems.filter((it) => ids.has(it.key));
  const merge = (base: SectionItem[], extra: SectionItem[]) => {
    const seen = new Set(base.map((it) => it.key));
    return [...base, ...extra.filter((it) => !seen.has(it.key))];
  };

  return {
    aboutItems: merge(
      merge(
        liveItemsFor(NARRATIVE_PAGES.details, about),
        pickProfile(PROFILE_ABOUT_IDS),
      ),
      liveItemsFor(ABOUT_MORE_PAGE, about),
    ),
    incomeItems: merge(
      liveItemsFor(NARRATIVE_PAGES.income, about),
      pickProfile(PROFILE_INCOME_IDS),
    ),
    spendingItems: merge(
      liveItemsFor(NARRATIVE_PAGES.spending, about),
      pickProfile(PROFILE_SPENDING_IDS),
    ),
    goalsItems: merge(
      liveItemsFor(NARRATIVE_PAGES.goals, about),
      liveItemsFor(GOALS_EXTRA_PAGE, about),
    ),
  };
}

export interface NarrativeProgress {
  /** Mandatory completion, 0..100, clamped (never exceeds 100). */
  requiredPct: number;
  /** Completion of currently-revealed optional fields, 0..100. */
  optionalPct: number;
  /** Whether any optional (conditional) fields are visible yet. */
  hasOptional: boolean;
}

const isFilledValue = (about: AnswerMap, id: string): boolean =>
  (about[id]?.value ?? "").trim().length > 0;

/**
 * Required vs optional completion for the narrative "Required details" bar.
 * Required = every field on an unconditional line (no `showIf`) across all pages.
 * Optional = fields on currently-visible conditional lines (e.g. partner details,
 * account breakdown). This replaces the v2 question-count math, which over-counted
 * (showing >100%) in the narrative.
 */
export function narrativeProgress(about: AnswerMap): NarrativeProgress {
  const valueGetter = (id: string) => about[id]?.value;

  let requiredTotal = 0;
  let requiredFilled = 0;
  let optionalTotal = 0;
  let optionalFilled = 0;

  for (const page of CORE_NARRATIVE_PAGES) {
    for (const line of page.lines) {
      const fields = line.tokens.filter(
        (t): t is MadlibField => typeof t !== "string" && t.kind === "field",
      );
      if (!line.showIf) {
        for (const f of fields) {
          requiredTotal += 1;
          if (isFilledValue(about, f.id)) requiredFilled += 1;
        }
      } else if (isLineVisible(line, valueGetter)) {
        for (const f of fields) {
          optionalTotal += 1;
          if (isFilledValue(about, f.id)) optionalFilled += 1;
        }
      }
    }
  }

  const pct = (n: number, d: number) =>
    d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0;

  return {
    requiredPct: pct(requiredFilled, requiredTotal),
    optionalPct: pct(optionalFilled, optionalTotal),
    hasOptional: optionalTotal > 0,
  };
}
