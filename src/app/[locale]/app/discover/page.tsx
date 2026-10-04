import Link from "next/link";
import { getAppCopy } from "@/lib/app-copy";
import { getLocale } from "@/lib/i18n";
import { getViewer } from "@/lib/viewer";

export default async function Discover({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const locale=getLocale((await params).locale),c=getAppCopy(locale),query=await searchParams;
  const {client,profile}=await getViewer();
  if(!client||profile?.role!=="investor")return <p className="app-alert">{locale==="en"?"Investor account required.":"നിക്ഷേപക അക്കൗണ്ട് ആവശ്യമാണ്."}</p>;
  let request=client.from("projects").select("id,public_pitch,sector,stage,location").eq("visibility","discovery");
  if(query.sector)request=request.eq("sector",query.sector);if(query.stage)request=request.eq("stage",query.stage as "idea");if(query.location)request=request.ilike("location",`%${query.location}%`);
  const {data:projects}=await request.order("published_at",{ascending:false});
  return <><div className="app-heading"><p className="eyebrow">{c.discover}</p><h1>{locale==="en"?"Ideas worth meeting":"പരിചയപ്പെടേണ്ട ആശയങ്ങൾ"}</h1><p>{c.privateNote}</p></div><form className="discovery-filters"><input name="sector" defaultValue={query.sector} placeholder={locale==="en"?"Sector":"മേഖല"}/><select name="stage" defaultValue={query.stage}><option value="">{locale==="en"?"All stages":"എല്ലാ ഘട്ടങ്ങളും"}</option><option value="idea">Idea</option><option value="prototype">Prototype</option><option value="early_users">Early users</option><option value="revenue">Revenue</option><option value="scaling">Scaling</option></select><input name="location" defaultValue={query.location} placeholder={locale==="en"?"Location":"സ്ഥലം"}/><button className="button button--small">{locale==="en"?"Filter":"ഫിൽട്ടർ"}</button></form><div className="workspace-grid">{projects?.length?projects.map(project=><article className="app-panel" key={project.id}><div className="card-meta"><span>{project.sector}</span><span>{project.stage}</span></div><h2>{project.public_pitch}</h2><small>{project.location}</small><Link className="button button--small" href={`/${locale}/app/discover/${project.id}`}>{locale==="en"?"Open profile":"പ്രൊഫൈൽ തുറക്കുക"}</Link></article>):<p className="app-empty">{c.noResults}</p>}</div></>
}
