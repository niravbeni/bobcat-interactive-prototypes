"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ToastItem {
  id: number;
  message: string;
}

export interface OutlookModalOpts {
  /** Small uppercase label above the title. */
  eyebrow?: string;
  title: string;
  copy?: string;
  /** Optional bullet list rendered under the copy. */
  bullets?: string[];
  /** Icon + accent treatment. */
  tone?: "violet" | "success";
  primaryLabel?: string;
  onPrimary?: () => void;
}

interface FeedbackApi {
  /** Fire a transient bottom-right confirmation toast. */
  toast: (message: string) => void;
  /** Open a centered placeholder / confirmation modal. */
  showModal: (opts: OutlookModalOpts) => void;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

/** No-op fallback so controls outside the provider (e.g. the loader) never crash. */
const NOOP: FeedbackApi = { toast: () => {}, showModal: () => {} };

/** Toast + placeholder-modal helpers for any control inside the Outlook shell. */
export function useOutlookFeedback(): FeedbackApi {
  return useContext(FeedbackContext) ?? NOOP;
}

/**
 * A "Learn more" affordance that opens an explanatory placeholder modal. Lives
 * inside the shell's children subtree so it resolves the feedback context.
 */
export function OutlookLearnMore({
  modal,
  className,
  children,
}: {
  modal: OutlookModalOpts;
  className?: string;
  children: React.ReactNode;
}) {
  const { showModal } = useOutlookFeedback();
  return (
    <button type="button" onClick={() => showModal(modal)} className={className}>
      {children}
    </button>
  );
}

/**
 * Provides lightweight, prototype-appropriate feedback for the many otherwise
 * "dead" controls in the Outlook flow: a bottom-right toast stack for quick
 * acknowledgements and a centered modal for richer explanatory placeholders
 * and the final plan-confirmation. Lives inside {@link OutlookShell} so the top
 * nav, sidebar, stepper and screen body can all reach it.
 */
export function OutlookFeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<OutlookModalOpts | null>(null);
  const idRef = useRef(0);

  const toast = useCallback((message: string) => {
    const id = (idRef.current += 1);
    setToasts((prev) => [...prev.slice(-2), { id, message }]);
    window.setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      2800,
    );
  }, []);

  const showModal = useCallback((opts: OutlookModalOpts) => setModal(opts), []);

  const api = useMemo<FeedbackApi>(() => ({ toast, showModal }), [toast, showModal]);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  const success = modal?.tone === "success";

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      {/* Toast stack — sits just above the bottom stepper. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-pill bg-deep-black py-2.5 pl-2.5 pr-4 text-sm font-medium text-white shadow-[0_10px_30px_rgba(16,24,32,0.28)]"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-violet">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Centered placeholder / confirmation modal. */}
      <AnimatePresence>
        {modal ? (
          <motion.div
            key="outlook-modal"
            className="fixed inset-0 z-[70] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setModal(null)}
              className="absolute inset-0 cursor-default bg-deep-black/40 backdrop-blur-[2px]"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={modal.title}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="relative z-10 w-full max-w-md rounded-card bg-white p-6 shadow-[0_24px_60px_rgba(16,24,32,0.24)]"
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setModal(null)}
                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
              >
                <X className="size-4" strokeWidth={2} />
              </button>

              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full",
                  success ? "bg-success/12 text-success" : "bg-violet/10 text-violet",
                )}
              >
                {success ? (
                  <Check className="size-5" strokeWidth={2.5} />
                ) : (
                  <Sparkles className="size-5" strokeWidth={2} />
                )}
              </span>

              {modal.eyebrow ? (
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-2">
                  {modal.eyebrow}
                </p>
              ) : null}
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.01em] text-deep-black">
                {modal.title}
              </h2>
              {modal.copy ? (
                <p className="mt-2 text-sm leading-relaxed text-gray-1">
                  {modal.copy}
                </p>
              ) : null}

              {modal.bullets && modal.bullets.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-2">
                  {modal.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-deep-black">
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                          success ? "bg-success/15 text-success" : "bg-violet/12 text-violet",
                        )}
                      >
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  modal.onPrimary?.();
                  setModal(null);
                }}
                className={cn(
                  "mt-6 w-full rounded-pill px-5 py-2.5 text-sm font-semibold text-white transition-[filter,background-color] hover:brightness-110",
                  success ? "bg-success" : "bg-violet",
                )}
              >
                {modal.primaryLabel ?? "Got it"}
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </FeedbackContext.Provider>
  );
}
