import type { MetadataRoute } from "next";
import { content, roles } from "@/lib/content";
import { siteConfig } from "@/lib/site-config";
import { locales } from "@/lib/types";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "about", "ecosystem", "opportunities", "events", "stories", "join", "contact", "brand", "privacy", "terms"];
  const pages = locales.flatMap((locale) => staticRoutes.map((route) => ({ url: `${siteConfig.siteUrl}/${locale}${route ? `/${route}` : ""}`, lastModified: new Date(), changeFrequency: "weekly" as const })));
  const details = locales.flatMap((locale) => content.map((item) => ({ url: `${siteConfig.siteUrl}/${locale}/${item.kind === "story" ? "stories" : item.kind === "event" ? "events" : item.kind === "organization" ? "ecosystem" : "opportunities"}/${item.slug}`, lastModified: item.date ? new Date(item.date) : new Date(), changeFrequency: "monthly" as const })));
  const rolePages = locales.flatMap((locale) => roles.map((role) => ({ url: `${siteConfig.siteUrl}/${locale}/roles/${role.slug}`, changeFrequency: "monthly" as const })));
  return [...pages, ...details, ...rolePages];
}
