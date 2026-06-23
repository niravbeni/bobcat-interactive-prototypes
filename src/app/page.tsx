import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VARIANTS, VARIANT_ORDER, firstStep, pathFor } from "@/lib/variants";
import type { VariantMeta } from "@/lib/variants";
import { cn } from "@/lib/cn";

function VariationCard({ v }: { v: VariantMeta }) {
  const ready = v.status === "ready";
  const featured = Boolean(v.featured) && ready;
  const href = pathFor(v.id, firstStep(v.id));

  const inner = (
    <div
      className={cn(
        "flex h-full flex-col rounded-card p-6 transition-all",
        featured
          ? "border-2 border-violet bg-gradient-to-br from-violet/[0.08] to-white shadow-[0_10px_40px_rgba(127,53,178,0.12)]"
          : "border border-stroke-subtle bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-deep-black">{v.title}</h2>
        <StatusBadge tone={ready ? "success" : "muted"}>
          {ready ? "Ready" : "Coming soon"}
        </StatusBadge>
      </div>
      <p className="mt-3 flex-1 text-base leading-[1.5] text-gray-text">{v.description}</p>
      {featured ? (
        <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-pill bg-violet px-5 py-2.5 text-base font-semibold text-white transition-opacity group-hover:opacity-90">
          Start
          <ArrowRight className="size-5" strokeWidth={2} />
        </span>
      ) : (
        <span
          className={
            ready
              ? "mt-6 inline-flex items-center gap-2 text-base font-semibold text-violet"
              : "mt-6 inline-flex items-center gap-2 text-base font-medium text-gray-2"
          }
        >
          {ready ? "Start" : "Not built yet"}
          {ready ? <ArrowRight className="size-5" strokeWidth={2} /> : null}
        </span>
      )}
    </div>
  );

  if (!ready) {
    return <div className="cursor-not-allowed opacity-70">{inner}</div>;
  }
  return (
    <Link
      href={href}
      className="group block rounded-card outline-none transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(16,24,32,0.08)] focus-visible:ring-2 focus-visible:ring-violet"
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

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 3xl:grid-cols-3 3xl:gap-6">
          {VARIANT_ORDER.map((id) => (
            <VariationCard key={id} v={VARIANTS[id]} />
          ))}
        </div>
      </section>
    </main>
  );
}
