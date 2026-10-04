export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  secretKey: process.env.SUPABASE_SECRET_KEY?.trim() ?? "",
  redirectOrigin: process.env.SUPABASE_AUTH_REDIRECT_ORIGIN?.trim() ?? process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "http://localhost:3000",
  invitationExpiryHours: Number(process.env.THALIR_INVITATION_EXPIRY_HOURS ?? 168),
  maxUploadBytes: Number(process.env.THALIR_MAX_UPLOAD_BYTES ?? 20_971_520),
  emailNotificationsEnabled: process.env.THALIR_EMAIL_NOTIFICATIONS_ENABLED === "true",
  attachmentsEnabled: process.env.THALIR_ATTACHMENTS_ENABLED === "true",
  adminMfaRequired: process.env.THALIR_ADMIN_MFA_REQUIRED !== "false",
  appEnvironment: process.env.NEXT_PUBLIC_APP_ENV?.trim() || "development",
  expectedProjectRef: process.env.SUPABASE_EXPECTED_PROJECT_REF?.trim() || "",
  opswatApiKey: process.env.OPSWAT_API_KEY?.trim() || "",
  scanMaxAttempts: Number(process.env.THALIR_SCAN_MAX_ATTEMPTS ?? 8),
  scanPollSeconds: Number(process.env.THALIR_SCAN_POLL_SECONDS ?? 30),
  messageEditMinutes: Number(process.env.THALIR_MESSAGE_EDIT_MINUTES ?? 15),
  termsVersion: process.env.THALIR_TERMS_VERSION?.trim() || "pilot-1",
  privacyVersion: process.env.THALIR_PRIVACY_VERSION?.trim() || "pilot-1",
  healthToken: process.env.THALIR_HEALTH_TOKEN?.trim() || "",
} as const;

export const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.publishableKey);

export function getSupabaseProjectRef(url = supabaseConfig.url) {
  if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) return "local";
  try { return new URL(url).hostname.split(".")[0] ?? ""; } catch { return ""; }
}

export function validateSupabaseEnvironment() {
  const errors:string[]=[];
  const actual=getSupabaseProjectRef();
  if (supabaseConfig.expectedProjectRef && actual !== supabaseConfig.expectedProjectRef) errors.push(`Supabase project mismatch: expected ${supabaseConfig.expectedProjectRef}, received ${actual || "invalid URL"}`);
  if (["preview","production"].includes(supabaseConfig.appEnvironment) && !supabaseConfig.expectedProjectRef) errors.push("SUPABASE_EXPECTED_PROJECT_REF is required outside development");
  if (supabaseConfig.attachmentsEnabled && !supabaseConfig.opswatApiKey) errors.push("OPSWAT_API_KEY is required when attachments are enabled");
  if (!Number.isFinite(supabaseConfig.maxUploadBytes) || supabaseConfig.maxUploadBytes<=0 || supabaseConfig.maxUploadBytes>20_971_520) errors.push("THALIR_MAX_UPLOAD_BYTES must be between 1 and 20 MB");
  return errors;
}
