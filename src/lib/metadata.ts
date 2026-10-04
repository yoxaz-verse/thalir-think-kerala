import type { Metadata } from "next";
import type { Locale } from "./types";
import { siteConfig } from "./site-config";

export function localizedMetadata(locale: Locale, path: string, title?: string, description?: string): Metadata {
  const normalized = path ? `/${path.replace(/^\//, "")}` : "";
  const localizedPath = `/${locale}${normalized}`;
  const other = locale === "en" ? "ml" : "en";
  const alternatePath = `/${other}${normalized}`;
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: localizedPath, languages: { [locale]: localizedPath, [other]: alternatePath, "x-default": `/en${normalized}` } },
    openGraph: { url: localizedPath, title: title ?? siteConfig.name, description, locale: locale === "ml" ? "ml_IN" : "en_IN", alternateLocale: [locale === "ml" ? "en_IN" : "ml_IN"] },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    logo: `${siteConfig.siteUrl}/icon.svg`,
    email: siteConfig.email,
    parentOrganization: { "@type": "Organization", name: "Think Kerala", url: siteConfig.parentUrl },
    sameAs: Object.values(siteConfig.social),
  };
}
