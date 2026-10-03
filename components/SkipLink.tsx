/** Keyboard/screen-reader skip link. The target <main> carries tabIndex={-1}. */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only z-50 bg-ink-900 px-4 py-3 text-sm text-cream-50 focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
    >
      Skip to content
    </a>
  );
}