"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { DumpCanvas } from "@/components/prototypes/DumpCanvas";
import { TAX_STATUS_LABEL, type TaxStatus } from "@/lib/institutions";
import { type StructuredResult } from "@/lib/dataDump";

type Mode = "canvas" | "form";

const fmtMoney = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

/** Map a tax status to the StatusBadge tone that reads best for it. */
const TAX_BADGE_TONE: Record<TaxStatus, "success" | "warning" | "neutral" | "muted"> = {
  "tax-free": "success",
  "tax-deferred": "neutral",
  taxable: "muted",
  "tax-advantaged": "warning",
};

export function DataDumpScreen() {
  const { goBack } = useFlow();

  const [mode, setMode] = useState<Mode>("canvas");
  const [form, setForm] = useState<StructuredResult | null>(null);
  // Once the user saves, mirror the structured values into the left sidebar.
  const [savedProfile, setSavedProfile] = useState(false);

  /* ----------------------------------------------------------- form ops -- */

  const updateAccountBalance = (idx: number, balance: number) =>
    setForm((prev) =>
      prev
        ? {
            ...prev,
            accounts: prev.accounts.map((a, i) =>
              i === idx ? { ...a, balance } : a,
            ),
          }
        : prev,
    );

  const removeStructuredAccount = (idx: number) =>
    setForm((prev) =>
      prev
        ? { ...prev, accounts: prev.accounts.filter((_, i) => i !== idx) }
        : prev,
    );

  const setIncome = (incomeMonthly: number) =>
    setForm((prev) => (prev ? { ...prev, incomeMonthly } : prev));
  const setSpending = (spendingMonthly: number) =>
    setForm((prev) => (prev ? { ...prev, spendingMonthly } : prev));
  const updateGoal = (id: string, value: string) =>
    setForm((prev) =>
      prev
        ? {
            ...prev,
            goals: prev.goals.map((g) =>
              g.id === id ? { ...g, text: value } : g,
            ),
          }
        : prev,
    );
  const removeGoal = (id: string) =>
    setForm((prev) =>
      prev ? { ...prev, goals: prev.goals.filter((g) => g.id !== id) } : prev,
    );
  const addGoal = () =>
    setForm((prev) =>
      prev
        ? {
            ...prev,
            goals: [...prev.goals, { id: crypto.randomUUID(), text: "" }],
          }
        : prev,
    );

  /* --------------------------------------------------------------- view -- */

  const sidebarConfig =
    savedProfile && form
      ? {
          folders: [
            {
              title: "Accounts",
              items: form.accounts.map((a) => ({
                label: `${a.provider} ${a.accountType}`,
                value: fmtMoney(a.balance),
              })),
            },
            {
              title: "Goals",
              numbered: true,
              items: form.goals
                .filter((g) => g.text.trim().length > 0)
                .map((g) => ({ label: g.text })),
            },
          ],
        }
      : {
          subSections: [
            { label: "About You" },
            { label: "Accounts", active: mode === "form" },
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

          {mode === "form" && form ? (
            <>
              <motion.div
                className="mt-4 max-w-[680px]"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black sm:text-[30px]">
                  Your structured profile
                </h1>
              </motion.div>

              <div className="mt-4 flex w-full flex-1 flex-col">
                <FormMode
                  result={form}
                  onEditInputs={() => {
                    setSavedProfile(false);
                    setMode("canvas");
                  }}
                  editable={!savedProfile}
                  onBalanceChange={updateAccountBalance}
                  onAccountRemove={removeStructuredAccount}
                  onIncomeChange={setIncome}
                  onSpendingChange={setSpending}
                  onGoalChange={updateGoal}
                  onGoalRemove={removeGoal}
                  onGoalAdd={addGoal}
                  onSaved={() => setSavedProfile(true)}
                />
              </div>
            </>
          ) : (
            <DumpCanvas
              onComplete={(result) => {
                setForm(result);
                setMode("form");
              }}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* ================================================================== form == */

function FormMode({
  result,
  editable,
  onEditInputs,
  onBalanceChange,
  onAccountRemove,
  onIncomeChange,
  onSpendingChange,
  onGoalChange,
  onGoalRemove,
  onGoalAdd,
  onSaved,
}: {
  result: StructuredResult;
  /** While true, fields show pen/edit affordances; Save locks them. */
  editable: boolean;
  onEditInputs: () => void;
  onBalanceChange: (idx: number, balance: number) => void;
  onAccountRemove: (idx: number) => void;
  onIncomeChange: (n: number) => void;
  onSpendingChange: (n: number) => void;
  onGoalChange: (id: string, value: string) => void;
  onGoalRemove: (id: string) => void;
  onGoalAdd: () => void;
  onSaved: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const handleSave = () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
    setSaved(true);
    onSaved();
    savedTimer.current = setTimeout(() => setSaved(false), 1800);
  };

  const total = result.accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <motion.div
      className="flex flex-1 flex-col gap-3"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* AI summary */}
      <div className="ai-glow flex items-center gap-2.5 rounded-card border border-violet/40 bg-white px-3.5 py-2">
        <AskSendIcon className="size-6 shrink-0" />
        <p className="text-xs leading-snug text-deep-black">{result.summary}</p>
      </div>

      {/* About you */}
      <Section title="About you">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LabeledField label="Name">
            <ReadonlyValue value={result.person.name} />
          </LabeledField>
          <LabeledField label="Target retirement age">
            <ReadonlyValue value={result.person.retireAge ?? ""} />
          </LabeledField>
        </div>
      </Section>

      {/* Body: two columns on large screens so it fits without scrolling */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-2">
        {/* Accounts */}
        <Section
          title="Accounts"
          aside={
            <span className="text-sm text-gray-2">{fmtMoney(total)} total</span>
          }
        >
          <ul className="flex flex-col gap-1.5">
            {result.accounts.map((acc, idx) => (
              <li
                key={`${acc.provider}-${acc.accountType}-${idx}`}
                className="flex items-center gap-3 rounded-card border border-stroke-subtle bg-white px-3 py-1.5"
              >
                <ProviderLogo
                  provider={acc.provider}
                  className="size-8"
                  textClassName="text-xs"
                />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-sm font-medium text-deep-black">
                    {acc.provider}
                  </span>
                  <span className="truncate text-xs text-gray-2">
                    {acc.accountType}
                  </span>
                  <StatusBadge tone={TAX_BADGE_TONE[acc.taxStatus]}>
                    {TAX_STATUS_LABEL[acc.taxStatus]}
                  </StatusBadge>
                </div>
                {editable ? (
                  <>
                    <BalanceField
                      value={acc.balance}
                      onChange={(v) => onBalanceChange(idx, v)}
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${acc.provider} ${acc.accountType}`}
                      onClick={() => onAccountRemove(idx)}
                      className="shrink-0 rounded-full p-1 text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
                    >
                      <X className="size-4" strokeWidth={2} />
                    </button>
                  </>
                ) : (
                  <span className="shrink-0 px-2.5 text-sm font-medium text-deep-black">
                    {fmtMoney(acc.balance)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>

        {/* Income, Spending & Goals */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Section title="Income">
              <LabeledField label="Take-home / month">
                {editable ? (
                  <MoneyField
                    value={result.incomeMonthly}
                    onChange={onIncomeChange}
                  />
                ) : (
                  <ReadonlyValue value={fmtMoney(result.incomeMonthly)} />
                )}
              </LabeledField>
            </Section>
            <Section title="Spending">
              <LabeledField label="Spending / month">
                {editable ? (
                  <MoneyField
                    value={result.spendingMonthly}
                    onChange={onSpendingChange}
                  />
                ) : (
                  <ReadonlyValue value={fmtMoney(result.spendingMonthly)} />
                )}
              </LabeledField>
            </Section>
          </div>

          <Section title="Goals">
            <ul className="flex flex-col gap-1.5">
              {result.goals.map((goal, idx) => (
                <li
                  key={goal.id}
                  className="flex items-center gap-2 rounded-card border border-stroke-subtle bg-white px-3 py-1.5"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet/10 text-xs font-semibold text-violet">
                    {idx + 1}
                  </span>
                  {editable ? (
                    <>
                      <input
                        value={goal.text}
                        onChange={(e) => onGoalChange(goal.id, e.target.value)}
                        placeholder="Describe a goal…"
                        className="w-full bg-transparent text-sm font-medium text-deep-black outline-none placeholder:text-gray-2"
                      />
                      <Pencil
                        className="size-3.5 shrink-0 text-gray-2"
                        strokeWidth={2}
                      />
                      <button
                        type="button"
                        aria-label="Remove goal"
                        onClick={() => onGoalRemove(goal.id)}
                        className="shrink-0 text-gray-2 transition-colors hover:text-deep-black"
                      >
                        <Trash2 className="size-4" strokeWidth={2} />
                      </button>
                    </>
                  ) : (
                    <span className="w-full truncate text-sm font-medium text-deep-black">
                      {goal.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {editable ? (
              <button
                type="button"
                onClick={onGoalAdd}
                className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-gray-2 transition-colors hover:text-violet"
              >
                <Plus className="size-4" strokeWidth={2} />
                Add a goal
              </button>
            ) : null}
          </Section>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
        <Button variant="outline" size="md" onClick={onEditInputs}>
          Back to inputs
        </Button>
        <Button variant="primary" size="md" onClick={handleSave}>
          Save
        </Button>
        <AnimatePresence>
          {saved ? (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-success"
            >
              <Check className="size-4" strokeWidth={2.5} />
              Saved
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.04em] text-gray-1">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </div>
  );
}

function LabeledField({
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

/** Read-only value display for locked (post-save) structured fields. */
function ReadonlyValue({ value }: { value: string }) {
  return (
    <div className="rounded-field border border-stroke-subtle bg-ghost-white px-3.5 py-2.5 text-sm font-medium text-deep-black">
      {value || "-"}
    </div>
  );
}

function MoneyField({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center rounded-field border border-stroke-subtle bg-white px-3.5 py-2.5 transition-colors focus-within:border-violet/50">
      <span className="text-sm text-gray-1">$</span>
      <input
        inputMode="numeric"
        value={value.toLocaleString("en-US")}
        onChange={(e) =>
          onChange(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)
        }
        className="ml-1 w-full bg-transparent text-sm font-medium text-deep-black outline-none"
      />
      <Pencil className="size-3.5 shrink-0 text-gray-2" strokeWidth={2} />
    </div>
  );
}

/** Click-to-edit balance pill (mirrors SmartSort's balance editor). */
function BalanceField({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const start = () => {
    setDraft(String(value));
    setEditing(true);
  };
  const commit = () => {
    onChange(Number(draft.replace(/[^0-9]/g, "")) || 0);
    setEditing(false);
  };

  if (editing) {
    return (
      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-pill bg-white py-1 pl-2.5 pr-1.5 shadow-[0_1px_2px_rgba(16,24,32,0.06)] ring-2 ring-violet/40">
        <span className="text-gray-1">$</span>
        <input
          autoFocus
          inputMode="numeric"
          value={Number(draft.replace(/[^0-9]/g, "")).toLocaleString("en-US")}
          size={Math.max(4, draft.replace(/[^0-9]/g, "").length + 1)}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={commit}
          className="bg-transparent text-right text-sm font-medium text-deep-black outline-none"
        />
        <button
          type="button"
          aria-label="Save balance"
          onClick={commit}
          className="rounded-full p-1 text-success transition-colors hover:bg-ghost-white"
        >
          <Check className="size-3.5" strokeWidth={2.4} />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className="group inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 text-sm font-medium text-deep-black transition-colors hover:bg-ghost-white"
    >
      {fmtMoney(value)}
      <Pencil
        className="size-3.5 text-gray-2 transition-colors group-hover:text-violet"
        strokeWidth={2}
      />
    </button>
  );
}
