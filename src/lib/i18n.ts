import { notFound } from "next/navigation";
import { locales, type Dictionary, type Locale } from "./types";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocale(value: string): Locale {
  if (!isLocale(value)) notFound();
  return value;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "ml" : "en";
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    skip: "Skip to content",
    nav: { home: "Home", about: "About", ecosystem: "Ecosystem", opportunities: "Opportunities", events: "Events", stories: "Stories", brand: "Brand book", join: "Join Thalir" },
    common: { explore: "Explore", learnMore: "Learn more", viewAll: "View all", readStory: "Read story", search: "Search", filter: "Filter by type", all: "All", noResults: "No matches yet. Try another search or filter.", back: "Back", date: "Date", location: "Location", for: "For", join: "Join the ecosystem", external: "Opens an external Google Form", comingSoon: "Form coming soon", clear: "Clear filters" },
    home: { eyebrow: "Kerala's independent startup ecosystem", title: "Where bold ideas take root.", intro: "Thalir brings founders, investors, mentors, institutions and communities together to build ventures with lasting value.", primary: "Find your place", secondary: "Explore opportunities", network: "One ecosystem. Many ways to grow.", networkBody: "Practical connections for every stage—from a first question to patient capital and meaningful scale.", featured: "Open doors", featuredBody: "Programs, funding pathways and gatherings curated for Kerala's builders.", stories: "Ideas taking root", storiesBody: "Field notes and honest stories from people building change.", manifesto: "Rooted here. Open to the world.", manifestoBody: "Thalir is a common ground for ambitious, responsible entrepreneurship—politically neutral, socially aware and designed around trust." },
    footer: { line: "Rooted in Kerala. Growing possibilities.", note: "An initiative by Think Kerala", rights: "Thalir by Think Kerala" }
  },
  ml: {
    skip: "ഉള്ളടക്കത്തിലേക്ക് പോകുക",
    nav: { home: "ഹോം", about: "ഞങ്ങളെക്കുറിച്ച്", ecosystem: "ആവാസവ്യവസ്ഥ", opportunities: "അവസരങ്ങൾ", events: "പരിപാടികൾ", stories: "കഥകൾ", brand: "ബ്രാൻഡ് ബുക്ക്", join: "തളിരിനൊപ്പം ചേരുക" },
    common: { explore: "കണ്ടെത്തുക", learnMore: "കൂടുതലറിയുക", viewAll: "എല്ലാം കാണുക", readStory: "കഥ വായിക്കുക", search: "തിരയുക", filter: "തരം അനുസരിച്ച്", all: "എല്ലാം", noResults: "ഫലങ്ങളൊന്നുമില്ല. മറ്റൊരു തിരയൽ പരീക്ഷിക്കുക.", back: "തിരികെ", date: "തീയതി", location: "സ്ഥലം", for: "ആർക്കായി", join: "ആവാസവ്യവസ്ഥയിൽ ചേരുക", external: "ഒരു ബാഹ്യ Google Form തുറക്കും", comingSoon: "ഫോം ഉടൻ ലഭ്യമാകും", clear: "ഫിൽട്ടറുകൾ നീക്കുക" },
    home: { eyebrow: "കേരളത്തിന്റെ സ്വതന്ത്ര സ്റ്റാർട്ടപ്പ് ആവാസവ്യവസ്ഥ", title: "ധീരമായ ആശയങ്ങൾ വേരുറപ്പിക്കുന്നിടം.", intro: "സ്ഥായിയായ മൂല്യമുള്ള സംരംഭങ്ങൾ സൃഷ്ടിക്കാൻ സ്ഥാപകർ, നിക്ഷേപകർ, മാർഗദർശകർ, സ്ഥാപനങ്ങൾ, സമൂഹങ്ങൾ എന്നിവരെ തളിർ ഒരുമിപ്പിക്കുന്നു.", primary: "നിങ്ങളുടെ ഇടം കണ്ടെത്തുക", secondary: "അവസരങ്ങൾ കാണുക", network: "ഒരൊറ്റ ആവാസവ്യവസ്ഥ. വളരാൻ നിരവധി വഴികൾ.", networkBody: "ആദ്യ ചോദ്യത്തിൽ നിന്ന് ക്ഷമയുള്ള മൂലധനത്തിലേക്കും അർത്ഥവത്തായ വളർച്ചയിലേക്കും പ്രായോഗിക ബന്ധങ്ങൾ.", featured: "തുറന്ന വാതിലുകൾ", featuredBody: "കേരളത്തിലെ സംരംഭകർക്കായി തിരഞ്ഞെടുത്ത പരിപാടികൾ, ധനസഹായ മാർഗങ്ങൾ, കൂടിച്ചേരലുകൾ.", stories: "വേരുറപ്പിക്കുന്ന ആശയങ്ങൾ", storiesBody: "മാറ്റം സൃഷ്ടിക്കുന്നവരുടെ അനുഭവങ്ങളും സത്യസന്ധമായ കഥകളും.", manifesto: "വേരുകൾ ഇവിടെ. ലോകത്തേക്ക് തുറന്നത്.", manifestoBody: "രാഷ്ട്രീയമായി നിഷ്പക്ഷവും സാമൂഹികമായി ബോധമുള്ളതും വിശ്വാസത്തെ അടിസ്ഥാനമാക്കിയതുമായ ഉത്തരവാദിത്ത സംരംഭകത്വത്തിന്റെ പൊതുവേദിയാണ് തളിർ." },
    footer: { line: "കേരളത്തിൽ വേരൂന്നി. സാധ്യതകളിലേക്ക് വളരുന്നു.", note: "തിങ്ക് കേരളയുടെ സംരംഭം", rights: "തളിർ — തിങ്ക് കേരള" }
  }
};

export function getDictionary(locale: Locale) { return dictionaries[locale]; }

export function localize<T extends { title: Record<Locale, string>; summary: Record<Locale, string> }>(item: T, locale: Locale) {
  return { ...item, displayTitle: item.title[locale], displaySummary: item.summary[locale] };
}
