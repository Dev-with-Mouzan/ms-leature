/**
 * Central site configuration.
 * ---------------------------------------------------------------
 * Edit this file to change author details, contact info and social links.
 *
 * SITE URL: read from NEXT_PUBLIC_SITE_URL so canonicals, OG tags, the
 * sitemap and every JSON-LD @id stay correct in production. Set it to the
 * real origin at deploy time; it falls back to localhost in dev.
 *
 * CONTACT EMAIL: read from NEXT_PUBLIC_CONTACT_EMAIL. The fallback below is a
 * placeholder — the contact form's mailto: target and every page footer use
 * it, so set a real address before launch.
 *
 * FACTS: the academic record below is taken from the college's own staff
 * directory (https://ggcb.edu.pk/pages/teaching-staff.php). Do not invent
 * degrees, awards or affiliations — cite what is verifiable.
 */

export type SocialPlatform =
  | "facebook"
  | "x"
  | "instagram"
  | "youtube"
  | "linkedin"
  | "whatsapp"
  | "email";

export type SocialLink = {
  platform: SocialPlatform;
  label: string;
  url: string;
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

if (!siteUrl) {
  // Canonicals, OG images, the sitemap and every JSON-LD @id are built from
  // this. Shipping without it silently points the whole site at localhost.
  console.warn(
    "[site] NEXT_PUBLIC_SITE_URL is not set — canonicals, Open Graph URLs and " +
      "the sitemap fall back to http://localhost:3000. Set it to the real " +
      "origin before deploying.",
  );
}

export const siteConfig = {
  url: siteUrl || "http://localhost:3000",

  author: {
    name: "Mujahid Sajjad",
    fullName: "Syed Mujahid Sajjad",
    title: "Associate Professor of English",
    portrait: "/images/author.png",
    affiliation: {
      name: "Govt. Graduate College Burewala",
      department: "Department of English",
      parent: "Higher Education Department, Government of the Punjab",
      address: "Multan Road, Burewala, District Vehari, Punjab, Pakistan",
      url: "https://ggcb.edu.pk/",
      directory: "https://ggcb.edu.pk/pages/teaching-staff.php",
    },
    credentials: "M.Phil",
    /** Year he joined the college, and the year he was promoted. */
    atCollegeSince: 2012,
    associateProfessorSince: 2022,
  },

  contact: {
    email:
      process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@mujahidsajjad.com",
    location: "Burewala, Punjab, Pakistan" as string | null,
  },

  /** Real profile URLs only. An empty array means NO icons are rendered. */
  socials: [
    {
      platform: "linkedin",
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/mujahid-sajjad-29696b376",
    },
  ] as SocialLink[],
};