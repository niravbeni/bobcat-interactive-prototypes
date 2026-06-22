import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Variation {
  title: string;
  description: string;
  href?: string;
  status: { label: string; tone: "success" | "warning" | "neutral" | "muted" };
}

const VARIATIONS: Variation[] = [
  {
    title: "Base Flow (Linear)",
    description:
      "The core click-through flow: collect future income, summary, spending calculator and retirement goals.",
    href: "/income",
    status: { label: "Ready", tone: "success" },
  },
  {
    title: "Linear Chat Flow",
    description:
      "The same questions delivered as a conversational, AI-style chat with actions embedded inline.",
    status: { label: "Coming soon", tone: "muted" },
  },
  {
    title: "Card-sort Goals",
    description:
      "A signature moment: prioritize retirement goals with a drag-to-rank card sort inside the flow.",
    status: { label: "Coming soon", tone: "muted" },
  },
  {
    title: "Happiness Chapter",
    description:
      "A breakout interaction that pops out of the linear flow for a richer moment, then returns.",
    status: { label: "Coming soon", tone: "muted" },
  },
];

function VariationCard({ v }: { v: Variation }) {
  const inner = (
    <div className="flex h-full flex-col rounded-card border border-stroke-subtle bg-white p-6 transition-all">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-deep-black">{v.title}</h2>
        <StatusBadge tone={v.status.tone}>{v.status.label}</StatusBadge>
      </div>
      <p className="mt-3 flex-1 text-base leading-[1.5] text-gray-text">{v.description}</p>
      <span
        className={
          v.href
            ? "mt-6 inline-flex items-center gap-2 text-base font-semibold text-violet"
            : "mt-6 inline-flex items-center gap-2 text-base font-medium text-gray-2"
        }
      >
        {v.href ? "Start" : "Not built yet"}
        {v.href ? <ArrowRight className="size-5" strokeWidth={2} /> : null}
      </span>
    </div>
  );

  if (!v.href) {
    return <div className="cursor-not-allowed opacity-70">{inner}</div>;
  }
  return (
    <Link
      href={v.href}
      className="block rounded-card outline-none transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(16,24,32,0.08)] focus-visible:ring-2 focus-visible:ring-violet"
    >
      {inner}
    </Link>
  );
}

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-ghost-white">
      <header className="flex h-18 items-center px-9 3xl:h-20 3xl:px-14">
        <span className="text-2xl leading-none tracking-[-1.8px] text-black">WTW</span>
      </header>

      <section className="mx-auto w-full max-w-[1100px] px-9 pb-20 pt-8 2xl:max-w-[1400px] 3xl:max-w-[1760px] 3xl:px-14">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet">
          Bobcat Prototype
        </p>
        <h1 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-deep-black">
          Retirement onboarding flows
        </h1>
        <p className="mt-4 max-w-[640px] text-lg leading-[1.5] text-gray-text">
          Choose an interaction variation to preview. Each one runs the full flow end to end.
          You can return here any time from the WTW logo in the top-left.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 3xl:grid-cols-4 3xl:gap-6">
          {VARIATIONS.map((v) => (
            <VariationCard key={v.title} v={v} />
          ))}
        </div>
      </section>
    </main>
  );
}
