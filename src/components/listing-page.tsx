import { PageHero } from "./page-hero";
import { FilterGrid } from "./filter-grid";
import type { ContentItem, ContentKind, Locale } from "@/lib/types";
import type { getDictionary } from "@/lib/i18n";
export function ListingPage({ locale, dict, eyebrow, title, intro, items, kinds }: { locale:Locale; dict:ReturnType<typeof getDictionary>; eyebrow:string; title:string; intro:string; items:ContentItem[]; kinds:ContentKind[] }) { return <main id="main"><PageHero eyebrow={eyebrow} title={title} intro={intro}/><section className="section shell"><FilterGrid items={items} locale={locale} dict={dict} kinds={kinds}/></section></main>; }
