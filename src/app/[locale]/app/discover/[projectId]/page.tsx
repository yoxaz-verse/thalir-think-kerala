import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppCopy } from "@/lib/app-copy";
import { getLocale } from "@/lib/i18n";
import { getViewer } from "@/lib/viewer";
import { expressInterest } from "../../actions";

export default async function DiscoveryProfile({params}:{params:Promise<{locale:string;projectId:string}>}){
  const p=await params,locale=getLocale(p.locale),c=getAppCopy(locale);const {client,profile}=await getViewer();
  if(!client||profile?.role!=="investor")notFound();
  const {data:usage,error:quotaError}=await client.rpc("consume_project_view",{target_project:p.projectId});const result=usage?.[0];
  if(quotaError||!result?.allowed)return <><div className="app-heading"><p className="eyebrow">{c.discover}</p><h1>{locale==="en"?"Monthly profile limit reached":"മാസത്തെ പ്രൊഫൈൽ പരിധി കഴിഞ്ഞു"}</h1><p>{locale==="en"?"Ask an administrator to review your pilot plan or return when the quota resets.":"പൈലറ്റ് പ്ലാൻ പരിശോധിക്കാൻ അഡ്മിനോട് ആവശ്യപ്പെടുക, അല്ലെങ്കിൽ പരിധി പുതുക്കിയ ശേഷം മടങ്ങിവരിക."}</p></div><Link className="button button--ghost" href={`/${locale}/app/discover`}>{locale==="en"?"Back to discovery":"തിരച്ചിലിലേക്ക് മടങ്ങുക"}</Link></>;
  const {data:project}=await client.from("projects").select("id,name,problem,affected_audience,motivation,sector,stage,team_size,location,public_pitch").eq("id",p.projectId).single();if(!project)notFound();
  return <><div className="app-heading"><p className="eyebrow">{project.sector} · {project.stage}</p><h1>{project.public_pitch}</h1><p>{locale==="en"?`${result.remaining} profile views remain this month.`:`ഈ മാസം ${result.remaining} പ്രൊഫൈൽ കാഴ്ചകൾ ശേഷിക്കുന്നു.`}</p></div><section className="app-panel legal-prose"><h2>{locale==="en"?"The problem":"പ്രശ്നം"}</h2><p>{project.problem}</p><h2>{locale==="en"?"Who feels it":"ആർക്കാണ് അനുഭവപ്പെടുന്നത്"}</h2><p>{project.affected_audience}</p><h2>{locale==="en"?"Founder motivation":"സ്ഥാപക പ്രചോദനം"}</h2><p>{project.motivation}</p><p>{project.location} · {project.team_size} {locale==="en"?"people":"അംഗങ്ങൾ"}</p><p className="legal-note">{c.privateNote}</p><form action={expressInterest} className="app-form"><input type="hidden" name="locale" value={locale}/><input type="hidden" name="projectId" value={project.id}/><label>{locale==="en"?"Optional note":"ഐച്ഛിക കുറിപ്പ്"}<textarea name="note" maxLength={1000}/></label><button className="button">{locale==="en"?"Request an introduction":"പരിചയപ്പെടുത്തൽ അഭ്യർത്ഥിക്കുക"}</button></form></section></>
}
