import { useState } from "react";
import { Check, Mail, Send } from "lucide-react";

import Seo from "@/components/Seo.tsx";
import SectionHeading from "@/components/SectionHeading.tsx";
import { postContact } from "@/lib/api";
import { site } from "@/lib/site";
import { CONTACT_TOPICS, type ContactTopic } from "@/lib/types";

type Errors = Partial<Record<"name" | "email" | "body", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Contact.
 *
 * Posts to FastAPI rather than handing off to a mail app, so the message
 * arrives even if the visitor has no mail client configured. The address is
 * still shown beside the form for anyone who would rather write directly.
 */
export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<ContactTopic>("general");
  const [body, setBody] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  function validate(): Errors {
    const found: Errors = {};
    if (name.trim().length < 2) found.name = "Please give a name of at least two characters.";
    if (!EMAIL.test(email.trim())) found.email = "Please give a valid email address.";
    if (body.trim().length < 10) found.body = "Please write at least a sentence.";
    return found;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFailure(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      const detail = await postContact({ name, email, topic, body, website: honeypot });
      setSent(detail);
      // Clear the form so a second message cannot be sent by accident.
      setName("");
      setEmail("");
      setBody("");
      setHoneypot("");
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Your message could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  const field = (key: keyof Errors) =>
    errors[key] ? "border-maroon-600" : "";

  return (
    <>
      <Seo
        title="Contact"
        description={`Contact ${site.fullName} about permissions, press or the books.`}
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <SectionHeading
          eyebrow="Contact"
          title="Get in touch"
          lead="For permissions, reprints, press requests, or anything about the books."
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="max-w-xl">
            {sent ? (
              <div
                role="status"
                className="rounded-sm border border-teal-700/30 bg-teal-700/5 p-6"
              >
                <h2 className="flex items-center gap-2 text-lg font-semibold text-teal-800">
                  <Check aria-hidden="true" className="size-5" />
                  Message sent
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-800">
                  {sent} A copy will reach {site.email}.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(null)}
                  className="btn btn-secondary mt-6"
                >
                  Write another
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={submit} noValidate>
                <div>
                  <label htmlFor="name" className="field-label">
                    Your name
                  </label>
                  <input
                    id="name"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    className={`field ${field("name")}`}
                  />
                  {errors.name && (
                    <p id="name-error" role="alert" className="field-error">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="field-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={`field ${field("email")}`}
                  />
                  {errors.email && (
                    <p id="email-error" role="alert" className="field-error">
                      {errors.email}
                    </p>
                  )}
                  <p className="field-hint">
                    Used only to reply. Never published, and never shared.
                  </p>
                </div>

                <div>
                  <label htmlFor="topic" className="field-label">
                    What is this about?
                  </label>
                  <select
                    id="topic"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value as ContactTopic)}
                    className="field"
                  >
                    {CONTACT_TOPICS.map((entry) => (
                      <option key={entry.value} value={entry.value}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="field-label">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={7}
                    required
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    aria-invalid={Boolean(errors.body)}
                    aria-describedby={errors.body ? "message-error" : undefined}
                    className={`field ${field("body")}`}
                  />
                  {errors.body && (
                    <p id="message-error" role="alert" className="field-error">
                      {errors.body}
                    </p>
                  )}
                </div>

                {/* Honeypot. Hidden from sight and from screen readers, so only
                    an automated filler ever sees it. */}
                <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
                  <label htmlFor="website">Leave this empty</label>
                  <input
                    id="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(event) => setHoneypot(event.target.value)}
                  />
                </div>

                {failure && (
                  <p
                    role="alert"
                    className="rounded-sm border border-maroon-600/25 bg-maroon-700/5 p-3 text-sm font-medium text-maroon-700"
                  >
                    {failure}
                  </p>
                )}

                <button type="submit" disabled={busy} className="btn btn-primary">
                  <Send aria-hidden="true" className="size-4" />
                  {busy ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>

          <aside className="h-fit rounded-sm border border-line bg-cream-50 p-6">
            <h2 className="text-base font-semibold">Direct</h2>

            <a
              href={`mailto:${site.email}`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-maroon-700 hover:text-maroon-800"
            >
              <Mail aria-hidden="true" className="size-4 shrink-0" />
              <span className="break-all">{site.email}</span>
            </a>
            <p className="mt-1 text-sm text-muted">{site.affiliation}</p>

            <div className="mt-6 border-t border-line pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-marigold-700">
                What this handles
              </h3>
              <ul className="mt-3 grid gap-1.5">
                {CONTACT_TOPICS.map((entry) => (
                  <li key={entry.value} className="flex items-start gap-2.5 text-sm text-ink-800">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-marigold-500"
                    />
                    {entry.label}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
              The form delivers your message through this site — it works even if you have no mail
              app configured.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}