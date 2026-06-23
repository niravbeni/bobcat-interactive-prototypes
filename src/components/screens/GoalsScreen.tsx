"use client";

import { useEffect, useRef, useState } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Bubble, Composer, TypingBubble } from "@/components/chat/ChatUI";
import {
  GOAL_PROMPTS,
  GOAL_SUGGESTIONS,
  GOAL_EXTRA_SUGGESTIONS,
  derivePriorities,
  findKeywords,
} from "@/lib/questions";

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
  const { answers, setAnswers, appendMessage, goNext, goBack } = useFlow();
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
  const userCount = messages.filter((m) => m.role === "user").length;
  const suggestions =
    stage === "extra"
      ? GOAL_EXTRA_SUGGESTIONS
      : GOAL_SUGGESTIONS[Math.min(userCount, GOAL_SUGGESTIONS.length - 1)];

  const submit = (raw: string) => {
    const text = raw.trim();
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

  const handleSend = () => submit(draft);

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
        <BackButton onClick={goBack} />

        <h2 className="mt-6 text-2xl font-bold text-deep-black">Retirement Goals</h2>

        <div
          ref={scrollRef}
          className="scrollbar-slim mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2 pr-1"
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role}>
              {m.text}
            </Bubble>
          ))}
          {typing ? <TypingBubble /> : null}
        </div>

        <div className="mt-4 border-t border-stroke-subtle pt-4">
          {composerActive ? (
            <Composer
              value={draft}
              onChange={(v) => setAnswers({ goalsText: v })}
              onSend={handleSend}
              suggestions={typing ? [] : suggestions}
              onSuggestionClick={submit}
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
              <Button variant="blue" size="md" onClick={goNext}>
                Finish up
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
