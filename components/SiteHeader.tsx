"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/lib/site";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/books", label: "Books" },
  { href: "/poems", label: "Poems" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled || open
          ? "border-b border-line bg-paper/95 backdrop-blur-md"
          : "border-b border-transparent bg-paper"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label={`${siteConfig.author.name} — home`}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center bg-ink-900 font-display text-sm tracking-wide text-gold-400 transition-colors group-hover:bg-ink-700"
            aria-hidden
          >
            MS
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-lg text-ink-900">
              {siteConfig.author.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
              Urdu Poet &amp; Writer
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-ink-900"
                  : "text-muted hover:text-ink-900"
              }`}
            >
              {link.label}
              <span
                className={`absolute inset-x-3 -bottom-0.5 h-px bg-gold-500 transition-transform duration-300 ${
                  isActive(link.href) ? "scale-x-100" : "scale-x-0"
                }`}
                aria-hidden
              />
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-11 w-11 items-center justify-center text-ink-900 transition-colors hover:text-gold-700 md:hidden"
        >
          {open ? (
            <X className="h-6 w-6" aria-hidden />
          ) : (
            <Menu className="h-6 w-6" aria-hidden />
          )}
        </button>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-line bg-paper md:hidden"
      >
        <nav className="mx-auto max-w-6xl px-4 py-3" aria-label="Mobile">
          <ul className="divide-y divide-line">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`flex min-h-12 items-center justify-between text-base ${
                    isActive(link.href)
                      ? "font-medium text-gold-700"
                      : "text-ink-900"
                  }`}
                >
                  {link.label}
                  <span className="text-xs text-muted" aria-hidden>
                    {String(navLinks.indexOf(link) + 1).padStart(2, "0")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="py-4 text-sm text-muted">{siteConfig.contact.email}</p>
        </nav>
      </div>
    </header>
  );
}