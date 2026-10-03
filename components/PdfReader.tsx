"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Loader2, X } from "lucide-react";
import { downloadUrl, embedUrl, externalReadUrl, type Book } from "@/lib/books";

type PdfReaderProps = {
  book: Book;
  onClose: () => void;
};

/**
 * In-site reading experience.
 *
 * 1. Embeds Google Drive's viewer (which provides zoom + page navigation).
 * 2. If the embed does not load within ~14s (Drive restriction, offline,
 *    private file), it degrades gracefully to a "read on Google Drive" CTA.
 * 3. Nothing is fetched until the user actually clicks "Read online".
 * 4. Acts as a modal dialog: scroll lock, Escape to close, focus moved in
 *    on open, Tab cycled inside, focus restored to the trigger on close.
 */
export default function PdfReader({ book, onClose }: PdfReaderProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStatus((current) => (current === "loading" ? "error" : current));
    }, 14000);

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${book.title} — reader`}
        className="flex h-full w-full max-w-5xl flex-col overflow-hidden bg-paper shadow-lift"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="eyebrow">Reading</p>
            <h2 className="truncate font-display text-lg text-ink-900">{book.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={downloadUrl(book)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 border border-ink-900/25 px-3 text-sm text-ink-900 transition-colors hover:border-gold-500 hover:text-gold-700"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sr-only sm:hidden">Download PDF</span>
            </a>
            <a
              href={externalReadUrl(book)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 border border-ink-900/25 px-3 text-sm text-ink-900 transition-colors hover:border-gold-500 hover:text-gold-700"
            >
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Open in new tab</span>
              <span className="sr-only sm:hidden">Open in new tab</span>
            </a>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close reader"
              className="flex h-11 w-11 items-center justify-center bg-ink-900 text-cream-50 transition-colors hover:bg-ink-700"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 bg-cream-100">
          {status === "loading" && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-muted"
              role="status"
            >
              <Loader2 className="h-7 w-7 animate-spin text-gold-600" aria-hidden />
              <p className="text-sm">Loading the book…</p>
            </div>
          )}

          {status === "error" ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="max-w-sm leading-relaxed text-muted">
                This PDF cannot be displayed here. Google Drive may have changed
                its sharing settings, or you may be offline.
              </p>
              <a
                href={externalReadUrl(book)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 bg-ink-900 px-6 text-sm font-medium text-cream-50 transition-colors hover:bg-ink-700"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                Read on Google Drive
              </a>
            </div>
          ) : (
            <iframe
              title={`${book.title} — PDF`}
              src={embedUrl(book)}
              onLoad={() => setStatus("ready")}
              className="h-full w-full"
              allow="autoplay"
            />
          )}
        </div>
      </div>
    </div>
  );
}