import Link from "next/link";
import { getAppCopy } from "@/lib/app-copy";
import type { UserRole } from "@/lib/database.types";
import type { Locale } from "@/lib/types";
import { signOut } from "@/app/[locale]/auth/actions";

export function AppNav({locale,role}:{locale:Locale;role:UserRole|null}){const c=getAppCopy(locale);const links=[["",c.dashboard],["projects",c.projects],...[role==="investor"?["discover",c.discover]:["interests",c.interests]],["chat",c.chat],["notifications",c.notifications],["settings",c.settings]];return <aside className="app-sidebar"><p className="eyebrow">{c.app}</p><nav aria-label={c.app}>{links.map(([path,label])=><Link key={path} href={`/${locale}/app${path?`/${path}`:""}`}>{label}</Link>)}{role==="admin"&&<Link href={`/${locale}/admin`}>{c.admin}</Link>}</nav><form action={signOut}><input type="hidden" name="locale" value={locale}/><button className="text-link">{c.signOut}</button></form></aside>}
