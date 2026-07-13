"use client";

import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { DetailsShell } from "@/components/prototypes/details/DetailsShell";
import { InfoTarget } from "@/components/prototypes/details/DetailsInfoTip";
import { isDetailsV2Variant } from "@/lib/variants";
import type { DetailsAbout } from "@/lib/types";

const RELATIONSHIP_OPTIONS = [
  "Single",
  "Married",
  "Partnered",
  "Divorced",
  "Widowed",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Number of days in a given 1-indexed month/year (handles leap Februaries). */
function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/**
 * Details v2 gives the page header a lighter, origin-cued settle (a gentle
 * overshoot spring) so it feels like it arrives when navigating from the hub.
 * Non-v2 keeps the original tween so the shared screen stays pristine.
 */
const headerEnterFor = (isV2: boolean) =>
  isV2
    ? {
        initial: { opacity: 0, y: 10, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { type: "spring" as const, stiffness: 320, damping: 24 },
      }
    : enter(0);

/**
 * About-you details page (frame 979-29979). Editable "Basic Details" bound to
 * the shared details.about, followed by a blocked-out "Spouse Details" section
 * matching the frame's placeholder rows.
 */
export function AboutYouDetailsScreen() {
  const { answers, setDetails, variant } = useFlow();
  const about = answers.details.about;
  const headerEnter = headerEnterFor(isDetailsV2Variant(variant));

  const set = (patch: Partial<DetailsAbout>) =>
    setDetails({ about: { ...about, ...patch } });

  return (
    <DetailsShell>
      <motion.div {...headerEnter} className="mt-3 max-w-[640px]">
        <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black">
          <InfoTarget tipId="about-you">About you details</InfoTarget>
        </h1>
        <p className="mt-2 text-sm leading-snug text-black/70">
          Here&apos;s the data we&apos;ve collected so far about you.
          <br />
          All fields are required unless they have an optional tag.
        </p>
      </motion.div>

      {/* Basic Details */}
      <motion.section {...enter(0.08)} className="mt-7">
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-deep-black">
          Basic Details
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="First name">
            <TextInput
              value={about.firstName}
              onChange={(v) => set({ firstName: v })}
            />
          </Field>
          <Field label="Middle name (optional)">
            <TextInput
              value={about.middleName}
              onChange={(v) => set({ middleName: v })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Last name">
              <TextInput
                value={about.lastName}
                onChange={(v) => set({ lastName: v })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Date of birth">
              <DobPicker value={about.dob} onChange={(v) => set({ dob: v })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Zip Code">
              <TextInput
                value={about.zip}
                onChange={(v) => set({ zip: v.replace(/[^0-9]/g, "").slice(0, 5) })}
                inputMode="numeric"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Relationship Status">
              <SelectField
                value={about.relationship}
                onChange={(v) => set({ relationship: v })}
                ariaLabel="Relationship Status"
                options={RELATIONSHIP_OPTIONS.map((o) => ({ value: o, label: o }))}
              />
            </Field>
          </div>
        </div>
      </motion.section>

      {/* Spouse Details — blocked-out placeholders per the frame. */}
      <motion.section {...enter(0.16)} className="mt-9 pb-6">
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-deep-black">
          Spouse Details
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-field border border-stroke-subtle bg-white px-4 py-4"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-16 rounded-full skeleton-shimmer" />
                <span className="h-2.5 w-12 rounded-full skeleton-shimmer" />
                <span className="h-2.5 w-14 rounded-full skeleton-shimmer" />
              </div>
              <div className="mt-3">
                <span className="block h-2.5 w-24 rounded-full skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </DetailsShell>
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
      <span className="text-xs font-semibold text-stratosphere">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  inputMode?: "text" | "numeric";
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputMode={inputMode}
      className="h-12 w-full rounded-field border border-stroke-subtle bg-white px-3.5 text-sm font-medium text-deep-black outline-none transition-colors focus:border-violet/50"
    />
  );
}

/** Styled native select with a chevron affordance. */
function SelectField({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
  ariaLabel?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="h-12 w-full appearance-none rounded-field border border-stroke-subtle bg-white px-3 pr-9 text-sm font-medium text-deep-black outline-none transition-colors focus:border-violet/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-2" />
    </div>
  );
}

/**
 * Day / Month / Year "age scroller" for the date of birth. Parses and emits a
 * DD/MM/YYYY string (kept in sync with the sidebar), clamping the day to the
 * number of days in the selected month/year.
 */
function DobPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [dRaw, mRaw, yRaw] = value.split("/");
  const day = Number(dRaw) || 1;
  const month = Number(mRaw) || 1;
  const year = Number(yRaw) || 1970;

  const thisYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = thisYear; y >= 1920; y--) years.push(y);

  const maxDay = daysInMonth(month, year);
  const days: number[] = [];
  for (let d = 1; d <= maxDay; d++) days.push(d);

  const emit = (d: number, m: number, y: number) => {
    const clampedDay = Math.min(d, daysInMonth(m, y));
    const dd = String(clampedDay).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    onChange(`${dd}/${mm}/${y}`);
  };

  return (
    <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
      <SelectField
        ariaLabel="Day of birth"
        value={day}
        onChange={(v) => emit(Number(v), month, year)}
        options={days.map((d) => ({ value: d, label: String(d) }))}
      />
      <SelectField
        ariaLabel="Month of birth"
        value={month}
        onChange={(v) => emit(day, Number(v), year)}
        options={MONTHS.map((name, i) => ({ value: i + 1, label: name }))}
      />
      <SelectField
        ariaLabel="Year of birth"
        value={year}
        onChange={(v) => emit(day, month, Number(v))}
        options={years.map((y) => ({ value: y, label: String(y) }))}
      />
    </div>
  );
}
