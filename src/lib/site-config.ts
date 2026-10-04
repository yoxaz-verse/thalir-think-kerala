import type { Audience } from "./types";

const fallback = {
  siteUrl: "https://thalir.example.org",
  email: "hello@thinkkerala.org",
  instagram: "https://www.instagram.com/think_kerala2047/",
  facebook: "https://www.facebook.com/profile.php?id=100091605977633",
  youtube: "https://www.youtube.com/channel/UCy_t_YnGt43rRVrTjtLMiPw",
};

export const siteConfig = {
  name: "Thalir by Think Kerala",
  shortName: "Thalir",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallback.siteUrl,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || fallback.email,
  parentUrl: "https://www.thinkkerala.org/home",
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() || fallback.instagram,
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim() || fallback.facebook,
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL?.trim() || fallback.youtube,
  },
  analyticsEnabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true",
  contentApproved: process.env.NEXT_PUBLIC_CONTENT_APPROVED === "true",
  privacyCopyApproved: process.env.NEXT_PUBLIC_PRIVACY_COPY_APPROVED === "true",
  deploymentEnvironment: process.env.VERCEL_ENV ?? "development",
} as const;

export const isDraftDeployment = siteConfig.deploymentEnvironment !== "production" || !siteConfig.contentApproved;

const formEnv: Record<Audience, string | undefined> = {
  founder: process.env.NEXT_PUBLIC_FOUNDER_FORM_URL,
  investor: process.env.NEXT_PUBLIC_INVESTOR_FORM_URL,
  mentor: process.env.NEXT_PUBLIC_MENTOR_FORM_URL,
  institution: process.env.NEXT_PUBLIC_INSTITUTION_FORM_URL,
  partner: process.env.NEXT_PUBLIC_PARTNER_FORM_URL,
};

export function getJoinForm(role: Audience) {
  const url = formEnv[role]?.trim();
  return { url: isGoogleFormUrl(url) ? url : null, enabled: isGoogleFormUrl(url) };
}

export function isGoogleFormUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && (url.hostname === "forms.gle" || (url.hostname === "docs.google.com" && url.pathname.startsWith("/forms/")));
  } catch {
    return false;
  }
}
