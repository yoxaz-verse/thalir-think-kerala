import type { Audience } from "./types";

export const siteConfig = {
  name: "Thalir by Think Kerala",
  shortName: "Thalir",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://thalir.example.org",
  email: "hello@thinkkerala.org",
  parentUrl: "https://www.thinkkerala.org/home",
  social: { instagram: "https://www.instagram.com/think_kerala2047/", facebook: "https://www.facebook.com/profile.php?id=100091605977633", youtube: "https://www.youtube.com/channel/UCy_t_YnGt43rRVrTjtLMiPw" }
} as const;

const formEnv: Record<Audience, string | undefined> = {
  founder: process.env.NEXT_PUBLIC_FOUNDER_FORM_URL,
  investor: process.env.NEXT_PUBLIC_INVESTOR_FORM_URL,
  mentor: process.env.NEXT_PUBLIC_MENTOR_FORM_URL,
  institution: process.env.NEXT_PUBLIC_INSTITUTION_FORM_URL,
  partner: process.env.NEXT_PUBLIC_PARTNER_FORM_URL,
};

export function getJoinForm(role: Audience) {
  const url = formEnv[role]?.trim();
  const isGoogleForm = Boolean(url && /^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//.test(url));
  return { url: isGoogleForm ? url! : null, enabled: isGoogleForm };
}
