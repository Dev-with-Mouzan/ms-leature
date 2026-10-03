import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageTransition from "@/components/PageTransition";
import SkipLink from "@/components/SkipLink";
import { siteConfig } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Display face — roman only. Italic headings are banned by design.md. */
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  weight: ["400", "500"],
});

const { author, url } = siteConfig;
const siteName = `${author.name} — Urdu Poet, Writer & Lecturer`;

const description =
  "Official website of Mujahid Sajjad — Urdu poet, writer and Associate Professor of English at Govt. Graduate College Burewala. Read his books online or download them free as PDF.";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: siteName,
    template: `%s · ${author.name}`,
  },
  description,
  keywords: [
    "Mujahid Sajjad",
    "Syed Mujahid Sajjad",
    "Urdu poet",
    "Urdu poetry",
    "Magar Manzar Nahi Mera",
    "Pakistani poet",
    "Govt. Graduate College Burewala",
    "Associate Professor of English",
  ],
  authors: [{ name: author.name, url }],
  creator: author.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url,
    siteName: author.name,
    title: siteName,
    description,
    images: [
      {
        url: author.portrait,
        width: 1254,
        height: 1254,
        alt: `${author.fullName}, ${author.title}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
    images: [author.portrait],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0f1e38",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${url}/#person`,
      name: author.fullName,
      alternateName: author.name,
      jobTitle: author.title,
      description:
        "Urdu poet and writer. Associate Professor of English at Govt. Graduate College Burewala, Higher Education Department, Government of the Punjab, Pakistan.",
      url: `${url}/`,
      image: `${url}${author.portrait}`,
      knowsAbout: [
        "Urdu poetry",
        "Ghazal",
        "Nazm",
        "Literary criticism",
        "Urdu literature",
        "Teaching",
      ],
      worksFor: {
        "@type": "CollegeOrUniversity",
        name: author.affiliation.name,
        department: { "@type": "Organization", name: author.affiliation.department },
        parentOrganization: {
          "@type": "GovernmentOrganization",
          name: author.affiliation.parent,
        },
        url: author.affiliation.url,
      },
      mainEntityOfPage: { "@id": `${url}/#website` },
      ...(siteConfig.socials.length > 0
        ? { sameAs: siteConfig.socials.map((s) => s.url) }
        : {}),
    },
    {
      "@type": "WebSite",
      "@id": `${url}/#website`,
      name: author.name,
      url: `${url}/`,
      inLanguage: "en",
      publisher: { "@id": `${url}/#person` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${newsreader.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <SkipLink />
        <SiteHeader />
        <PageTransition>
          <main id="main-content" tabIndex={-1} className="outline-none">
            {children}
          </main>
        </PageTransition>
        <SiteFooter />
      </body>
    </html>
  );
}