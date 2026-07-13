"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BrandWordmark } from "@/components/chrome/BrandWordmark";

const STORAGE_KEY = "bobcat-auth";
const PASSWORD = "bobcat";

/**
 * Lightweight client-side password gate for the prototype. Holds the rest of
 * the app behind a single shared password and remembers a successful unlock
 * via localStorage so reloads don't require re-entry. This is *not* real
 * authentication — just a soft cover while we share previews.
 */
export function PasswordGate({ children }: { children: React.ReactNode }) {
  // Start "checking" so we render neither the gate nor the app until we've
  // had a chance to read localStorage on the client.
  const [status, setStatus] = useState<"checking" | "locked" | "unlocked">(
    "checking",
  );
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // localStorage is browser-only; this effect runs after hydration so we
    // can safely read it and flip from the "checking" placeholder into the
    // right UI without a hydration mismatch.
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setStatus(stored === "1" ? "unlocked" : "locked");
    } catch {
      setStatus("locked");
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (draft.trim().toLowerCase() === PASSWORD) {
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // Ignore — even if storage fails we can still unlock for this session.
      }
      setError(false);
      setStatus("unlocked");
    } else {
      setError(true);
    }
  };

  if (status === "unlocked") return <>{children}</>;
  if (status === "checking") {
    return <div className="min-h-screen bg-ghost-white" aria-hidden="true" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ghost-white px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-field bg-white p-8 shadow-[0_24px_64px_rgba(16,24,32,0.08)]"
      >
        <div className="flex justify-center text-deep-black">
          <BrandWordmark className="text-deep-black" />
        </div>

        <h1 className="mt-6 text-center text-2xl font-semibold tracking-[-0.01em] text-deep-black">
          Bobcat prototype
        </h1>
        <p className="mt-1 text-center text-sm text-gray-1">
          Enter the password to continue.
        </p>

        <label className="mt-6 block">
          <span className="sr-only">Password</span>
          <input
            autoFocus
            type="password"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(false);
            }}
            placeholder="Password"
            className={`h-12 w-full rounded-lg border bg-white px-4 text-base text-deep-black outline-none transition-colors placeholder:text-gray-2 focus:border-deep-black ${
              error ? "border-violet" : "border-stroke-subtle"
            }`}
          />
        </label>

        {error ? (
          <p className="mt-2 text-sm font-medium text-violet">
            That&rsquo;s not the right password.
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-5 w-full rounded-pill bg-deep-black px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
