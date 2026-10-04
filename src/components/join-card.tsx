import Link from "next/link";
import { Arrow } from "./icons";
import { getJoinForm } from "@/lib/site-config";
import type { Audience, Locale } from "@/lib/types";
import type { getDictionary } from "@/lib/i18n";

export function JoinCard({ role, title, summary, locale, dict }: { role: Audience; title: string; summary: string; locale: Locale; dict: ReturnType<typeof getDictionary> }) {
  const form = getJoinForm(role);
  return <article className="join-card"><span className="role-number">0{["founder","investor","mentor","institution","partner"].indexOf(role)+1}</span><h2>{title}</h2><p>{summary}</p>{form.enabled ? <a className="text-link" href={form.url!} target="_blank" rel="noreferrer">{dict.common.join}<Arrow external/><small>{dict.common.external}</small></a> : <Link className="text-link" href={`/${locale}/roles/${role}`}>{locale === "en" ? "Explore this path" : "ഈ വഴി കണ്ടെത്തുക"}<Arrow/><small>{dict.common.comingSoon}</small></Link>}</article>;
}
