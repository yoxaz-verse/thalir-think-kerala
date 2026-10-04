export const locales = ["en", "ml"] as const;
export type Locale = (typeof locales)[number];
export type Localized = Record<Locale, string>;

export type ContentKind = "program" | "opportunity" | "event" | "story" | "organization";
export type Audience = "founder" | "investor" | "mentor" | "institution" | "partner";

export interface ContentItem {
  slug: string;
  kind: ContentKind;
  title: Localized;
  summary: Localized;
  body: Localized;
  category: Localized;
  audience: Audience[];
  date?: string;
  location?: Localized;
  featured?: boolean;
}

export interface Dictionary {
  skip: string;
  nav: Record<string, string>;
  common: Record<string, string>;
  home: Record<string, string>;
  footer: Record<string, string>;
}
