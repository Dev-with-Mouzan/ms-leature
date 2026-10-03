import Link from "next/link";
import { ExternalLink, Mail, MapPin } from "lucide-react";
import { siteConfig } from "@/lib/site";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/books", label: "Books" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const { author, contact, socials } = siteConfig;

  return (
    <footer className="mt-24 bg-ink-900 text-cream-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1.1fr]">
        <div>
          <p className="font-display text-2xl text-cream-50">{author.name}</p>
          <p className="mt-1.5 text-xs uppercase tracking-[0.18em] text-gold-400">
            {author.title}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-300/85">
            {author.affiliation.name} — {author.affiliation.department},
            Higher Education Department, Government of the Punjab.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="eyebrow eyebrow-light">Explore</p>
          <ul className="mt-4 space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-sm text-cream-200/90 transition-colors hover:text-gold-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="eyebrow eyebrow-light">Contact</p>
          <a
            href={`mailto:${contact.email}`}
            className="mt-4 inline-flex min-h-11 items-center gap-2 break-all text-sm text-cream-200/90 transition-colors hover:text-gold-300"
          >
            <Mail className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
            {contact.email}
          </a>
          {contact.location && (
            <p className="flex items-start gap-2 text-sm text-cream-300/85">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
              {contact.location}
            </p>
          )}

          {socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {socials.map((social) => (
                <li key={social.platform}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 border border-white/20 px-3 text-sm text-cream-200/90 transition-colors hover:border-gold-400 hover:text-gold-300"
                  >
                    {social.label}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-cream-300/75 sm:flex-row sm:px-6">
          <p>
            © {year} {author.name}. All rights reserved.
          </p>
          <a
            href={author.affiliation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-gold-300"
          >
            {author.affiliation.name}
          </a>
        </div>
      </div>
    </footer>
  );
}