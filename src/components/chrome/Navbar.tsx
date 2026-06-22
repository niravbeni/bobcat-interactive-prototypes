"use client";

import Link from "next/link";
import { ChevronDown, Info, SquareUser } from "lucide-react";

export function Navbar() {
  return (
    <header className="relative flex h-18 w-full items-center bg-ghost-white px-9 3xl:h-20 3xl:px-14">
      <Link
        href="/"
        aria-label="Back to dashboard"
        className="text-2xl leading-none tracking-[-1.8px] text-black transition-opacity hover:opacity-60"
      >
        WTW
      </Link>

      <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[7px] rounded-xl px-3 py-1">
        <Info className="size-5 text-ink" strokeWidth={2} />
        <p className="text-sm font-medium leading-[1.4] tracking-[-0.42px] text-ink">
          Rough answers are fine, you&rsquo;ll refine and add more information later.{" "}
          <span className="underline">Learn more</span>
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="flex h-9 items-center gap-1 rounded-full bg-white pl-3 pr-2">
          <SquareUser className="size-6 text-black" strokeWidth={2} />
          <span className="text-base font-semibold tracking-[0.16px] text-black">Gloria</span>
          <ChevronDown className="size-6 text-black" strokeWidth={2} />
        </button>
        <button className="flex h-9 items-center justify-center rounded-full bg-violet px-4">
          <span className="text-base font-semibold tracking-[0.16px] text-white">Help</span>
        </button>
      </div>
    </header>
  );
}
