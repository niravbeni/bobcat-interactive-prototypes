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
  // Anchor coordinates for the fixed-position menu so it escapes the scroll
  // container's overflow clipping (an absolute menu would get cut off).
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const label = optionLabel(field, value) || (field.placeholder ?? "select");

  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
    setOpen(true);
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
    // rather than letting it drift away from its trigger.
    const onReposition = () => setOpen(false);
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
                left: coords.left,
                minWidth: coords.width,
              }}
              className="z-50 max-h-[40vh] overflow-y-auto rounded-card border border-stroke-subtle bg-white p-1 shadow-[0_16px_48px_rgba(16,24,32,0.16)]"
            >
              {field.options?.map((opt) => {
                const active = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center whitespace-nowrap rounded-lg px-3 py-2 text-left text-base transition-colors",
                      active
                        ? "bg-violet/10 font-medium text-violet"
                        : "text-deep-black hover:bg-divider/60",
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
