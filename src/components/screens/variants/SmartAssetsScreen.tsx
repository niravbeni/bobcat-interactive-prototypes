"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Layers, Plus, X } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { AccountSearch } from "@/components/ui/AccountSearch";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DumpCanvas } from "@/components/prototypes/DumpCanvas";
import { cn } from "@/lib/cn";
import { TAX_STATUS_LABEL, type TaxStatus } from "@/lib/institutions";
import { makeId, type DumpItem, type StructuredResult } from "@/lib/dataDump";

const fmtMoney = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

/**
 * Compact seed notes for the "Add what you have" modal. Deliberately mentions
 * only the two accounts we surface into the list (Fidelity 401k + Vanguard Roth)
 * so what's typed matches what appears — and so the list stays short enough to
 * fit on screen without scrolling.
 */
const MODAL_SEED_NOTES = [
  "ok dumping my retirement stuff here:",
  "- 401k at Fidelity, work match, roughly $124k",
  "- Roth IRA at Vanguard, ~$42k, been maxing it",
  "take home about $7,200/mo, we spend around $5,400/mo",
  "goals: retire around 62, pay off the house first",
].join("\n");

/**
 * Everything the modal seeds must line up with each other AND with what we
 * import into the list (Fidelity 401k + Vanguard Roth). The docked attachment,
 * voice memo and phone-scanned docs all reference only those two accounts plus
 * income/spending/retire age — no stray HSA, Chase or pension that never appear.
 */
const MODAL_SEED_ITEMS: DumpItem[] = [
  {
    id: "modal-seed-fidelity",
    kind: "image",
    title: "Fidelity 401(k) statement",
    fileMeta: { name: "fidelity_401k_statement.png", size: "612 KB" },
    addedVia: "upload",
    at: Date.now() - 1000 * 60 * 6,
  },
];

const MODAL_VOICE_TRANSCRIPT =
  "A couple more details on those two. The Fidelity 401k has the full company match, and I've been maxing the Vanguard Roth for years. Take-home is about seventy two hundred a month, we spend around fifty four hundred, and the main goals are retiring around sixty two and paying off the house first.";

const makeModalScan = (): DumpItem[] => {
  const at = Date.now();
  return [
    {
      id: makeId("scan"),
      kind: "pdf",
      title: "Vanguard Roth IRA statement",
      fileMeta: { name: "vanguard_roth_2025.pdf", size: "196 KB" },
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
};

/** Map a tax status to the StatusBadge tone that reads best for it. */
const TAX_BADGE_TONE: Record<TaxStatus, "success" | "warning" | "neutral" | "muted"> = {
  "tax-free": "success",
  "tax-deferred": "neutral",
  taxable: "muted",
  "tax-advantaged": "warning",
};

/** One account line in the flat list. Amount is null until it's entered. */
type AssetRow = {
  id: string;
  provider: string;
  accountType?: string;
  taxStatus: TaxStatus;
  balance: number | null;
  source: "search" | "ai" | "plaid" | "manual";
  accentColor?: string;
};

/** Ordered tax options offered in the custom-account form. */
const TAX_OPTIONS: TaxStatus[] = [
  "tax-free",
  "tax-deferred",
  "taxable",
  "tax-advantaged",
];

/** Account types offered in the add-account form dropdown. */
const ACCOUNT_TYPE_OPTIONS: string[] = [
  "401(k)",
  "Roth 401(k)",
  "403(b)",
  "Traditional IRA",
  "Roth IRA",
  "SEP IRA",
  "Health Savings Account",
  "Taxable brokerage",
  "Checking",
  "Savings",
  "CD",
  "Pension",
  "Other",
];

export function SmartAssetsScreen() {
  const { goBack } = useFlow();

  const [assets, setAssets] = useState<AssetRow[]>([]);
  // The active input mode. "Connect with Plaid" is a placeholder and never
  // becomes active, so only manual / smart are tracked here.
  const [mode, setMode] = useState<"manual" | "smart">("manual");
  // Bumped after each Smart add so the canvas remounts to a fresh, editable
  // state (it only autotypes the demo on its first mount).
  const [smartRun, setSmartRun] = useState(0);

  const addManual = (row: {
    provider: string;
    accountType: string;
    taxStatus: TaxStatus;
    balance: number | null;
  }) =>
    setAssets((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        provider: row.provider,
        accountType: row.accountType || undefined,
        taxStatus: row.taxStatus,
        balance: row.balance,
        source: "manual",
      },
    ]);

  const setBalance = (id: string, balance: number | null) =>
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, balance } : a)),
    );

  const removeAsset = (id: string) =>
    setAssets((prev) => prev.filter((a) => a.id !== id));

  const handleDumpComplete = (result: StructuredResult) => {
    // Only surface the accounts the notes actually mention (401k at Fidelity,
    // Roth IRA at Vanguard) so the list matches what was typed — and keep it
    // small so the whole page fits without scrolling, even after the user also
    // adds a custom account and a searched one.
    const MENTIONED: Array<{ provider: string; accountType: string }> = [
      { provider: "Fidelity", accountType: "401(k)" },
      { provider: "Vanguard", accountType: "Roth IRA" },
    ];
    const detected = MENTIONED.map((m) =>
      result.accounts.find(
        (a) => a.provider === m.provider && a.accountType === m.accountType,
      ),
    ).filter((a): a is (typeof result.accounts)[number] => Boolean(a));
    setAssets((prev) => [
      ...prev,
      ...detected.map((acc, i) => ({
        id: `ai-${Date.now()}-${i}`,
        provider: acc.provider,
        accountType: acc.accountType,
        taxStatus: acc.taxStatus,
        balance: acc.balance,
        source: "ai" as const,
      })),
    ]);
    // Stay in Smart add; just remount the canvas to a fresh editable state so
    // the newly added accounts show in the list below without leaving the mode.
    setSmartRun((n) => n + 1);
  };

  // Group assets by tax treatment for the headed list (order = TAX_OPTIONS).
  const groupedAssets = TAX_OPTIONS.map((tax) => ({
    tax,
    rows: assets.filter((a) => a.taxStatus === tax),
  })).filter((g) => g.rows.length > 0);

  const total = assets.reduce((sum, a) => sum + (a.balance ?? 0), 0);
  const hasAmounts = assets.some((a) => a.balance !== null);

  // Group the list by tax treatment (stable within each tag).
  const sortedAssets = [...assets].sort(
    (a, b) =>
      TAX_OPTIONS.indexOf(a.taxStatus) - TAX_OPTIONS.indexOf(b.taxStatus),
  );

  // Left panel mirrors the list: the added accounts are nested directly under
  // the "Accounts" step (with a running total on the row) so the sidebar stays
  // in sync with what's on the right — no separate section at the bottom.
  const sidebarConfig = {
    sticky: true,
    subSections: [
      { label: "About You" },
      {
        label: "Accounts",
        active: true,
        value: hasAmounts
          ? fmtMoney(total)
          : assets.length > 0
            ? `${assets.length} ${assets.length === 1 ? "account" : "accounts"}`
            : undefined,
        items:
          assets.length > 0
            ? sortedAssets.map((a) => ({
                label: a.accountType
                  ? `${a.provider} ${a.accountType}`
                  : a.provider,
                value: a.balance !== null ? fmtMoney(a.balance) : undefined,
              }))
            : undefined,
      },
      { label: "Income" },
      { label: "Spending" },
      { label: "Goals" },
    ],
  };

  return (
    <AppShell card={false} sidebar={sidebarConfig}>
      <div className="flex w-full flex-1 flex-col rounded-field bg-card px-5 py-5 xl:px-10 xl:py-6 3xl:px-14 3xl:py-8">
        <div className="mx-auto flex w-full max-w-[820px] flex-1 flex-col xl:max-w-[1040px] 3xl:max-w-[1220px]">
          <BackButton onClick={goBack} />

          <motion.div
            className="mt-3 max-w-[680px]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black sm:text-[30px]">
              Add your accounts
            </h1>
            <p className="mt-1.5 text-sm leading-snug text-black/70">
              Link, drop in everything you have, or add accounts one by one.
            </p>
          </motion.div>

          {/* Three ways to add accounts (see layout reference). Manual + Smart
              add are selectable modes; Connect with Plaid is a placeholder. */}
          <motion.div
            className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <OptionCard
              visual={
                <span className="flex size-10 items-center justify-center rounded-full border border-stroke-subtle bg-white text-deep-black">
                  <Layers className="size-5" strokeWidth={1.9} />
                </span>
              }
              title="Add account manually"
              description="Create your account information from scratch."
              selected={mode === "manual"}
              onClick={() => setMode("manual")}
            />
            <OptionCard
              visual={
                <span className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-stroke-subtle bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logos/plaid.png"
                    alt=""
                    className="size-full object-contain p-1.5"
                  />
                </span>
              }
              title="Connect with Plaid"
              description="Securely link your banks and brokerages."
              onClick={() => {}}
            />
            <OptionCard
              visual={
                <span className="flex size-10 items-center justify-center">
                  <AskSendIcon className="size-7" />
                </span>
              }
              title="Smart add"
              description="Drop in statements, notes or a voice memo. Violet will then digest your data and let you add & edit."
              accent
              selected={mode === "smart"}
              onClick={() => setMode("smart")}
            />
          </motion.div>

          {/* Input area — swaps with the selected mode */}
          <div className="mt-6 flex w-full flex-1 flex-col">
            <AnimatePresence mode="wait" initial={false}>
              {mode === "smart" ? (
                <motion.div
                  key="smart"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-1 flex-col"
                >
                  <DumpCanvas
                    key={smartRun}
                    title={null}
                    continueLabel="Add to my accounts"
                    autotype={smartRun === 0}
                    seedNotes={MODAL_SEED_NOTES}
                    seedItems={MODAL_SEED_ITEMS}
                    voiceTranscript={MODAL_VOICE_TRANSCRIPT}
                    makeScan={makeModalScan}
                    onComplete={handleDumpComplete}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="manual"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <AccountEntryForm onAdd={addManual} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Account list grouped by tax treatment */}
            <div className="mt-5 flex flex-col gap-4">
              {assets.length === 0 ? (
                <div className="rounded-card border border-dashed border-stroke-subtle bg-white/60 px-5 py-8 text-center text-sm text-gray-2">
                  No accounts yet. Add one manually, connect a bank, or use
                  Smart add.
                </div>
              ) : (
                groupedAssets.map((group) => (
                  <div key={group.tax} className="flex flex-col gap-2">
                    <span className="px-1 text-xs font-semibold uppercase tracking-[0.08em] text-gray-1">
                      {TAX_STATUS_LABEL[group.tax]}
                    </span>
                    <AnimatePresence initial={false}>
                      {group.rows.map((asset) => (
                        <motion.div
                          key={asset.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <AssetLine
                            asset={asset}
                            onBalanceChange={(v) => setBalance(asset.id, v)}
                            onRemove={() => removeAsset(asset.id)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>

            {hasAmounts ? (
              <div className="mt-3 flex items-baseline justify-between gap-2 px-1">
                <span className="text-sm text-gray-2">
                  Total across {assets.length}{" "}
                  {assets.length === 1 ? "account" : "accounts"}
                </span>
                <span className="text-xl font-semibold tracking-[-0.01em] text-deep-black">
                  {fmtMoney(total)}
                </span>
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ============================================================= option card == */

function OptionCard({
  visual,
  title,
  description,
  accent,
  selected,
  onClick,
}: {
  visual: React.ReactNode;
  title: string;
  description: string;
  accent?: boolean;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative flex h-full flex-col items-start gap-2.5 rounded-card border bg-white px-4 py-4 text-left transition-colors",
        selected
          ? "border-violet ring-1 ring-violet/40"
          : accent
            ? "ai-glow border-violet/40 hover:border-violet"
            : "border-stroke-subtle hover:border-violet/50 hover:bg-violet/5",
      )}
    >
      {selected ? (
        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-stratosphere text-white">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      ) : null}
      {visual}
      <span className="text-base font-semibold text-deep-black">{title}</span>
      <span className="text-sm leading-snug text-gray-1">{description}</span>
    </button>
  );
}

/* ========================================================= entry form == */

/**
 * Unified add-account form: the "Account name" field is the AI search combobox.
 * Picking a matched provider pre-fills the type + tax treatment; fully custom
 * names type straight through. The user sets the amount and clicks Add.
 */
function AccountEntryForm({
  onAdd,
}: {
  onAdd: (row: {
    provider: string;
    accountType: string;
    taxStatus: TaxStatus;
    balance: number | null;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [taxStatus, setTaxStatus] = useState<TaxStatus>("taxable");
  const [amount, setAmount] = useState("");

  const canAdd = name.trim().length > 0;

  const submit = () => {
    if (!canAdd) return;
    const digits = amount.replace(/[^0-9]/g, "");
    onAdd({
      provider: name.trim(),
      accountType: accountType.trim(),
      taxStatus,
      balance: digits === "" ? null : Number(digits),
    });
    setName("");
    setAccountType("");
    setTaxStatus("taxable");
    setAmount("");
  };

  return (
    <div className="rounded-card border border-stroke-subtle bg-ghost-white p-4">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-1">
        Add an account
      </span>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Account name">
          <AccountSearch
            onSelect={() => {}}
            onQueryChange={setName}
            value={name}
            clearOnSelect={false}
            nameOnly
            placeholder="Search or type an account name…"
          />
        </Field>
        <Field label="Account type">
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="w-full rounded-field border border-stroke-subtle bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-violet/50"
          >
            <option value="">Select account type</option>
            {ACCOUNT_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tax treatment">
          <select
            value={taxStatus}
            onChange={(e) => setTaxStatus(e.target.value as TaxStatus)}
            className="w-full rounded-field border border-stroke-subtle bg-white px-3 py-2.5 text-sm text-deep-black outline-none transition-colors focus:border-violet/50"
          >
            {TAX_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TAX_STATUS_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount">
          <div className="flex items-center rounded-field border border-stroke-subtle bg-white px-3.5 py-2.5 transition-colors focus-within:border-violet/50">
            <span className="text-sm text-gray-1">$</span>
            <input
              inputMode="numeric"
              value={
                amount === ""
                  ? ""
                  : Number(amount.replace(/[^0-9]/g, "")).toLocaleString("en-US")
              }
              onChange={(e) =>
                setAmount(e.target.value.replace(/[^0-9]/g, ""))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="Add amount"
              className="ml-1 w-full bg-transparent text-sm font-medium text-deep-black outline-none placeholder:font-normal placeholder:text-gray-2"
            />
          </div>
        </Field>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={!canAdd}
          className="inline-flex items-center gap-2 rounded-pill bg-deep-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-divider disabled:text-gray-text"
        >
          <Plus className="size-4" strokeWidth={2.2} />
          Add account
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-2">{label}</span>
      {children}
    </label>
  );
}

/* ============================================================== asset line == */

function AssetLine({
  asset,
  onBalanceChange,
  onRemove,
}: {
  asset: AssetRow;
  onBalanceChange: (value: number | null) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-stroke-subtle bg-white px-3.5 py-2">
      <ProviderLogo
        provider={asset.provider}
        accentColor={asset.accentColor}
        className="size-9"
        textClassName="text-xs"
      />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-sm font-medium text-deep-black">
          {asset.provider}
        </span>
        {asset.accountType ? (
          <span className="truncate text-xs text-gray-2">
            {asset.accountType}
          </span>
        ) : null}
      </div>

      <StatusBadge tone={TAX_BADGE_TONE[asset.taxStatus]}>
        {TAX_STATUS_LABEL[asset.taxStatus]}
      </StatusBadge>

      <AmountField value={asset.balance} onChange={onBalanceChange} />

      <button
        type="button"
        aria-label={`Remove ${asset.provider}`}
        onClick={onRemove}
        className="shrink-0 rounded-full p-1.5 text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
      >
        <X className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}

/** Always-editable amount pill; empty until the user types a value in. */
function AmountField({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="flex shrink-0 items-center rounded-pill border border-stroke-subtle bg-white pl-2.5 pr-1 py-1 transition-colors focus-within:border-violet/50 focus-within:ring-2 focus-within:ring-violet/20">
      <span className="text-sm text-gray-1">$</span>
      <input
        inputMode="numeric"
        value={value === null ? "" : value.toLocaleString("en-US")}
        placeholder="Add amount"
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "");
          onChange(digits === "" ? null : Number(digits));
        }}
        className="w-[104px] bg-transparent px-1.5 text-right text-sm font-medium text-deep-black outline-none placeholder:text-gray-2 placeholder:font-normal"
      />
    </div>
  );
}
