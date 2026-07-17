"use client";

import { useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import {
  ChevronDown,
  ChevronLeft,
  Info,
  MoreVertical,
  Plus,
} from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { TAX_STATUS_LABEL, type TaxStatus } from "@/lib/institutions";
import { SignatureShell, NavPill } from "./SignatureShell";
import {
  SignatureDetailsSidebar,
  SignatureSummaryRow,
} from "./SignatureDetailsSidebar";
import { AddSavingModal } from "./AddSavingModal";
import {
  SIG_EASE,
  SIG_SPRING,
  SIG_SPRING_SNAPPY,
  fmtMoneyCents,
  useCountUp,
} from "./shared";

/** Static demo allocation shown in the "Total Investable Assets" card.
 *  Verbatim proportions/labels from Figma 1996:31029 (Banner/Advisor Banner). */
const ALLOCATION: { pct: number; label: string }[] = [
  { pct: 30, label: "Equities" },
  { pct: 40, label: "Bonds" },
  { pct: 15, label: "Cash" },
  { pct: 15, label: "Misc" },
];

export interface SigAsset {
  id: string;
  name: string;
  accountType: string;
  /** Retirement accounts carry a tax treatment for grouping. */
  taxStatus?: TaxStatus;
  /** Other assets carry a category for grouping. */
  category?: string;
  amount: number;
  accentColor?: string;
}

/** Tax-treatment groups (display order) with their one-line descriptions. */
const TAX_GROUPS: { tax: TaxStatus; desc: string }[] = [
  {
    tax: "tax-deferred",
    desc: "You'll pay tax on withdrawals from these in retirement",
  },
  {
    tax: "tax-free",
    desc: "Contributions are made with after-tax dollars; withdrawals are tax-free",
  },
  {
    tax: "tax-advantaged",
    desc: "Designed to reduce the tax burden on both contributions and withdrawals",
  },
  {
    tax: "taxable",
    desc: "Taxed on gains, dividends and interest as they occur",
  },
];

/** Circular category icons exported from the Figma populated frame
 *  (1802:22303) for the "Other assets" rows. */
const CATEGORY_ICON_SRC: Record<string, string> = {
  Property: "/signature/cat-property.svg",
  Vehicle: "/signature/cat-vehicle.svg",
  "Valuables & collections": "/signature/cat-valuables.svg",
  "Business interest": "/signature/cat-business.svg",
  Other: "/signature/cat-vehicle.svg",
};

export function SignatureAssetsScreen() {
  const { goTo } = useFlow();

  const [retirement, setRetirement] = useState<SigAsset[]>([]);
  const [other, setOther] = useState<SigAsset[]>([]);
  const [modal, setModal] = useState<"retirement" | "other" | null>(null);

  const retirementTotal = retirement.reduce((s, a) => s + a.amount, 0);
  const otherTotal = other.reduce((s, a) => s + a.amount, 0);
  const total = retirementTotal + otherTotal;
  const netWorth = useCountUp(total);
  const hasAssets = retirement.length > 0 || other.length > 0;

  // Net-worth card gives a subtle pop/settle each time an account is added.
  const netWorthControls = useAnimationControls();
  const addAsset = (asset: SigAsset) => {
    if (modal === "retirement") setRetirement((prev) => [...prev, asset]);
    else setOther((prev) => [...prev, asset]);
    netWorthControls.start({
      scale: [1, 1.035, 1],
      transition: { duration: 0.5, ease: SIG_EASE },
    });
  };

  return (
    <SignatureShell
      mode="tabs"
      scroll={false}
      askPill={false}
      subBar={{
        left: (
          <button
            type="button"
            onClick={() => goTo("sig-home")}
            className="inline-flex items-center gap-1 text-sm font-medium text-deep-black transition-opacity hover:opacity-60"
          >
            <ChevronLeft className="size-4" strokeWidth={2.2} />
            Back to summary
          </button>
        ),
        center: (
          <p className="text-xs text-[#18181b]">
            Your personalized outlook will update once we have more details in
            each category.
          </p>
        ),
        right: (
          <NavPill secondary="Spending" onClick={() => goTo("sig-expense")}>
            Next Section
          </NavPill>
        ),
      }}
      bodyClassName="p-4"
    >
      <div className="flex min-h-0 w-full flex-1 gap-4">
        <SignatureDetailsSidebar
          selected="assets"
          selectedComplete={hasAssets}
          onNavigate={(section) => {
            if (section === "spending") goTo("sig-expense");
            else if (section === "goals") goTo("sig-goals");
          }}
          subContent={
            <div className="flex flex-col gap-0.5 px-1 pb-2 pt-0.5">
              <SignatureSummaryRow
                label="Total Investable Assets"
                value={fmtMoneyCents(total)}
              />
              <SignatureSummaryRow
                label="Retirement savings"
                value={`${fmtMoneyCents(retirementTotal)} · ${retirement.length} ${
                  retirement.length === 1 ? "Account" : "Accounts"
                }`}
                indented
              />
              <SignatureSummaryRow
                label="Other assets"
                value={`${fmtMoneyCents(otherTotal)} · ${other.length} ${
                  other.length === 1 ? "Item" : "Items"
                }`}
                indented
              />
            </div>
          }
        />

        <div className="scrollbar-slim mx-auto flex min-h-0 min-w-0 max-w-[1080px] flex-1 flex-col gap-5 overflow-y-auto pb-24 pr-1">
          {/* Header card (Figma 1996:30993): the "Your retirement assets"
              heading sits ABOVE the two info cards, wrapped together in a
              translucent white card. */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: SIG_EASE }}
            className="flex shrink-0 flex-col gap-6 rounded-card bg-white/75 p-6 sm:p-8"
          >
            {/* Heading with the violet left accent bar. */}
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="h-[30px] w-[3px] shrink-0 rounded-full bg-violet"
              />
              <h1 className="text-[28px] font-medium leading-none tracking-[-0.64px] text-[#18181b] sm:text-[32px]">
                Your retirement assets
              </h1>
            </div>

            {/* Two collapsible info cards. */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <InfoCard
                iconSrc="/signature/icon-plan.svg"
                title="What you need to do"
              />
              <InfoCard
                iconSrc="/signature/icon-info.svg"
                title="How this affects your retirement plan"
              />
            </div>
          </motion.div>

          {/* Total Investable Assets card (count-up + allocation breakdown). */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: SIG_EASE, delay: 0.1 }}
            className="relative flex shrink-0 items-start justify-between gap-6 overflow-hidden rounded-card p-6 text-white"
            style={{
              // Hero gradient verbatim from Figma 1996:31021 (Banner/Advisor
              // Banner). The black layer sits BENEATH the opaque gradient in
              // Figma, so it never shows — no darkening here.
              backgroundImage:
                "linear-gradient(191.69deg, #742ca5 19.541%, #d124b8 137.51%)",
            }}
          >
            {/* Figma Banner/Advisor Banner texture image, soft-light blended. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-soft-light"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/signature/banner-texture.png"
                alt=""
                className="absolute left-0 top-[-84%] h-[275%] w-full max-w-none"
              />
            </div>

            <div className="relative flex min-w-0 flex-col gap-[19px]">
              <motion.div
                animate={netWorthControls}
                className="flex origin-left flex-col gap-1"
              >
                <span className="text-xl leading-[1.16] text-white">
                  Total Investable Assets
                </span>
                <span className="text-[40px] font-medium leading-[1.1] tracking-[-0.8px]">
                  {fmtMoneyCents(netWorth)}
                </span>
              </motion.div>
              <div className="flex flex-wrap items-center gap-x-[19px] gap-y-1 text-xs font-medium text-white">
                <span>
                  Retirement savings accounts · {fmtMoneyCents(retirementTotal)}
                </span>
                <span aria-hidden className="hidden h-2 w-px bg-white/60 sm:block" />
                <span>Other assets · {fmtMoneyCents(otherTotal)}</span>
              </div>
            </div>

            {/* Right-side allocation breakdown; hidden in the empty ($0.00)
                state per Figma 1984:24518. */}
            <AnimatePresence initial={false}>
              {hasAssets ? <AllocationBreakdown /> : null}
            </AnimatePresence>
          </motion.div>

          {/* Retirement savings accounts. */}
          <SectionCard
            title="Retirement savings accounts"
            subtitle="401(k), IRA, Pension etc"
            addLabel="Add retirement savings"
            onAdd={() => setModal("retirement")}
            showPlaidLink
            delay={0.14}
          >
            {retirement.length === 0 ? (
              <EmptyState caption="Your 401(k), IRA, and other savings accounts will show up here once you add them." />
            ) : (
              <GroupedRetirement rows={retirement} />
            )}
          </SectionCard>

          {/* Other assets. */}
          <SectionCard
            title="Other assets"
            subtitle="Property, vehicles, collections"
            addLabel="Add other assets"
            onAdd={() => setModal("other")}
            delay={0.18}
          >
            {other.length === 0 ? (
              <EmptyState caption="Property, vehicles, and collections will show up here once you add them." />
            ) : (
              <GroupedOther rows={other} />
            )}
          </SectionCard>
        </div>
      </div>

      <AddSavingModal
        open={modal !== null}
        variant={modal === "other" ? "other" : "retirement"}
        onClose={() => setModal(null)}
        onAdd={addAsset}
      />
    </SignatureShell>
  );
}

/* ------------------------------------------------------------------ */
/* Allocation breakdown visual (static demo)                           */
/* ------------------------------------------------------------------ */

/** Four proportional translucent blocks on the right of the card. Widths are
 *  proportional to the percentages; blocks grow in with a staggered spring. */
function AllocationBreakdown() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: SIG_EASE } }}
      transition={{ duration: 0.3, ease: SIG_EASE }}
      className="relative hidden h-[99px] w-[440px] shrink-0 gap-[2px] self-start lg:flex"
      aria-hidden
    >
      {ALLOCATION.map((block, i) => (
        <motion.div
          key={block.label}
          initial={{ opacity: 0, scaleX: 0.7 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ ...SIG_SPRING, delay: 0.12 + i * 0.08 }}
          style={{ flexGrow: block.pct, flexBasis: 0, transformOrigin: "left" }}
          className={`flex min-w-0 flex-col justify-between gap-2 bg-white/20 p-3 ${
            i === 0
              ? "rounded-l-lg rounded-r-[4px]"
              : i === ALLOCATION.length - 1
                ? "rounded-l-[4px] rounded-r-lg"
                : "rounded-[4px]"
          }`}
        >
          <span className="text-xs leading-none tracking-[-0.38px] text-white">
            {block.pct}%
          </span>
          <span className="flex items-center gap-0.5">
            <span className="truncate text-sm font-medium tracking-[-0.1px] text-white">
              {block.label}
            </span>
            <Info className="size-4 shrink-0 text-white" strokeWidth={2} />
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Grouped lists                                                       */
/* ------------------------------------------------------------------ */

function GroupedRetirement({ rows }: { rows: SigAsset[] }) {
  const groups = TAX_GROUPS.map((g) => ({
    ...g,
    items: rows.filter((r) => r.taxStatus === g.tax),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <motion.div
          key={group.tax}
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SIG_SPRING}
          className="flex flex-col gap-2"
        >
          <div className="flex flex-col">
            <span className="text-base font-medium leading-[1.45] text-black">
              {TAX_STATUS_LABEL[group.tax]}
            </span>
            <span className="text-xs leading-[1.9] text-gray-1">{group.desc}</span>
          </div>
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {group.items.map((row, i) => (
                <AssetRow key={row.id} row={row} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function GroupedOther({ rows }: { rows: SigAsset[] }) {
  const categories = Array.from(new Set(rows.map((r) => r.category ?? "Other")));
  return (
    <div className="flex flex-col gap-6">
      {categories.map((cat) => {
        const items = rows.filter((r) => (r.category ?? "Other") === cat);
        return (
          <motion.div
            key={cat}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SIG_SPRING}
            className="flex flex-col gap-2"
          >
            <span className="text-base font-medium leading-[1.45] text-black">
              {cat}
            </span>
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {items.map((row, i) => (
                  <AssetRow key={row.id} row={row} index={i} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function AssetRow({ row, index }: { row: SigAsset; index: number }) {
  const categoryIcon = row.category
    ? CATEGORY_ICON_SRC[row.category] ?? CATEGORY_ICON_SRC.Other
    : null;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.96,
        transition: { duration: 0.18, ease: SIG_EASE },
      }}
      transition={{ ...SIG_SPRING_SNAPPY, delay: index * 0.05 }}
      className="flex items-center justify-between gap-3 rounded-field bg-black/[0.03] px-4 py-2 transition-colors hover:bg-black/[0.05]"
    >
      <span className="flex min-w-0 items-center gap-3">
        {/* Figma 1802:22303: retirement rows show a 32px white circle with a
            28px circular brand logo; other-asset rows show circular category
            icons exported from the frame. */}
        {categoryIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={categoryIcon} alt="" aria-hidden className="size-8 shrink-0" />
        ) : (
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-[#eee] bg-white">
            <ProviderLogo
              provider={row.name}
              accentColor={row.accentColor}
              className="size-7"
              textClassName="text-[10px]"
            />
          </span>
        )}
        <span className="truncate text-base font-medium leading-[1.45] text-black">
          {row.name}
        </span>
        {row.accountType ? (
          <span className="shrink-0 rounded-full border border-gray-1 px-2 py-0.5 text-xs font-medium uppercase leading-[16.5px] tracking-[0.66px] text-black opacity-75">
            {row.accountType}
          </span>
        ) : null}
      </span>

      <span className="flex shrink-0 items-center gap-3">
        <span className="flex items-center gap-3 rounded-full bg-white py-1.5 pl-3 pr-4 text-base tracking-[-0.32px] text-black">
          <span>$</span>
          <span>
            {row.amount > 0
              ? fmtMoneyCents(row.amount).replace("$", "")
              : "—"}
          </span>
        </span>
        <button
          type="button"
          aria-label="More options"
          className="rounded-full p-0.5 text-deep-black transition-colors hover:bg-black/5"
        >
          <MoreVertical className="size-6" strokeWidth={2} />
        </button>
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Section card                                                        */
/* ------------------------------------------------------------------ */

function SectionCard({
  title,
  subtitle,
  addLabel,
  onAdd,
  delay,
  showPlaidLink = false,
  children,
}: {
  title: string;
  subtitle: string;
  addLabel: string;
  onAdd: () => void;
  delay: number;
  /** Retirement section shows the inert blue "Connect accounts with Plaid" link
   *  next to the add button (the Plaid tab moved out of the modal). */
  showPlaidLink?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: SIG_EASE, delay, layout: SIG_SPRING }}
      className="shrink-0 overflow-hidden rounded-card border border-[#eee] bg-white"
    >
      <motion.div
        layout="position"
        className="flex flex-wrap items-center justify-between gap-3 px-6 py-5"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xl leading-[23.25px] text-black">{title}</span>
          <span className="flex items-center gap-1 text-xs leading-[1.4] tracking-[-0.12px] text-gray-1">
            {subtitle}
            <Info className="size-4 text-gray-1" strokeWidth={2} />
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showPlaidLink ? (
            <button
              type="button"
              className="px-3 text-sm tracking-[0.14px] text-stratosphere transition-opacity hover:opacity-70"
            >
              Connect accounts with Plaid
            </button>
          ) : null}
          <motion.button
            type="button"
            onClick={onAdd}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="group inline-flex h-12 items-center gap-3 rounded-full bg-black px-6 text-sm font-medium tracking-[0.14px] text-white transition-colors hover:bg-black/85 sm:w-[256px] sm:justify-between sm:gap-0"
          >
            {addLabel}
            <Plus
              className="size-6 transition-transform duration-300 group-hover:rotate-90"
              strokeWidth={2}
            />
          </motion.button>
        </div>
      </motion.div>
      <div className="border-t border-[#eee] px-6 pb-6 pt-4">{children}</div>
    </motion.section>
  );
}

function EmptyState({ caption }: { caption: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center gap-1.5 py-8 text-center"
    >
      {/* Soft sphere visual exported from Figma 1984:24518. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/signature/empty-sphere.svg"
        alt=""
        aria-hidden
        className="size-9"
      />
      <span className="text-xl text-gray-1">Nothing added yet</span>
      {/* Non-essential caption → shimmer placeholder bars. */}
      <span
        className="mt-1 flex w-full max-w-[440px] flex-col items-center gap-1.5"
        aria-label={caption}
      >
        <span className="h-2.5 w-[86%] rounded-full skeleton-shimmer" aria-hidden />
        <span className="h-2.5 w-[54%] rounded-full skeleton-shimmer" aria-hidden />
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Collapsible info card                                              */
/* ------------------------------------------------------------------ */

function InfoCard({
  iconSrc,
  title,
  defaultOpen = true,
}: {
  /** Color icon exported from the Figma frame (48px). */
  iconSrc: string;
  title: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`relative flex items-start gap-[22px] overflow-hidden rounded-card bg-black/[0.02] px-5 transition-[padding] duration-300 ${
        open ? "py-5" : "py-2"
      }`}
    >
      {/* Textured light-gray fill (Figma 1996:30999): the banner texture image
          overlaid very faintly. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/signature/banner-texture.png"
          alt=""
          className="absolute left-0 top-[-120%] h-[340%] w-full max-w-none opacity-[0.06]"
        />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconSrc} alt="" aria-hidden className="relative size-12 shrink-0" />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`flex items-center justify-between gap-2 text-left transition-[min-height] duration-300 ${
            open ? "min-h-5" : "min-h-12"
          }`}
        >
          {/* Card heading is essential → real text. */}
          <span className="text-sm font-medium leading-[1.4] tracking-[-0.42px] text-black">
            {title}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25, ease: SIG_EASE }}
          >
            <ChevronDown className="size-[18px] text-gray-2" strokeWidth={2} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={SIG_SPRING}
              className="overflow-hidden"
            >
              {/* Body copy is non-essential → shimmer placeholder bars. */}
              <div className="flex flex-col gap-1.5 pt-3" aria-hidden>
                <span className="h-2.5 w-full rounded-full skeleton-shimmer" />
                <span className="h-2.5 w-[92%] rounded-full skeleton-shimmer" />
                <span className="h-2.5 w-[60%] rounded-full skeleton-shimmer" />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

