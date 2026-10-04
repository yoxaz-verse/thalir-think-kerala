export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  secretKey: process.env.SUPABASE_SECRET_KEY?.trim() ?? "",
  redirectOrigin: process.env.SUPABASE_AUTH_REDIRECT_ORIGIN?.trim() ?? process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "http://localhost:3000",
  invitationExpiryHours: Number(process.env.THALIR_INVITATION_EXPIRY_HOURS ?? 168),
  maxUploadBytes: Number(process.env.THALIR_MAX_UPLOAD_BYTES ?? 20_971_520),
  emailNotificationsEnabled: process.env.THALIR_EMAIL_NOTIFICATIONS_ENABLED === "true",
} as const;

export const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.publishableKey);
