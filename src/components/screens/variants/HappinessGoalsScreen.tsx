"use client";

import { useEffect, useRef, useState } from "react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Bubble, Composer, TypingBubble } from "@/components/chat/ChatUI";
import { BreakoutOverlay } from "@/components/interactions/BreakoutOverlay";
import { MoodBoard, MOOD_ITEMS } from "@/components/interactions/MoodBoard";
import { GOAL_PROMPTS, GOAL_SUGGESTIONS, findKeywords } from "@/lib/questions";
import { Sparkles } from "lucide-react";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function ack(text: string): string {
  const k = findKeywords(text)[0];
  const warm = ["Got it.", "Love that.", "That's helpful.", "Makes sense."];
  if (k) return `${cap(k)}, noted.`;
  return warm[text.length % warm.length];
}

function hasEnoughContext(allText: string, answered: number): boolean {
  const keywords = new Set(findKeywords(allText)).size;
  const words = allText.trim().split(/\s+/).filter(Boolean).length;
  if (answered >= 3) return true;
  if (answered >= 2 && keywords >= 2) return true;
  if (words >= 45) return true;
  return false;
}

const moodLabel = (id: string) =>
  MOOD_ITEMS.find((m) => m.id === id)?.label ?? id;

export function HappinessGoalsScreen() {
  const { answers, setAnswers, appendMessage, goNext, goBack } = useFlow();
  const { goalsMessages: messages, goalsStage: stage, goalsText: draft, vision } = answers;
  const [typing, setTyping] = useState(false);
  const [breakoutOpen, setBreakoutOpen] = useState(false);
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

  const composerActive = stage === "asking";
  const userCount = messages.filter((m) => m.role === "user").length;
  const suggestions = GOAL_SUGGESTIONS[Math.min(userCount, GOAL_SUGGESTIONS.length - 1)];

  const submit = (raw: string) => {
    const text = raw.trim();
    if (!text || !composerActive) return;

    const priorUserMsgs = messages.filter((m) => m.role === "user").map((m) => m.text);
    appendMessage({ role: "user", text });
    setAnswers({ goalsText: "" });

    const answered = priorUserMsgs.length + 1;
    const allText = [...priorUserMsgs, text].join(" ");

    if (hasEnoughContext(allText, answered)) {
      botReply(
        "I'd love to go a little deeper. Let's picture what your retirement actually feels like.",
        { goalsStage: "confirm" },
        950,
      );
      window.setTimeout(() => setBreakoutOpen(true), 1250);
    } else {
      botReply(`${ack(text)} ${GOAL_PROMPTS[answered]}`);
    }
  };

  const handleSend = () => submit(draft);

  const toggleVision = (id: string) =>
    setAnswers({
      vision: vision.includes(id)
        ? vision.filter((v) => v !== id)
        : [...vision, id],
    });

  const saveVision = () => {
    setBreakoutOpen(false);
    const labels = vision.map(moodLabel).slice(0, 4).join(", ");
    botReply(
      vision.length
        ? `Beautiful. I've saved your retirement vision: ${labels}. This is the feeling we'll plan towards.`
        : "No problem, we can shape your vision later. I've noted that for now.",
      { goalsStage: "done" },
      600,
    );
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

          {stage === "confirm" && !typing && !breakoutOpen ? (
            <div className="flex items-center gap-3 text-gray-text">
              <Sparkles className="size-5 text-violet" strokeWidth={2} />
              <span className="text-sm">Opening your happiness chapter…</span>
            </div>
          ) : null}

          {stage === "done" && !typing ? (
            <div className="flex items-center justify-between gap-4">
              <Button variant="outline" size="md" onClick={() => setBreakoutOpen(true)}>
                Revisit chapter
              </Button>
              <Button variant="blue" size="md" onClick={goNext}>
                Finish up
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <BreakoutOverlay
        open={breakoutOpen}
        eyebrow="Happiness chapter"
        title="Picture your retirement"
        subtitle="Tap everything that feels like your ideal retirement. There are no wrong answers."
        onClose={() => setBreakoutOpen(false)}
        onSave={saveVision}
        saveLabel="Save my vision"
      >
        <MoodBoard selected={vision} onToggle={toggleVision} />
      </BreakoutOverlay>
    </AppShell>
  );
}
