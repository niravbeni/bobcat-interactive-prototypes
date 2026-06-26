"use client";

import { cn } from "@/lib/cn";
import { Option, OptionList } from "@/components/ui/Option";
import type { MadlibField } from "@/lib/narrative";

/** Today (import-time) as yyyy-mm-dd, used to cap date pickers to the past. */
const TODAY_ISO = new Date().toISOString().slice(0, 10);

/** Format a raw digit string as a grouped number (e.g. "5000" -> "5,000"). */
function formatGrouped(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits).toLocaleString("en-US") : "";
}

/** Large field-styled text/number input matching the base-flow money field. */
function BigInput({
  field,
  value,
  onChange,
  onSubmit,
  error,
  compact = false,
}: {
  field: MadlibField;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  error?: boolean;
  compact?: boolean;
}) {
  const isNumeric = field.type === "number";
  const display = isNumeric ? formatGrouped(value) : value;
  return (
    <div
      className={cn(
        "flex w-full items-center rounded-field border border-stroke-subtle bg-white",
        compact ? "h-12 px-4" : "h-20 px-6",
        error && "border-violet ring-1 ring-violet",
      )}
    >
      <input
        type="text"
        inputMode={isNumeric ? "numeric" : "text"}
        value={display}
        placeholder={field.placeholder ?? ""}
        onChange={(e) =>
          onChange(
            isNumeric ? e.target.value.replace(/[^0-9]/g, "") : e.target.value,
          )
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        className={cn(
          "w-full bg-transparent text-black outline-none placeholder:text-gray-text",
          compact ? "text-base leading-snug" : "text-2xl leading-[1.6]",
        )}
      />
    </div>
  );
}

/** Large field-styled money input: stores raw digits, displays grouped with $. */
function BigMoney({
  field,
  value,
  onChange,
  onSubmit,
  error,
  compact = false,
}: {
  field: MadlibField;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  error?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center rounded-field border border-stroke-subtle bg-white",
        compact ? "h-12 px-4" : "h-20 px-6",
        error && "border-violet ring-1 ring-violet",
      )}
    >
      <span
        className={cn(
          "text-black",
          compact ? "text-base leading-snug" : "text-2xl leading-[1.6]",
        )}
      >
        $
      </span>
      <input
        inputMode="numeric"
        value={formatGrouped(value)}
        placeholder={field.placeholder ?? "0"}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        className={cn(
          "ml-2 w-full bg-transparent text-black outline-none placeholder:text-gray-text",
          compact ? "text-base leading-snug" : "text-2xl leading-[1.6]",
        )}
      />
    </div>
  );
}

/** Large field-styled native date input. */
function BigDate({
  value,
  onChange,
  onSubmit,
  error,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  error?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center rounded-field border border-stroke-subtle bg-white",
        compact ? "h-12 px-4" : "h-20 px-6",
        error && "border-violet ring-1 ring-violet",
      )}
    >
      <input
        type="date"
        value={value}
        max={TODAY_ISO}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit?.();
          }
        }}
        className={cn(
          "w-full bg-transparent text-black outline-none",
          compact ? "text-base leading-snug" : "text-2xl leading-[1.6]",
        )}
      />
    </div>
  );
}

/**
 * Renders one {@link MadlibField} as a base-linear question block: a question
 * heading + optional helper, then the appropriate control (option buttons for
 * selects, a money field for amounts, a large input otherwise). Reads/writes the
 * value via the caller (which stores it in `answers.about`), so it stays in sync
 * with the live side panel and outlook. `onSubmit` advances when the user
 * presses Enter inside a text/money/date input.
 */
export function SectionQuestion({
  field,
  value,
  onChange,
  onSubmit,
  error,
  compact = false,
}: {
  field: MadlibField;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  error?: boolean;
  /**
   * Smaller heading, helper, controls and option buttons for dense stacked
   * layouts (the experienced `hybrid-quick` scroll flow). Defaults to the large
   * base-linear size used by the guided wizard and base linear flow.
   */
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col", compact ? "gap-3" : "gap-5")}>
      <div className="flex flex-col gap-2">
        <h2
          className={cn(
            "max-w-[640px] font-semibold tracking-[-0.02em] text-deep-black",
            compact
              ? "text-lg leading-snug sm:text-xl"
              : "text-[28px] leading-[1.12] sm:text-[32px]",
          )}
        >
          {field.question}
        </h2>
        {field.helper ? (
          <p
            className={cn(
              "max-w-[560px] leading-snug text-gray-text",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {field.helper}
          </p>
        ) : null}
      </div>

      {field.type === "select" ? (
        <OptionList compact={compact}>
          {field.options?.map((opt) => (
            <Option
              key={opt.id}
              label={opt.label}
              selected={value === opt.id}
              onClick={() => onChange(opt.id)}
              compact={compact}
            />
          ))}
        </OptionList>
      ) : field.type === "money" ? (
        <BigMoney
          field={field}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          error={error}
          compact={compact}
        />
      ) : field.type === "date" ? (
        <BigDate
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          error={error}
          compact={compact}
        />
      ) : (
        <BigInput
          field={field}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          error={error}
          compact={compact}
        />
      )}
    </div>
  );
}
