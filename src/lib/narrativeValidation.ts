import type { MadlibField } from "@/lib/narrative";
import type { AnswerMap } from "@/lib/types";

/**
 * Shared field-validation helpers for the narrative pages and the linear
 * narrative wizard. Both read from the `answers.about` store keyed by field id.
 */

const ZIP_RE = /^\d{5}(-\d{4})?$/;

/** Whether a field has a non-empty stored value. */
export function isFilled(field: MadlibField, about: AnswerMap): boolean {
  return (about[field.id]?.value ?? "").trim().length > 0;
}

/**
 * Per-field format/type validity. Empty values are handled by {@link isFilled};
 * these rules judge a NON-EMPTY value (age ranges, zip format, money >= 0).
 * Rules live here (not in the schema) so they stay decoupled from
 * `lib/narrative.ts`.
 */
export function isValid(field: MadlibField, about: AnswerMap): boolean {
  const raw = (about[field.id]?.value ?? "").trim();
  if (!raw) return true; // emptiness is the required check's job
  if (field.type === "number") {
    const n = Number(raw);
    // Percent allocation fields are plain 0–100 values, not ages.
    if (field.id === "pctEquities" || field.id === "pctBonds") {
      return Number.isInteger(n) && n >= 0 && n <= 100;
    }
    // Dependent count is a small non-negative tally, not an age.
    if (field.id === "dependents") {
      return Number.isInteger(n) && n >= 0 && n <= 20;
    }
    return Number.isInteger(n) && n >= 18 && n <= 100;
  }
  if (field.type === "money") {
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n >= 0;
  }
  if (field.type === "date") {
    const t = Date.parse(raw);
    if (Number.isNaN(t)) return false;
    const year = new Date(t).getFullYear();
    return year >= 1900 && t <= Date.now();
  }
  if (field.type === "text" && (field.id === "zip" || field.id === "partnerZip")) {
    return ZIP_RE.test(raw);
  }
  return true; // selects and generic text just need to be non-empty
}
