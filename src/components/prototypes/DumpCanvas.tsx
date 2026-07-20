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
  QrCode,
  ScanLine,
  Smartphone,
  Square,
  Type,
  Upload,
  X,
} from "lucide-react";
import { AskSendIcon } from "@/components/ui/AskSendIcon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
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

type Stage = "canvas" | "processing";

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
  const previewUrl = kind === "image" ? URL.createObjectURL(file) : undefined;
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

const DEFAULT_SUBTITLE =
  "Drop in files, screenshots, pasted notes, a voice memo or a scan from your phone. When you're done, let AI structure it into your account profile.";

/**
 * Which optional input sources actually contributed to the dump by the time
 * the user hit Continue. Passed alongside the structured result so parents can
 * tailor what they import (e.g. only surface accounts a used source mentions).
 */
export interface DumpCompletion {
  /** The mic was used: the voice transcript was streamed into the notes. */
  voiceUsed: boolean;
  /** At least one phone-scanned item was still attached at completion. */
  scanUsed: boolean;
}

/** The seeded free-text notes (text + voice notes folded into the notepad). */
const SEED_NOTES = SEED_ITEMS.filter(
  (i) => i.kind === "text" || i.kind === "voice",
)
  .map((i) => i.content)
  .filter((c): c is string => Boolean(c && c.trim()))
  .join("\n\n");

/** The seeded docked attachments (everything that isn't free text/voice). */
const DEFAULT_SEED_ITEMS = SEED_ITEMS.filter(
  (i) => i.kind !== "text" && i.kind !== "voice",
);

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The Data Dump "dump everything" experience: a single notepad canvas with
 * docked attachments, voice dictation, and phone-scan support, plus the AI
 * "structuring" animation. Fully self-contained; calls `onComplete` with the
 * structured result once processing finishes. Shared by the Data Dump screen
 * and the Smart Assets "Add what you have" modal.
 */
export function DumpCanvas({
  onComplete,
  title = "Dump everything here",
  subtitle = DEFAULT_SUBTITLE,
  continueLabel = "Continue",
  autotype = false,
  seedNotes = SEED_NOTES,
  seedItems = DEFAULT_SEED_ITEMS,
  voiceTranscript = VOICE_TRANSCRIPT,
  makeScan = makeScanItems,
}: {
  /**
   * Fired with the structured result once "processing" finishes. `completion`
   * reports which optional sources (voice memo, phone scan) were actually used
   * in this session; callers that don't care can ignore it.
   */
  onComplete: (result: StructuredResult, completion: DumpCompletion) => void;
  /** Heading shown above the canvas. Pass `null` to omit (e.g. inside a modal). */
  title?: string | null;
  subtitle?: React.ReactNode;
  continueLabel?: string;
  /** Type the seeded notes into the notepad on mount, as if entered live. */
  autotype?: boolean;
  /** Free-text notes to pre-fill/autotype. Defaults to the full Data Dump seed. */
  seedNotes?: string;
  /** Docked attachments shown on mount. Defaults to the full Data Dump seed. */
  seedItems?: DumpItem[];
  /** Transcript streamed into the notepad when the mic "listens". */
  voiceTranscript?: string;
  /** Factory for the documents that "arrive" from the simulated phone scan. */
  makeScan?: () => DumpItem[];
}) {
  const [stage, setStage] = useState<Stage>("canvas");
  // The canvas is one notepad (free text) plus docked attachments. Seed text/voice
  // notes fold into the notepad; files/scans become bottom-docked attachments.
  // When autotyping, start empty and stream the seed text in on mount (unless
  // reduced motion is preferred, in which case seed it fully right away).
  const [notes, setNotes] = useState<string>(() =>
    autotype && !prefersReducedMotion() ? "" : seedNotes,
  );
  const [items, setItems] = useState<DumpItem[]>(() => seedItems);
  const [dragging, setDragging] = useState(false);

  const [voiceOpen, setVoiceOpen] = useState(false);
  const [qrState, setQrState] = useState<"idle" | "waiting" | "received">("idle");
  const [statusIdx, setStatusIdx] = useState(0);

  const [reduceMotion] = useState(prefersReducedMotion);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track object URLs we create for image previews so they can be revoked on
  // removal/unmount (createObjectURL leaks until explicitly revoked).
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // Timers (kept in refs so transitions are driven by handlers, not effects).
  const voiceTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceBaseRef = useRef("");
  // Whether the mic was used this session (the transcript entered the notes).
  const voiceUsedRef = useRef(false);
  const qrTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const processTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear every pending timer + revoke object URLs on unmount (cleanup-only;
  // never sets state on mount).
  useEffect(
    () => () => {
      if (voiceTimer.current) clearInterval(voiceTimer.current);
      if (statusTimer.current) clearInterval(statusTimer.current);
      if (processTimer.current) clearTimeout(processTimer.current);
      if (typeTimer.current) clearInterval(typeTimer.current);
      qrTimers.current.forEach(clearTimeout);
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    },
    [],
  );

  // Stream the seed notes into the notepad on mount so it reads like the user
  // is entering the details live. Cancels itself once finished.
  useEffect(() => {
    if (!autotype || reduceMotion || !seedNotes) return;
    let i = 0;
    const perTick = 2;
    typeTimer.current = setInterval(() => {
      i = Math.min(i + perTick, seedNotes.length);
      setNotes(seedNotes.slice(0, i));
      if (i >= seedNotes.length && typeTimer.current) {
        clearInterval(typeTimer.current);
        typeTimer.current = null;
      }
    }, 16);
    return () => {
      if (typeTimer.current) {
        clearInterval(typeTimer.current);
        typeTimer.current = null;
      }
    };
  }, [autotype, reduceMotion, seedNotes]);

  // A manual edit cancels any in-progress autotyping.
  const handleNotesChange = (value: string) => {
    if (typeTimer.current) {
      clearInterval(typeTimer.current);
      typeTimer.current = null;
    }
    setNotes(value);
  };

  /* ---------------------------------------------------------------- items -- */

  const addItems = (next: DumpItem[]) => setItems((prev) => [...prev, ...next]);

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
    if (typeTimer.current) {
      clearInterval(typeTimer.current);
      typeTimer.current = null;
    }
    setVoiceOpen(true);
    voiceUsedRef.current = true;
    // Transcribe straight into the notepad, after whatever's already there.
    voiceBaseRef.current = notes.trim() ? notes.replace(/\s+$/, "") + "\n\n" : "";

    const words = voiceTranscript.split(" ");
    let i = 0;
    voiceTimer.current = setInterval(
      () => {
        i += 1;
        setNotes(voiceBaseRef.current + words.slice(0, i).join(" "));
        if (i >= words.length) stopVoice();
      },
      reduceMotion ? 30 : 90,
    );
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
        addItems(makeScan());
        setQrState("received");
        qrTimers.current.push(setTimeout(() => setQrState("idle"), 1100));
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
    if (typeTimer.current) {
      clearInterval(typeTimer.current);
      typeTimer.current = null;
    }
    setStage("processing");
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
      onComplete(structureDump(items, notes), {
        voiceUsed: voiceUsedRef.current,
        scanUsed: items.some((it) => it.addedVia === "phone"),
      });
      // Return to the editable canvas with the notes/attachments intact, so
      // parents that keep the canvas mounted after completion (Smart add)
      // don't lose the session's inputs. Parents that navigate away on
      // complete (Data Dump) unmount before this matters.
      setStage("canvas");
    }, 2300);
  };

  return (
    <>
      {title ? (
        <motion.div
          className="mt-4 max-w-[680px]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-deep-black sm:text-[30px]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-snug text-black/70">{subtitle}</p>
          ) : null}
        </motion.div>
      ) : null}

      <div className="mt-4 flex w-full flex-1 flex-col">
        {stage === "canvas" ? (
          <CanvasMode
            notes={notes}
            attachments={items}
            dragging={dragging}
            fileInputRef={fileInputRef}
            continueLabel={continueLabel}
            onNotesChange={handleNotesChange}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onPickFiles={(files) => handleFiles(files, "upload")}
            onStartVoice={startVoice}
            onOpenQr={openQr}
            onRemove={removeItem}
            onStructure={startStructure}
          />
        ) : (
          <ProcessingMode line={PROCESSING_LINES[statusIdx]} />
        )}
      </div>

      <AnimatePresence>
        {voiceOpen ? (
          <VoicePanel reduceMotion={reduceMotion} onStop={stopVoice} />
        ) : null}
      </AnimatePresence>

      {qrState !== "idle" ? <QrModal state={qrState} onClose={closeQr} /> : null}
    </>
  );
}

/* ================================================================ canvas == */

function CanvasMode({
  notes,
  attachments,
  dragging,
  fileInputRef,
  continueLabel,
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
  continueLabel: string;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Follow programmatic appends (voice dictation / on-mount autotype) by
  // scrolling to the newest text. Skip when the textarea is focused so we never
  // fight the user's caret during manual typing (the browser handles that).
  useEffect(() => {
    const el = textareaRef.current;
    if (el && document.activeElement !== el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [notes]);

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
          ref={textareaRef}
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
          {continueLabel}
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
      className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-4 rounded-pill border border-violet/40 bg-white px-5 py-3 shadow-[0_16px_48px_rgba(16,24,32,0.18)]"
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
          animate={reduceMotion ? { height: 7 } : { height: [5, 14, 7, 16, 6] }}
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
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8"
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
  const isOn = (r: number, c: number) => (r * 7 + c * 13 + r * c) % 5 < 2;

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
