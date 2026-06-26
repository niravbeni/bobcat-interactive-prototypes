"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { optionLabel, type MadlibField } from "@/lib/narrative";

/** Format a raw digit string as a grouped number (e.g. "5000" -> "5,000"). */
function formatMoney(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits).toLocaleString("en-US") : "";
}

/** Today (import-time) as yyyy-mm-dd, used to cap date pickers to the past. */
const TODAY_ISO = new Date().toISOString().slice(0, 10);

/** Inline white pill native date picker. */
function MadlibDate({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
}) {
  return (
    <input
      type="date"
      value={value}
      max={TODAY_ISO}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={cn(
        "rounded-pill bg-white px-4 py-1.5 text-center text-lg text-deep-black shadow-[0_1px_2px_rgba(16,24,32,0.06)] outline-none transition-shadow placeholder:text-gray-2 focus:ring-2 focus:ring-violet/40",
        error && "ring-2 ring-violet",
      )}
    />
  );
}

/** Inline white pill text/number/money input that grows with its content. */
function MadlibText({
  field,
  value,
  onChange,
  onBlur,
  error,
}: {
  field: MadlibField;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
}) {
  const isMoney = field.type === "money";
  const isNumeric = field.type === "number" || isMoney;
  const display = isMoney ? formatMoney(value) : value;
  const placeholder = field.placeholder ?? "";
  const size = Math.max(
    field.widthCh ?? 0,
    placeholder.length,
    display.length + 1,
    2,
  );

  const handleChange = (raw: string) =>
    onChange(isNumeric ? raw.replace(/[^0-9]/g, "") : raw);

  if (isMoney) {
    // Money keeps the "$" outside the input so display formatting (commas)
    // never fights the caret; the raw digits are what we store.
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-pill bg-white py-1.5 pl-3.5 pr-4 text-lg text-deep-black shadow-[0_1px_2px_rgba(16,24,32,0.06)] transition-shadow focus-within:ring-2 focus-within:ring-violet/40",
          error && "ring-2 ring-violet",
        )}
      >
        <span className={cn("text-gray-1", error && "text-violet/60")}>$</span>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          size={size}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={onBlur}
          className={cn(
            "bg-transparent text-center text-lg text-deep-black outline-none placeholder:text-gray-2",
            error && "placeholder:text-violet/60",
          )}
        />
      </span>
    );
  }

  return (
    <input
      type="text"
      inputMode={isNumeric ? "numeric" : "text"}
      value={value}
      size={size}
      placeholder={placeholder}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={onBlur}
      className={cn(
        "rounded-pill bg-white px-4 py-1.5 text-center text-lg text-deep-black shadow-[0_1px_2px_rgba(16,24,32,0.06)] outline-none transition-shadow placeholder:text-gray-2 focus:ring-2 focus:ring-violet/40",
        error && "ring-2 ring-violet placeholder:text-violet/60",
      )}
    />
  );
}

/** Inline white pill dropdown that opens a popover list of options. */
function MadlibSelect({
  field,
  value,
  onChange,
  onBlur,
  error,
}: {
  field: MadlibField;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Index of the keyboard-highlighted option while the menu is open.
  const [highlight, setHighlight] = useState(0);
  // Anchor coordinates for the fixed-position menu so it escapes the scroll
  // container's overflow clipping (an absolute menu would get cut off). We pick
  // up- or down-placement based on the room around the trigger and cap the
  // height to the available space so the list is never cut off at the edge.
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const label = optionLabel(field, value) || (field.placeholder ?? "select");
  const options = field.options ?? [];

  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const gap = 6;
      const margin = 8;
      const vh = window.innerHeight;
      const spaceBelow = vh - r.bottom - margin;
      const spaceAbove = r.top - margin;
      // Flip up only when below is genuinely cramped and above has more room.
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      const avail = (openUp ? spaceAbove : spaceBelow) - gap;
      setCoords({
        left: r.left,
        width: r.width,
        maxHeight: Math.max(140, Math.min(avail, 360)),
        ...(openUp ? { bottom: vh - r.top + gap } : { top: r.bottom + gap }),
      });
    }
    // Start the highlight on the current value (or the first option).
    const selIdx = options.findIndex((o) => o.id === value);
    setHighlight(selIdx >= 0 ? selIdx : 0);
    setOpen(true);
  };

  // Keyboard navigation: focus stays on the trigger while the menu is open, so
  // Up/Down move the highlight, Enter selects it. Enter is preventDefault-ed so
  // it doesn't re-toggle the menu; the page-level Enter-to-continue already
  // ignores keys while this trigger is aria-expanded.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[highlight];
      if (opt) {
        onChange(opt.id);
        setOpen(false);
      }
    }
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      // The menu is portaled outside `ref`, so check it explicitly too —
      // otherwise pointerdown on an option would close before the click lands.
      if (
        ref.current &&
        !ref.current.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // The menu is viewport-anchored, so close it if the page scrolls/resizes
    // rather than letting it drift away from its trigger. But ignore scrolls
    // INSIDE the menu itself — long lists (e.g. the 50 states) need to scroll,
    // and keyboard nav calls scrollIntoView on the menu; those must not close it.
    const onReposition = (e?: Event) => {
      const t = e?.target as Node | null;
      if (t && menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  // Keep the keyboard-highlighted option scrolled into view.
  useEffect(() => {
    if (!open) return;
    menuRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${highlight}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          onBlur?.();
        }
      }}
    >
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill bg-white py-1.5 pl-4 pr-2.5 text-lg shadow-[0_1px_2px_rgba(16,24,32,0.06)] outline-none transition-shadow focus:ring-2 focus:ring-violet/40",
          value ? "text-deep-black" : "text-gray-2",
          error && "ring-2 ring-violet",
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-gray-1 transition-transform",
            open && "rotate-180",
          )}
          strokeWidth={2}
        />
      </button>

      {open && coords && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              style={{
                position: "fixed",
                top: coords.top,
                bottom: coords.bottom,
                left: coords.left,
                minWidth: coords.width,
                maxHeight: coords.maxHeight,
              }}
              className="z-50 overflow-y-auto rounded-card border border-stroke-subtle bg-white p-1 shadow-[0_16px_48px_rgba(16,24,32,0.16)]"
            >
              {options.map((opt, i) => {
                const active = opt.id === value;
                const highlighted = i === highlight;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    data-idx={i}
                    aria-selected={active}
                    onPointerEnter={() => setHighlight(i)}
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center whitespace-nowrap rounded-lg px-3 py-2 text-left text-base transition-colors",
                      active
                        ? "font-medium text-violet"
                        : "text-deep-black",
                      highlighted
                        ? active
                          ? "bg-violet/15"
                          : "bg-divider/60"
                        : active
                          ? "bg-violet/10"
                          : "hover:bg-divider/60",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/** Renders the correct inline control for a mad-libs blank. */
export function MadlibFieldView({
  field,
  value,
  onChange,
  onBlur,
  error,
}: {
  field: MadlibField;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
}) {
  if (field.type === "select") {
    return (
      <MadlibSelect
        field={field}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
      />
    );
  }
  if (field.type === "date") {
    return (
      <MadlibDate
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
      />
    );
  }
  return (
    <MadlibText
      field={field}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
    />
  );
}
