import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  tone?: "dark" | "light";
};

/**
 * Editorial section heading. Vertical stack only — the tag-left /
 * heading-right split is a templated tell and is banned by design.md.
 * An eyebrow is optional and must never restate the title beneath it.
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "dark",
}: SectionHeadingProps) {
  const isLight = tone === "light";

  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <p className={`eyebrow ${isLight ? "eyebrow-light" : ""}`}>{eyebrow}</p>
      )}
      <h2
        className={`mt-3 text-[clamp(1.75rem,1.4rem+1.2vw,2.5rem)] leading-[1.15] ${
          isLight ? "text-cream-50" : "text-ink-900"
        }`}
      >
        {title}
      </h2>
      <div
        className={`mt-4 h-px w-16 ${
          isLight ? "bg-gold-400/70" : "bg-gold-500/70"
        }`}
        aria-hidden
      />
      {description && (
        <p
          className={`mt-5 max-w-[62ch] leading-relaxed ${
            isLight ? "text-cream-200/90" : "text-muted"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}