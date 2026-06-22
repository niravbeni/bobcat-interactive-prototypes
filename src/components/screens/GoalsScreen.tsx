"use client";

import { useEffect, useRef, useState } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { GOAL_PROMPTS, derivePriorities, findKeywords } from "@/lib/questions";
import { cn } from "@/lib/cn";
import { Mic } from "lucide-react";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const phrase = (p: string[]) => p.map(cap).join(" and ");

function ack(text: string): string {
  const k = findKeywords(text)[0];
  const warm = ["Got it.", "Love that.", "That's helpful.", "Makes sense."];
  if (k) return `${cap(k)}, noted.`;
  return warm[text.length % warm.length];
}

/**
 * Decide, conversationally, whether the assistant has gathered enough to wrap up.
 * No fixed number of questions — it can stop early when the user has been
 * detailed, or keep gently probing (up to the prompt pool) when they're terse.
 */
function hasEnoughContext(allText: string, answered: number): boolean {
  const keywords = new Set(findKeywords(allText)).size;
  const words = allText.trim().split(/\s+/).filter(Boolean).length;
  if (answered >= GOAL_PROMPTS.length) return true; // ran out of follow-ups
  if (answered >= 2 && keywords >= 3) return true; // rich, varied detail early
  if (answered >= 3 && keywords >= 2) return true;
  if (words >= 60) return true; // they wrote a lot
  return false;
}

export function GoalsScreen() {
  const { answers, setAnswers, appendMessage, goTo } = useFlow();
  const { goalsMessages: messages, goalsStage: stage, goalsText: draft, goalsPriorities } = answers;
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (!seeded.current && messages.length === 0) {
      seeded.current = true;
      setAnswers({
        goalsMessages: [
          { role: "bot", text: "Hi Gloria, this last part is the fun bit. The more you tell me, the better I can tailor your plan." },
          { role: "bot", text: GOAL_PROMPTS[0] },
        ],
        goalsStage: "asking",
      });
    }
  }, [messages.length, setAnswers]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const botReply = (text: string, patch?: Partial<typeof answers>, delay = 850) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      appendMessage({ role: "bot", text });
      if (patch) setAnswers(patch);
    }, delay);
  };

  const composerActive = stage === "asking" || stage === "extra";

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !composerActive) return;

    const priorUserMsgs = messages.filter((m) => m.role === "user").map((m) => m.text);
    appendMessage({ role: "user", text });
    setAnswers({ goalsText: "" });

    if (stage === "extra") {
      botReply("Thanks, that really helps. I've added it to your plan.", {
        goalsStage: "done",
      });
      return;
    }

    const answered = priorUserMsgs.length + 1;
    const allText = [...priorUserMsgs, text].join(" ");

    if (hasEnoughContext(allText, answered)) {
      const pr = derivePriorities(allText);
      botReply(
        `Thank you, that gives me a really clear picture. Here's what I'm hearing: ${phrase(pr)} matter most to you, and I'll fold in everything else you shared. Does that sound right?`,
        { goalsStage: "confirm", goalsPriorities: pr },
        1100,
      );
    } else {
      botReply(`${ack(text)} ${GOAL_PROMPTS[answered]}`);
    }
  };

  const confirmYes = () => {
    appendMessage({ role: "user", text: "Yes, that's right" });
    botReply(
      `Perfect. I'll personalize your Bobcat plan around ${phrase(goalsPriorities)} and everything you've told me.`,
      { goalsConfirmed: true, goalsStage: "done" },
    );
  };

  const confirmNo = () => {
    appendMessage({ role: "user", text: "Not quite" });
    botReply("No problem. What did I miss, or what matters more to you?", {
      goalsStage: "extra",
    });
  };

  return (
    <AppShell
      fill
      sidebar={{
        planBadge: { label: "Updated", tone: "success" },
        detailsBadges: [{ label: "Required 80%", tone: "warning" }],
        subSections: [
          { label: "About You" },
          { label: "Assets" },
          { label: "Income" },
          { label: "Spending" },
          { label: "Goals", active: true },
        ],
      }}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <BackButton onClick={() => goTo("spending")} />

        <h2 className="mt-6 text-2xl font-bold text-deep-black">Time and Goals</h2>

        <div
          ref={scrollRef}
          className="mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2 pr-1"
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role}>
              {m.text}
            </Bubble>
          ))}
          {typing ? (
            <Bubble role="bot">
              <span className="flex gap-1">
                <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
              </span>
            </Bubble>
          ) : null}
        </div>

        <div className="mt-4 border-t border-stroke-subtle pt-4">
          {composerActive ? (
            <Composer
              value={draft}
              onChange={(v) => setAnswers({ goalsText: v })}
              onSend={handleSend}
            />
          ) : null}

          {stage === "confirm" && !typing ? (
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="md" onClick={confirmYes}>
                Yes, that&rsquo;s right
              </Button>
              <Button variant="outline" size="md" onClick={confirmNo}>
                Not quite
              </Button>
            </div>
          ) : null}

          {stage === "done" ? (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-gray-text">Your goals are captured.</p>
              <Button variant="blue" size="md" onClick={() => goTo("complete")}>
                Finish up
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function Bubble({ role, children }: { role: "bot" | "user"; children: React.ReactNode }) {
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

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="inline-block size-2 animate-bounce rounded-full bg-gray-2"
      style={{ animationDelay: delay }}
    />
  );
}

function Composer({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
}) {
  return (
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
  );
}
