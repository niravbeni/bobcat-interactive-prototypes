"use client";

import { Fragment, useEffect, useState } from "react";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { cn } from "@/lib/cn";
import type { StepId } from "@/lib/types";
import { SignatureShell, NavPill, SIG_DEMO_CLEAR_EVENT } from "./SignatureShell";
import { SIG_EASE, SIG_HERO_GRADIENT, SIG_HOME_GRADIENT } from "./shared";

/**
 * Status glyphs taken 1:1 from the Figma frame (Material Symbols), inlined so
 * the tick / half-circle / empty circle / lock match exactly in size, weight
 * and fill rather than approximating with lucide equivalents.
 */
function MaterialGlyph({ d, fill, className }: { d: string; fill: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-6 shrink-0", className)}
      fill="none"
      aria-hidden
    >
      <path d={d} fill={fill} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

const GLYPH_CHECK_CIRCLE =
  "M10.5615 14.4923L8.0655 11.9963C7.97183 11.9026 7.85708 11.8526 7.72125 11.8463C7.58525 11.8398 7.46408 11.8898 7.35775 11.9963C7.25125 12.1026 7.198 12.2205 7.198 12.35C7.198 12.4795 7.25125 12.5974 7.35775 12.7037L9.99625 15.3422C10.1578 15.5037 10.3462 15.5845 10.5615 15.5845C10.7768 15.5845 10.9653 15.5037 11.127 15.3422L16.6038 9.8655C16.6974 9.77183 16.7474 9.65708 16.7538 9.52125C16.7603 9.38525 16.7103 9.26408 16.6038 9.15775C16.4974 9.05125 16.3795 8.998 16.25 8.998C16.1205 8.998 16.0026 9.05125 15.8962 9.15775L10.5615 14.4923ZM12.0033 21C10.7587 21 9.58867 20.7638 8.493 20.2915C7.3975 19.8192 6.4445 19.1782 5.634 18.3685C4.8235 17.5588 4.18192 16.6067 3.70925 15.512C3.23642 14.4175 3 13.2479 3 12.0033C3 10.7587 3.23617 9.58867 3.7085 8.493C4.18083 7.3975 4.82183 6.4445 5.6315 5.634C6.44117 4.8235 7.39333 4.18192 8.488 3.70925C9.5825 3.23642 10.7521 3 11.9967 3C13.2413 3 14.4113 3.23617 15.507 3.7085C16.6025 4.18083 17.5555 4.82183 18.366 5.6315C19.1765 6.44117 19.8181 7.39333 20.2908 8.488C20.7636 9.5825 21 10.7521 21 11.9967C21 13.2413 20.7638 14.4113 20.2915 15.507C19.8192 16.6025 19.1782 17.5555 18.3685 18.366C17.5588 19.1765 16.6067 19.8181 15.512 20.2908C14.4175 20.7636 13.2479 21 12.0033 21Z";
const GLYPH_CIRCLE =
  "M12.0033 3C10.7587 3 9.58867 3.23616 8.493 3.7085C7.3975 4.18083 6.4445 4.82183 5.634 5.6315C4.8235 6.44117 4.18192 7.39333 3.70925 8.488C3.23642 9.5825 3 10.7521 3 11.9967C3 13.2413 3.23617 14.4113 3.7085 15.507C4.18083 16.6025 4.82183 17.5555 5.6315 18.366C6.44117 19.1765 7.39333 19.8181 8.488 20.2908C9.5825 20.7636 10.7521 21 11.9967 21C13.2413 21 14.4113 20.7638 15.507 20.2915C16.6025 19.8192 17.5555 19.1782 18.366 18.3685C19.1765 17.5588 19.8181 16.6067 20.2908 15.512C20.7636 14.4175 21 13.2479 21 12.0033C21 10.7587 20.7638 9.58867 20.2915 8.493C19.8192 7.3975 19.1782 6.4445 18.3685 5.634C17.5588 4.8235 16.6067 4.18192 15.512 3.70925C14.4175 3.23642 13.2479 3 12.0033 3ZM12 4C14.2333 4 16.125 4.775 17.675 6.325C19.225 7.875 20 9.76667 20 12C20 14.2333 19.225 16.125 17.675 17.675C16.125 19.225 14.2333 20 12 20C9.76667 20 7.875 19.225 6.325 17.675C4.775 16.125 4 14.2333 4 12C4 9.76667 4.775 7.875 6.325 6.325C7.875 4.775 9.76667 4 12 4Z";
// Material Symbols "lock" (filled) — path taken 1:1 from Figma node 2165:29016
// (the locked Goals row in frame 2165:28956), filled with gray-2 (#8b919a).
const GLYPH_LOCK =
  "M6.6155 21C6.17117 21 5.79083 20.8418 5.4745 20.5255C5.15817 20.2092 5 19.8288 5 19.3845V10.6155C5 10.1712 5.15817 9.79083 5.4745 9.4745C5.79083 9.15817 6.17117 9 6.6155 9H8V7C8 5.88583 8.38817 4.94067 9.1645 4.1645C9.94067 3.38817 10.8858 3 12 3C13.1142 3 14.0593 3.38817 14.8355 4.1645C15.6118 4.94067 16 5.88583 16 7V9H17.3845C17.8288 9 18.2092 9.15817 18.5255 9.4745C18.8418 9.79083 19 10.1712 19 10.6155V19.3845C19 19.8288 18.8418 20.2092 18.5255 20.5255C18.2092 20.8418 17.8288 21 17.3845 21H6.6155ZM13.0663 16.0663C13.3554 15.7773 13.5 15.4218 13.5 15C13.5 14.5782 13.3554 14.2227 13.0663 13.9337C12.7773 13.6446 12.4218 13.5 12 13.5C11.5782 13.5 11.2228 13.6446 10.9338 13.9337C10.6446 14.2227 10.5 14.5782 10.5 15C10.5 15.4218 10.6446 15.7773 10.9338 16.0663C11.2228 16.3554 11.5782 16.5 12 16.5C12.4218 16.5 12.7773 16.3554 13.0663 16.0663ZM9 9H15V7C15 6.16667 14.7083 5.45833 14.125 4.875C13.5417 4.29167 12.8333 4 12 4C11.1667 4 10.4583 4.29167 9.875 4.875C9.29167 5.45833 9 6.16667 9 7V9Z";
// Material Symbols "contrast" (half-filled) — path taken 1:1 from Figma node
// 2165:28984 (the Income "In progress" row in frame 2165:28956). The exported
// asset bakes in a near-black fill (#1c1b1f), so it renders the same dark
// half-circle shown in the frame rather than a gray tint.
const GLYPH_CONTRAST =
  "M8.493 20.2915C7.3975 19.8192 6.4445 19.1782 5.634 18.3685C4.8235 17.5588 4.18192 16.6067 3.70925 15.512C3.23642 14.4175 3 13.2479 3 12.0032C3 10.7587 3.23617 9.58867 3.7085 8.493C4.18083 7.3975 4.82183 6.4445 5.6315 5.634C6.44117 4.8235 7.39333 4.18192 8.488 3.70925C9.5825 3.23642 10.7521 3 11.9967 3C13.2412 3 14.4113 3.23617 15.507 3.7085C16.6025 4.18083 17.5555 4.82183 18.366 5.6315C19.1765 6.44117 19.8181 7.39333 20.2908 8.488C20.7636 9.5825 21 10.7521 21 11.9967C21 13.2412 20.7638 14.4113 20.2915 15.507C19.8192 16.6025 19.1782 17.5555 18.3685 18.366C17.5588 19.1765 16.6067 19.8181 15.512 20.2908C14.4175 20.7636 13.2479 21 12.0032 21C10.7587 21 9.58867 20.7638 8.493 20.2915ZM12.5 19.9827C14.5603 19.8481 16.3254 19.0285 17.7952 17.524C19.2651 16.0195 20 14.1782 20 12C20 9.82183 19.2715 7.98692 17.8145 6.49525C16.3573 5.00358 14.5858 4.17758 12.5 4.01725V19.9827Z";

interface StatusRowData {
  key: string;
  title: string;
  titleClass: string;
  icon: React.ReactNode;
  status: React.ReactNode;
  muted?: boolean;
  goto?: StepId;
  /** Completed sections with no dedicated sub-page: rendered as a static,
   *  non-clickable summary row (no nav chevron) so they read as finished
   *  detail rather than a dead disabled button. */
  summary?: boolean;
}

// Exact status strings transcribed from Figma frame 2165:28956 (the demo
// "locked"/first-run progression). Each row's status is a set of inline
// segments separated by thin vertical dividers, matching the frame.
const STATUS_INCOME_INPROGRESS = [
  "In progress",
  "10 - 15mins to complete",
  "We'll ask about your pension, social security and potential part time work",
];
const STATUS_SPENDING_PENDING = [
  "Not yet started",
  "2 - 10 mins to complete",
  "We'll help you understand what you'll need to spend during retirement",
];
const STATUS_GOALS_LOCKED = [
  "Locked till other sections complete",
  "5 mins to complete",
  "A few questions on your goals for retirement",
];

/** Renders a row's status as inline segments separated by thin vertical
 *  dividers (Figma frame 2165:28956). Used for the demo locked-state rows so
 *  the real progression copy is shown instead of a shimmer bar. */
function StatusLine({
  parts,
  colorClass,
  italic,
}: {
  parts: string[];
  colorClass: string;
  italic?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] leading-[1.4] tracking-[-0.1px]",
        italic && "italic",
        colorClass,
      )}
    >
      {parts.map((part, i) => (
        <Fragment key={part}>
          {i > 0 ? (
            <span aria-hidden className="h-[9px] w-px shrink-0 bg-current opacity-50" />
          ) : null}
          <span>{part}</span>
        </Fragment>
      ))}
    </span>
  );
}

export function SignatureHomeScreen() {
  const { goTo } = useFlow();

  // Hidden demo shortcut: double-tapping the shell's Ask pill dispatches
  // SIG_DEMO_CLEAR_EVENT. On the Home base that flips the "Your details" rows to
  // match Figma frame 2165:28956 exactly — the early/first-run progression:
  // Income "In progress", Spending "Not yet started", and Goals "Locked".
  // Default render is unchanged. Listener is added only in the effect (SSR-safe).
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const onClear = () => setLocked(true);
    window.addEventListener(SIG_DEMO_CLEAR_EVENT, onClear);
    return () => window.removeEventListener(SIG_DEMO_CLEAR_EVENT, onClear);
  }, []);

  const rows: StatusRowData[] = [
    {
      key: "about",
      title: "About you",
      titleClass: "text-title-ink",
      icon: <MaterialGlyph d={GLYPH_CHECK_CIRCLE} fill="#7F35B2" />,
      status: <span className="text-[10px] leading-[1.4] tracking-[-0.1px] text-violet">Complete</span>,
      goto: "sig-story",
    },
    {
      key: "assets",
      title: "Assets",
      titleClass: "text-title-ink",
      icon: <MaterialGlyph d={GLYPH_CHECK_CIRCLE} fill="#7F35B2" />,
      status: <span className="text-[10px] leading-[1.4] tracking-[-0.1px] text-violet">Complete</span>,
      goto: "sig-assets",
    },
    // Income: Complete summary row by default. In the demo locked state it
    // matches the frame's "In progress" treatment — contrast/half-circle glyph,
    // italic gray-1 status, dark title, and a chevron (non-navigable: Income has
    // no dedicated screen, it's captured within the Retirement Story).
    locked
      ? {
          key: "income",
          title: "Income",
          titleClass: "text-title-ink",
          icon: <MaterialGlyph d={GLYPH_CONTRAST} fill="#1C1B1F" />,
          status: (
            <StatusLine parts={STATUS_INCOME_INPROGRESS} colorClass="text-gray-1" italic />
          ),
        }
      : {
          // Income has no dedicated detail screen — it's captured within the
          // Retirement Story (the monthly pre-tax income mad-lib). Figma's Home
          // base shows Income as a populated detail row, so it's presented here
          // as a completed, non-clickable summary row (consistent with
          // About/Assets) rather than a dead disabled row.
          key: "income",
          title: "Income",
          titleClass: "text-title-ink",
          icon: <MaterialGlyph d={GLYPH_CHECK_CIRCLE} fill="#7F35B2" />,
          status: (
            <span className="text-[10px] leading-[1.4] tracking-[-0.1px] text-violet">
              Complete
            </span>
          ),
          summary: true,
        },
    // Spending: live/navigable in both states. The demo locked state swaps the
    // shimmer bar for the frame's exact "Not yet started" copy and the muted
    // gray-1 title, but it stays a normal pending row — navigable to sig-expense
    // with its chevron (it is NOT locked in frame 2165:28956).
    locked
      ? {
          key: "spending",
          title: "Spending",
          titleClass: "text-gray-1",
          icon: <MaterialGlyph d={GLYPH_CIRCLE} fill="#585D65" />,
          status: <StatusLine parts={STATUS_SPENDING_PENDING} colorClass="text-gray-1" />,
          goto: "sig-expense",
        }
      : {
          // Now that the Expense Engine screen exists, Spending is a live
          // section: navigable, with the active (non-muted) row treatment.
          key: "spending",
          title: "Spending",
          titleClass: "text-title-ink",
          icon: <MaterialGlyph d={GLYPH_CIRCLE} fill="#585D65" />,
          status: (
            <span className="flex items-center text-[10px] leading-[1.4] tracking-[-0.1px] text-gray-1">
              {/* Non-essential status detail → shimmer bar. */}
              <span
                className="inline-block h-2 w-24 rounded-full skeleton-shimmer"
                aria-hidden
              />
            </span>
          ),
          goto: "sig-expense",
        },
    // Goals: live/navigable by default, but flips to the Figma locked treatment
    // (node 2165:28956) once the demo shortcut fires — lock glyph in gray-2,
    // muted gray-2 title + status, and non-navigable (no goto). The chevron is
    // kept (muted:false → dark) to match the frame, which still shows one.
    locked
      ? {
          key: "goals",
          title: "Goals",
          titleClass: "text-gray-2",
          icon: <MaterialGlyph d={GLYPH_LOCK} fill="#8B919A" />,
          status: <StatusLine parts={STATUS_GOALS_LOCKED} colorClass="text-gray-2" />,
        }
      : {
          // Now that the Goal Blueprint screen exists, Goals is navigable. The
          // lock glyph is swapped for the empty-circle "not yet started" glyph so
          // the row reads as accessible rather than locked.
          key: "goals",
          title: "Goals",
          titleClass: "text-title-ink",
          icon: <MaterialGlyph d={GLYPH_CIRCLE} fill="#585D65" />,
          status: (
            <span className="flex items-center text-[10px] leading-[1.4] tracking-[-0.1px] text-gray-1">
              {/* Non-essential status detail → shimmer bar. */}
              <span
                className="inline-block h-2 w-40 rounded-full skeleton-shimmer"
                aria-hidden
              />
            </span>
          ),
          goto: "sig-goals",
        },
  ];

  return (
    <SignatureShell
      mode="tabs"
      subBar={{
        center: (
          <p className="text-xs text-[#18181b]">
            Your personalized outlook will update once we have more details in
            each category.
          </p>
        ),
        right: <NavPill onClick={() => goTo("sig-assets")}>Go to next step</NavPill>,
      }}
      bodyClassName="pb-16"
    >
      {/* Full-bleed purple gradient hero with the downloaded photo. */}
      <section
        className="relative w-full shrink-0 overflow-hidden"
        style={{ background: SIG_HOME_GRADIENT }}
      >
        {/* The photo is a transparent cut-out: keep its natural aspect ratio,
            anchor it to the hero's bottom-right, and soften its left side into
            the gradient so it never reads as a pasted rectangle. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/signature/home-hero.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 hidden h-[74%] w-auto max-w-none lg:block xl:h-[calc(100%-18px)]"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 4%, black 22%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 4%, black 22%, black 100%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-[832px] px-4 pb-[224px] pt-12 lg:pt-[68px]">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: SIG_EASE }}
            className="max-w-[600px] text-[36px] font-semibold leading-[1.04] tracking-[-1.6px] text-white lg:text-[44px] lg:tracking-[-2.2px]"
          >
            Let&apos;s build the right{" "}
            <br className="hidden lg:block" aria-hidden />
            retirement plan for you
          </motion.h1>
          {/* Non-essential subtitle + supporting copy → shimmer blocks. */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: SIG_EASE, delay: 0.08 }}
            className="mt-9 flex max-w-[560px] flex-col gap-2.5"
            aria-hidden
          >
            <span className="h-4 w-[72%] rounded-full bg-white/25 skeleton-shimmer" />
            <span className="mt-2.5 h-3 w-full rounded-full bg-white/25 skeleton-shimmer" />
            <span className="h-3 w-[78%] rounded-full bg-white/25 skeleton-shimmer" />
          </motion.div>
        </div>
      </section>

      {/* Overlapping white "Your details" card. */}
      <div className="relative z-10 mx-auto -mt-40 w-full max-w-[832px] shrink-0 px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: SIG_EASE, delay: 0.12 }}
          className="flex flex-col gap-2.5 rounded-card border-[0.5px] border-stroke-subtle bg-white p-6 shadow-[0_0_10px_rgba(0,0,0,0.15)]"
        >
          <div className="flex flex-col gap-0.5 pb-3">
            <h2 className="text-2xl leading-[1.28] tracking-[-0.48px] text-black">
              Your details
            </h2>
            <p className="text-sm leading-[1.4] text-gray-2">
              Fill out your details to create a comprehensive plan. You can make
              changes to your information at any time.
            </p>
          </div>

          {rows.map((row, i) => (
            <StatusRow key={row.key} row={row} index={i} onClick={row.goto ? () => goTo(row.goto!) : undefined} />
          ))}
        </motion.div>

        {/* Purple gradient advisor banner (Figma node 2165:29030). */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: SIG_EASE, delay: 0.5 }}
          className="relative mt-8 flex items-center overflow-hidden rounded-card px-6 py-5 text-white"
          style={{ background: SIG_HERO_GRADIENT }}
        >
          <BannerTexture />
          {/* Non-essential advisor reassurance copy → shimmer bars. */}
          <span className="relative flex min-w-0 flex-1 flex-col gap-1.5" aria-hidden>
            <span className="h-3 w-full max-w-[560px] rounded-full bg-white/25 skeleton-shimmer" />
            <span className="h-3 w-2/3 max-w-[360px] rounded-full bg-white/25 skeleton-shimmer" />
          </span>
        </motion.div>
      </div>
    </SignatureShell>
  );
}

/** Figma Banner texture image, soft-light blended (matches the hero banners). */
function BannerTexture() {
  return (
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
  );
}

function StatusRow({
  row,
  index,
  onClick,
}: {
  row: StatusRowData;
  index: number;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: SIG_EASE, delay: 0.2 + index * 0.08 }}
      whileHover={interactive ? { y: -2 } : undefined}
      whileTap={interactive ? { scale: 0.995 } : undefined}
      className={cn(
        "group flex w-full items-center justify-between gap-3 rounded-[14px] border-[0.5px] border-stroke-subtle bg-black/[0.03] px-6 py-4 text-left transition-colors",
        interactive
          ? "hover:border-violet/40 hover:bg-violet/[0.04]"
          : "cursor-default",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        {row.icon}
        <span className="flex min-w-0 flex-col">
          <span className={cn("text-xl leading-[1.42] tracking-[-0.32px]", row.titleClass)}>
            {row.title}
          </span>
          {row.status}
        </span>
      </span>
      {/* Summary rows (e.g. Income) have no destination, so they omit the nav
          chevron — it would otherwise read as a broken, clickable affordance. */}
      {row.summary ? null : (
        <ChevronRight
          className={cn(
            "size-6 shrink-0 transition-transform duration-200",
            row.muted ? "text-gray-2" : "text-deep-black",
            interactive && "group-hover:translate-x-0.5",
          )}
          strokeWidth={2}
        />
      )}
    </motion.button>
  );
}
