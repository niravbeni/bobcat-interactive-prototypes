"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Layers, Plus, X } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { DetailsShell } from "@/components/prototypes/details/DetailsShell";
import { AccountSearch } from "@/components/ui/AccountSearch";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DumpCanvas } from "@/components/prototypes/DumpCanvas";
import { cn } from "@/lib/cn";
import {
  TAX_STATUS_LABEL,
  accountTypesForProvider,
  taxStatusFor,
  taxStatusForType,
  type InstitutionAccount,
  type TaxStatus,
} from "@/lib/institutions";
import type { DumpCompletion } from "@/components/prototypes/DumpCanvas";
import { makeId, type DumpItem, type StructuredResult } from "@/lib/dataDump";
import type { AssetRow } from "@/lib/types";

const fmtMoney = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

/**
 * Compact seed notes for the Smart-add canvas. Deliberately mentions only the
 * accounts we surface into the list so what's typed matches what appears.
 */
const MODAL_SEED_NOTES = [
  "ok dumping my retirement stuff here:",
  "- 401k at Fidelity, work match, roughly $124k",
  "- Roth IRA at Vanguard, ~$42k, been maxing it",
  "take home about $7,200/mo, we spend around $5,400/mo",
  "goals: retire around 62, pay off the house first",
].join("\n");

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
  "One more thing I almost forgot — there's also a Fidelity HSA with about nine thousand two hundred in it from my old health plan. The 401k has the full company match, and I've been maxing the Vanguard Roth for years. Main goals are still retiring around sixty two and paying off the house first.";

const makeModalScan = (): DumpItem[] => {
  const at = Date.now();
  return [
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
};

/** Map a tax status to the StatusBadge tone that reads best for it. */
const TAX_BADGE_TONE: Record<TaxStatus, "success" | "warning" | "neutral" | "muted"> = {
  "tax-free": "success",
  "tax-deferred": "neutral",
  taxable: "muted",
  "tax-advantaged": "warning",
};

/** Tax-treatment display order for the grouped account list. */
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

/**
 * Assets details page (frames 979-30454 + states). Ports the Smart Assets body
 * exactly (three add methods, add-account form, tax-grouped list) but backs the
 * account list with the shared details.accounts so edits persist and the
 * sidebar Assets accordion stays in sync.
 */
export function AssetsDetailsScreen() {
  const { answers, setDetails } = useFlow();
  const assets = answers.details.accounts;

  const setAssets = (updater: (prev: AssetRow[]) => AssetRow[]) =>
    setDetails({ accounts: updater(answers.details.accounts) });

  const [mode, setMode] = useState<"manual" | "smart">("manual");
  const [smartMounted, setSmartMounted] = useState(false);

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
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, balance } : a)));

  const removeAsset = (id: string) =>
    setAssets((prev) => prev.filter((a) => a.id !== id));

  const handleDumpComplete = (
    result: StructuredResult,
    completion: DumpCompletion,
  ) => {
    const mentioned: Array<{ provider: string; accountType: string }> = [
      { provider: "Fidelity", accountType: "401(k)" },
      { provider: "Vanguard", accountType: "Roth IRA" },
    ];
    if (completion.voiceUsed) {
      mentioned.push({ provider: "Fidelity", accountType: "HSA" });
    }
    if (completion.scanUsed) {
      mentioned.push({ provider: "Chase", accountType: "Savings" });
    }
    const detected = mentioned
      .map((m) =>
        result.accounts.find(
          (a) => a.provider === m.provider && a.accountType === m.accountType,
        ),
      )
      .filter((a): a is (typeof result.accounts)[number] => Boolean(a));
    setAssets((prev) => {
      const has = (provider: string, accountType?: string) =>
        prev.some(
          (a) => a.provider === provider && a.accountType === accountType,
        );
      return [
        ...prev,
        ...detected
          .filter((acc) => !has(acc.provider, acc.accountType))
          .map((acc, i) => ({
            id: `ai-${Date.now()}-${i}`,
            provider: acc.provider,
            accountType: acc.accountType,
            taxStatus: acc.taxStatus,
            balance: acc.balance,
            source: "ai" as const,
          })),
      ];
    });
  };

  const groupedAssets = TAX_OPTIONS.map((tax) => ({
    tax,
    rows: assets.filter((a) => a.taxStatus === tax),
  })).filter((g) => g.rows.length > 0);

  const total = assets.reduce((sum, a) => sum + (a.balance ?? 0), 0);
  const hasAmounts = assets.some((a) => a.balance !== null);

  return (
    <DetailsShell>
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
          Here&apos;s the data we&apos;ve collected so far about you.
          <br />
          All fields are required unless they have an optional tag.
        </p>
      </motion.div>

      <motion.div
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"
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
          onClick={() => {
            setMode("smart");
            setSmartMounted(true);
          }}
        />
      </motion.div>

      <div className="mt-4 flex w-full flex-1 flex-col">
        {smartMounted ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "flex-1 flex-col",
              mode === "smart" ? "flex" : "hidden",
            )}
          >
            <DumpCanvas
              title={null}
              continueLabel="Add to my accounts"
              autotype
              seedNotes={MODAL_SEED_NOTES}
              seedItems={MODAL_SEED_ITEMS}
              voiceTranscript={MODAL_VOICE_TRANSCRIPT}
              makeScan={makeModalScan}
              onComplete={handleDumpComplete}
            />
          </motion.div>
        ) : null}
        <div className={mode === "manual" ? undefined : "hidden"}>
          <AccountEntryForm onAdd={addManual} />
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {assets.length === 0 ? (
            <div className="rounded-card border border-dashed border-stroke-subtle bg-white/60 px-5 py-6 text-center text-sm text-gray-2">
              No accounts yet. Add one manually, connect a bank, or use Smart
              add.
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
          <div className="mt-3 flex items-baseline justify-between gap-2 px-1 pb-6">
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
    </DetailsShell>
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
  const [taxOverride, setTaxOverride] = useState<TaxStatus | null>(null);
  const [amount, setAmount] = useState("");

  const providerTypes = accountTypesForProvider(name);
  const typeOptions =
    providerTypes.length > 0 ? providerTypes : ACCOUNT_TYPE_OPTIONS;

  const derivedTax: TaxStatus | null =
    taxStatusFor(name, accountType) ?? taxStatusForType(accountType);
  const effectiveTax: TaxStatus = taxOverride ?? derivedTax ?? "taxable";

  const handleTypeChange = (next: string) => {
    setAccountType(next);
    setTaxOverride(null);
  };

  const handleNameChange = (next: string) => {
    setName(next);
    const nextTypes = accountTypesForProvider(next);
    if (nextTypes.length > 0) {
      setAccountType((prev) => {
        if (prev && !nextTypes.includes(prev)) {
          setTaxOverride(null);
          return "";
        }
        return prev;
      });
    }
  };

  const handleSelect = (acc: InstitutionAccount) => {
    setName(acc.provider);
    setAccountType(acc.accountType);
    setTaxOverride(null);
  };

  const canAdd = name.trim().length > 0;

  const submit = () => {
    if (!canAdd) return;
    const digits = amount.replace(/[^0-9]/g, "");
    onAdd({
      provider: name.trim(),
      accountType: accountType.trim(),
      taxStatus: effectiveTax,
      balance: digits === "" ? null : Number(digits),
    });
    setName("");
    setAccountType("");
    setTaxOverride(null);
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
            onSelect={handleSelect}
            onQueryChange={handleNameChange}
            value={name}
            clearOnSelect={false}
            providerGhost
            compact
            placeholder="Search or type an account name…"
          />
        </Field>
        <Field label="Account type">
          <SelectWrap>
            <select
              value={accountType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="h-11 w-full appearance-none rounded-field border border-stroke-subtle bg-white px-3 pr-9 text-sm outline-none transition-colors focus:border-violet/50"
            >
              <option value="">Select account type</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </SelectWrap>
        </Field>
        <Field label="Tax treatment">
          <SelectWrap>
            <select
              value={effectiveTax}
              onChange={(e) => setTaxOverride(e.target.value as TaxStatus)}
              className="h-11 w-full appearance-none rounded-field border border-stroke-subtle bg-white px-3 pr-9 text-sm text-deep-black outline-none transition-colors focus:border-violet/50"
            >
              {TAX_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {TAX_STATUS_LABEL[t]}
                </option>
              ))}
            </select>
          </SelectWrap>
        </Field>
        <Field label="Amount">
          <div className="flex h-11 items-center rounded-field border border-stroke-subtle bg-white px-3.5 transition-colors focus-within:border-violet/50">
            <span className="text-sm text-gray-1">$</span>
            <input
              inputMode="numeric"
              value={
                amount === ""
                  ? ""
                  : Number(amount.replace(/[^0-9]/g, "")).toLocaleString("en-US")
              }
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
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

/** Relative wrapper that overlays a custom chevron on a native `<select>`. */
function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-2" />
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
