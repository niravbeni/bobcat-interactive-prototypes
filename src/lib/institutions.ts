/**
 * Mock "AI" institution catalog for the Smart Sort prototype. There is no real
 * API or LLM here — the intelligence is this hand-built catalog of common US
 * retirement/savings products plus a small fuzzy matcher and a ghost-text
 * completion helper that together sell the "smart" autocomplete feel.
 */

export type TaxStatus = "tax-free" | "tax-deferred" | "taxable" | "tax-advantaged";

export interface InstitutionAccount {
  id: string;
  provider: string;
  /** Display name shown on the suggestion + card, e.g. "Vanguard Roth IRA". */
  fullName: string;
  /** Human label for the account type, e.g. "Roth IRA", "401(k)". */
  accountType: string;
  taxStatus: TaxStatus;
  category: "brokerage" | "robo" | "bank" | "employer" | "hsa";
  /** Lowercase search aliases (tickers, nicknames, abbreviations). */
  aliases?: string[];
  /** Brand-ish accent used for the provider chip. */
  accentColor?: string;
  /** Pre-filled balance estimate to seed the editable amount. */
  estBalance?: number;
}

export type AddedAccount = InstitutionAccount & {
  instanceId: string;
  balance: number;
};

/** Friendly copy for each tax bucket, used in badges + the summary legend. */
export const TAX_STATUS_LABEL: Record<TaxStatus, string> = {
  "tax-free": "Tax-free",
  "tax-deferred": "Tax-deferred",
  taxable: "Taxable",
  "tax-advantaged": "Tax-advantaged",
};

/** Token-backed colors for each tax bucket (used by the segmented summary bar). */
export const TAX_STATUS_COLOR: Record<TaxStatus, string> = {
  "tax-free": "var(--color-seg-1)",
  "tax-deferred": "var(--color-seg-2)",
  taxable: "var(--color-stratosphere)",
  "tax-advantaged": "var(--color-seg-3)",
};

/**
 * Brand domains for each provider, used to fetch real logos at runtime in the
 * Smart Sort connect flow. Logos load from a CDN in the browser; if that fails
 * we fall back to the accent-colored initials chip.
 */
export const PROVIDER_DOMAINS: Record<string, string> = {
  Vanguard: "vanguard.com",
  Fidelity: "fidelity.com",
  "Charles Schwab": "schwab.com",
  Chase: "chase.com",
  Ally: "ally.com",
  // TIAA uses a bundled local logo (see PROVIDER_LOGO_SRC) rather than the CDN,
  // which returned a wrong mark for tiaa.org.
};

/**
 * Bundled local logos (in /public) that override the CDN lookup for providers
 * whose CDN logo is wrong or unavailable.
 */
export const PROVIDER_LOGO_SRC: Record<string, string> = {
  TIAA: "/logos/tiaa.png",
  Vanguard: "/logos/vanguard.png",
  Betterment: "/logos/betterment.png",
};

/**
 * Zoom factor for logo images that have extra transparent/white padding baked
 * in, so the actual mark fills the round tile. 1 = no scaling. The tile clips
 * overflow, so scaling up simply crops the empty margins.
 */
export const PROVIDER_LOGO_SCALE: Record<string, number> = {
  TIAA: 2.5,
  // Full-bleed navy square: scale up so it clips to the round tile edges.
  Betterment: 1.15,
};

/**
 * Vertical nudge (in % of the image) for logos that sit slightly off-center.
 * Positive values move the mark down. Applied together with PROVIDER_LOGO_SCALE.
 */
export const PROVIDER_LOGO_OFFSET_Y: Record<string, number> = {
  TIAA: 1.5,
};

/**
 * Providers whose logo mark is a colored square rather than a mark on white.
 * We fill the round logo tile with this color so there's no white ring around
 * the square (e.g. Charles Schwab's light-blue square logo).
 */
export const PROVIDER_LOGO_BG: Record<string, string> = {
  "Charles Schwab": "#00a0df",
  Vanguard: "#c3002a",
  Betterment: "#002060",
};

export const CATALOG: InstitutionAccount[] = [
  {
    id: "vanguard-roth-ira",
    provider: "Vanguard",
    fullName: "Vanguard Roth IRA",
    accountType: "Roth IRA",
    taxStatus: "tax-free",
    category: "brokerage",
    aliases: ["van", "vanguard", "vti", "vtsax", "roth"],
    accentColor: "#96151d",
    estBalance: 42000,
  },
  {
    id: "vanguard-traditional-ira",
    provider: "Vanguard",
    fullName: "Vanguard Traditional IRA",
    accountType: "Traditional IRA",
    taxStatus: "tax-deferred",
    category: "brokerage",
    aliases: ["van", "vanguard", "trad", "ira"],
    accentColor: "#96151d",
    estBalance: 58000,
  },
  {
    id: "vanguard-brokerage",
    provider: "Vanguard",
    fullName: "Vanguard Brokerage Account",
    accountType: "Taxable brokerage",
    taxStatus: "taxable",
    category: "brokerage",
    aliases: ["van", "vanguard", "vti", "brokerage", "taxable"],
    accentColor: "#96151d",
    estBalance: 31000,
  },
  {
    id: "fidelity-401k",
    provider: "Fidelity",
    fullName: "Fidelity 401(k)",
    accountType: "401(k)",
    taxStatus: "tax-deferred",
    category: "employer",
    aliases: ["fid", "fidelity", "401k", "401(k)", "workplace"],
    accentColor: "#368727",
    estBalance: 124000,
  },
  {
    id: "fidelity-roth-ira",
    provider: "Fidelity",
    fullName: "Fidelity Roth IRA",
    accountType: "Roth IRA",
    taxStatus: "tax-free",
    category: "brokerage",
    aliases: ["fid", "fidelity", "roth", "ira"],
    accentColor: "#368727",
    estBalance: 27500,
  },
  {
    id: "fidelity-hsa",
    provider: "Fidelity",
    fullName: "Fidelity HSA",
    accountType: "Health Savings Account",
    taxStatus: "tax-advantaged",
    category: "hsa",
    aliases: ["fid", "fidelity", "hsa", "health"],
    accentColor: "#368727",
    estBalance: 9200,
  },
  {
    id: "schwab-brokerage",
    provider: "Charles Schwab",
    fullName: "Charles Schwab Brokerage Account",
    accountType: "Taxable brokerage",
    taxStatus: "taxable",
    category: "brokerage",
    aliases: ["schwab", "charles", "chuck", "brokerage", "taxable"],
    accentColor: "#00a0df",
    estBalance: 46000,
  },
  {
    id: "schwab-roth-ira",
    provider: "Charles Schwab",
    fullName: "Charles Schwab Roth IRA",
    accountType: "Roth IRA",
    taxStatus: "tax-free",
    category: "brokerage",
    aliases: ["schwab", "charles", "chuck", "roth", "ira"],
    accentColor: "#00a0df",
    estBalance: 33000,
  },
  {
    id: "chase-checking",
    provider: "Chase",
    fullName: "Chase Total Checking",
    accountType: "Checking",
    taxStatus: "taxable",
    category: "bank",
    aliases: ["chase", "jpmorgan", "checking", "bank"],
    accentColor: "#117aca",
    estBalance: 7800,
  },
  {
    id: "chase-savings",
    provider: "Chase",
    fullName: "Chase Savings",
    accountType: "Savings",
    taxStatus: "taxable",
    category: "bank",
    aliases: ["chase", "jpmorgan", "savings", "bank"],
    accentColor: "#117aca",
    estBalance: 15400,
  },
  {
    id: "ally-savings",
    provider: "Ally",
    fullName: "Ally High-Yield Savings",
    accountType: "Savings",
    taxStatus: "taxable",
    category: "bank",
    aliases: ["ally", "hysa", "savings", "bank", "high yield"],
    accentColor: "#6c1d8a",
    estBalance: 21000,
  },
  {
    id: "tiaa-403b",
    provider: "TIAA",
    fullName: "TIAA 403(b)",
    accountType: "403(b)",
    taxStatus: "tax-deferred",
    category: "employer",
    aliases: ["tiaa", "403b", "403(b)", "workplace", "nonprofit"],
    accentColor: "#e21833",
    estBalance: 61000,
  },
];

const MAX_RESULTS = 6;

/** Cheap subsequence test: do all of `q`'s chars appear in order within `s`? */
function isSubsequence(q: string, s: string): boolean {
  let i = 0;
  for (let j = 0; j < s.length && i < q.length; j++) {
    if (s[j] === q[i]) i++;
  }
  return i === q.length;
}

/** Bounded Levenshtein distance (good enough for short single tokens). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

/** The set of strings a query can match against for a given account. */
function haystack(acc: InstitutionAccount): string[] {
  return [
    acc.provider.toLowerCase(),
    acc.fullName.toLowerCase(),
    acc.accountType.toLowerCase(),
    ...(acc.aliases ?? []),
  ];
}

/**
 * Score an account against a normalized query. Lower is better; `null` means no
 * match. Ranking, best (lowest) first:
 *   0  exact match on a field/alias
 *   1  field/alias starts with the query
 *   10 query is a substring of a field/alias
 *   20 typo-tolerant: small edit distance to a word, or subsequence match
 */
function scoreAccount(acc: InstitutionAccount, q: string): number | null {
  const fields = haystack(acc);
  let best: number | null = null;
  const consider = (s: number) => {
    if (best === null || s < best) best = s;
  };

  for (const field of fields) {
    if (field === q) {
      consider(0);
      continue;
    }
    if (field.startsWith(q)) {
      consider(1);
      continue;
    }
    if (field.includes(q)) {
      consider(10);
      continue;
    }
    // Typo tolerance only kicks in for queries long enough to be meaningful.
    if (q.length >= 3) {
      for (const word of field.split(/\s+/)) {
        if (!word) continue;
        const dist = levenshtein(q, word.slice(0, Math.max(word.length, q.length)));
        const allowed = q.length <= 4 ? 1 : 2;
        if (dist <= allowed) {
          consider(20 + dist);
          break;
        }
      }
      if (isSubsequence(q, field)) consider(28);
    }
  }

  return best;
}

/**
 * Case-insensitive, ranked institution search. Exact/startsWith on provider,
 * full name, account type or alias rank first, then substring matches, then a
 * light typo-tolerant fuzzy pass so "vangard" still finds Vanguard.
 */
export function matchInstitutions(query: string): InstitutionAccount[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: { acc: InstitutionAccount; score: number }[] = [];
  for (const acc of CATALOG) {
    const score = scoreAccount(acc, q);
    if (score !== null) scored.push({ acc, score });
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    // Tie-break by provider name then full name for stable, predictable order.
    return a.acc.fullName.localeCompare(b.acc.fullName);
  });

  return scored.slice(0, MAX_RESULTS).map((s) => s.acc);
}

/**
 * Unique account types offered by a provider (case-insensitive exact match on
 * the provider name), in catalog order. Returns [] when the name doesn't match
 * a known provider — callers should fall back to their generic type list.
 */
export function accountTypesForProvider(name: string): string[] {
  const q = name.trim().toLowerCase();
  if (!q) return [];
  const types: string[] = [];
  for (const acc of CATALOG) {
    if (acc.provider.toLowerCase() === q && !types.includes(acc.accountType)) {
      types.push(acc.accountType);
    }
  }
  return types;
}

/**
 * Tax status for an exact provider + account type combination in the catalog
 * (case-insensitive), or null when the pair isn't a known catalog entry.
 */
export function taxStatusFor(
  provider: string,
  accountType: string,
): TaxStatus | null {
  const p = provider.trim().toLowerCase();
  const t = accountType.trim().toLowerCase();
  if (!p || !t) return null;
  const hit = CATALOG.find(
    (acc) =>
      acc.provider.toLowerCase() === p && acc.accountType.toLowerCase() === t,
  );
  return hit ? hit.taxStatus : null;
}

/**
 * Best-effort tax status inferred from the account type alone, for custom
 * providers that aren't in the catalog. Unrecognized types default to
 * "taxable"; only an empty type returns null (nothing to infer from).
 */
export function taxStatusForType(type: string): TaxStatus | null {
  const t = type.trim().toLowerCase();
  if (!t) return null;
  if (t === "roth ira" || t === "roth 401(k)") return "tax-free";
  if (
    ["401(k)", "403(b)", "traditional ira", "sep ira", "pension"].includes(t)
  ) {
    return "tax-deferred";
  }
  if (t === "health savings account") return "tax-advantaged";
  return "taxable";
}

/**
 * Inline ghost-text completion for the current top match. Returns the remaining
 * characters to append to what the user has typed (so the input shows their
 * text + a faded suffix), or "" when there's nothing to complete.
 *
 * Only completes when the top match's provider or full name *starts with* the
 * typed text — a substring/fuzzy hit wouldn't line up visually as a suffix.
 */
export function ghostCompletion(query: string, providerOnly = false): string {
  const q = query.trim().toLowerCase();
  if (!q) return "";

  const [top] = matchInstitutions(q);
  if (!top) return "";

  const candidates = providerOnly ? [top.provider] : [top.provider, top.fullName];
  for (const cand of candidates) {
    if (cand.toLowerCase().startsWith(q) && cand.length > q.length) {
      // Return the catalog's remaining characters so the input shows the user's
      // typed text followed by this faded suffix.
      return cand.slice(q.length);
    }
  }
  return "";
}
