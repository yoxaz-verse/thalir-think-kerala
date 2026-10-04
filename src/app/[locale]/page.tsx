import Link from "next/link";
import { Arrow, Leaf, RoleIcon } from "@/components/icons";
import { Mark } from "@/components/logo";
import { ContentCard } from "@/components/content-card";
import { roles } from "@/lib/content";
import { getPublishedContent } from "@/lib/content-repository";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const locale = getLocale((await params).locale);
  const d = getDictionary(locale);
  const content = await getPublishedContent();
  const featured = content.filter((i) => i.featured);
  const stories = content.filter((i) => i.kind === "story");

  return (
    <main id="main">
      {/* Hero Section */}
      <section className="hero">
        <Leaf n={1} />
        <Leaf n={2} />

        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{d.home.eyebrow}</p>
            <h1>{d.home.title}</h1>
            <p className="lede">{d.home.intro}</p>

            <div className="actions">
              <Link className="button" href={`/${locale}/join`}>
                {d.home.primary}
                <Arrow />
              </Link>
              <Link className="button button--ghost" href={`/${locale}/opportunities`}>
                {d.home.secondary}
              </Link>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="sun" />
            <Mark />
            <span className="coast coast--one" />
            <span className="coast coast--two" />
            <p>
              THALIR / 01<br />
              KERALA / INDIA
            </p>
          </div>
        </div>

        <div className="ticker" aria-hidden="true">
          <span>Ideas • People • Capital • Community • ആശയങ്ങൾ • ആളുകൾ • മൂലധനം • സമൂഹം • </span>
          <span>Ideas • People • Capital • Community • ആശയങ്ങൾ • ആളുകൾ • മൂലധനം • സമൂഹം • </span>
          <span>Ideas • People • Capital • Community • ആശയങ്ങൾ • ആളുകൾ • മൂലധനം • സമൂഹം • </span>
        </div>
      </section>

      {/* Role Grid Section */}
      <section className="section shell">
        <div className="section-heading">
          <p className="eyebrow">{locale === "en" ? "Find your path" : "നിങ്ങളുടെ വഴി"}</p>
          <h2>{d.home.network}</h2>
          <p>{d.home.networkBody}</p>
        </div>

        <div className="role-grid">
          {roles.map((r, i) => (
            <Link key={r.slug} href={`/${locale}/roles/${r.slug}`}>
              <div className="role-header">
                <RoleIcon role={r.slug} />
                <span>0{i + 1}</span>
              </div>
              <h3>{r.title[locale]}</h3>
              <p>{r.summary[locale]}</p>
              <Arrow />
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Section */}
      <section className="section section--sand">
        <div className="shell">
          <div className="section-heading row">
            <div>
              <p className="eyebrow">{locale === "en" ? "Curated now" : "ഇപ്പോൾ തിരഞ്ഞെടുത്തത്"}</p>
              <h2>{d.home.featured}</h2>
            </div>
            <p>{d.home.featuredBody}</p>
          </div>

          <div className="card-grid">
            {featured.map((item) => (
              <ContentCard key={item.slug} item={item} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto Band */}
      <section className="manifesto">
        <div className="shell manifesto-grid">
          <p className="eyebrow">Think Kerala × Thalir</p>
          <div>
            <h2>{d.home.manifesto}</h2>
            <p>{d.home.manifestoBody}</p>
            <Link className="text-link text-link--light" href={`/${locale}/about`}>
              {d.common.learnMore}
              <Arrow />
            </Link>
          </div>
        </div>
      </section>

      {/* Journal / Stories Section */}
      <section className="section shell">
        <div className="section-heading row">
          <div>
            <p className="eyebrow">Journal</p>
            <h2>{d.home.stories}</h2>
          </div>
          <p>{d.home.storiesBody}</p>
        </div>

        <div className="card-grid">
          {stories.map((item) => (
            <ContentCard key={item.slug} item={item} locale={locale} />
          ))}
        </div>
      </section>

      {/* Join Band CTA */}
      <section className="join-band">
        <div className="shell">
          <Mark />
          <div>
            <p className="eyebrow">
              {locale === "en" ? "The ecosystem needs you" : "ആവാസവ്യവസ്ഥയ്ക്ക് നിങ്ങളെ വേണം"}
            </p>
            <h2>
              {locale === "en"
                ? "Bring what you know. Find what you need."
                : "അറിവ് പങ്കിടൂ. ആവശ്യമുള്ളത് കണ്ടെത്തൂ."}
            </h2>
          </div>
          <Link className="button button--sun" href={`/${locale}/join`}>
            {d.nav.join}
            <Arrow />
          </Link>
        </div>
      </section>
    </main>
  );
}
