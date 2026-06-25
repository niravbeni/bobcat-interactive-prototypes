"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { MadlibField } from "@/lib/narrative";

/**
 * Edit a single About You mad-libs value from the side panel. Mirrors the v2
 * `EditAboutFieldModal` chrome but is driven by a {@link MadlibField} so it stays
 * in sync with the narrative config (selects render an option list, text/number
 * render an input). Writes to the same `answers.about` store as the inline pills.
 */
export function EditMadlibFieldModal({
  field,
  onClose,
}: {
  field: MadlibField;
  onClose: () => void;
}) {
  const { answers, setAbout } = useFlow();
  const [value, setValue] = useState<string>(
    answers.about[field.id]?.value ?? field.default ?? "",
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const label = field.sidebarLabel ?? field.id;

  const save = (next?: string) => {
    setAbout(field.id, (next ?? value).trim());
    onClose();
  };

  const isSelect = field.type === "select";
  const isNumeric = field.type === "number" || field.type === "money";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
    >
      <div
        className="absolute inset-0 bg-deep-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-[440px] flex-col rounded-field bg-card p-6 shadow-[0_24px_64px_rgba(16,24,32,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-[-0.01em] text-deep-black">
            {label}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-full p-1.5 text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        {isSelect ? (
          <div className="scrollbar-slim mt-5 flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1">
            {field.options?.map((opt) => {
              const active = value === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setValue(opt.id);
                    save(opt.id);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "flex shrink-0 items-center justify-between rounded-card border px-4 py-3 text-left text-base font-medium transition-colors",
                    active
                      ? "border-deep-black bg-white text-deep-black"
                      : "border-stroke-subtle bg-white text-deep-black hover:border-deep-black/30",
                  )}
                >
                  {opt.label}
                  {active ? (
                    <Check className="size-5 text-deep-black" strokeWidth={2.5} />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <input
              autoFocus
              inputMode={isNumeric ? "numeric" : "text"}
              value={value}
              onChange={(e) =>
                setValue(
                  isNumeric
                    ? e.target.value.replace(/[^0-9]/g, "")
                    : e.target.value,
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                }
              }}
              placeholder={field.placeholder ?? `Enter ${label.toLowerCase()}`}
              className="mt-5 w-full rounded-card border border-stroke-subtle bg-white px-4 py-3 text-base text-deep-black outline-none transition-colors placeholder:text-gray-text focus:border-deep-black"
            />
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-pill px-4 py-2 text-sm font-semibold text-deep-black transition-colors hover:bg-ghost-white"
              >
                Cancel
              </button>
              <Button variant="blue" size="md" onClick={() => save()}>
                Save
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
