"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { AccountSearch } from "@/components/ui/AccountSearch";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DumpCanvas } from "@/components/prototypes/DumpCanvas";
import {
  TAX_STATUS_LABEL,
  type InstitutionAccount,
  type TaxStatus,
} from "@/lib/institutions";
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

/** Example content typed into the custom-account form when it opens. */
const MANUAL_DEFAULTS = {
  provider: "Betterment",
  accountType: "Roth IRA",
  taxStatus: "tax-free" as TaxStatus,
  amount: "18500",
};

export function SmartAssetsScreen() {
  const { goBack } = useFlow();

  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [aiSummary, setAiSummary] = useState<StructuredResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const addFromSearch = (acc: InstitutionAccount) =>
    setAssets((prev) => [
      ...prev,
      {
        id: `${acc.id}-${Date.now()}`,
        provider: acc.provider,
        accountType: acc.accountType,
        taxStatus: acc.taxStatus,
        balance: null,
        source: "search",
        accentColor: acc.accentColor,
      },
    ]);

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
    setAiSummary({ ...result, accounts: detected });
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
    setModalOpen(false);
  };

  const total = assets.reduce((sum, a) => sum + (a.balance ?? 0), 0);
  const hasAmounts = assets.some((a) => a.balance !== null);

  // Group the list by tax treatment (stable within each tag).
  const sortedAssets = [...assets].sort(
    (a, b) =>
      TAX_OPTIONS.indexOf(a.taxStatus) - TAX_OPTIONS.indexOf(b.taxStatus),
  );

  // Left panel mirrors the list: the "Accounts" step shows a live count and,
  // once anything is added, an expanded folder lists each account with its
  // balance so the sidebar stays in sync with what's on the right.
  const sidebarConfig = {
    subSections: [
      { label: "About You" },
      {
        label: "Accounts",
        active: true,
        value:
          assets.length > 0
            ? `${assets.length} ${assets.length === 1 ? "account" : "accounts"}`
            : undefined,
      },
      { label: "Income" },
      { label: "Spending" },
      { label: "Goals" },
    ],
    folders:
      assets.length > 0
        ? [
            {
              title: "Your accounts",
              value: hasAmounts ? fmtMoney(total) : undefined,
              items: sortedAssets.map((a) => ({
                label: a.accountType
                  ? `${a.provider} ${a.accountType}`
                  : a.provider,
                value: a.balance !== null ? fmtMoney(a.balance) : undefined,
              })),
            },
          ]
        : undefined,
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

          {/* Two ways to bring in everything at once. Once the list has any
              accounts, these collapse into a slim bar to save vertical space
              so the whole page fits without scrolling. */}
          {assets.length === 0 ? (
            <motion.div
              className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
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
                title="Add what you have"
                description="Drop in statements, notes or a voice memo — AI does the rest."
                accent
                onClick={() => setModalOpen(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              className="mt-5 grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                type="button"
                onClick={() => {}}
                className="group flex items-center gap-2.5 rounded-card border border-stroke-subtle bg-white px-3.5 py-3.5 text-left transition-colors hover:border-violet/50 hover:bg-violet/5 xl:py-5 3xl:py-6"
              >
                <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stroke-subtle bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logos/plaid.png"
                    alt=""
                    className="size-full object-contain p-1"
                  />
                </span>
                <span className="truncate text-sm font-medium text-deep-black">
                  Connect with Plaid
                </span>
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="ai-glow group flex items-center gap-2.5 rounded-card border border-violet/40 bg-white px-3.5 py-3.5 text-left transition-colors hover:border-violet xl:py-5 3xl:py-6"
              >
                <AskSendIcon className="size-5 shrink-0" />
                <span className="truncate text-sm font-medium text-deep-black">
                  Add what you have
                </span>
              </button>
            </motion.div>
          )}

          {/* Manual add */}
          <div className="mt-6 flex w-full flex-1 flex-col">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-stroke-subtle" />
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-gray-2">
                or add manually
              </span>
              <span className="h-px flex-1 bg-stroke-subtle" />
            </div>

            <div className="mt-4">
              <AccountSearch
                onSelect={addFromSearch}
                placeholder="Search for a bank or provider…"
                showIcon={false}
              />
            </div>

            {/* Custom account (not one of the popular providers) */}
            <div className="mt-3">
              <AnimatePresence initial={false} mode="wait">
                {manualOpen ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <ManualAddForm
                      onAdd={addManual}
                      onClose={() => setManualOpen(false)}
                    />
                  </motion.div>
                ) : (
                  <motion.button
                    key="toggle"
                    type="button"
                    onClick={() => setManualOpen(true)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-1 transition-colors hover:text-violet"
                  >
                    <Plus className="size-4" strokeWidth={2} />
                    Can&rsquo;t find it? Add a custom account
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Flat account list */}
            <div className="mt-4 flex flex-col gap-2">
              {assets.length === 0 ? (
                <div className="rounded-card border border-dashed border-stroke-subtle bg-white/60 px-5 py-8 text-center text-sm text-gray-2">
                  No accounts yet. Connect, add what you have, or search above.
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {sortedAssets.map((asset) => (
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

            {/* AI-determined profile summary (deprioritized) */}
            {aiSummary ? <AiSummaryCard result={aiSummary} /> : null}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen ? (
          <AddModal
            onClose={() => setModalOpen(false)}
            onComplete={handleDumpComplete}
          />
        ) : null}
      </AnimatePresence>
    </AppShell>
  );
}

/* ============================================================= option card == */

function OptionCard({
  visual,
  title,
  description,
  accent,
  onClick,
}: {
  visual: React.ReactNode;
  title: string;
  description: string;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        accent
          ? "ai-glow group flex h-full flex-col items-start gap-2.5 rounded-card border border-violet/40 bg-white px-4 py-4 text-left transition-colors hover:border-violet"
          : "group flex h-full flex-col items-start gap-2.5 rounded-card border border-stroke-subtle bg-white px-4 py-4 text-left transition-colors hover:border-violet/50 hover:bg-violet/5"
      }
    >
      {visual}
      <span className="text-base font-semibold text-deep-black">{title}</span>
      <span className="text-sm leading-snug text-gray-1">{description}</span>
    </button>
  );
}

/* =========================================================== manual form == */

/** Inline form to add an account that isn't in the popular-providers catalog. */
function ManualAddForm({
  onAdd,
  onClose,
}: {
  onAdd: (row: {
    provider: string;
    accountType: string;
    taxStatus: TaxStatus;
    balance: number | null;
  }) => void;
  onClose: () => void;
}) {
  const [provider, setProvider] = useState("");
  const [accountType, setAccountType] = useState("");
  const [taxStatus, setTaxStatus] = useState<TaxStatus>("taxable");
  const [amount, setAmount] = useState("");

  // On open, type in some example content so the form fills itself in live.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (fn: () => void, delay: number) =>
      timers.push(setTimeout(fn, delay));

    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      at(() => {
        setProvider(MANUAL_DEFAULTS.provider);
        setAccountType(MANUAL_DEFAULTS.accountType);
        setTaxStatus(MANUAL_DEFAULTS.taxStatus);
        setAmount(MANUAL_DEFAULTS.amount);
      }, 0);
      return () => timers.forEach(clearTimeout);
    }

    const step = 45;
    let t = 250;
    const typeInto = (text: string, setter: (v: string) => void) => {
      for (let i = 1; i <= text.length; i += 1) {
        const slice = text.slice(0, i);
        at(() => setter(slice), t);
        t += step;
      }
      t += 250;
    };

    typeInto(MANUAL_DEFAULTS.provider, setProvider);
    typeInto(MANUAL_DEFAULTS.accountType, setAccountType);
    at(() => setTaxStatus(MANUAL_DEFAULTS.taxStatus), t);
    t += 300;
    typeInto(MANUAL_DEFAULTS.amount, setAmount);

    return () => timers.forEach(clearTimeout);
  }, []);

  const canAdd = provider.trim().length > 0;

  const submit = () => {
    if (!canAdd) return;
    const digits = amount.replace(/[^0-9]/g, "");
    onAdd({
      provider: provider.trim(),
      accountType: accountType.trim(),
      taxStatus,
      balance: digits === "" ? null : Number(digits),
    });
    setProvider("");
    setAccountType("");
    setTaxStatus("taxable");
    setAmount("");
    onClose();
  };

  return (
    <div className="rounded-card border border-stroke-subtle bg-ghost-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-1">
          Add a custom account
        </span>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="shrink-0 rounded-full p-1 text-gray-2 transition-colors hover:bg-white hover:text-deep-black"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Account name">
          <input
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="e.g. Betterment"
            className="w-full rounded-field border border-stroke-subtle bg-white px-3.5 py-2.5 text-sm text-deep-black outline-none transition-colors placeholder:text-gray-2 focus:border-violet/50"
          />
        </Field>
        <Field label="Account type">
          <input
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            placeholder="e.g. Roth IRA"
            className="w-full rounded-field border border-stroke-subtle bg-white px-3.5 py-2.5 text-sm text-deep-black outline-none transition-colors placeholder:text-gray-2 focus:border-violet/50"
          />
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

/* ============================================================ ai summary == */

/** Compose a short, plain-language paragraph summarising the AI's read. */
function buildSummaryParagraph(result: StructuredResult): string {
  const count = result.accounts.length;
  const total = result.accounts.reduce((sum, a) => sum + a.balance, 0);
  const goals = result.goals
    .filter((g) => g.text.trim().length > 0)
    .slice(0, 2)
    .map((g) => g.text.charAt(0).toLowerCase() + g.text.slice(1));

  const parts: string[] = [];
  parts.push(
    count > 0
      ? `From what you shared, I found ${count} account${count === 1 ? "" : "s"}${total > 0 ? ` worth about ${fmtMoney(total)}` : ""}, take-home pay of ~${fmtMoney(result.incomeMonthly)}/mo and spending of ~${fmtMoney(result.spendingMonthly)}/mo${result.person.retireAge ? `, aiming to retire around ${result.person.retireAge}` : ""}.`
      : `You take home ~${fmtMoney(result.incomeMonthly)}/mo and spend ~${fmtMoney(result.spendingMonthly)}/mo.`,
  );
  if (goals.length > 0) {
    parts.push(`Priorities: ${goals.join(" and ")}.`);
  }
  return parts.join(" ");
}

function AiSummaryCard({ result }: { result: StructuredResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mt-4 rounded-card border border-stroke-subtle bg-ghost-white px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <AskSendIcon className="size-5 shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-1">
          AI Summary
        </span>
      </div>

      <p className="mt-1.5 text-sm leading-snug text-gray-1">
        {buildSummaryParagraph(result)}
      </p>
    </motion.div>
  );
}

/* ================================================================== modal == */

/**
 * Large overlay that hosts the shared Data Dump canvas. On completion it hands
 * the structured result back to the screen (which fills the AI summary + appends
 * detected accounts) and closes.
 */
function AddModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (result: StructuredResult) => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <motion.div
        className="absolute inset-0 bg-deep-black/50"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden="true"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Add what you have"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex h-[86vh] w-full max-w-[920px] flex-col overflow-hidden rounded-field bg-card shadow-[0_24px_64px_rgba(16,24,32,0.28)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stroke-subtle px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.01em] text-deep-black">
              Add what you have
            </h2>
            <p className="mt-0.5 text-sm text-gray-2">
              Drop in files, screenshots, notes, a voice memo or a phone scan —
              AI will pull out your accounts.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
          <DumpCanvas
            title={null}
            continueLabel="Add to my accounts"
            autotype
            seedNotes={MODAL_SEED_NOTES}
            seedItems={MODAL_SEED_ITEMS}
            voiceTranscript={MODAL_VOICE_TRANSCRIPT}
            makeScan={makeModalScan}
            onComplete={onComplete}
          />
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
