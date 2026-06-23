"use client";

import { cn } from "@/lib/cn";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { EnterHint } from "@/components/ui/EnterHint";
import { Mic } from "lucide-react";

export function Bubble({
  role,
  children,
}: {
  role: "bot" | "user";
  children: React.ReactNode;
}) {
  const isBot = role === "bot";
  return (
    <div
      className={cn(
        "max-w-[80%] rounded-2xl px-5 py-3 text-lg leading-[1.4]",
        isBot
          ? "self-start rounded-tl-sm border border-stroke-subtle bg-white text-deep-black"
          : "self-end rounded-tr-sm bg-violet text-white",
      )}
    >
      {children}
    </div>
  );
}

export function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="inline-block size-2 animate-bounce rounded-full bg-gray-2"
      style={{ animationDelay: delay }}
    />
  );
}

export function TypingBubble() {
  return (
    <Bubble role="bot">
      <span className="flex gap-1">
        <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
      </span>
    </Bubble>
  );
}

export function Composer({
  value,
  onChange,
  onSend,
  suggestions,
  onSuggestionClick,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  /** Tappable example answers shown above the input. */
  suggestions?: string[];
  onSuggestionClick?: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {suggestions && suggestions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestionClick?.(s)}
              className="rounded-pill border border-stroke-subtle bg-white px-3.5 py-1.5 text-sm text-gray-1 transition-colors hover:border-deep-black hover:text-deep-black"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2 rounded-full border border-stroke-subtle bg-white py-2 pl-5 pr-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        rows={1}
        placeholder="Type your answer, or use the mic…"
        className="max-h-32 w-full resize-none self-center bg-transparent py-1.5 text-lg leading-6 text-deep-black outline-none placeholder:text-gray-text"
      />
      <button
        type="button"
        aria-label="Voice input"
        className="grid size-10 shrink-0 place-items-center rounded-full text-deep-black transition-colors hover:bg-ghost-white"
      >
        <Mic className="size-6" strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={onSend}
        disabled={!value.trim()}
        aria-label="Send"
        className="shrink-0 rounded-full transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        <AskSendIcon className="size-[38px]" />
      </button>
      </div>

      {value.trim() ? <EnterHint className="px-1" /> : null}
    </div>
  );
}
