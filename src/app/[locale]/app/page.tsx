import Link from "next/link";
import { getAppCopy } from "@/lib/app-copy";
import { getLocale } from "@/lib/i18n";
import { getViewer } from "@/lib/viewer";

export default async function Dashboard({params}:{params:Promise<{locale:string}>}){
  const locale=getLocale((await params).locale),c=getAppCopy(locale);const {client,profile}=await getViewer();if(!profile)return null;if(!profile.onboarding_completed_at)return <Onboarding locale={locale}/>;
  let cards:{label:string;value:number|string;href:string}[]=[];
  if(profile.role==="founder"){
    const {data:projects}=await client!.from("projects").select("id,visibility");const ids=(projects??[]).map(p=>p.id);
    const [interestResult,viewResult,threadResult]=ids.length?await Promise.all([client!.from("interests").select("*",{count:"exact",head:true}).in("project_id",ids),client!.from("profile_views").select("*",{count:"exact",head:true}).in("project_id",ids),client!.from("chat_threads").select("*",{count:"exact",head:true}).in("project_id",ids).eq("status","open")]):[{count:0},{count:0},{count:0}];
    cards=[{label:c.projects,value:projects?.length??0,href:`/${locale}/app/projects`},{label:locale==="en"?"Profile views":"പ്രൊഫൈൽ കാഴ്ചകൾ",value:viewResult.count??0,href:`/${locale}/app/projects`},{label:c.interests,value:interestResult.count??0,href:`/${locale}/app/interests`},{label:locale==="en"?"Open chats":"തുറന്ന ചാറ്റുകൾ",value:threadResult.count??0,href:`/${locale}/app/chat`}];
  }else{
    const {data:usage}=await client!.from("quota_usage").select("profile_views,chats_opened").order("period_start",{ascending:false}).limit(1).maybeSingle();
    cards=[{label:locale==="en"?"Profiles viewed":"കണ്ട പ്രൊഫൈലുകൾ",value:usage?.profile_views??0,href:`/${locale}/app/discover`},{label:c.chat,value:usage?.chats_opened??0,href:`/${locale}/app/chat`}];
  }
  return <><div className="app-heading"><p className="eyebrow">{c.dashboard}</p><h1>{locale==="en"?`Welcome, ${profile.full_name||"builder"}`:`സ്വാഗതം, ${profile.full_name||"സംരംഭക"}`}</h1><p>{c.privateNote}</p></div><div className="metric-grid">{cards.map(x=><Link href={x.href} key={x.label}><strong>{x.value}</strong><span>{x.label}</span></Link>)}</div><section className="app-panel"><h2>{locale==="en"?"What’s next":"അടുത്തത് എന്ത്"}</h2><p>{profile.role==="investor"&&!profile.investor_tier?c.pending:locale==="en"?"Continue with your workspace using the navigation.":"നാവിഗേഷൻ ഉപയോഗിച്ച് നിങ്ങളുടെ വർക്ക്‌സ്‌പേസിൽ തുടരുക."}</p></section></>
}

function Onboarding({locale}:{locale:"en"|"ml"}){const c=getAppCopy(locale);return <form action={async(form)=>{"use server";const {completeOnboarding}=await import("./actions");await completeOnboarding(form)}} className="app-form app-panel"><p className="eyebrow">{c.onboarding}</p><h1>{c.onboarding}</h1><p>{locale==="en"?"Your role was assigned by your invitation and cannot be changed. Founders finish onboarding after saving their first project draft.":"നിങ്ങളുടെ റോൾ ക്ഷണത്തിലൂടെ നൽകിയതാണ്; മാറ്റാനാവില്ല. ആദ്യ പ്രോജക്റ്റ് ഡ്രാഫ്റ്റ് സേവ് ചെയ്താൽ സ്ഥാപക ഓൺബോർഡിംഗ് പൂർത്തിയാകും."}</p><input type="hidden" name="locale" value={locale}/><label>{locale==="en"?"Full name":"പൂർണ്ണനാമം"}<input name="fullName" required minLength={2}/></label><label className="choice"><input type="checkbox" name="consent" required/>{locale==="en"?"I accept the current Terms and Privacy Notice.":"നിലവിലെ നിബന്ധനകളും സ്വകാര്യതാ അറിയിപ്പും ഞാൻ അംഗീകരിക്കുന്നു."}</label><button className="button">{c.continue}</button></form>}
