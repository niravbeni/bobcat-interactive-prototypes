"use client";

/**
 * Fills the V2 main panel with the same dark "Placeholder" treatment used by
 * the plan preview, for tabs that don't have real content yet (Your Plan,
 * Marketplace).
 */
export function TabPlaceholder({
  eyebrow = "Placeholder",
  title,
  copy,
}: {
  eyebrow?: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-card bg-deep-black px-8 py-12 text-center text-white">
      <p className="text-xs font-medium uppercase tracking-[0.4em] text-white/40">
        {eyebrow}
      </p>
      <p className="max-w-2xl text-4xl font-semibold leading-[1.1] tracking-[-0.02em] 3xl:text-5xl">
        {title}
      </p>
      <p className="mt-2 max-w-xl text-base text-white/55 3xl:text-lg">
        {copy}
      </p>
    </div>
  );
}
