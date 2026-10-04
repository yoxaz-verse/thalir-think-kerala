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
  requireCondition(env.NEXT_PUBLIC_APP_ENV === "production", "NEXT_PUBLIC_APP_ENV must be production.");
  requireCondition(Boolean(env.SUPABASE_EXPECTED_PROJECT_REF), "SUPABASE_EXPECTED_PROJECT_REF must identify the production project.");
  const actualRef=(env.NEXT_PUBLIC_SUPABASE_URL??"").match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  requireCondition(Boolean(actualRef && actualRef===env.SUPABASE_EXPECTED_PROJECT_REF), "Supabase URL does not match the approved production project reference.");
  requireCondition(Boolean(env.SUPABASE_AUTH_REDIRECT_ORIGIN && env.SUPABASE_AUTH_REDIRECT_ORIGIN===env.NEXT_PUBLIC_SITE_URL), "Production Auth redirect origin must equal the canonical site URL.");
  requireCondition(env.THALIR_ADMIN_MFA_REQUIRED !== "false", "Administrator MFA enforcement must remain enabled.");
  requireCondition(Boolean(env.THALIR_HEALTH_TOKEN), "THALIR_HEALTH_TOKEN must be configured.");
  requireCondition(Boolean(env.NOTIFICATION_FUNCTION_SECRET), "NOTIFICATION_FUNCTION_SECRET must be configured.");
  requireCondition(Boolean(env.WORKER_FUNCTION_SECRET), "WORKER_FUNCTION_SECRET must be configured.");
  requireCondition(env.THALIR_EMAIL_NOTIFICATIONS_ENABLED === "true", "Enable transactional notifications for the production pilot.");
  requireCondition(Boolean(env.RESEND_API_KEY), "RESEND_API_KEY must be configured server-side.");
  requireCondition(Boolean(env.RESEND_FROM_EMAIL && /@/.test(env.RESEND_FROM_EMAIL)), "RESEND_FROM_EMAIL must be an approved sender.");
  if(env.THALIR_ATTACHMENTS_ENABLED==="true") {
    requireCondition(Boolean(env.OPSWAT_API_KEY), "OPSWAT_API_KEY is required when attachments are enabled.");
    requireCondition(env.NEXT_PUBLIC_PRIVACY_COPY_APPROVED==="true", "Attachment scanning requires approved subprocesser disclosure.");
  }
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
