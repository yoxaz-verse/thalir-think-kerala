export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type UserRole = "founder" | "investor" | "admin";
export type InvestorTier = "community_backer" | "venture_investor";
export type ProjectMemberRole = "owner" | "cofounder" | "viewer";
export type ProjectStage = "idea" | "prototype" | "early_users" | "revenue" | "scaling";
export type ProjectVisibility = "draft" | "discovery" | "hidden" | "deleted";
export type InterestStatus = "pending" | "approved" | "declined" | "withdrawn";
export type NotificationType = "invitation" | "interest" | "interest_approved" | "interest_declined" | "message" | "meeting" | "weekly_summary" | "system";
export type AccountStatus = "invited"|"onboarding"|"pending_plan"|"active"|"suspended"|"deletion_pending"|"deleted";
export type PlatformInvitationStatus = "pending"|"accepted"|"revoked"|"expired";
export type FileAssetStatus = "requested"|"uploaded"|"scanning"|"clean"|"rejected"|"expired"|"deleted"|"failed";

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      profiles: Table<{ id:string; email:string; full_name:string; avatar_path:string|null; locale:"en"|"ml"; role:UserRole|null; investor_tier:InvestorTier|null; onboarding_completed_at:string|null; email_summaries_enabled:boolean; product_email_enabled:boolean; chat_email_enabled:boolean; account_status:AccountStatus; terms_version:string|null; terms_accepted_at:string|null; privacy_version:string|null; privacy_accepted_at:string|null; suspended_at:string|null; suspension_reason:string|null; purge_after:string|null; deleted_at:string|null; created_at:string; updated_at:string }>;
      plans: Table<{ id:string; code:string; name_en:string; name_ml:string; role:UserRole; investor_tier:InvestorTier|null; profile_views_per_month:number; open_chats_per_month:number; active:boolean; created_at:string }>;
      entitlements: Table<{ id:string; user_id:string; plan_id:string; plan_version_id:string|null; starts_at:string; ends_at:string|null; assigned_by:string|null; assignment_reason:string|null; suspended_at:string|null; created_at:string }>;
      quota_usage: Table<{ user_id:string; period_start:string; profile_views:number; chats_opened:number }>;
      projects: Table<{ id:string; slug:string; name:string; problem:string; affected_audience:string; motivation:string; sector:string; stage:ProjectStage; team_size:number; location:string; public_pitch:string; visibility:ProjectVisibility; created_by:string; revision:number; archived_at:string|null; deletion_requested_at:string|null; published_at:string|null; deleted_at:string|null; created_at:string; updated_at:string }>;
      project_members: Table<{ project_id:string; user_id:string; role:ProjectMemberRole; created_at:string }>;
      project_invitations: Table<{ id:string; project_id:string; email:string; role:ProjectMemberRole; token_hash:string; invited_by:string; expires_at:string; accepted_at:string|null; revoked_at:string|null; created_at:string }>;
      profile_views: Table<{ investor_id:string; project_id:string; period_start:string; viewed_at:string }>;
      interests: Table<{ id:string; project_id:string; investor_id:string; note:string|null; status:InterestStatus; decided_by:string|null; decided_at:string|null; created_at:string }>;
      chat_threads: Table<{ id:string; project_id:string; interest_id:string; status:"open"|"closed"; opened_at:string; closed_at:string|null }>;
      chat_participants: Table<{ thread_id:string; user_id:string; last_read_at:string|null; joined_at:string }>;
      messages: Table<{ id:string; thread_id:string; sender_id:string; body:string; delivery_state:"sending"|"sent"|"failed"; client_nonce:string|null; deletion_reason:string|null; created_at:string; edited_at:string|null; deleted_at:string|null }>;
      chat_attachments: Table<{ id:string; message_id:string; storage_path:string; file_name:string; content_type:string; byte_size:number; created_at:string }>;
      meeting_proposals: Table<{ id:string; thread_id:string; proposed_by:string; starts_at:string; note:string|null; status:string; decided_by:string|null; decided_at:string|null; replaced_by:string|null; updated_at:string; created_at:string }>;
      notifications: Table<{ id:string; user_id:string; type:NotificationType; title_en:string; title_ml:string; body_en:string; body_ml:string; href:string|null; read_at:string|null; created_at:string }>;
      content_items: Table<{ id:string; slug:string; kind:"program"|"opportunity"|"event"|"story"|"organization"; status:"draft"|"published"|"archived"; title_en:string; title_ml:string; summary_en:string; summary_ml:string; body_en:string; body_ml:string; category_en:string; category_ml:string; audience:string[]; event_date:string|null; location_en:string|null; location_ml:string|null; seo_title_en:string|null; seo_title_ml:string|null; seo_description_en:string|null; seo_description_ml:string|null; featured:boolean; display_order:number; publish_at:string|null; created_by:string|null; updated_by:string|null; created_at:string; updated_at:string }>;
      deletion_requests: Table<{ id:string; user_id:string; status:string; requested_at:string; purge_after:string|null; phase:string; legal_hold_at:string|null; legal_hold_reason:string|null; export_manifest:Json|null; failure_reason:string|null; cancelled_at:string|null; completed_at:string|null; correlation_id:string; reviewed_by:string|null; reviewed_at:string|null; note:string|null }>;
      audit_log: Table<{ id:number; actor_id:string|null; action:string; entity_type:string; entity_id:string|null; metadata:Json; created_at:string }>;
      email_outbox: Table<{ id:string; notification_id:string|null; recipient:string; template:string; locale:"en"|"ml"; payload:Json; idempotency_key:string; status:string; attempts:number; next_attempt_at:string; last_error:string|null; provider_message_id:string|null; accepted_at:string|null; failure_class:string|null; template_version:number; cancelled_at:string|null; correlation_id:string; sent_at:string|null; created_at:string }>;
      platform_invitations: Table<{id:string;email:string;normalized_email:string;role:UserRole;investor_tier:InvestorTier|null;initial_plan_id:string|null;locale:"en"|"ml";token_hash:string;status:PlatformInvitationStatus;invited_by:string|null;expires_at:string;accepted_at:string|null;accepted_by:string|null;revoked_at:string|null;revocation_reason:string|null;delivery_status:string;delivery_attempts:number;last_delivered_at:string|null;supersedes_id:string|null;grandfathered:boolean;created_at:string}>;
      project_slug_history: Table<{slug:string;project_id:string;replaced_at:string}>;
      project_revisions: Table<{id:number;project_id:string;revision:number;snapshot:Json;changed_by:string|null;created_at:string}>;
      plan_versions: Table<{id:string;plan_id:string;version:number;profile_views_per_month:number;open_chats_per_month:number;effective_at:string;retired_at:string|null;created_by:string|null;created_at:string}>;
      quota_adjustments: Table<{id:string;user_id:string;period_start:string;profile_views_delta:number;chats_delta:number;reason:string;created_by:string;created_at:string}>;
      upload_sessions: Table<{id:string;user_id:string;project_id:string|null;thread_id:string|null;purpose:"project"|"chat"|"avatar";object_path:string;original_name:string;declared_mime:string;byte_size:number;checksum_sha256:string|null;status:FileAssetStatus;expires_at:string;completed_at:string|null;correlation_id:string;created_at:string}>;
      file_assets: Table<{id:string;upload_session_id:string;owner_id:string;project_id:string|null;thread_id:string|null;bucket_id:string;object_path:string;display_name:string;detected_mime:string;byte_size:number;checksum_sha256:string;status:FileAssetStatus;provider_job_id:string|null;normalized_result:string|null;scanned_at:string|null;deleted_at:string|null;created_at:string}>;
      file_scan_attempts: Table<{id:number;upload_session_id:string;attempt:number;provider_job_id:string|null;outcome:string;retry_at:string|null;error_class:string|null;created_at:string}>;
      domain_events: Table<{id:string;event_type:string;aggregate_type:string;aggregate_id:string;actor_id:string|null;payload:Json;correlation_id:string;occurred_at:string;processed_at:string|null}>;
      content_revisions: Table<{id:number;content_id:string;revision:number;snapshot:Json;changed_by:string|null;created_at:string}>;
    };
    Views: Record<string, never>;
    Functions: {
      consume_project_view:{ Args:{target_project:string}; Returns:{allowed:boolean;remaining:number;already_viewed:boolean}[] };
      express_interest:{ Args:{target_project:string;interest_note?:string|null}; Returns:string };
      decide_interest:{ Args:{target_interest:string;decision:InterestStatus}; Returns:string|null };
      accept_project_invitation:{ Args:{raw_token:string}; Returns:string };
      is_active_account:{Args:{uid?:string};Returns:boolean};
      complete_invited_onboarding:{Args:{display_name:string;preferred_locale:string;terms:string;privacy:string};Returns:undefined};
      update_project:{Args:{target:string;expected_revision:number;patch:Json};Returns:Database["public"]["Tables"]["projects"]["Row"]};
      transfer_project_ownership:{Args:{target_project:string;new_owner:string;reason:string};Returns:undefined};
      withdraw_interest:{Args:{target_interest:string};Returns:undefined};
      mark_thread_read:{Args:{target_thread:string};Returns:undefined};
      set_thread_status:{Args:{target_thread:string;next_status:string};Returns:undefined};
      transition_meeting:{Args:{target:string;next_status:string};Returns:undefined};
      request_account_deletion:{Args:{request_note?:string|null};Returns:string};
      cancel_account_deletion:{Args:Record<string,never>;Returns:undefined};
      claim_email_jobs:{Args:{batch_size?:number};Returns:Database["public"]["Tables"]["email_outbox"]["Row"][]};
      complete_scanned_attachment:{Args:{target_session:string;detected_type:string;provider_job:string;result:string;destination_bucket:string;destination_path:string};Returns:string};
      claim_background_jobs:{Args:{queue_name:string;visibility_timeout:number;batch_size:number};Returns:{message_id:number;read_count:number;enqueued_at:string;visible_at:string;payload:Json}[]};
      complete_background_job:{Args:{queue_name:string;message_id:number};Returns:boolean};
      retry_background_job:{Args:{queue_name:string;message_id:number;payload:Json;delay_seconds:number};Returns:number};
      complete_account_deletion:{Args:{target_request:string};Returns:undefined};
    };
    Enums: { user_role:UserRole; investor_tier:InvestorTier; member_role:ProjectMemberRole; project_stage:ProjectStage; project_visibility:ProjectVisibility; interest_status:InterestStatus; notification_type:NotificationType; account_status:AccountStatus; platform_invitation_status:PlatformInvitationStatus; file_asset_status:FileAssetStatus };
    CompositeTypes: Record<string, never>;
  };
}

export type Entitlement = Database["public"]["Tables"]["entitlements"]["Row"];
