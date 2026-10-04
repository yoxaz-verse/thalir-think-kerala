export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type UserRole = "founder" | "investor" | "admin";
export type InvestorTier = "community_backer" | "venture_investor";
export type ProjectMemberRole = "owner" | "cofounder" | "viewer";
export type ProjectStage = "idea" | "prototype" | "early_users" | "revenue" | "scaling";
export type ProjectVisibility = "draft" | "discovery" | "hidden" | "deleted";
export type InterestStatus = "pending" | "approved" | "declined" | "withdrawn";
export type NotificationType = "invitation" | "interest" | "interest_approved" | "interest_declined" | "message" | "meeting" | "weekly_summary" | "system";

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      profiles: Table<{ id:string; email:string; full_name:string; avatar_path:string|null; locale:"en"|"ml"; role:UserRole|null; investor_tier:InvestorTier|null; onboarding_completed_at:string|null; email_summaries_enabled:boolean; deleted_at:string|null; created_at:string; updated_at:string }>;
      plans: Table<{ id:string; code:string; name_en:string; name_ml:string; role:UserRole; investor_tier:InvestorTier|null; profile_views_per_month:number; open_chats_per_month:number; active:boolean; created_at:string }>;
      entitlements: Table<{ id:string; user_id:string; plan_id:string; starts_at:string; ends_at:string|null; assigned_by:string|null; created_at:string }>;
      quota_usage: Table<{ user_id:string; period_start:string; profile_views:number; chats_opened:number }>;
      projects: Table<{ id:string; slug:string; name:string; problem:string; affected_audience:string; motivation:string; sector:string; stage:ProjectStage; team_size:number; location:string; public_pitch:string; visibility:ProjectVisibility; created_by:string; published_at:string|null; deleted_at:string|null; created_at:string; updated_at:string }>;
      project_members: Table<{ project_id:string; user_id:string; role:ProjectMemberRole; created_at:string }>;
      project_invitations: Table<{ id:string; project_id:string; email:string; role:ProjectMemberRole; token_hash:string; invited_by:string; expires_at:string; accepted_at:string|null; revoked_at:string|null; created_at:string }>;
      profile_views: Table<{ investor_id:string; project_id:string; period_start:string; viewed_at:string }>;
      interests: Table<{ id:string; project_id:string; investor_id:string; note:string|null; status:InterestStatus; decided_by:string|null; decided_at:string|null; created_at:string }>;
      chat_threads: Table<{ id:string; project_id:string; interest_id:string; status:"open"|"closed"; opened_at:string; closed_at:string|null }>;
      chat_participants: Table<{ thread_id:string; user_id:string; last_read_at:string|null; joined_at:string }>;
      messages: Table<{ id:string; thread_id:string; sender_id:string; body:string; created_at:string; edited_at:string|null; deleted_at:string|null }>;
      chat_attachments: Table<{ id:string; message_id:string; storage_path:string; file_name:string; content_type:string; byte_size:number; created_at:string }>;
      meeting_proposals: Table<{ id:string; thread_id:string; proposed_by:string; starts_at:string; note:string|null; status:string; created_at:string }>;
      notifications: Table<{ id:string; user_id:string; type:NotificationType; title_en:string; title_ml:string; body_en:string; body_ml:string; href:string|null; read_at:string|null; created_at:string }>;
      content_items: Table<{ id:string; slug:string; kind:"program"|"opportunity"|"event"|"story"|"organization"; status:"draft"|"published"|"archived"; title_en:string; title_ml:string; summary_en:string; summary_ml:string; body_en:string; body_ml:string; category_en:string; category_ml:string; audience:string[]; event_date:string|null; location_en:string|null; location_ml:string|null; seo_title_en:string|null; seo_title_ml:string|null; seo_description_en:string|null; seo_description_ml:string|null; featured:boolean; display_order:number; publish_at:string|null; created_by:string|null; updated_by:string|null; created_at:string; updated_at:string }>;
      deletion_requests: Table<{ id:string; user_id:string; status:string; requested_at:string; reviewed_by:string|null; reviewed_at:string|null; note:string|null }>;
      audit_log: Table<{ id:number; actor_id:string|null; action:string; entity_type:string; entity_id:string|null; metadata:Json; created_at:string }>;
      email_outbox: Table<{ id:string; notification_id:string|null; recipient:string; template:string; locale:"en"|"ml"; payload:Json; idempotency_key:string; status:string; attempts:number; next_attempt_at:string; last_error:string|null; sent_at:string|null; created_at:string }>;
    };
    Views: Record<string, never>;
    Functions: {
      consume_project_view:{ Args:{target_project:string}; Returns:{allowed:boolean;remaining:number;already_viewed:boolean}[] };
      express_interest:{ Args:{target_project:string;interest_note?:string|null}; Returns:string };
      decide_interest:{ Args:{target_interest:string;decision:InterestStatus}; Returns:string|null };
      accept_project_invitation:{ Args:{raw_token:string}; Returns:string };
    };
    Enums: { user_role:UserRole; investor_tier:InvestorTier; member_role:ProjectMemberRole; project_stage:ProjectStage; project_visibility:ProjectVisibility; interest_status:InterestStatus; notification_type:NotificationType };
    CompositeTypes: Record<string, never>;
  };
}

export type Entitlement = Database["public"]["Tables"]["entitlements"]["Row"];
