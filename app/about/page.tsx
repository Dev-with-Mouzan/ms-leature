import type { Metadata } from "next";
import AboutView from "@/components/views/AboutView";
import { siteConfig } from "@/lib/site";

const description = `About ${siteConfig.author.name} — Urdu poet and Associate Professor of English at ${siteConfig.author.affiliation.name}. Academic record, literary work and books.`;

export const metadata: Metadata = {
  title: "About",
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "profile",
    title: `About ${siteConfig.author.name}`,
    description,
    url: "/about",
  },
};

export default function AboutPage() {
  return <AboutView />;
}