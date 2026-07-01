"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  AudioLines,
  Check,
  FileText,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Pencil,
  Plus,
  QrCode,
  ScanLine,
  Smartphone,
  Square,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";
import { useFlow } from "@/components/flow/FlowProvider";
import { AppShell } from "@/components/chrome/AppShell";
import { BackButton } from "@/components/ui/BackButton";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ProviderLogo } from "@/components/ui/ProviderLogo";
import { cn } from "@/lib/cn";
import { TAX_STATUS_LABEL, type TaxStatus } from "@/lib/institutions";
import {
  SEED_ITEMS,
  VOICE_TRANSCRIPT,
  makeId,
  makeScanItems,
  structureDump,
  type DumpItem,
  type DumpItemKind,
  type StructuredResult,
} from "@/lib/dataDump";

type Mode = "canvas" | "processing" | "form";

const fmtMoney = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

/** Map a tax status to the StatusBadge tone that reads best for it. */
const TAX_BADGE_TONE: Record<TaxStatus, "success" | "warning" | "neutral" | "muted"> = {
  "tax-free": "success",
  "tax-deferred": "neutral",
  taxable: "muted",
  "tax-advantaged": "warning",
};

const PROCESSING_LINES = [
  "Reading documents…",
  "Transcribing your voice note…",
  "Extracting accounts…",
  "Tagging by tax treatment…",
  "Building your summary…",
];

/** Per-kind icon + label + accent for the canvas item cards. */
const KIND_META: Record<
  DumpItemKind,
  { icon: typeof FileText; label: string; accent: string }
> = {
  text: { icon: Type, label: "Text", accent: "var(--color-violet)" },
  image: { icon: ImageIcon, label: "Image", accent: "#0d8a6a" },
  pdf: { icon: FileText, label: "PDF", accent: "#b3261e" },
  doc: { icon: FileText, label: "Document", accent: "#1b62c4" },
  voice: { icon: AudioLines, label: "Voice", accent: "#7f35b2" },
  scan: { icon: ScanLine, label: "Phone scan", accent: "#c2410c" },
};

/** Human-friendly file size from raw bytes. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Guess a dump kind from a dropped/uploaded file. */
function kindForFile(file: File): DumpItemKind {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (type.startsWith("text/") || name.endsWith(".txt")) return "text";
  return "doc";
}

/** Build a DumpItem from a File (no real parsing — just metadata + preview). */
function itemFromFile(file: File, via: DumpItem["addedVia"]): DumpItem {
  const kind = kindForFile(file);
  const previewUrl =
    kind === "image" ? URL.createObjectURL(file) : undefined;
  return {
    id: makeId(kind),
    kind,
    title: file.name.replace(/\.[^.]+$/, "") || "Untitled",
    content: kind === "text" ? "" : undefined,
    previewUrl,
    fileMeta: { name: file.name, size: formatSize(file.size) },
    addedVia: via,
    at: Date.now(),
  };
}

export function DataDumpScreen() {
  const { goBack } = useFlow();

  const [mode, setMode] = useState<Mode>("canvas");
  // The canvas is one notepad (free text) plus docked attachments. Seed text/voice
  // notes fold into the notepad; files/scans become bottom-docked attachments.
  const [notes, setNotes] = useState<string>(() =>
    SEED_ITEMS.filter((i) => i.kind === "text" || i.kind === "voice")
      .map((i) => i.content)
      .filter((c): c is string => Boolean(c && c.trim()))
      .join("\n\n"),
  );
  const [items, setItems] = useState<DumpItem[]>(() =>
    SEED_ITEMS.filter((i) => i.kind !== "text" && i.kind !== "voice"),
  );
  const [dragging, setDragging] = useState(false);

  const [voiceOpen, setVoiceOpen] = useState(false);
  const [qrState, setQrState] = useState<"idle" | "waiting" | "received">("idle");
  const [statusIdx, setStatusIdx] = useState(0);
  const [form, setForm] = useState<StructuredResult | null>(null);
  // Once the user saves, mirror the structured values into the left sidebar.
  const [savedProfile, setSavedProfile] = useState(false);

  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track object URLs we create for image previews so they can be revoked on
  // removal/unmount (createObjectURL leaks until explicitly revoked).
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // Timers (kept in refs so transitions are driven by handlers, not effects).
  const voiceTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceBaseRef = useRef("");
  const qrTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const processTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear every pending timer + revoke object URLs on unmount (cleanup-only;
  // never sets state on mount).
  useEffect(
    () => () => {
      if (voiceTimer.current) clearInterval(voiceTimer.current);
      if (statusTimer.current) clearInterval(statusTimer.current);
      if (processTimer.current) clearTimeout(processTimer.current);
      qrTimers.current.forEach(clearTimeout);
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    },
    [],
  );

  /* ---------------------------------------------------------------- items -- */

  const addItems = (next: DumpItem[]) =>
    setItems((prev) => [...prev, ...next]);

  const removeItem = (id: string) => {
    const target = items.find((it) => it.id === id);
    if (target?.previewUrl && objectUrlsRef.current.has(target.previewUrl)) {
      URL.revokeObjectURL(target.previewUrl);
      objectUrlsRef.current.delete(target.previewUrl);
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleFiles = (files: FileList | null, via: DumpItem["addedVia"]) => {
    if (!files || files.length === 0) return;
    const next = Array.from(files).map((f) => itemFromFile(f, via));
    for (const it of next) {
      if (it.previewUrl) objectUrlsRef.current.add(it.previewUrl);
    }
    addItems(next);
  };

  /* ----------------------------------------------------------- drag/drop -- */

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragging) setDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files, "drop");
  };

  /* --------------------------------------------------------------- voice -- */

  const startVoice = () => {
    if (voiceTimer.current) clearInterval(voiceTimer.current);
    setVoiceOpen(true);
    // Transcribe straight into the notepad, after whatever's already there.
    voiceBaseRef.current = notes.trim() ? notes.replace(/\s+$/, "") + "\n\n" : "";

    const words = VOICE_TRANSCRIPT.split(" ");
    let i = 0;
    voiceTimer.current = setInterval(() => {
      i += 1;
      setNotes(voiceBaseRef.current + words.slice(0, i).join(" "));
      if (i >= words.length) stopVoice();
    }, reduceMotion ? 30 : 90);
  };

  const stopVoice = () => {
    if (voiceTimer.current) {
      clearInterval(voiceTimer.current);
      voiceTimer.current = null;
    }
    setVoiceOpen(false);
  };

  /* ------------------------------------------------------------------ qr -- */

  const openQr = () => {
    qrTimers.current.forEach(clearTimeout);
    qrTimers.current = [];
    setQrState("waiting");
    qrTimers.current.push(
      setTimeout(() => {
        addItems(makeScanItems());
        setQrState("received");
        qrTimers.current.push(
          setTimeout(() => setQrState("idle"), 1100),
        );
      }, 2500),
    );
  };

  const closeQr = () => {
    qrTimers.current.forEach(clearTimeout);
    qrTimers.current = [];
    setQrState("idle");
  };

  /* ---------------------------------------------------------- structure -- */

  const startStructure = () => {
    setMode("processing");
    setStatusIdx(0);

    if (statusTimer.current) clearInterval(statusTimer.current);
    statusTimer.current = setInterval(() => {
      setStatusIdx((i) => Math.min(i + 1, PROCESSING_LINES.length - 1));
    }, 480);

    if (processTimer.current) clearTimeout(processTimer.current);
    processTimer.current = setTimeout(() => {
      if (statusTimer.current) {
        clearInterval(statusTimer.current);
        statusTimer.current = null;
      }
      setForm(structureDump(items, notes));
      setMode("form");
    }, 2300);
  };

  /* ----------------------------------------------------------- form ops -- */

  const updateAccountBalance = (idx: number, balance: number) =>
    setForm((prev) =>
      prev
        ? {
            ...prev,
            accounts: prev.accounts.map((a, i) =>
              i === idx ? { ...a, balance } : a,
            ),
          }
        : prev,
    );

  const removeStructuredAccount = (idx: number) =>
    setForm((prev) =>
      prev
        ? { ...prev, accounts: prev.accounts.filter((_, i) => i !== idx) }
        : prev,
    );

  const setIncome = (incomeMonthly: number) =>
    setForm((prev) => (prev ? { ...prev, incomeMonthly } : prev));
  const setSpending = (spendingMonthly: number) =>
    setForm((prev) => (prev ? { ...prev, spendingMonthly } : prev));
  const updateGoal = (id: string, value: string) =>
    setForm((prev) =>
      prev
        ? {
            ...prev,
            goals: prev.goals.map((g) =>
              g.id === id ? { ...g, text: value } : g,
            ),
          }
        : prev,
    );
  const removeGoal = (id: string) =>
    setForm((prev) =>
      prev ? { ...prev, goals: prev.goals.filter((g) => g.id !== id) } : prev,
    );
  const addGoal = () =>
    setForm((prev) =>
      prev
        ? {
            ...prev,
            goals: [...prev.goals, { id: crypto.randomUUID(), text: "" }],
          }
        : prev,
    );

  /* --------------------------------------------------------------- view -- */

  const sidebarConfig =
    savedProfile && form
      ? {
          folders: [
            {
              title: "Accounts",
              items: form.accounts.map((a) => ({
                label: `${a.provider} ${a.accountType}`,
                value: fmtMoney(a.balance),
              })),
            },
            {
              title: "Goals",
              numbered: true,
              items: form.goals
                .filter((g) => g.text.trim().length > 0)
                .map((g) => ({ label: g.text })),
            },
          ],
        }
      : {
          subSections: [
            { label: "About You" },
            { label: "Accounts", active: mode === "form" },
            { label: "Income" },
            { label: "Spending" },
            { label: "Goals" },
          ],
        };

  return (
    <AppShell card={false} sidebar={sidebarConfig}>
      <div className="flex w-full flex-1 flex-col rounded-field bg-card px-5 py-5 xl:px-10 xl:py-6 3xl:px-14 3xl:py-8">
        <div className="mx-auto flex w-full max-w-[820px] flex-1 flex-col xl:max-w-[1040px] 3xl:max-w-[1220px]">
        <BackButton onClick={goBack} />

        <motion.div
          className="mt-4 max-w-[680px]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black sm:text-[30px]">
            {mode === "form" ? "Your structured profile" : "Dump everything here"}
          </h1>
          {mode === "form" ? null : (
            <p className="mt-2 text-sm leading-snug text-black/70">
              Drop in files, screenshots, pasted notes, a voice memo or a scan
              from your phone. When you&apos;re done, let AI structure it into
              your account profile.
            </p>
          )}
        </motion.div>

        <div className="mt-4 flex w-full flex-1 flex-col">
          {mode === "canvas" ? (
            <CanvasMode
              notes={notes}
              attachments={items}
              dragging={dragging}
              fileInputRef={fileInputRef}
              onNotesChange={setNotes}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onPickFiles={(files) => handleFiles(files, "upload")}
              onStartVoice={startVoice}
              onOpenQr={openQr}
              onRemove={removeItem}
              onStructure={startStructure}
            />
          ) : null}

          {mode === "processing" ? (
            <ProcessingMode line={PROCESSING_LINES[statusIdx]} />
          ) : null}

          {mode === "form" && form ? (
            <FormMode
              result={form}
              onEditInputs={() => {
                setSavedProfile(false);
                setMode("canvas");
              }}
              editable={!savedProfile}
              onBalanceChange={updateAccountBalance}
              onAccountRemove={removeStructuredAccount}
              onIncomeChange={setIncome}
              onSpendingChange={setSpending}
              onGoalChange={updateGoal}
              onGoalRemove={removeGoal}
              onGoalAdd={addGoal}
              onSaved={() => setSavedProfile(true)}
            />
          ) : null}
        </div>
        </div>
      </div>

      <AnimatePresence>
        {voiceOpen ? (
          <VoicePanel reduceMotion={reduceMotion} onStop={stopVoice} />
        ) : null}
      </AnimatePresence>

      {qrState !== "idle" ? (
        <QrModal state={qrState} onClose={closeQr} />
      ) : null}
    </AppShell>
  );
}

/* ================================================================ canvas == */

function CanvasMode({
  notes,
  attachments,
  dragging,
  fileInputRef,
  onNotesChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onPickFiles,
  onStartVoice,
  onOpenQr,
  onRemove,
  onStructure,
}: {
  notes: string;
  attachments: DumpItem[];
  dragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onNotesChange: (value: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onPickFiles: (files: FileList | null) => void;
  onStartVoice: () => void;
  onOpenQr: () => void;
  onRemove: (id: string) => void;
  onStructure: () => void;
}) {
  const empty = notes.trim() === "" && attachments.length === 0;
  return (
    <motion.div
      className="flex flex-1 flex-col gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* One canvas: type, talk, and drop documents — attachments dock at the bottom. */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-1 flex-col overflow-hidden rounded-card border bg-white transition-colors",
          dragging
            ? "border-violet ring-2 ring-violet/30"
            : "border-stroke-subtle",
        )}
      >
        {/* Mic — top-right */}
        <button
          type="button"
          onClick={onStartVoice}
          aria-label="Dictate with your voice"
          title="Tap to talk and we'll transcribe it in"
          className="absolute right-4 top-4 z-10 inline-flex size-11 items-center justify-center rounded-2xl bg-violet text-white shadow-[0_4px_14px_rgba(127,53,178,0.4)] transition-transform hover:scale-105 active:scale-95"
        >
          <Mic className="size-5" strokeWidth={2} />
        </button>

        {/* Notepad */}
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Start typing… paste notes, financial details, anything. Drop in documents and images below, or tap the mic to talk."
          className="scrollbar-slim min-h-[300px] flex-1 resize-none bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_27px,rgba(16,24,32,0.06)_27px,rgba(16,24,32,0.06)_28px)] px-5 pb-6 pr-16 pt-7 text-[15px] leading-[28px] text-deep-black outline-none placeholder:text-gray-2 xl:px-7"
        />

        {/* Drag overlay */}
        {dragging ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-violet/5 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2 text-violet">
              <Upload className="size-8" strokeWidth={1.75} />
              <span className="text-sm font-semibold">
                Drop to add to your canvas
              </span>
            </div>
          </div>
        ) : null}

        {/* Bottom dock — attachments + attach controls, stuck to the bottom */}
        <div className="mt-auto border-t border-stroke-subtle bg-ghost-white/70 px-3 py-3">
          {attachments.length > 0 ? (
            <div className="scrollbar-slim mb-2.5 flex gap-2 overflow-x-auto pb-1">
              <AnimatePresence initial={false}>
                {attachments.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <AttachmentTile
                      item={item}
                      onRemove={() => onRemove(item.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                onPickFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <ToolbarButton
              icon={Paperclip}
              label="Attach"
              onClick={() => fileInputRef.current?.click()}
            />
            <ToolbarButton
              icon={QrCode}
              label="Send from phone"
              onClick={onOpenQr}
            />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="md"
          onClick={onStructure}
          disabled={empty}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Upload;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-pill border border-stroke-subtle bg-white px-3.5 py-2 text-sm font-medium text-deep-black transition-colors hover:border-violet/50 hover:bg-violet/5"
    >
      <Icon className="size-4 text-violet" strokeWidth={2} />
      {label}
    </button>
  );
}

function AttachmentTile({
  item,
  onRemove,
}: {
  item: DumpItem;
  onRemove: () => void;
}) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  return (
    <div className="group relative flex w-[170px] shrink-0 items-center gap-2.5 rounded-field border border-stroke-subtle bg-white p-2 pr-7">
      {item.kind === "image" && item.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.previewUrl}
          alt={item.title}
          className="size-9 shrink-0 rounded object-cover"
        />
      ) : (
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded text-white"
          style={{ background: meta.accent }}
          aria-hidden
        >
          <Icon className="size-4" strokeWidth={2} />
        </span>
      )}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium text-deep-black">
          {item.fileMeta?.name ?? item.title}
        </span>
        <span className="truncate text-[10px] uppercase tracking-[0.06em] text-gray-2">
          {meta.label}
          {item.fileMeta?.size ? ` · ${item.fileMeta.size}` : ""}
        </span>
      </div>
      <button
        type="button"
        aria-label={`Remove ${item.title}`}
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full p-1 text-gray-2 opacity-0 transition-colors hover:bg-ghost-white hover:text-deep-black group-hover:opacity-100"
      >
        <X className="size-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

/* ============================================================ processing == */

function ProcessingMode({ line }: { line: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="ai-glow flex flex-1 flex-col items-center justify-center gap-5 rounded-card border border-violet/40 bg-white px-6 py-16 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <AskSendIcon className="size-14" />
      </motion.div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2 text-violet">
          <span className="text-sm font-semibold uppercase tracking-[0.12em]">
            Structuring
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={line}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-lg font-medium text-deep-black"
          >
            {line}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ================================================================== form == */

function FormMode({
  result,
  editable,
  onEditInputs,
  onBalanceChange,
  onAccountRemove,
  onIncomeChange,
  onSpendingChange,
  onGoalChange,
  onGoalRemove,
  onGoalAdd,
  onSaved,
}: {
  result: StructuredResult;
  /** While true, fields show pen/edit affordances; Save locks them. */
  editable: boolean;
  onEditInputs: () => void;
  onBalanceChange: (idx: number, balance: number) => void;
  onAccountRemove: (idx: number) => void;
  onIncomeChange: (n: number) => void;
  onSpendingChange: (n: number) => void;
  onGoalChange: (id: string, value: string) => void;
  onGoalRemove: (id: string) => void;
  onGoalAdd: () => void;
  onSaved: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const handleSave = () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
    setSaved(true);
    onSaved();
    savedTimer.current = setTimeout(() => setSaved(false), 1800);
  };

  const total = result.accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <motion.div
      className="flex flex-1 flex-col gap-3"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* AI summary */}
      <div className="ai-glow flex items-center gap-2.5 rounded-card border border-violet/40 bg-white px-3.5 py-2">
        <AskSendIcon className="size-6 shrink-0" />
        <p className="text-xs leading-snug text-deep-black">{result.summary}</p>
      </div>

      {/* About you */}
      <Section title="About you">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LabeledField label="Name">
            <ReadonlyValue value={result.person.name} />
          </LabeledField>
          <LabeledField label="Target retirement age">
            <ReadonlyValue value={result.person.retireAge ?? ""} />
          </LabeledField>
        </div>
      </Section>

      {/* Body: two columns on large screens so it fits without scrolling */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-2">
        {/* Accounts */}
        <Section
          title="Accounts"
          aside={
            <span className="text-sm text-gray-2">{fmtMoney(total)} total</span>
          }
        >
          <ul className="flex flex-col gap-1.5">
            {result.accounts.map((acc, idx) => (
              <li
                key={`${acc.provider}-${acc.accountType}-${idx}`}
                className="flex items-center gap-3 rounded-card border border-stroke-subtle bg-white px-3 py-1.5"
              >
                <ProviderLogo
                  provider={acc.provider}
                  className="size-8"
                  textClassName="text-xs"
                />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-sm font-medium text-deep-black">
                    {acc.provider}
                  </span>
                  <span className="truncate text-xs text-gray-2">
                    {acc.accountType}
                  </span>
                  <StatusBadge tone={TAX_BADGE_TONE[acc.taxStatus]}>
                    {TAX_STATUS_LABEL[acc.taxStatus]}
                  </StatusBadge>
                </div>
                {editable ? (
                  <>
                    <BalanceField
                      value={acc.balance}
                      onChange={(v) => onBalanceChange(idx, v)}
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${acc.provider} ${acc.accountType}`}
                      onClick={() => onAccountRemove(idx)}
                      className="shrink-0 rounded-full p-1 text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
                    >
                      <X className="size-4" strokeWidth={2} />
                    </button>
                  </>
                ) : (
                  <span className="shrink-0 px-2.5 text-sm font-medium text-deep-black">
                    {fmtMoney(acc.balance)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>

        {/* Income, Spending & Goals */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Section title="Income">
              <LabeledField label="Take-home / month">
                {editable ? (
                  <MoneyField
                    value={result.incomeMonthly}
                    onChange={onIncomeChange}
                  />
                ) : (
                  <ReadonlyValue value={fmtMoney(result.incomeMonthly)} />
                )}
              </LabeledField>
            </Section>
            <Section title="Spending">
              <LabeledField label="Spending / month">
                {editable ? (
                  <MoneyField
                    value={result.spendingMonthly}
                    onChange={onSpendingChange}
                  />
                ) : (
                  <ReadonlyValue value={fmtMoney(result.spendingMonthly)} />
                )}
              </LabeledField>
            </Section>
          </div>

          <Section title="Goals">
            <ul className="flex flex-col gap-1.5">
              {result.goals.map((goal, idx) => (
                <li
                  key={goal.id}
                  className="flex items-center gap-2 rounded-card border border-stroke-subtle bg-white px-3 py-1.5"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet/10 text-xs font-semibold text-violet">
                    {idx + 1}
                  </span>
                  {editable ? (
                    <>
                      <input
                        value={goal.text}
                        onChange={(e) => onGoalChange(goal.id, e.target.value)}
                        placeholder="Describe a goal…"
                        className="w-full bg-transparent text-sm font-medium text-deep-black outline-none placeholder:text-gray-2"
                      />
                      <Pencil
                        className="size-3.5 shrink-0 text-gray-2"
                        strokeWidth={2}
                      />
                      <button
                        type="button"
                        aria-label="Remove goal"
                        onClick={() => onGoalRemove(goal.id)}
                        className="shrink-0 text-gray-2 transition-colors hover:text-deep-black"
                      >
                        <Trash2 className="size-4" strokeWidth={2} />
                      </button>
                    </>
                  ) : (
                    <span className="w-full truncate text-sm font-medium text-deep-black">
                      {goal.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {editable ? (
              <button
                type="button"
                onClick={onGoalAdd}
                className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-gray-2 transition-colors hover:text-violet"
              >
                <Plus className="size-4" strokeWidth={2} />
                Add a goal
              </button>
            ) : null}
          </Section>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
        <Button variant="outline" size="md" onClick={onEditInputs}>
          Back to inputs
        </Button>
        <Button variant="primary" size="md" onClick={handleSave}>
          Save
        </Button>
        <AnimatePresence>
          {saved ? (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-success"
            >
              <Check className="size-4" strokeWidth={2.5} />
              Saved
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.04em] text-gray-1">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </div>
  );
}

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-2">{label}</span>
      {children}
    </label>
  );
}

/** Read-only value display for locked (post-save) structured fields. */
function ReadonlyValue({ value }: { value: string }) {
  return (
    <div className="rounded-field border border-stroke-subtle bg-ghost-white px-3.5 py-2.5 text-sm font-medium text-deep-black">
      {value || "-"}
    </div>
  );
}

function MoneyField({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center rounded-field border border-stroke-subtle bg-white px-3.5 py-2.5 transition-colors focus-within:border-violet/50">
      <span className="text-sm text-gray-1">$</span>
      <input
        inputMode="numeric"
        value={value.toLocaleString("en-US")}
        onChange={(e) =>
          onChange(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)
        }
        className="ml-1 w-full bg-transparent text-sm font-medium text-deep-black outline-none"
      />
      <Pencil className="size-3.5 shrink-0 text-gray-2" strokeWidth={2} />
    </div>
  );
}

/** Click-to-edit balance pill (mirrors SmartSort's balance editor). */
function BalanceField({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const start = () => {
    setDraft(String(value));
    setEditing(true);
  };
  const commit = () => {
    onChange(Number(draft.replace(/[^0-9]/g, "")) || 0);
    setEditing(false);
  };

  if (editing) {
    return (
      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-pill bg-white py-1 pl-2.5 pr-1.5 shadow-[0_1px_2px_rgba(16,24,32,0.06)] ring-2 ring-violet/40">
        <span className="text-gray-1">$</span>
        <input
          autoFocus
          inputMode="numeric"
          value={Number(draft.replace(/[^0-9]/g, "")).toLocaleString("en-US")}
          size={Math.max(4, draft.replace(/[^0-9]/g, "").length + 1)}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={commit}
          className="bg-transparent text-right text-sm font-medium text-deep-black outline-none"
        />
        <button
          type="button"
          aria-label="Save balance"
          onClick={commit}
          className="rounded-full p-1 text-success transition-colors hover:bg-ghost-white"
        >
          <Check className="size-3.5" strokeWidth={2.4} />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className="group inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 text-sm font-medium text-deep-black transition-colors hover:bg-ghost-white"
    >
      {fmtMoney(value)}
      <Pencil
        className="size-3.5 text-gray-2 transition-colors group-hover:text-violet"
        strokeWidth={2}
      />
    </button>
  );
}

/* ============================================================ voice panel == */

function VoicePanel({
  reduceMotion,
  onStop,
}: {
  reduceMotion: boolean;
  onStop: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-pill border border-violet/40 bg-white px-5 py-3 shadow-[0_16px_48px_rgba(16,24,32,0.18)]"
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-violet text-white">
        <Mic className="size-4" strokeWidth={2} />
      </span>

      <div className="flex flex-col">
        <span className="text-sm font-semibold text-deep-black">Listening…</span>
        <Waveform reduceMotion={reduceMotion} />
      </div>

      <button
        type="button"
        onClick={onStop}
        className="inline-flex items-center gap-1.5 rounded-pill bg-deep-black px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85"
      >
        <Square className="size-3.5" strokeWidth={2.5} fill="currentColor" />
        Stop
      </button>
    </motion.div>
  );
}

function Waveform({ reduceMotion }: { reduceMotion: boolean }) {
  const bars = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <div className="mt-0.5 flex h-4 items-center gap-[3px]">
      {bars.map((b) => (
        <motion.span
          key={b}
          className="w-[3px] rounded-full bg-violet"
          animate={
            reduceMotion ? { height: 7 } : { height: [5, 14, 7, 16, 6] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 0.9,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: b * 0.08,
                }
          }
        />
      ))}
    </div>
  );
}

/* =============================================================== qr modal == */

function QrModal({
  state,
  onClose,
}: {
  state: "waiting" | "received";
  onClose: () => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Send from your phone"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
    >
      <div
        className="absolute inset-0 bg-deep-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center rounded-field bg-card p-6 text-center shadow-[0_24px_64px_rgba(16,24,32,0.24)]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-2 transition-colors hover:bg-ghost-white hover:text-deep-black"
        >
          <X className="size-5" strokeWidth={2} />
        </button>

        <div className="flex items-center gap-2 text-violet">
          <Smartphone className="size-5" strokeWidth={2} />
          <span className="text-sm font-semibold uppercase tracking-[0.1em]">
            Send from your phone
          </span>
        </div>

        <AnimatePresence mode="wait">
          {state === "waiting" ? (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-5 flex flex-col items-center gap-4"
            >
              <DecorativeQr />
              <p className="text-sm text-deep-black">
                Scan this with your phone camera to add a document.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-2">
                <span className="size-4 animate-spin rounded-full border-2 border-violet/30 border-t-violet" />
                Waiting for your phone…
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="received"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 flex flex-col items-center gap-3 py-6"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="size-8" strokeWidth={2.5} />
              </span>
              <p className="text-lg font-semibold text-deep-black">Received!</p>
              <p className="text-sm text-gray-2">
                A scanned document was added to your dump.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>,
    document.body,
  );
}

/** A purely decorative QR rendered as an SVG grid (no QR library). */
function DecorativeQr() {
  const size = 21;
  const cell = 8;
  // Deterministic pseudo-random module pattern so it looks like a real QR.
  const isOn = (r: number, c: number) => ((r * 7 + c * 13 + r * c) % 5) < 2;

  const finder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

  const rows = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (finder(r, c)) continue;
      if (isOn(r, c)) {
        rows.push(
          <rect
            key={`${r}-${c}`}
            x={c * cell}
            y={r * cell}
            width={cell}
            height={cell}
            rx={1.5}
            fill="#101820"
          />,
        );
      }
    }
  }

  const finderSquare = (x: number, y: number) => (
    <g key={`f-${x}-${y}`}>
      <rect x={x} y={y} width={cell * 7} height={cell * 7} rx={6} fill="#101820" />
      <rect
        x={x + cell}
        y={y + cell}
        width={cell * 5}
        height={cell * 5}
        rx={4}
        fill="#ffffff"
      />
      <rect
        x={x + cell * 2}
        y={y + cell * 2}
        width={cell * 3}
        height={cell * 3}
        rx={2.5}
        fill="#101820"
      />
    </g>
  );

  return (
    <div className="rounded-field border border-stroke-subtle bg-white p-3">
      <svg
        width={size * cell}
        height={size * cell}
        viewBox={`0 0 ${size * cell} ${size * cell}`}
        aria-hidden
      >
        {rows}
        {finderSquare(0, 0)}
        {finderSquare((size - 7) * cell, 0)}
        {finderSquare(0, (size - 7) * cell)}
      </svg>
    </div>
  );
}
