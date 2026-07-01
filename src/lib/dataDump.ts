/**
 * Mock data + helpers for the "Data Dump" prototype. There is no real file
 * parsing, OCR, speech recognition, device pairing or LLM here — everything is
 * simulated. This module just supplies believable seed inputs, a canned voice
 * transcript, a fake phone-scan factory, and a hand-built "structured" result
 * that the faked-AI step returns.
 */

import type { TaxStatus } from "./institutions";

export type DumpItemKind = "text" | "image" | "pdf" | "doc" | "voice" | "scan";

export interface DumpItem {
  id: string;
  kind: DumpItemKind;
  title: string;
  /** Editable body for text/voice items (and any transcript-like content). */
  content?: string;
  /** Object URL or placeholder for image/scan previews. */
  previewUrl?: string;
  fileMeta?: { name: string; size?: string };
  addedVia: "paste" | "upload" | "drop" | "voice" | "phone";
  at: number;
}

/** Unique-ish id for a freshly created dump item. */
export function makeId(prefix = "item"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Pre-loaded examples so the canvas demos immediately. The financial text block
 * is intentionally messy/realistic so the "Structure with AI" step has obvious
 * raw material to clean up.
 */
export const SEED_ITEMS: DumpItem[] = [
  {
    id: "seed-text",
    kind: "text",
    title: "Notes I typed up",
    content: [
      "ok so retirement stuff, dumping everything here:",
      "- 401k at Fidelity, work match, roughly $124k last I checked",
      "- Roth IRA at Vanguard, maybe $42k? been maxing it most years",
      "- old Chase savings ~$15k just sitting there as an emergency fund",
      "take home is about $7,200/mo, we spend somewhere around $5,400/mo",
      "goal: retire around 62, ideally pay off the house first + travel a bit",
    ].join("\n"),
    addedVia: "paste",
    at: Date.now() - 1000 * 60 * 9,
  },
  {
    id: "seed-image",
    kind: "image",
    title: "Statement screenshot",
    fileMeta: { name: "fidelity_oct_statement.png", size: "612 KB" },
    addedVia: "upload",
    at: Date.now() - 1000 * 60 * 7,
  },
  {
    id: "seed-doc",
    kind: "doc",
    title: "Pension summary",
    fileMeta: { name: "pension_summary.docx", size: "84 KB" },
    addedVia: "upload",
    at: Date.now() - 1000 * 60 * 4,
  },
  {
    id: "seed-voice",
    kind: "voice",
    title: "Quick voice note",
    content:
      "Almost forgot, there's a Vanguard brokerage too, the regular taxable one, somewhere around thirty one thousand.",
    addedVia: "voice",
    at: Date.now() - 1000 * 60 * 3,
  },
];

/** Canned dictation streamed word-by-word when the mic is "listening". */
export const VOICE_TRANSCRIPT =
  "So a couple more things to add. I've got a Fidelity HSA with about nine thousand dollars that I forgot about, and we put roughly six hundred a month toward our daughter's college fund. Other than that I think the big goal is being able to stop working full time by sixty two.";

/** The batch of documents that "arrives" from the simulated phone scan. */
export function makeScanItems(): DumpItem[] {
  const at = Date.now();
  return [
    {
      id: makeId("scan"),
      kind: "pdf",
      title: "401(k) statement",
      fileMeta: { name: "401k_statement.pdf", size: "248 KB" },
      addedVia: "phone",
      at,
    },
    {
      id: makeId("scan"),
      kind: "pdf",
      title: "Vanguard Roth statement",
      fileMeta: { name: "vanguard_roth_2025.pdf", size: "196 KB" },
      addedVia: "phone",
      at,
    },
    {
      id: makeId("scan"),
      kind: "image",
      title: "Chase savings screenshot",
      fileMeta: { name: "chase_savings.png", size: "508 KB" },
      addedVia: "phone",
      at,
    },
    {
      id: makeId("scan"),
      kind: "scan",
      title: "Latest payslip",
      fileMeta: { name: "payslip_scan.jpg", size: "1.1 MB" },
      addedVia: "phone",
      at,
    },
  ];
}

export interface StructuredAccount {
  provider: string;
  accountType: string;
  taxStatus: TaxStatus;
  balance: number;
}

/** A single goal row with a stable identity for reliable edit/remove. */
export interface StructuredGoal {
  id: string;
  text: string;
}

export interface StructuredResult {
  summary: string;
  person: { name: string; retireAge?: string };
  accounts: StructuredAccount[];
  incomeMonthly: number;
  spendingMonthly: number;
  goals: StructuredGoal[];
}

/** Believable structured output, consistent with {@link SEED_ITEMS}. */
export const STRUCTURED_RESULT: StructuredResult = {
  summary:
    "Here's your draft profile. Review the details and fix anything I got wrong.",
  person: { name: "Gloria", retireAge: "62" },
  accounts: [
    {
      provider: "Fidelity",
      accountType: "401(k)",
      taxStatus: "tax-deferred",
      balance: 124000,
    },
    {
      provider: "Vanguard",
      accountType: "Roth IRA",
      taxStatus: "tax-free",
      balance: 42000,
    },
    {
      provider: "Vanguard",
      accountType: "Taxable",
      taxStatus: "taxable",
      balance: 31000,
    },
    {
      provider: "Fidelity",
      accountType: "HSA",
      taxStatus: "tax-advantaged",
      balance: 9200,
    },
    {
      provider: "TIAA",
      accountType: "403(b)",
      taxStatus: "tax-deferred",
      balance: 58000,
    },
    {
      provider: "Chase",
      accountType: "Savings",
      taxStatus: "taxable",
      balance: 15000,
    },
  ],
  incomeMonthly: 7200,
  spendingMonthly: 5400,
  goals: [
    "Retire around age 62",
    "Pay off the house first",
    "Travel more in early retirement",
    "Keep funding the college savings",
    "Build a 12-month emergency fund",
  ].map((text, i) => ({ id: `goal-${i}`, text })),
};

/**
 * Returns the mock structured result. Lightly references how many inputs were
 * provided so the summary feels generated from *this* dump.
 */
export function structureDump(items: DumpItem[], notes?: string): StructuredResult {
  // Count the docked attachments plus the notepad itself (if it has content).
  const count = items.length + (notes && notes.trim().length > 0 ? 1 : 0);
  const lead =
    count > 0
      ? `I read your ${count} ${count === 1 ? "input" : "inputs"}. `
      : "";
  return {
    ...STRUCTURED_RESULT,
    summary: lead + STRUCTURED_RESULT.summary,
  };
}
