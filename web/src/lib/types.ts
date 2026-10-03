/**
 * Types mirroring the FastAPI schemas. The wire format is camelCase because
 * Pydantic serialises by alias, so nothing has to be renamed on arrival.
 */

export type BookCategory = "poetry" | "criticism" | "essays" | "research" | "other";

export const CATEGORIES: BookCategory[] = [
  "poetry",
  "criticism",
  "essays",
  "research",
  "other",
];

export const categoryLabels: Record<BookCategory, string> = {
  poetry: "Poetry",
  criticism: "Criticism",
  essays: "Essays",
  research: "Research",
  other: "Literature",
};

export type Book = {
  slug: string;
  title: string;
  description: string;
  coverImage: string | null;
  pdfUrl: string;
  category: BookCategory;
  author: string;
  publishedYear: number | null;
  pages: number | null;
  publication: string | null;
  sortOrder: number;
  /** Null for a row written before the column existed. */
  createdAt: string | null;
};

/** What a verse is: the same three choices the admin form offers. */
export const VERSE_TYPES = ["Ghazal", "Nazm", "Poem"] as const;

export type VerseType = (typeof VERSE_TYPES)[number];

export type Poem = {
  slug: string;
  title: string;
  body: string;
  /** Null only for a verse saved before the field existed. */
  type: VerseType | null;
  createdAt: string;
};

export type Review = {
  id: number;
  bookSlug: string;
  bookTitle: string;
  name: string;
  body: string;
  isApproved: boolean;
};

/** Everything the book form can change. The slug is separate: it is the URL. */
export type BookInput = Omit<Book, "slug" | "createdAt"> & { slug?: string };
export type PoemInput = Omit<Poem, "slug" | "createdAt"> & { slug?: string };

export type ContactTopic = "general" | "permissions" | "press" | "technical";

export const CONTACT_TOPICS: { value: ContactTopic; label: string }[] = [
  { value: "general", label: "General enquiry" },
  { value: "permissions", label: "Permissions and reprints" },
  { value: "press", label: "Press and interview" },
  { value: "technical", label: "A problem with the site" },
];

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  /** Free text on the wire, so an older row can carry a topic the form no
      longer offers. Rendered through topicLabel, which falls back to itself. */
  topic: string;
  body: string;
  createdAt: string;
};

export const topicLabel = (topic: string) =>
  CONTACT_TOPICS.find((entry) => entry.value === topic)?.label ?? topic;