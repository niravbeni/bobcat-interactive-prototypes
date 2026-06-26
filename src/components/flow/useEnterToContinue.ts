"use client";

import { useEffect } from "react";

/**
 * True when focus is in a control where Enter has its own meaning (typing in a
 * field, inserting a newline in a textarea, operating a native select, or an
 * open inline popover) and so should NOT trigger a page-level Continue.
 */
function isEnterCapturedByTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  // Inline madlib selects render as a button with an open listbox popover;
  // let Enter operate the menu rather than advancing the page.
  if (el.getAttribute("aria-expanded") === "true") return true;
  return false;
}

/**
 * Gate "press Enter to Continue" on a screen whose primary action is a single
 * bottom Continue button. `enabled` MUST mirror that button's enabled state
 * exactly (reuse the same completeness/validity condition), so Enter only
 * advances when the page is complete — and does nothing when it isn't.
 *
 * Enter is ignored while focus is in a text field / textarea / select / open
 * popover (so typing, newlines, and option pickers keep working), and while an
 * IME composition is in progress.
 */
export function useEnterToContinue(enabled: boolean, onEnter: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
      if (isEnterCapturedByTarget(document.activeElement)) return;
      e.preventDefault();
      onEnter();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled, onEnter]);
}
