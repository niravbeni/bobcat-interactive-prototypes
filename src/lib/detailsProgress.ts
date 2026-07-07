import type { DetailsState } from "./types";

/** Per-section completion of the Details flow. */
export interface DetailsCompletion {
  about: boolean;
  assets: boolean;
  income: boolean;
  spending: boolean;
  goals: boolean;
}

/**
 * Derives which Details-flow sections are "complete" from the shared state, so
 * the progress bar and section ticks respond as the user fills things in.
 *
 * - about: all required fields present (middle name is optional)
 * - assets: at least one account, each with a positive balance
 * - income: locked / employer-synced, always considered provided
 * - spending: a monthly aim has been set
 * - goals: the ranking has been confirmed
 */
export function computeDetailsCompletion(
  details: DetailsState,
): DetailsCompletion {
  const a = details.about;
  const about = Boolean(
    a.firstName.trim() &&
      a.lastName.trim() &&
      a.dob.trim() &&
      a.zip.trim() &&
      a.relationship.trim(),
  );

  const assets =
    details.accounts.length > 0 &&
    details.accounts.every((acc) => acc.balance != null && acc.balance > 0);

  const income = true;
  const spending = details.spending.aim > 0;
  const goals = details.goals.confirmed;

  return { about, assets, income, spending, goals };
}

/** Overall required-details progress as a whole-number percentage (0–100). */
export function computeDetailsProgress(details: DetailsState): number {
  const c = computeDetailsCompletion(details);
  const flags = [c.about, c.assets, c.income, c.spending, c.goals];
  const done = flags.filter(Boolean).length;
  return Math.round((done / flags.length) * 100);
}
