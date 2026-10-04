import { isDraftDeployment } from "@/lib/site-config";
import type { Locale } from "@/lib/types";

export function DraftBanner({ locale }: { locale: Locale }) {
  if (!isDraftDeployment) return null;
  return <aside className="draft-banner" role="status"><div className="shell"><strong>{locale === "en" ? "Preview — draft content" : "പ്രിവ്യൂ — കരട് ഉള്ളടക്കം"}</strong><span>{locale === "en" ? "Details, dates and application links require owner approval before launch." : "ലോഞ്ചിന് മുമ്പ് വിവരങ്ങൾ, തീയതികൾ, അപേക്ഷാ ലിങ്കുകൾ എന്നിവയ്ക്ക് ഉടമയുടെ അംഗീകാരം ആവശ്യമാണ്."}</span></div></aside>;
}
