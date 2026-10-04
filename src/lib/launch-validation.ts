import type { ContentItem } from "./types";

const roles = ["MENTOR", "INSTITUTION", "PARTNER"] as const;
const placeholderText = /\b(sample|demonstration|replace it|before launch)\b/i;
const googleForm = /^https:\/\/(forms\.gle\/|docs\.google\.com\/forms\/)/;

export function validateProduction(env: Record<string, string | undefined>, items: ContentItem[], now = new Date()): string[] {
  const errors: string[] = [];
  const requireCondition = (condition: boolean, message: string) => { if (!condition) errors.push(message); };
  let canonical: URL | null = null;
  try { canonical = new URL(env.NEXT_PUBLIC_SITE_URL ?? ""); } catch { errors.push("NEXT_PUBLIC_SITE_URL must be a valid URL."); }
  requireCondition(Boolean(canonical && canonical.protocol === "https:"), "NEXT_PUBLIC_SITE_URL must use HTTPS.");
  requireCondition(!((env.NEXT_PUBLIC_SITE_URL ?? "").includes("example.org")), "Replace the placeholder canonical domain.");
  requireCondition(Boolean(env.NEXT_PUBLIC_CONTACT_EMAIL && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(env.NEXT_PUBLIC_CONTACT_EMAIL)), "NEXT_PUBLIC_CONTACT_EMAIL must be explicitly configured and valid.");
  requireCondition(env.NEXT_PUBLIC_CONTENT_APPROVED === "true", "Set NEXT_PUBLIC_CONTENT_APPROVED=true only after editorial approval.");
  requireCondition(env.NEXT_PUBLIC_PRIVACY_COPY_APPROVED === "true", "Set NEXT_PUBLIC_PRIVACY_COPY_APPROVED=true only after legal/privacy approval.");
  try { requireCondition(new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "").protocol === "https:", "NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS project URL."); }
  catch { errors.push("NEXT_PUBLIC_SUPABASE_URL must be explicitly configured."); }
  requireCondition(Boolean(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY), "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be configured.");
  requireCondition(Boolean(env.SUPABASE_SECRET_KEY), "SUPABASE_SECRET_KEY must be configured server-side.");
  requireCondition(Boolean(env.SUPABASE_DB_URL), "SUPABASE_DB_URL must be configured for migrations.");
  requireCondition(env.THALIR_EMAIL_NOTIFICATIONS_ENABLED === "true", "Enable transactional notifications for the production pilot.");
  requireCondition(Boolean(env.RESEND_API_KEY), "RESEND_API_KEY must be configured server-side.");
  requireCondition(Boolean(env.RESEND_FROM_EMAIL && /@/.test(env.RESEND_FROM_EMAIL)), "RESEND_FROM_EMAIL must be an approved sender.");
  for (const key of ["NEXT_PUBLIC_INSTAGRAM_URL", "NEXT_PUBLIC_FACEBOOK_URL", "NEXT_PUBLIC_YOUTUBE_URL"] as const) {
    try { requireCondition(new URL(env[key] ?? "").protocol === "https:", `${key} must use HTTPS.`); }
    catch { errors.push(`${key} must be explicitly configured and valid.`); }
  }
  for (const role of roles) requireCondition(googleForm.test(env[`NEXT_PUBLIC_${role}_FORM_URL`] ?? ""), `Configure a valid Google Form URL for ${role.toLowerCase()}.`);
  for (const item of items) {
    requireCondition(!placeholderText.test([item.title.en, item.summary.en, item.body.en].join(" ")), `Content “${item.slug}” still contains sample/launch placeholder language.`);
    if (item.kind === "event" && item.date) requireCondition(new Date(`${item.date}T23:59:59+05:30`) > now, `Event “${item.slug}” is expired.`);
  }
  return errors;
}
