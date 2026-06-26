import {
  fieldLineVisible,
  isLineVisible,
  lineForField,
  madlibFieldById,
  type MadlibField,
  type MadlibLine,
} from "@/lib/narrative";
import { isFilled, isValid } from "@/lib/narrativeValidation";
import type { AnswerMap } from "@/lib/types";

/**
 * Shared "section parts" definition used by both hybrid persona flows. Each
 * section groups the REAL narrative fields (from About-more / Income / the
 * savings page, all keyed in `answers.about`) into labeled parts so the
 * Experience path can stack them on one scrollable screen and the Guided path
 * can step through them one part at a time. Goals is special — its rank deck is
 * an interaction, not a field group — so it only lists its question parts here.
 */

export type SectionKey = "aboutMore" | "income" | "spending" | "goals";

/** Which DetailsSidebar folder a section's values fold into. */
export type SidebarSection = "about" | "income" | "spending" | "goals";

export interface SectionPart {
  id: string;
  title: string;
  /** Field ids (declared in `lib/narrative`) captured in this part. */
  fieldIds: string[];
}

export interface SectionDef {
  key: SectionKey;
  sidebar: SidebarSection;
  /** Short main title for the page (e.g. "About You"). */
  name: string;
  /** Descriptive heading shown under the main title. */
  title: string;
  /** Supporting line under the title. */
  subtitle: string;
  parts: SectionPart[];
}

export const SECTIONS: Record<SectionKey, SectionDef> = {
  aboutMore: {
    key: "aboutMore",
    sidebar: "about",
    name: "About You",
    title: "A bit more about you",
    subtitle:
      "These extra details help us tailor your outlook to your situation.",
    parts: [
      {
        id: "household",
        title: "Your household",
        fieldIds: ["maritalStatus", "dependents"],
      },
      {
        id: "health",
        title: "Health & longevity",
        fieldIds: ["healthStatus", "familyLongevity"],
      },
      {
        id: "work",
        title: "Work & timing",
        fieldIds: ["employmentStatus", "retireTargetAge"],
      },
    ],
  },
  income: {
    key: "income",
    sidebar: "income",
    name: "Income",
    title: "Your income",
    subtitle:
      "The money you expect coming in. Your outlook updates with every answer.",
    parts: [
      {
        id: "recent",
        title: "Recent income",
        fieldIds: ["incomeLevel"],
      },
      {
        id: "socialSecurity",
        title: "Social Security",
        fieldIds: ["ssMode", "ssAmount", "spouseSs"],
      },
      {
        id: "pension",
        title: "Pensions & defined benefits",
        fieldIds: ["hasPension", "pensionAmount"],
      },
      {
        id: "other",
        title: "Other monthly income",
        fieldIds: ["otherIncome"],
      },
    ],
  },
  spending: {
    key: "spending",
    sidebar: "spending",
    name: "Spending",
    title: "Your savings & accounts",
    subtitle:
      "A snapshot of what you've put away and how it's invested.",
    parts: [
      {
        id: "total",
        title: "Total savings",
        fieldIds: ["totalSavings", "allocation"],
      },
      {
        id: "breakdown",
        title: "Break it down",
        fieldIds: ["breakdown"],
      },
      {
        id: "taxAdvantaged",
        title: "Tax-advantaged accounts",
        fieldIds: ["preTax", "roth", "hsa"],
      },
      {
        id: "afterTax",
        title: "After-tax savings",
        fieldIds: ["afterTax"],
      },
    ],
  },
  goals: {
    key: "goals",
    sidebar: "goals",
    name: "Goals",
    title: "What matters most",
    subtitle:
      "Tell us your priorities, then rank them so your outlook leans into them.",
    parts: [
      {
        id: "pick",
        title: "Your top goals",
        fieldIds: ["primaryGoal", "secondaryGoal"],
      },
      {
        id: "more",
        title: "A few more details",
        fieldIds: ["inheritanceImportance", "bigExpense", "legacyTarget"],
      },
    ],
  },
};

/** Resolve a part's declared field ids to their MadlibField definitions. */
export function partFields(part: SectionPart): MadlibField[] {
  return part.fieldIds
    .map((id) => madlibFieldById(id))
    .filter((f): f is MadlibField => Boolean(f));
}

/** Fields of a part whose declaring line is currently visible. */
export function visiblePartFields(
  part: SectionPart,
  about: AnswerMap,
): MadlibField[] {
  const valueOf = (id: string) => about[id]?.value;
  return partFields(part).filter((f) => fieldLineVisible(f.id, valueOf));
}

/**
 * The currently-visible madlib lines that declare a part's fields, in
 * declaration order and de-duplicated (so a line shared by two fields renders
 * once). Used by the section screens to render the part as madlib sentences.
 */
export function visiblePartLines(
  part: SectionPart,
  about: AnswerMap,
): MadlibLine[] {
  const valueOf = (id: string) => about[id]?.value;
  const seen = new Set<string>();
  const lines: MadlibLine[] = [];
  for (const id of part.fieldIds) {
    const line = lineForField(id);
    if (!line || seen.has(line.id)) continue;
    if (!isLineVisible(line, valueOf)) continue;
    seen.add(line.id);
    lines.push(line);
  }
  return lines;
}

/** A part is complete when every visible, required field is filled and valid. */
export function isPartComplete(part: SectionPart, about: AnswerMap): boolean {
  return visiblePartFields(part, about)
    .filter((f) => !f.optional)
    .every((f) => isFilled(f, about) && isValid(f, about));
}

/** Whether any visible, touched field of a part has an invalid value. */
export function partHasError(part: SectionPart, about: AnswerMap): boolean {
  return visiblePartFields(part, about).some(
    (f) => isFilled(f, about) && !isValid(f, about),
  );
}

/** Parts that currently have at least one visible field (skips empty ones). */
export function visibleParts(
  section: SectionDef,
  about: AnswerMap,
): SectionPart[] {
  return section.parts.filter(
    (part) => visiblePartFields(part, about).length > 0,
  );
}

/** A whole section is complete when all its parts are complete. */
export function isSectionComplete(
  section: SectionDef,
  about: AnswerMap,
): boolean {
  return section.parts.every((part) => isPartComplete(part, about));
}

/**
 * How far through a section the user is, 0..1, based on the share of currently
 * visible required fields that are filled & valid. Optional fields don't count
 * toward the denominator so the bar can still reach 100%.
 */
export function sectionProgress(section: SectionDef, about: AnswerMap): number {
  const required = section.parts
    .flatMap((part) => visiblePartFields(part, about))
    .filter((f) => !f.optional);
  if (required.length === 0) return 0;
  const done = required.filter(
    (f) => isFilled(f, about) && isValid(f, about),
  ).length;
  return done / required.length;
}
