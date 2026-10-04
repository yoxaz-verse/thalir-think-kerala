"use client";
import { useMemo, useState } from "react";
import { ContentCard } from "./content-card";
import type { ContentItem, ContentKind, Locale } from "@/lib/types";
import type { getDictionary } from "@/lib/i18n";

export function FilterGrid({ items, locale, dict, kinds }: { items: ContentItem[]; locale: Locale; dict: ReturnType<typeof getDictionary>; kinds: ContentKind[] }) {
  const [query, setQuery] = useState(""); const [kind, setKind] = useState("all");
  const shown = useMemo(() => items.filter(i => (kind === "all" || i.kind === kind) && `${i.title[locale]} ${i.summary[locale]} ${i.category[locale]}`.toLowerCase().includes(query.toLowerCase())), [items, kind, query, locale]);
  return <><div className="filters"><label><span>{dict.common.search}</span><input value={query} onChange={e => setQuery(e.target.value)} type="search" placeholder={locale === "en" ? "Search the ecosystem…" : "ആവാസവ്യവസ്ഥയിൽ തിരയുക…"}/></label><label><span>{dict.common.filter}</span><select value={kind} onChange={e => setKind(e.target.value)}><option value="all">{dict.common.all}</option>{kinds.map(k => <option key={k} value={k}>{kindLabel[k][locale]}</option>)}</select></label></div>{shown.length ? <div className="card-grid">{shown.map(item => <ContentCard key={item.slug} item={item} locale={locale}/>)}</div> : <div className="empty"><p>{dict.common.noResults}</p><button className="text-link" onClick={() => {setQuery(""); setKind("all")}}>{dict.common.clear}</button></div>}</>;
}
const kindLabel: Record<ContentKind, Record<Locale,string>> = { program: {en:"Programs",ml:"പരിപാടികൾ"}, opportunity:{en:"Opportunities",ml:"അവസരങ്ങൾ"}, event:{en:"Events",ml:"ഇവന്റുകൾ"}, story:{en:"Stories",ml:"കഥകൾ"}, organization:{en:"Organizations",ml:"സ്ഥാപനങ്ങൾ"} };
