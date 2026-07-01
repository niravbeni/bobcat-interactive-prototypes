"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ChevronLeft,
  Landmark,
  Lock,
  Pencil,
  Search,
  X,
} from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SegmentedBar, type Segment } from "@/components/ui/SegmentedBar";
import { Button } from "@/components/ui/Button";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { cn } from "@/lib/cn";
import {
  CATALOG,
  TAX_STATUS_COLOR,
  TAX_STATUS_LABEL,
  ghostCompletion,
  matchInstitutions,
  type AddedAccount,
  type InstitutionAccount,
  type TaxStatus,
} from "@/lib/institutions";

const fmtMoney = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

/** Map a tax status to the StatusBadge tone that reads best for it. */
const TAX_BADGE_TONE: Record<TaxStatus, "success" | "warning" | "neutral" | "muted"> = {
  "tax-free": "success",
  "tax-deferred": "neutral",
  taxable: "muted",
  "tax-advantaged": "warning",
};

/** Order tax buckets consistently in the summary bar. */
const TAX_ORDER: TaxStatus[] = [
  "tax-free",
  "tax-deferred",
  "taxable",
  "tax-advantaged",
];

type TaxGroup = {
  status: TaxStatus;
  accounts: AddedAccount[];
  subtotal: number;
};

/** Unique providers derived from the catalog for the Connect flow. */
type Provider = {
  provider: string;
  accentColor?: string;
  count: number;
};

const PROVIDERS: Provider[] = (() => {
  const map = new Map<string, Provider>();
  for (const acc of CATALOG) {
    const existing = map.get(acc.provider);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(acc.provider, {
        provider: acc.provider,
        accentColor: acc.accentColor,
        count: 1,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.provider.localeCompare(b.provider));
})();

export function SmartSortScreen() {
  const { goBack } = useFlow();
  const [accounts, setAccounts] = useState<AddedAccount[]>([]);
  const [connectOpen, setConnectOpen] = useState(false);

  const addAccount = (acc: InstitutionAccount) => {
    setAccounts((prev) => [
      ...prev,
      {
        ...acc,
        instanceId: `${acc.id}-${Date.now()}`,
        balance: acc.estBalance ?? 0,
      },
    ]);
  };

  const removeAccount = (instanceId: string) =>
    setAccounts((prev) => prev.filter((a) => a.instanceId !== instanceId));

  const setBalance = (instanceId: string, balance: number) =>
    setAccounts((prev) =>
      prev.map((a) => (a.instanceId === instanceId ? { ...a, balance } : a)),
    );

  const total = accounts.reduce((sum, a) => sum + a.balance, 0);

  // Underlying catalog ids already added, so the Connect flow can skip dupes.
  const addedIds = useMemo(
    () => new Set(accounts.map((a) => a.id)),
    [accounts],
  );

  // Group added accounts by tax treatment, sort members by balance (desc),
  // then order groups by subtotal (desc) so the biggest pot sits on top.
  const groups: TaxGroup[] = useMemo(() => {
    const byStatus = new Map<TaxStatus, AddedAccount[]>();
    for (const a of accounts) {
      const bucket = byStatus.get(a.taxStatus);
      if (bucket) bucket.push(a);
      else byStatus.set(a.taxStatus, [a]);
    }
    return [...byStatus.entries()]
      .map(([status, members]) => {
        const sorted = [...members].sort((x, y) => y.balance - x.balance);
        const subtotal = sorted.reduce((sum, a) => sum + a.balance, 0);
        return { status, accounts: sorted, subtotal };
      })
      .sort((a, b) => b.subtotal - a.subtotal);
  }, [accounts]);

  const segments: Segment[] = useMemo(() => {
    const byBucket = new Map<TaxStatus, number>();
    for (const a of accounts) {
      byBucket.set(a.taxStatus, (byBucket.get(a.taxStatus) ?? 0) + a.balance);
    }
    return TAX_ORDER.filter((status) => (byBucket.get(status) ?? 0) > 0).map(
      (status) => ({
        label: TAX_STATUS_LABEL[status],
        value: byBucket.get(status) ?? 0,
        display: fmtMoney(byBucket.get(status) ?? 0),
        color: TAX_STATUS_COLOR[status],
      }),
    );
  }, [accounts]);

  return (
    <AppShell
      card={false}
      sidebar={{
        subSections: [
          { label: "About You" },
          { label: "Accounts", active: true },
          { label: "Income" },
          { label: "Spending" },
          { label: "Goals" },
        ],
      }}
    >
      <div className="flex w-full flex-1 flex-col rounded-field bg-card px-5 py-5 xl:px-10 xl:py-6 3xl:px-14 3xl:py-8">
        <div className="mx-auto flex w-full max-w-[820px] flex-1 flex-col xl:max-w-[1040px] 3xl:max-w-[1220px]">
        <BackButton onClick={goBack} />

        <motion.div
          className="mt-4 max-w-[680px]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black sm:text-[30px]">
            Find your accounts
          </h1>
          <p className="mt-2 text-sm leading-snug text-black/70">
            Start typing a bank or provider. We&rsquo;ll recognize the account and
            automatically sort it by tax treatment: tax-free, tax-deferred,
            taxable or tax-advantaged.
          </p>
        </motion.div>

        <motion.div
          className="mt-6 w-full"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <AccountSearch onSelect={addAccount} />

          <div className="mt-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-stroke-subtle" />
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-gray-2">
              or
            </span>
            <span className="h-px flex-1 bg-stroke-subtle" />
          </div>

          <div className="mt-3 flex justify-center">
            <Button
              variant="outline"
              size="md"
              onClick={() => setConnectOpen(true)}
            >
              <Landmark className="size-4 text-violet" strokeWidth={2} />
              Connect an account
            </Button>
          </div>
        </motion.div>

        <div className="mt-7 flex w-full flex-1 flex-col">
          {accounts.length === 0 ? (
            <div className="rounded-card border border-dashed border-stroke-subtle bg-white/60 px-5 py-8 text-center text-sm text-gray-2">
              No accounts yet.
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <AnimatePresence initial={false}>
                {groups.map((group) => (
                  <motion.div
                    key={group.status}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-3 px-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: TAX_STATUS_COLOR[group.status] }}
                          aria-hidden
                        />
                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-1">
                          {TAX_STATUS_LABEL[group.status]}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-deep-black">
                          {fmtMoney(group.subtotal)}
                        </span>
                        <span className="text-xs text-gray-2">
                          {group.accounts.length}{" "}
                          {group.accounts.length === 1 ? "account" : "accounts"}
                        </span>
                      </div>
                    </div>

                    <ul className="flex flex-col gap-2.5">
                      <AnimatePresence initial={false}>
                        {group.accounts.map((acc) => (
                          <motion.li
                            key={acc.instanceId}
                            layout
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{
                              duration: 0.25,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          >
                            <AccountCard
                              account={acc}
                              onRemove={() => removeAccount(acc.instanceId)}
                              onBalanceChange={(v) =>
                                setBalance(acc.instanceId, v)
                              }
                            />
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {accounts.length > 0 ? (
            <motion.div
              layout
              className="mt-7 flex flex-col gap-4 rounded-field bg-ghost-white p-6"
            >
              <div className="flex flex-wrap items-end justify-between gap-2">
                <p className="text-base font-medium text-gray-text">
                  Total saved across {accounts.length}{" "}
                  {accounts.length === 1 ? "account" : "accounts"}
                </p>
                <p className="text-3xl font-semibold tracking-[-0.01em] text-deep-black">
                  {fmtMoney(total)}
                </p>
              </div>
              <SegmentedBar segments={segments} />
            </motion.div>
          ) : null}
        </div>
        </div>
      </div>

      {connectOpen ? (
        <ConnectModal
          addedIds={addedIds}
          onAdd={addAccount}
          onClose={() => setConnectOpen(false)}
        />
      ) : null}
    </AppShell>
  );
}

/** Provider chip + name + tax badge + editable balance + remove button. */
function AccountCard({
  account,
  onRemove,
  onBalanceChange,
}: {
  account: AddedAccount;
  onRemove: () => void;
  onBalanceChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-stroke-subtle bg-white px-3.5 py-3">
      <ProviderLogo
        provider={account.provider}
        accentColor={account.accentColor}
        className="size-10"
        textClassName="text-sm"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-base font-medium text-deep-black">
          {account.fullName}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-2">{account.accountType}</span>
          <StatusBadge tone={TAX_BADGE_TONE[account.taxStatus]}>
            {TAX_STATUS_LABEL[account.taxStatus]}
          </StatusBadge>
        </div>
      </div>

      <BalanceEditor value={account.balance} onChange={onBalanceChange} />

      <button
        type="button"
        aria-label={`Remove ${account.fullName}`}
        onClick={onRemove}
        className="shrink-0 rounded-full p-1.5 text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
      >
        <X className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}

/** Click-to-edit balance pill, pre-filled from the catalog estimate. */
function BalanceEditor({
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
    const next = Number(draft.replace(/[^0-9]/g, "")) || 0;
    onChange(next);
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
        className="size-3 text-gray-2 opacity-0 transition-opacity group-hover:opacity-100"
        strokeWidth={1.75}
      />
    </button>
  );
}

/**
 * AI-style search combobox: a violet glowing input with inline ghost-text
 * completion and a portaled, keyboard-navigable suggestion list. Mirrors the
 * positioning/keyboard patterns used by MadlibSelect.
 */
function AccountSearch({
  onSelect,
}: {
  onSelect: (acc: InstitutionAccount) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const thinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = useId();

  const results = useMemo(() => matchInstitutions(query), [query]);
  const ghost = useMemo(() => ghostCompletion(query), [query]);
  const hasQuery = query.trim().length > 0;
  // Clamp the keyboard highlight to the current result set without writing back
  // to state from an effect (keeps cascading renders out of the picture).
  const safeHighlight = Math.min(highlight, Math.max(0, results.length - 1));

  // Reposition the portaled menu under the input.
  const reposition = () => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const margin = 8;
    const gap = 6;
    const maxHeight = Math.max(160, window.innerHeight - r.bottom - margin - gap);
    setCoords({
      top: r.bottom + gap,
      left: r.left,
      width: r.width,
      maxHeight: Math.min(maxHeight, 360),
    });
  };

  useEffect(() => {
    if (!open) return;
    reposition();
    const onReposition = (e?: Event) => {
      const t = e?.target as Node | null;
      if (t && menuRef.current?.contains(t)) return;
      reposition();
    };
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        wrapRef.current &&
        !wrapRef.current.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // Keep the keyboard-highlighted option scrolled into view (no state writes).
  useEffect(() => {
    menuRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${safeHighlight}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [safeHighlight, results.length]);

  // Clear any pending "thinking" timer on unmount.
  useEffect(() => () => {
    if (thinkTimer.current) clearTimeout(thinkTimer.current);
  }, []);

  /** Sell the AI feel with a brief shimmer each time the query changes. */
  const runThinking = (active: boolean) => {
    if (thinkTimer.current) clearTimeout(thinkTimer.current);
    if (!active) {
      setThinking(false);
      return;
    }
    setThinking(true);
    thinkTimer.current = setTimeout(() => setThinking(false), 360);
  };

  const handleChange = (next: string) => {
    setQuery(next);
    setHighlight(0);
    setOpen(next.trim().length > 0);
    runThinking(next.trim().length > 0);
  };

  const acceptGhost = () => {
    if (!ghost) return false;
    setQuery((q) => q + ghost);
    setHighlight(0);
    return true;
  };

  const select = (acc: InstitutionAccount) => {
    onSelect(acc);
    setQuery("");
    setOpen(false);
    setHighlight(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(hasQuery);
      setHighlight(Math.min(safeHighlight + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(Math.max(safeHighlight - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const acc = results[safeHighlight];
      if (acc) select(acc);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (
      (e.key === "Tab" || e.key === "ArrowRight") &&
      ghost &&
      // Only hijack Right-arrow when the caret is at the end of the text.
      (e.key === "Tab" ||
        inputRef.current?.selectionStart === query.length)
    ) {
      if (acceptGhost()) e.preventDefault();
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="ai-glow flex items-center gap-2.5 rounded-card border border-violet/40 bg-white px-3.5 py-3">
        <AskSendIcon className="size-7 shrink-0" />

        <div className="relative min-w-0 flex-1">
          {/* Ghost-text overlay aligned behind the real input text. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre text-base"
          >
            <span className="invisible">{query}</span>
            <span className="text-gray-2">{ghost}</span>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => hasQuery && setOpen(true)}
            placeholder="Start typing your bank or provider…"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            autoComplete="off"
            className="relative w-full bg-transparent text-base text-deep-black outline-none placeholder:text-gray-text"
          />
        </div>

        {query ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-gray-2 transition-colors hover:bg-divider/60"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        ) : null}
      </div>

      {open && coords && results.length > 0 && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              role="listbox"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: coords.width,
                maxHeight: coords.maxHeight,
              }}
              className="scrollbar-slim z-50 overflow-y-auto rounded-card border border-stroke-subtle bg-white p-1.5 shadow-[0_16px_48px_rgba(16,24,32,0.16)]"
            >
              {thinking ? (
                <div className="flex items-center gap-2 px-2.5 py-2 text-sm text-violet">
                  <span className="animate-pulse">Recognizing account…</span>
                </div>
              ) : (
                results.map((acc, i) => {
                  const highlighted = i === safeHighlight;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      role="option"
                      data-idx={i}
                      aria-selected={highlighted}
                      onPointerEnter={() => setHighlight(i)}
                      onClick={() => select(acc)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                        highlighted ? "bg-violet/10" : "hover:bg-divider/40",
                      )}
                    >
                      <ProviderLogo
                        provider={acc.provider}
                        accentColor={acc.accentColor}
                        className="size-8"
                        textClassName="text-xs"
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-deep-black">
                          {acc.provider} &mdash; {acc.accountType}
                        </span>
                        <span className="truncate text-xs text-gray-2">
                          {acc.fullName}
                        </span>
                      </span>
                      <StatusBadge tone={TAX_BADGE_TONE[acc.taxStatus]}>
                        {TAX_STATUS_LABEL[acc.taxStatus]}
                      </StatusBadge>
                    </button>
                  );
                })
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/* ============================================================ connect flow == */

type ConnectPhase = "pick" | "auth" | "connecting" | "done";

/**
 * Simulated Plaid-style link modal. Purely local state: pick a provider, "log
 * in" with demo inputs, watch a brief connecting shimmer, then import every
 * catalog account for that provider that isn't already added.
 */
function ConnectModal({
  addedIds,
  onAdd,
  onClose,
}: {
  addedIds: Set<string>;
  onAdd: (acc: InstitutionAccount) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<ConnectPhase>("pick");
  const [chosen, setChosen] = useState<Provider | null>(null);
  const [query, setQuery] = useState("");

  const connectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending timers on unmount (cleanup-only, no state on mount).
  useEffect(
    () => () => {
      if (connectTimer.current) clearTimeout(connectTimer.current);
      if (doneTimer.current) clearTimeout(doneTimer.current);
    },
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PROVIDERS;
    return PROVIDERS.filter((p) => p.provider.toLowerCase().includes(q));
  }, [query]);

  const pickProvider = (provider: Provider) => {
    setChosen(provider);
    setPhase("auth");
  };

  const backToPick = () => {
    setChosen(null);
    setPhase("pick");
  };

  const startConnect = () => {
    if (!chosen) return;
    setPhase("connecting");
    if (connectTimer.current) clearTimeout(connectTimer.current);
    connectTimer.current = setTimeout(() => {
      for (const acc of CATALOG) {
        if (acc.provider === chosen.provider && !addedIds.has(acc.id)) {
          onAdd(acc);
        }
      }
      setPhase("done");
      if (doneTimer.current) clearTimeout(doneTimer.current);
      doneTimer.current = setTimeout(onClose, 700);
    }, 1200);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Connect an account"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex max-h-[calc(100vh-4rem)] w-full max-w-[440px] flex-col overflow-hidden rounded-field border border-stroke-subtle bg-card shadow-[0_24px_64px_rgba(16,24,32,0.24)]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
        >
          <X className="size-5" strokeWidth={2} />
        </button>

        <AnimatePresence mode="wait">
          {phase === "pick" ? (
            <motion.div
              key="pick"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex min-h-0 flex-col p-6"
            >
              <div className="flex items-center gap-2 text-violet">
                <Landmark className="size-5" strokeWidth={2} />
                <span className="text-sm font-semibold uppercase tracking-[0.1em]">
                  Connect an account
                </span>
              </div>
              <p className="mt-1.5 text-sm text-gray-2">
                Securely link your bank or provider.
              </p>

              <div className="mt-4 flex items-center gap-2.5 rounded-card border border-stroke-subtle bg-white px-3 py-2.5">
                <Search className="size-4 shrink-0 text-gray-2" strokeWidth={2} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search providers…"
                  className="w-full bg-transparent text-sm text-deep-black outline-none placeholder:text-gray-text"
                />
              </div>

              <ul className="scrollbar-slim mt-3 flex min-h-0 flex-col gap-1.5 overflow-y-auto">
                {filtered.length === 0 ? (
                  <li className="px-2 py-4 text-center text-sm text-gray-2">
                    No matching providers.
                  </li>
                ) : (
                  filtered.map((provider) => (
                    <li key={provider.provider}>
                      <button
                        type="button"
                        onClick={() => pickProvider(provider)}
                        className="flex w-full items-center gap-3 rounded-card border border-stroke-subtle bg-white px-3 py-2.5 text-left transition-colors hover:border-violet/50 hover:bg-violet/5"
                      >
                        <ProviderLogo
                          provider={provider.provider}
                          accentColor={provider.accentColor}
                          className="size-9"
                          textClassName="text-xs"
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium text-deep-black">
                            {provider.provider}
                          </span>
                          <span className="text-xs text-gray-2">
                            Connect securely
                          </span>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </motion.div>
          ) : null}

          {phase === "auth" && chosen ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col p-6"
            >
              <button
                type="button"
                onClick={backToPick}
                className="mb-4 inline-flex w-fit items-center gap-1 text-sm font-medium text-gray-2 transition-colors hover:text-deep-black"
              >
                <ChevronLeft className="size-4" strokeWidth={2} />
                Back
              </button>

              <div className="flex items-center gap-3">
                <ProviderLogo
                  provider={chosen.provider}
                  accentColor={chosen.accentColor}
                  className="size-11"
                  textClassName="text-sm"
                />
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-deep-black">
                    Log in to {chosen.provider}
                  </span>
                  <span className="text-xs text-gray-2">
                    Enter your credentials to continue
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-gray-2">
                    Username
                  </span>
                  <input
                    type="text"
                    autoComplete="off"
                    defaultValue="gloria.hayes@gmail.com"
                    placeholder="you@example.com"
                    className="w-full rounded-field border border-stroke-subtle bg-white px-3.5 py-2.5 text-sm text-deep-black outline-none transition-colors focus:border-violet/50"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-gray-2">
                    Password
                  </span>
                  <input
                    type="password"
                    autoComplete="off"
                    defaultValue="gloria2026"
                    placeholder="••••••••"
                    className="w-full rounded-field border border-stroke-subtle bg-white px-3.5 py-2.5 text-sm text-deep-black outline-none transition-colors focus:border-violet/50"
                  />
                </label>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={startConnect}
                className="mt-5 w-full"
              >
                <Lock className="size-4" strokeWidth={2} />
                Securely connect
              </Button>
            </motion.div>
          ) : null}

          {phase === "connecting" && chosen ? (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-4 px-6 py-14 text-center"
            >
              <span className="relative flex size-16 items-center justify-center rounded-full bg-violet/10 text-violet">
                <span className="absolute inset-0 animate-ping rounded-full bg-violet/20" />
                <Lock className="relative size-7" strokeWidth={2} />
              </span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-base font-semibold text-deep-black">
                  Connecting to {chosen.provider}…
                </span>
                <span className="text-sm text-gray-2">
                  Establishing a secure link.
                </span>
              </div>
              <span className="size-5 animate-spin rounded-full border-2 border-violet/30 border-t-violet" />
            </motion.div>
          ) : null}

          {phase === "done" && chosen ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-3 px-6 py-14 text-center"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="size-8" strokeWidth={2.5} />
              </span>
              <span className="text-lg font-semibold text-deep-black">
                Connected
              </span>
              <span className="text-sm text-gray-2">
                {chosen.provider} accounts added to your profile.
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>,
    document.body,
  );
}
