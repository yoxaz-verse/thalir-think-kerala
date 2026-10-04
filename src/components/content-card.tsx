import Link from "next/link";
import { Arrow } from "./icons";
import { formatDate } from "@/lib/content";
import type { ContentItem, Locale } from "@/lib/types";

const routeFor = (kind: ContentItem["kind"]) => kind === "story" ? "stories" : kind === "event" ? "events" : kind === "organization" ? "ecosystem" : "opportunities";
export function ContentCard({ item, locale }: { item: ContentItem; locale: Locale }) {
  return <article className="content-card"><div className="card-meta"><span>{item.category[locale]}</span>{item.date && <time dateTime={item.date}>{formatDate(item.date, locale)}</time>}</div><h3>{item.title[locale]}</h3><p>{item.summary[locale]}</p>{item.location && <span className="location">⌖ {item.location[locale]}</span>}<Link className="text-link" href={`/${locale}/${routeFor(item.kind)}/${item.slug}`} aria-label={`${item.title[locale]} — read more`}>{locale === "en" ? "Discover" : "കണ്ടെത്തുക"}<Arrow/></Link></article>;
}
