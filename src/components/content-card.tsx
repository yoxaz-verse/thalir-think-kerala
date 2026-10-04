import Link from "next/link";
import { Arrow } from "./icons";
import { formatDate } from "@/lib/content";
import type { ContentItem, Locale } from "@/lib/types";

const routeFor = (kind: ContentItem["kind"]) =>
  kind === "story" ? "stories" : kind === "event" ? "events" : kind === "organization" ? "ecosystem" : "opportunities";

export function ContentCard({ item, locale }: { item: ContentItem; locale: Locale }) {
  return (
    <article className="content-card">
      <div className="card-meta">
        <span className="card-badge">{item.category[locale]}</span>
        {item.date && (
          <time dateTime={item.date}>
            {formatDate(item.date, locale)}
          </time>
        )}
      </div>

      <h3>{item.title[locale]}</h3>
      <p>{item.summary[locale]}</p>

      {item.location && (
        <span className="location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {item.location[locale]}
        </span>
      )}

      <Link
        className="text-link"
        href={`/${locale}/${routeFor(item.kind)}/${item.slug}`}
        aria-label={`${item.title[locale]} — read more`}
      >
        {locale === "en" ? "Discover" : "കണ്ടെത്തുക"}
        <Arrow />
      </Link>
    </article>
  );
}
