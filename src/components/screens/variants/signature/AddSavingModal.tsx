"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  Info,
  Lock,
  Plus,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AccountSearch } from "@/components/ui/AccountSearch";
import { DumpCanvas, type DumpCompletion } from "@/components/prototypes/DumpCanvas";
import {
  makeId,
  type DumpItem,
  type StructuredAccount,
  type StructuredResult,
} from "@/lib/dataDump";
import {
  TAX_STATUS_LABEL,
  accountTypesForProvider,
  taxStatusFor,
  taxStatusForType,
  type InstitutionAccount,
  type TaxStatus,
} from "@/lib/institutions";
import { SIG_EASE } from "./shared";
import type { SigAsset } from "./SignatureAssetsScreen";

/**
 * Seed inputs for the Smart-Add canvas, mirrored from the details flow
 * (AssetsDetailsScreen) so the mechanic reads identically. The typed notes are
 * cosmetic — the structured balances come from the shared dataDump result — so
 * we keep the same figures the details flow uses for consistency.
 */
const MODAL_SEED_NOTES = [
  "ok dumping my retirement stuff here:",
  "- 401k at Fidelity, roughly $500k",
  "- Roth IRA at Vanguard, ~$320k (mine plus my late husband's)",
  "- CDs & money market at Ally, about $400k",
  "- checking + savings, another ~$100k",
  "guaranteed income ~$5,600/mo (SS $2,400, pension $2,000, survivor $1,200)",
  "spending runs around $12k/mo",
  "goal: leaving behind enough for the family",
].join("\n");

const MODAL_SEED_ITEMS: DumpItem[] = [
  {
    id: "sig-modal-seed-fidelity",
    kind: "image",
    title: "Fidelity 401(k) statement",
    fileMeta: { name: "fidelity_401k_statement.png", size: "612 KB" },
    addedVia: "upload",
    at: Date.now() - 1000 * 60 * 6,
  },
];

const MODAL_VOICE_TRANSCRIPT =
  "One more thing I almost forgot — there's also a Fidelity HSA with about nine thousand two hundred in it from my old health plan. The 401k's been with Fidelity for years, and the Vanguard Roth includes my late husband's. My main goal now is making sure there's enough to leave behind for the family.";

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

const TAX_OPTIONS: TaxStatus[] = [
  "tax-free",
  "tax-deferred",
  "taxable",
  "tax-advantaged",
];

const ACCOUNT_TYPE_OPTIONS = [
  "401(k)",
  "Roth 401(k)",
  "403(b)",
  "Traditional IRA",
  "Roth IRA",
  "SEP IRA",
  "SIMPLE IRA",
  "Health Savings Account",
  "Taxable brokerage",
  "Pension",
  "Other",
];

const OTHER_CATEGORY_OPTIONS = [
  "Property",
  "Vehicle",
  "Valuables & collections",
  "Business interest",
  "Other",
];

/** The two add-method tabs; both are selectable and toggle the modal body
    between the manual form and the Smart-Add canvas.
    Icons are the exact SVGs exported from Figma 2005:34310 / 2005:34285.
    Subtitles are filler, so they render as shimmer bars (no copy here). */
const TABS: { id: "manual" | "smart"; title: string; iconSrc: string }[] = [
  {
    id: "manual",
    title: "Add account manually",
    iconSrc: "/signature/icon-tab-manual.svg",
  },
  { id: "smart", title: "Smart Add", iconSrc: "/signature/icon-tab-smart.svg" },
];

export function AddSavingModal({
  open,
  variant,
  onClose,
  onAdd,
}: {
  open: boolean;
  variant: "retirement" | "other";
  onClose: () => void;
  onAdd: (asset: SigAsset) => void;
}) {
  const isRetirement = variant === "retirement";
  const heading = isRetirement
    ? "Add retirement saving accounts"
    : "Add other assets";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/[0.66]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={heading}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 8,
              transition: { duration: 0.16, ease: SIG_EASE },
            }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="scrollbar-slim relative max-h-[90vh] w-full max-w-[1105px] overflow-y-auto rounded-[16px] bg-[#f7f7f7] p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-8">
              <h2 className="text-[26px] font-normal leading-[1.28] tracking-[-0.64px] text-title-ink sm:text-[32px]">
                {heading}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-14 shrink-0 place-items-center rounded-[12px] text-deep-black transition-colors hover:bg-black/5"
              >
                <X className="size-6" strokeWidth={2} />
              </button>
            </div>

            {/* Body mounts only while open, so its tab state resets to "manual"
                (and Smart Add re-runs its autotype) on every fresh open. */}
            <ModalBody
              isRetirement={isRetirement}
              onAdd={onAdd}
              onClose={onClose}
            />
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Modal body (tab state + connected panel)                           */
/* ------------------------------------------------------------------ */

/** The tab row + connected panel. Kept as its own component so it mounts fresh
 *  with each modal open — resetting to the manual tab and letting Smart Add
 *  replay its autotype. */
function ModalBody({
  isRetirement,
  onAdd,
  onClose,
}: {
  isRetirement: boolean;
  onAdd: (asset: SigAsset) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"manual" | "smart">("manual");

  // Map the Smart-Add structured result into SigAssets, mirroring the details
  // flow's handleDumpComplete field mapping (provider→name, accountType,
  // taxStatus, balance→amount). Only surface accounts the used inputs mention.
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
      .filter((a): a is StructuredAccount => Boolean(a));

    const stamp = Date.now();
    detected.forEach((acc, i) => {
      onAdd(
        isRetirement
          ? {
              id: `sig-ai-${stamp}-${i}`,
              name: acc.provider,
              accountType: acc.accountType,
              taxStatus: acc.taxStatus,
              amount: acc.balance,
            }
          : {
              // The dump is retirement-flavored, so for the "other" modal we
              // map sensibly to a category/amount rather than a tax treatment.
              id: `sig-ai-${stamp}-${i}`,
              name: acc.provider,
              accountType: acc.accountType,
              category: "Other",
              amount: acc.balance,
            },
      );
    });
    onClose();
  };

  return (
    // Tab row + connected form panel share one wrapper so the active tab
    // reliably paints over the panel's top border (folder tab).
    <div className="relative mt-6">
      {/* Folder-tab shaping (sm+): Figma 2005:34229 layers a #f7f7f7 rect
          (2005:34249) with a rounded-bl-[20px] corner over a white bridge
          (2005:34230). Where the gray corner rounds away it reveals white,
          so the tab gap curves softly into the panel instead of meeting it
          square. The white reveal is a small BOTTOM strip only — it must
          never reach the tab tops, or it would fill in (square off) the
          active tab's rounded top corners. Mirrored to whichever tab is
          active (left for manual, right for smart). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden h-24 sm:block"
      >
        <div className="absolute bottom-0 left-[calc(50%-8px)] h-6 w-10 bg-white" />
        {mode === "manual" ? (
          <div className="absolute left-[calc(50%-2px)] right-0 top-0 h-full rounded-bl-[20px] rounded-br-[16px] rounded-tr-[16px] bg-[#f7f7f7]" />
        ) : (
          <div className="absolute left-0 right-[calc(50%-2px)] top-0 h-full rounded-bl-[16px] rounded-br-[20px] rounded-tl-[16px] bg-[#f7f7f7]" />
        )}
      </div>
      <TabCards mode={mode} onSelect={setMode} />
      {mode === "smart" ? (
        <FormPanel side="right">
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
        </FormPanel>
      ) : isRetirement ? (
        <RetirementForm onAdd={onAdd} onClose={onClose} />
      ) : (
        <OtherForm onAdd={onAdd} onClose={onClose} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab cards (connected-tab treatment; selectable)                    */
/* ------------------------------------------------------------------ */

/** Figma 2005:34229: both tab cards are white on the #f7f7f7 modal with NO
 *  black strokes. The active card has no border at all (it merges into the
 *  white panel below); the inactive card carries a 1px #eee border and sits
 *  4px shorter so a sliver of the gray modal separates it from the panel.
 *  Both tabs are now selectable and toggle the modal body between the manual
 *  form and the Smart-Add canvas. */
function TabCards({
  mode,
  onSelect,
}: {
  mode: "manual" | "smart";
  onSelect: (mode: "manual" | "smart") => void;
}) {
  return (
    <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-1">
      {TABS.map((tab) => {
        const active = tab.id === mode;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            aria-pressed={active}
            className={cn(
              "flex flex-1 items-center gap-4 bg-white p-6 text-left transition-colors",
              active
                ? "rounded-2xl sm:h-24 sm:rounded-b-none sm:rounded-t-[16px]"
                : "rounded-[16px] border border-stroke-subtle hover:border-[#ddd] sm:h-[92px]",
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-black/[0.05]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tab.iconSrc} alt="" aria-hidden className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[20px] leading-[23.25px] text-title-ink">
                {tab.title}
              </span>
              {/* Subtitle is filler → shimmer bar (with the Smart-Add info dot). */}
              <span className="flex items-center gap-1">
                <span
                  className="h-2.5 w-40 rounded-full skeleton-shimmer"
                  aria-hidden
                />
                {tab.id === "smart" ? (
                  <Info className="size-4 shrink-0 text-gray-2" strokeWidth={2} />
                ) : null}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Retirement form                                                    */
/* ------------------------------------------------------------------ */

function RetirementForm({
  onAdd,
  onClose,
}: {
  onAdd: (asset: SigAsset) => void;
  onClose: () => void;
}) {
  const [nameMode, setNameMode] = useState<"search" | "custom">("search");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [taxOverride, setTaxOverride] = useState<TaxStatus | null>(null);
  const [amount, setAmount] = useState("");
  const [accentColor, setAccentColor] = useState<string | undefined>(undefined);
  const [locked, setLocked] = useState(false);
  // Tracks the provider name just picked from the autocomplete so the query
  // change it triggers isn't mistaken for the user typing (which unlocks).
  const selectedProvider = useRef<string | null>(null);

  const providerTypes = accountTypesForProvider(name);
  const typeOptions = providerTypes.length > 0 ? providerTypes : ACCOUNT_TYPE_OPTIONS;
  const derivedTax = taxStatusFor(name, accountType) ?? taxStatusForType(accountType);
  const effectiveTax: TaxStatus = taxOverride ?? derivedTax ?? "taxable";

  // In search mode, a picked institution locks + auto-fills Type/Tax. In custom
  // mode there is no institution, so those two fields become editable.
  const fieldsLocked = nameMode === "search" && locked;

  const handleSelect = (acc: InstitutionAccount) => {
    selectedProvider.current = acc.provider;
    setName(acc.provider);
    setAccountType(acc.accountType);
    setTaxOverride(null);
    setAccentColor(acc.accentColor);
    setLocked(true);
  };

  const handleQueryChange = (q: string) => {
    setName(q);
    // Ignore the programmatic query change that a selection triggers; only
    // real typing (a query differing from the picked provider) unlocks.
    if (q !== selectedProvider.current) {
      selectedProvider.current = null;
      setAccentColor(undefined);
      setLocked(false);
    }
  };

  const switchMode = (mode: "search" | "custom") => {
    setNameMode(mode);
    selectedProvider.current = null;
    setName("");
    setAccountType("");
    setTaxOverride(null);
    setAccentColor(undefined);
    setLocked(false);
  };

  const canAdd = name.trim().length > 0;
  const submit = () => {
    if (!canAdd) return;
    const digits = amount.replace(/[^0-9]/g, "");
    onAdd({
      id: `sig-${Date.now()}`,
      name: name.trim(),
      accountType: accountType.trim(),
      taxStatus: effectiveTax,
      amount: digits === "" ? 0 : Number(digits),
      accentColor,
    });
    onClose();
  };

  return (
    <FormPanel>
      <RadioGroup mode={nameMode} onChange={switchMode} />

      {/* Name / Type / Tax group — the bracket annotation links these three. */}
      <div className="relative flex w-full max-w-[640px] flex-col gap-4">
        <FilledField
          label="Account name"
          trailing={<FieldIcon icon={Search} />}
        >
          {nameMode === "search" ? (
            <AccountSearch
              chrome="bare"
              showIcon={false}
              onSelect={handleSelect}
              onQueryChange={handleQueryChange}
              value={name}
              clearOnSelect={false}
              providerGhost
              menuZIndex={70}
              placeholder="Search for an account name…"
            />
          ) : (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter an account name…"
              className="w-full bg-transparent caret-violet text-[15.5px] leading-[18.7px] text-black outline-none placeholder:text-gray-2"
            />
          )}
        </FilledField>

        {fieldsLocked ? (
          <LockedField label="Account Type" value={accountType || "—"} />
        ) : (
          <SelectField
            label="Account Type"
            value={accountType}
            onChange={(v) => {
              setAccountType(v);
              setTaxOverride(null);
            }}
            placeholder="Select account type"
            options={typeOptions}
          />
        )}

          {fieldsLocked ? (
          <LockedField
            label="Tax treatment"
            value={TAX_STATUS_LABEL[effectiveTax]}
          />
        ) : (
          <SelectField
            label="Tax treatment"
            value={effectiveTax}
            onChange={(v) => setTaxOverride(v as TaxStatus)}
            options={TAX_OPTIONS}
            renderOption={(t) => TAX_STATUS_LABEL[t as TaxStatus]}
          />
        )}

        <BracketAnnotation />
      </div>

      <div className="w-full max-w-[640px]">
        <BalanceField value={amount} onChange={setAmount} onEnter={submit} />
      </div>

      <AddButton onClick={submit} disabled={!canAdd} label="Add account" />
    </FormPanel>
  );
}

/* ------------------------------------------------------------------ */
/* Other-assets form (simpler variant)                                */
/* ------------------------------------------------------------------ */

function OtherForm({
  onAdd,
  onClose,
}: {
  onAdd: (asset: SigAsset) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(OTHER_CATEGORY_OPTIONS[0]);
  const [amount, setAmount] = useState("");

  const canAdd = name.trim().length > 0;
  const submit = () => {
    if (!canAdd) return;
    const digits = amount.replace(/[^0-9]/g, "");
    onAdd({
      id: `sig-${Date.now()}`,
      name: name.trim(),
      accountType: category,
      category,
      amount: digits === "" ? 0 : Number(digits),
    });
    onClose();
  };

  return (
    <FormPanel>
      <div className="flex w-full max-w-[640px] flex-col gap-4">
        <FilledField label="Asset name" trailing={<FieldIcon icon={Search} />}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lakehouse, family business…"
            className="w-full bg-transparent caret-violet text-[15.5px] leading-[18.7px] text-black outline-none placeholder:text-gray-2"
          />
        </FilledField>
        <SelectField
          label="Category"
          value={category}
          onChange={setCategory}
          options={OTHER_CATEGORY_OPTIONS}
        />
        <BalanceField value={amount} onChange={setAmount} onEnter={submit} />
      </div>

      <AddButton onClick={submit} disabled={!canAdd} label="Add asset" />
    </FormPanel>
  );
}

/* ------------------------------------------------------------------ */
/* Form panel + primitives                                            */
/* ------------------------------------------------------------------ */

/** The white folder panel connected to the active "manual" tab. Per Figma
 *  2005:34238 it has no stroke — just white, rounded on every corner except
 *  the top-left where the active tab flows into it. */
function FormPanel({
  children,
  side = "left",
}: {
  children: React.ReactNode;
  /** Which top corner is squared so the panel flows out of the active tab. */
  side?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "relative z-0 mt-3 flex flex-col gap-6 rounded-2xl bg-white p-5 sm:mt-0 sm:p-8",
        side === "left" ? "sm:rounded-tl-none" : "sm:rounded-tr-none",
      )}
    >
      {children}
    </div>
  );
}

function RadioGroup({
  mode,
  onChange,
}: {
  mode: "search" | "custom";
  onChange: (mode: "search" | "custom") => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <RadioOption
        label="Search for account name"
        checked={mode === "search"}
        onSelect={() => onChange("search")}
      />
      <RadioOption
        label="Add custom account name"
        checked={mode === "custom"}
        onSelect={() => onChange("custom")}
      />
    </div>
  );
}

function RadioOption({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-center gap-4 text-left"
    >
      {/* Figma Desktop/RadioButton: 24px ring, 1.5px black stroke for both
          states; the checked state adds a 12px solid black dot. */}
      <span className="grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] border-black">
        {checked ? <span className="size-3 rounded-full bg-black" /> : null}
      </span>
      <span className="text-base text-black">{label}</span>
    </button>
  );
}

/** Gray filled text field with the label stacked inside on top. Per Figma the
 *  resting field has NO stroke; the focused field (2005:52616) carries a
 *  1.556px solid black border. */
function FilledField({
  label,
  children,
  trailing,
  labelClassName,
}: {
  label: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
  labelClassName?: string;
}) {
  return (
    <div className="flex h-14 items-center gap-3 rounded-[6px] border-[1.5px] border-transparent bg-[#f7f7f7] px-[18px] focus-within:border-black">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-[12.5px] font-semibold leading-[1.28] tracking-[0.12px] text-black",
            labelClassName,
          )}
        >
          {label}
        </span>
        {children}
      </div>
      {trailing}
    </div>
  );
}

/** Read-only locked field: muted #b3b3b3 label, black value, lock icon.
 *  No stroke in any state (it never takes focus). */
function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-14 items-center gap-3 rounded-[6px] border-[1.5px] border-transparent bg-[#f7f7f7] px-[18px]">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[12.5px] font-semibold leading-[1.28] tracking-[0.12px] text-[#b3b3b3]">
          {label}
        </span>
        <span className="truncate text-[15.5px] leading-[18.7px] text-black">
          {value}
        </span>
      </div>
      <FieldIcon icon={Lock} />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  renderOption,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  renderOption?: (v: string) => string;
}) {
  const displayValue = value
    ? renderOption
      ? renderOption(value)
      : value
    : (placeholder ?? "");
  return (
    <div className="relative flex h-14 items-center gap-3 rounded-[6px] border-[1.5px] border-transparent bg-[#f7f7f7] px-[18px] focus-within:border-black">
      {/* The native <select> covers the whole field so clicking anywhere in the
          row (label, padding, chevron) opens the dropdown. The visible label /
          value / chevron below are non-interactive overlays. */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent text-transparent opacity-0 outline-none"
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o} value={o}>
            {renderOption ? renderOption(o) : o}
          </option>
        ))}
      </select>
      <div className="pointer-events-none flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[12.5px] font-semibold leading-[1.28] tracking-[0.12px] text-black">
          {label}
        </span>
        <span className="truncate text-[15.5px] leading-[18.7px] text-black">
          {displayValue}
        </span>
      </div>
      <ChevronDown
        className="pointer-events-none size-5 shrink-0 text-gray-2"
        strokeWidth={2}
      />
    </div>
  );
}

function BalanceField({
  value,
  onChange,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
}) {
  return (
    // Figma 2005:52616: #333 label; the 1.556px black border is the focused
    // state (applied via focus-within), with a violet typing caret.
    <FilledField label="Account Balance" labelClassName="tracking-normal text-[#333]">
      <div className="flex items-center gap-2 text-[15.5px] leading-[18.7px] text-black">
        <span>$</span>
        <input
          inputMode="numeric"
          value={
            value === ""
              ? ""
              : Number(value.replace(/[^0-9]/g, "")).toLocaleString("en-US")
          }
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnter();
          }}
          placeholder="Add amount"
          className="w-full bg-transparent caret-violet outline-none placeholder:text-gray-2"
        />
      </div>
    </FilledField>
  );
}

/** Small square action button holding a field icon (search / lock). */
function FieldIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid size-[34px] shrink-0 place-items-center rounded-[9px] text-[#18181b]">
      <Icon className="size-5" strokeWidth={2} />
    </span>
  );
}

/** Decorative annotation linking the name/type/tax fields. Figma 2005:52697 /
 *  2005:52705: TWO stacked brackets, each 72px tall × 11px wide with 0.75px
 *  solid gray-2 top/right/bottom strokes and 8px right-corner radii, running
 *  field-center to field-center; the note text sits beside the lower one.
 *  Positioned absolutely off the right edge of the 640px fields column. */
function BracketAnnotation() {
  const bracket =
    "absolute left-0 h-[72px] w-[11px] rounded-r-[8px] border-y-[0.75px] border-r-[0.75px] border-gray-2";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-full top-0 hidden pl-1 lg:block"
    >
      <div className="relative w-[262px]">
        <span className={`${bracket} top-[28px]`} />
        <span className={`${bracket} top-[100.5px]`} />
        {/* Explanatory copy is filler → shimmer placeholder bars. */}
        <span className="absolute left-[27px] top-[150px] flex w-[235px] flex-col gap-1.5">
          <span className="h-2.5 w-full rounded-full skeleton-shimmer" />
          <span className="h-2.5 w-[70%] rounded-full skeleton-shimmer" />
        </span>
      </div>
    </div>
  );
}

function AddButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="group inline-flex h-12 w-[256px] items-center justify-between gap-3 self-start rounded-full bg-black px-6 text-sm font-medium tracking-[0.14px] text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-divider disabled:text-gray-text"
    >
      {label}
      <Plus
        className="size-6 transition-transform duration-300 group-hover:rotate-90"
        strokeWidth={2}
      />
    </motion.button>
  );
}
