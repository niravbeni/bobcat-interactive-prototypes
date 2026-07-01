"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { cn } from "@/lib/cn";
import {
  TAX_STATUS_LABEL,
  ghostCompletion,
  matchInstitutions,
  type InstitutionAccount,
  type TaxStatus,
} from "@/lib/institutions";

/** Map a tax status to the StatusBadge tone that reads best for it. */
const TAX_BADGE_TONE: Record<
  TaxStatus,
  "success" | "warning" | "neutral" | "muted"
> = {
  "tax-free": "success",
  "tax-deferred": "neutral",
  taxable: "muted",
  "tax-advantaged": "warning",
};

/**
 * AI-style search combobox: a violet glowing input with inline ghost-text
 * completion and a portaled, keyboard-navigable suggestion list. Mirrors the
 * positioning/keyboard patterns used by MadlibSelect.
 */
export function AccountSearch({
  onSelect,
  placeholder = "Start typing your bank or provider…",
  showIcon = true,
}: {
  onSelect: (acc: InstitutionAccount) => void;
  placeholder?: string;
  /** Show the leading AI-spiral icon inside the input. */
  showIcon?: boolean;
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
      (e.key === "Tab" || inputRef.current?.selectionStart === query.length)
    ) {
      if (acceptGhost()) e.preventDefault();
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="ai-glow flex items-center gap-2.5 rounded-card border border-violet/40 bg-white px-3.5 py-3">
        {showIcon ? <AskSendIcon className="size-7 shrink-0" /> : null}

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
            placeholder={placeholder}
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
