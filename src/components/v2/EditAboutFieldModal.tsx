"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface AboutField {
  id: string;
  /** Mono label shown on the row + as the modal eyebrow. */
  label: string;
  /** Pre-filled mock value so the section isn't empty. */
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  /** When set, the field is edited as a single-select choice list. */
  options?: string[];
  /** When set, the field is edited via a year selector list. */
  yearSelector?: boolean;
}

/**
 * Year options for the year-selector fields: this year through ~40 years out,
 * plus any already-stored value that falls outside that window so the current
 * selection always appears in the list.
 */
function yearOptions(current?: string): string[] {
  const now = new Date().getFullYear();
  const years: number[] = [];
  for (let y = now; y <= now + 40; y += 1) years.push(y);
  const stored = current ? Number.parseInt(current, 10) : NaN;
  if (!Number.isNaN(stored) && !years.includes(stored)) {
    years.push(stored);
    years.sort((a, b) => a - b);
  }
  return years.map(String);
}

/** Personal details shown under the "About you" tab. */
export const ABOUT_FIELDS: AboutField[] = [
  { id: "firstName", label: "First name", defaultValue: "Gloria", required: true },
  { id: "middleName", label: "Middle name", defaultValue: "May" },
  { id: "lastName", label: "Last name", defaultValue: "Stevens", required: true },
  {
    id: "dob",
    label: "Date of birth",
    defaultValue: "21 / 08 / 1964",
    placeholder: "DD / MM / YYYY",
    required: true,
  },
  {
    id: "postcode",
    label: "Home postcode",
    placeholder: "Add yours",
    required: true,
  },
  {
    id: "maritalStatus",
    label: "Marital status",
    defaultValue: "Married",
    options: [
      "Single",
      "Married",
      "Civil partnership",
      "Divorced",
      "Widowed",
      "Separated",
    ],
  },
  {
    id: "retireYear",
    label: "Target retirement year",
    defaultValue: "2031",
    yearSelector: true,
  },
];

/** Current display value for an About field (saved answer → mock default). */
export function aboutValue(
  field: AboutField,
  about: Record<string, { value?: string }>,
): string {
  const saved = about[field.id]?.value;
  return saved != null ? saved : (field.defaultValue ?? "");
}

/**
 * Edit popup for a single "About you" free-text field. Unlike the
 * income/spending EditQuestionModal, these are obvious details (names, date of
 * birth, …) so the popup is a plain form — a label and an input — rather than a
 * conversational question.
 */
export function EditAboutFieldModal({
  field,
  onClose,
}: {
  field: AboutField;
  onClose: () => void;
}) {
  const { answers, setAnswers } = useFlow();
  const [value, setValue] = useState<string>(() =>
    aboutValue(field, answers.about),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = (next?: string) => {
    const raw = next ?? value;
    setAnswers({
      about: {
        ...answers.about,
        [field.id]: { value: raw.trim(), at: Date.now() },
      },
    });
    onClose();
  };

  const choices = field.yearSelector
    ? yearOptions(aboutValue(field, answers.about))
    : field.options;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={field.label}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
    >
      <div
        className="absolute inset-0 bg-deep-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-[440px] flex-col rounded-field bg-card p-6 shadow-[0_24px_64px_rgba(16,24,32,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold tracking-[-0.01em] text-deep-black">
              {field.label}
            </h2>
            {field.required ? (
              <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-mandarin">
                Required
              </span>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-full p-1.5 text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        {choices ? (
          <div
            className={cn(
              "scrollbar-slim mt-5 flex flex-col gap-2",
              field.yearSelector && "max-h-[320px] overflow-y-auto pr-1",
            )}
          >
            {choices.map((opt) => {
              const active = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  ref={
                    active && field.yearSelector
                      ? (el) => el?.scrollIntoView({ block: "center" })
                      : undefined
                  }
                  onClick={() => {
                    setValue(opt);
                    save(opt);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "flex shrink-0 items-center justify-between rounded-card border px-4 py-3 text-left text-base font-medium transition-colors",
                    active
                      ? "border-deep-black bg-white text-deep-black"
                      : "border-stroke-subtle bg-white text-deep-black hover:border-deep-black/30",
                  )}
                >
                  {opt}
                  {active ? <Check className="size-5 text-deep-black" strokeWidth={2.5} /> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            placeholder={field.placeholder ?? `Enter your ${field.label.toLowerCase()}`}
            className="mt-5 w-full rounded-card border border-stroke-subtle bg-white px-4 py-3 text-base text-deep-black outline-none transition-colors focus:border-deep-black placeholder:text-gray-text"
          />
        )}

        {choices ? null : (
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
        )}
      </div>
    </div>
  );
}
