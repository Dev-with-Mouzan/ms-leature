"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { CheckCircle2, ExternalLink, Mail, MapPin } from "lucide-react";
import Reveal from "@/components/Reveal";
import { siteConfig } from "@/lib/site";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const empty: FormState = { name: "", email: "", subject: "", message: "" };

export default function ContactView() {
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [sent, setSent] = useState(false);

  const { contact, socials, author } = siteConfig;

  const set =
    (key: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Please enter a valid email address.";
    if (!form.message.trim()) next.message = "Please enter a message.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const subject = encodeURIComponent(
      form.subject.trim() || `Message — ${form.name.trim()}`,
    );
    const body = encodeURIComponent(
      `${form.message}\n\n—\n${form.name}\n${form.email}`,
    );

    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const field = (error?: string) =>
    `w-full min-h-12 border bg-paper px-4 py-3 text-sm text-ink-900 placeholder:text-muted/70 focus:border-gold-600 focus:outline-none ${
      error ? "border-red-600" : "border-line"
    }`;

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-3 text-[clamp(2.25rem,1.8rem+2vw,3.25rem)] leading-[1.1] text-ink-900">
            Write to {author.name}
          </h1>
          <div className="mt-4 h-px w-16 bg-gold-500/70" aria-hidden />
          <p className="mt-5 max-w-2xl leading-relaxed text-muted">
            Literary conversations, invitations, interviews, or questions about
            the books — all welcome. Messages go straight to the author&apos;s
            email.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <div className="space-y-5">
              <Row
                icon={Mail}
                label="Email"
                value={contact.email}
                href={`mailto:${contact.email}`}
              />
              {contact.location && (
                <Row icon={MapPin} label="Based in" value={contact.location} />
              )}

              <div className="border border-line bg-paper px-5 py-4">
                <p className="text-[0.7rem] uppercase tracking-[0.16em] text-muted">
                  Affiliation
                </p>
                <p className="mt-1 text-sm font-medium text-ink-900">
                  {author.affiliation.name}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {author.affiliation.department}
                </p>
                <a
                  href={author.affiliation.directory}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm text-gold-700 transition-colors hover:text-gold-600"
                >
                  Staff directory
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>

              {socials.length > 0 && (
                <div>
                  <p className="eyebrow">Elsewhere</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {socials.map((social) => (
                      <li key={social.platform}>
                        <a
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center gap-2 border border-line bg-paper px-4 py-2.5 text-sm text-ink-900 transition-colors hover:border-gold-500 hover:text-gold-700"
                        >
                          {social.label}
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="border border-line bg-paper p-6 sm:p-8">
              {sent ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <span className="flex h-14 w-14 items-center justify-center bg-cream-100 text-gold-700">
                    <CheckCircle2 className="h-7 w-7" aria-hidden />
                  </span>
                  <p className="mt-5 font-display text-xl text-ink-900">Thank you</p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                    Your email app should now be open with the message prepared —
                    review it and press send.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setForm(empty);
                    }}
                    className="mt-6 inline-flex min-h-11 items-center border border-ink-900/25 px-5 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:border-gold-500 hover:text-gold-700"
                  >
                    Write another message
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Labeled id="name" label="Your name" error={errors.name}>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={form.name}
                        onChange={set("name")}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? "name-error" : undefined}
                        className={field(errors.name)}
                      />
                    </Labeled>

                    <Labeled id="email" label="Your email" error={errors.email}>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={set("email")}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? "email-error" : undefined}
                        className={field(errors.email)}
                      />
                    </Labeled>
                  </div>

                  <div className="mt-5">
                    <Labeled id="subject" label="Subject (optional)">
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        value={form.subject}
                        onChange={set("subject")}
                        className={field()}
                      />
                    </Labeled>
                  </div>

                  <div className="mt-5">
                    <Labeled id="message" label="Message" error={errors.message}>
                      <textarea
                        id="message"
                        name="message"
                        rows={6}
                        value={form.message}
                        onChange={set("message")}
                        aria-invalid={Boolean(errors.message)}
                        aria-describedby={
                          errors.message ? "message-error" : undefined
                        }
                        className={`${field(errors.message)} min-h-[160px] resize-y`}
                      />
                    </Labeled>
                  </div>

                  <button
                    type="submit"
                    className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-ink-900 px-6 py-3 text-sm font-medium text-cream-50 transition-colors hover:bg-ink-700 sm:w-auto"
                  >
                    <Mail className="h-4 w-4" aria-hidden />
                    Send message
                  </button>

                  <p className="mt-4 text-xs leading-relaxed text-muted">
                    No server and no tracking — the form simply opens a pre-filled
                    message in your own email app.
                  </p>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Labeled({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <span className="flex items-start gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-cream-100 text-gold-700">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.7rem] uppercase tracking-[0.16em] text-muted">
          {label}
        </span>
        <span className="mt-0.5 block break-words text-sm font-medium text-ink-900">
          {value}
        </span>
      </span>
    </span>
  );

  return (
    <div className="border border-line bg-paper px-5 py-4">
      {href ? (
        <a href={href} className="block transition-colors hover:text-gold-700">
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}