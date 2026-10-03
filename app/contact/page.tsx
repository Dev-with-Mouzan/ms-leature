import type { Metadata } from "next";
import ContactView from "@/components/views/ContactView";
import { siteConfig } from "@/lib/site";

const description = `Write to ${siteConfig.author.name} — email address, LinkedIn profile and a contact form for literary conversations, invitations and interviews.`;

export const metadata: Metadata = {
  title: "Contact",
  description,
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    title: `Contact ${siteConfig.author.name}`,
    description,
    url: "/contact",
  },
};

export default function ContactPage() {
  return <ContactView />;
}