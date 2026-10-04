-- Production pilot hardening. This migration is intentionally append-only.
create extension if not exists pgmq;

create type public.account_status as enum ('invited','onboarding','pending_plan','active','suspended','deletion_pending','deleted');
create type public.platform_invitation_status as enum ('pending','accepted','revoked','expired');
create type public.file_asset_status as enum ('requested','uploaded','scanning','clean','rejected','expired','deleted','failed');
create type public.message_delivery_state as enum ('sending','sent','failed');
create type public.deletion_phase as enum ('recovery','blocked','exporting','purging','completed','failed','cancelled');

alter table public.profiles
  add column account_status public.account_status not null default 'onboarding',
  add column terms_version text,
  add column terms_accepted_at timestamptz,
  add column privacy_version text,
  add column privacy_accepted_at timestamptz,
  add column product_email_enabled boolean not null default true,
  add column chat_email_enabled boolean not null default true,
  add column suspended_at timestamptz,
  add column suspension_reason text,
  add column purge_after timestamptz;

update public.profiles set account_status = case
  when deleted_at is not null then 'deleted'::public.account_status
  when onboarding_completed_at is null then 'onboarding'::public.account_status
  when role = 'investor' and not exists (
    select 1 from public.entitlements e where e.user_id=profiles.id and e.starts_at<=now() and (e.ends_at is null or e.ends_at>now())
  ) then 'pending_plan'::public.account_status
  else 'active'::public.account_status end;

create table public.platform_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  normalized_email text generated always as (lower(trim(email))) stored,
  role public.user_role not null,
  investor_tier public.investor_tier,
  initial_plan_id uuid references public.plans(id),
  locale text not null default 'en' check (locale in ('en','ml')),
  token_hash text not null unique,
  status public.platform_invitation_status not null default 'pending',
  invited_by uuid references public.profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),
  revoked_at timestamptz,
  revocation_reason text,
  delivery_status public.delivery_status not null default 'pending',
  delivery_attempts integer not null default 0,
  last_delivered_at timestamptz,
  supersedes_id uuid references public.platform_invitations(id),
  grandfathered boolean not null default false,
  created_at timestamptz not null default now(),
  constraint platform_invitation_role check (role <> 'admin' or investor_tier is null),
  constraint platform_invitation_tier check (investor_tier is null or role='investor')
);
create unique index platform_invitation_one_pending_email on public.platform_invitations(normalized_email) where status='pending';

create table public.project_slug_history (
  slug text primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  replaced_at timestamptz not null default now()
);
create table public.project_revisions (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  revision integer not null,
  snapshot jsonb not null,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(project_id,revision)
);
alter table public.projects add column revision integer not null default 1,
  add column archived_at timestamptz,
  add column deletion_requested_at timestamptz;

create table public.plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id),
  version integer not null,
  profile_views_per_month integer not null check(profile_views_per_month>=0),
  open_chats_per_month integer not null check(open_chats_per_month>=0),
  effective_at timestamptz not null,
  retired_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(plan_id,version)
);
insert into public.plan_versions(plan_id,version,profile_views_per_month,open_chats_per_month,effective_at)
select id,1,profile_views_per_month,open_chats_per_month,created_at from public.plans on conflict do nothing;
alter table public.entitlements add column plan_version_id uuid references public.plan_versions(id),
  add column assignment_reason text,
  add column suspended_at timestamptz;
update public.entitlements e set plan_version_id=(select id from public.plan_versions v where v.plan_id=e.plan_id and v.version=1);

create table public.quota_adjustments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
  period_start date not null, profile_views_delta integer not null default 0, chats_delta integer not null default 0,
  reason text not null check(length(trim(reason))>=4), created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);

alter table public.messages add column delivery_state public.message_delivery_state not null default 'sent',
  add column client_nonce uuid,
  add column deletion_reason text;
create unique index messages_sender_nonce on public.messages(sender_id,client_nonce) where client_nonce is not null;
alter table public.meeting_proposals add column decided_by uuid references public.profiles(id),
  add column decided_at timestamptz, add column replaced_by uuid references public.meeting_proposals(id), add column updated_at timestamptz not null default now();

create table public.upload_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  project_id uuid references public.projects(id),
  thread_id uuid references public.chat_threads(id),
  purpose text not null check(purpose in ('project','chat','avatar')),
  object_path text not null unique,
  original_name text not null,
  declared_mime text not null,
  byte_size bigint not null check(byte_size>0 and byte_size<=20971520),
  checksum_sha256 text check(checksum_sha256 is null or checksum_sha256 ~ '^[a-f0-9]{64}$'),
  status public.file_asset_status not null default 'requested',
  expires_at timestamptz not null,
  completed_at timestamptz,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  constraint upload_scope check ((purpose='project' and project_id is not null and thread_id is null) or (purpose='chat' and thread_id is not null and project_id is null) or (purpose='avatar' and project_id is null and thread_id is null))
);
create table public.file_assets (
  id uuid primary key default gen_random_uuid(), upload_session_id uuid not null unique references public.upload_sessions(id),
  owner_id uuid not null references public.profiles(id), project_id uuid references public.projects(id), thread_id uuid references public.chat_threads(id),
  bucket_id text not null, object_path text not null unique, display_name text not null, detected_mime text not null,
  byte_size bigint not null, checksum_sha256 text not null, status public.file_asset_status not null,
  provider_job_id text, normalized_result text, scanned_at timestamptz, deleted_at timestamptz, created_at timestamptz not null default now()
);
create table public.file_scan_attempts (
  id bigint generated always as identity primary key, upload_session_id uuid not null references public.upload_sessions(id) on delete cascade,
  attempt integer not null, provider_job_id text, outcome text not null, retry_at timestamptz, error_class text, created_at timestamptz not null default now(),
  unique(upload_session_id,attempt)
);

create table public.domain_events (
  id uuid primary key default gen_random_uuid(), event_type text not null, aggregate_type text not null, aggregate_id text not null,
  actor_id uuid references public.profiles(id), payload jsonb not null default '{}', correlation_id uuid not null default gen_random_uuid(),
  occurred_at timestamptz not null default now(), processed_at timestamptz
);
create table public.content_revisions (
  id bigint generated always as identity primary key, content_id uuid not null references public.content_items(id) on delete cascade,
  revision integer not null, snapshot jsonb not null, changed_by uuid references public.profiles(id), created_at timestamptz not null default now(), unique(content_id,revision)
);

alter table public.email_outbox add column provider_message_id text, add column accepted_at timestamptz,
  add column failure_class text, add column template_version integer not null default 1, add column cancelled_at timestamptz,
  add column correlation_id uuid not null default gen_random_uuid();
alter table public.deletion_requests add column purge_after timestamptz, add column phase public.deletion_phase not null default 'recovery',
  add column legal_hold_at timestamptz, add column legal_hold_reason text, add column export_manifest jsonb,
  add column failure_reason text, add column cancelled_at timestamptz, add column completed_at timestamptz,
  add column correlation_id uuid not null default gen_random_uuid();

-- Existing preview users become explicit grandfathered records. Production must start from an empty auth schema.
insert into public.platform_invitations(email,role,investor_tier,locale,token_hash,status,accepted_at,accepted_by,grandfathered,expires_at)
select p.email,coalesce(p.role,'founder'::public.user_role),p.investor_tier,p.locale,
  encode(extensions.digest('grandfathered:'||p.id::text,'sha256'),'hex'),'accepted',p.created_at,p.id,true,p.created_at
from public.profiles p on conflict do nothing;

create or replace function public.is_active_account(uid uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles where id=uid and account_status in ('onboarding','pending_plan','active') and deleted_at is null)
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and account_status='active' and deleted_at is null)
$$;

-- Configure this as the Supabase Auth "Before User Created" hook.
create or replace function public.hook_require_platform_invitation(event jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare candidate text := lower(trim(coalesce(event->'user'->>'email','')));
begin
  if candidate='' or not exists(select 1 from public.platform_invitations where normalized_email=candidate and status='pending' and revoked_at is null and expires_at>now()) then
    return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','INVITATION_REQUIRED'));
  end if;
  return '{}'::jsonb;
end $$;
grant execute on function public.hook_require_platform_invitation(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_require_platform_invitation(jsonb) from anon,authenticated,public;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
declare invitation public.platform_invitations;
begin
  select * into invitation from public.platform_invitations where normalized_email=lower(trim(coalesce(new.email,''))) and status='pending' and revoked_at is null and expires_at>now() order by created_at desc limit 1 for update;
  if invitation.id is null then raise exception using errcode='P0001',message='INVITATION_REQUIRED'; end if;
  insert into public.profiles(id,email,full_name,avatar_path,locale,role,investor_tier,account_status)
  values(new.id,lower(trim(coalesce(new.email,''))),coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',''),new.raw_user_meta_data->>'avatar_url',invitation.locale,invitation.role,invitation.investor_tier,'onboarding');
  update public.platform_invitations set status='accepted',accepted_at=now(),accepted_by=new.id where id=invitation.id;
  if invitation.initial_plan_id is not null then
    insert into public.entitlements(user_id,plan_id,plan_version_id,starts_at,assigned_by,assignment_reason)
    select new.id,invitation.initial_plan_id,v.id,now(),invitation.invited_by,'Platform invitation' from public.plan_versions v where v.plan_id=invitation.initial_plan_id order by v.version desc limit 1;
  end if;
  return new;
end $$;

create or replace function public.prevent_audit_mutation() returns trigger language plpgsql as $$ begin raise exception using errcode='42501',message='AUDIT_IMMUTABLE'; end $$;
create trigger audit_log_immutable before update or delete on public.audit_log for each row execute function public.prevent_audit_mutation();

create or replace function public.protect_profile_security_fields() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.role()='service_role' or public.is_admin() then return new; end if;
 if row(new.role,new.investor_tier,new.account_status,new.suspended_at,new.suspension_reason,new.purge_after,new.deleted_at)
    is distinct from row(old.role,old.investor_tier,old.account_status,old.suspended_at,old.suspension_reason,old.purge_after,old.deleted_at) then raise exception using errcode='42501',message='FORBIDDEN'; end if;
 return new;
end $$;
create trigger profiles_protected_fields before update on public.profiles for each row execute function public.protect_profile_security_fields();

create or replace function public.complete_invited_onboarding(display_name text,preferred_locale text,terms text,privacy text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or preferred_locale not in ('en','ml') or length(trim(display_name))<2 then raise exception using errcode='P0001',message='VALIDATION_ERROR'; end if;
 update public.profiles set full_name=left(trim(display_name),120),locale=preferred_locale,terms_version=terms,privacy_version=privacy,terms_accepted_at=now(),privacy_accepted_at=now(),onboarding_completed_at=case when role='investor' then now() else onboarding_completed_at end,account_status=case when role='investor' and exists(select 1 from public.entitlements where user_id=auth.uid() and starts_at<=now() and (ends_at is null or ends_at>now()) and suspended_at is null) then 'active'::public.account_status when role='investor' then 'pending_plan'::public.account_status else 'onboarding'::public.account_status end where id=auth.uid() and account_status='onboarding';
 if not found then raise exception using errcode='42501',message='FORBIDDEN'; end if;
end $$;

create or replace function public.add_project_owner() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.project_members(project_id,user_id,role) values(new.id,new.created_by,'owner');update public.profiles set onboarding_completed_at=coalesce(onboarding_completed_at,now()),account_status='active' where id=new.created_by and role='founder' and account_status='onboarding';return new;end $$;

create or replace function public.protect_project_identity() returns trigger language plpgsql as $$
begin if new.id<>old.id or new.created_by<>old.created_by then raise exception using errcode='42501',message='FORBIDDEN'; end if; return new; end $$;
create trigger projects_identity_immutable before update on public.projects for each row execute function public.protect_project_identity();

create or replace function public.capture_project_revision() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if row(new.name,new.problem,new.affected_audience,new.motivation,new.sector,new.stage,new.team_size,new.location,new.public_pitch,new.visibility)
     is distinct from row(old.name,old.problem,old.affected_audience,old.motivation,old.sector,old.stage,old.team_size,old.location,old.public_pitch,old.visibility) then
    new.revision := old.revision+1;
    insert into public.project_revisions(project_id,revision,snapshot,changed_by) values(old.id,old.revision,to_jsonb(old)-'deleted_at',auth.uid());
  end if;
  new.updated_at:=now(); return new;
end $$;
create trigger projects_revision before update on public.projects for each row execute function public.capture_project_revision();

create or replace function public.update_project(target uuid, expected_revision integer, patch jsonb) returns public.projects language plpgsql security definer set search_path='' as $$
declare result public.projects;
begin
  if not public.is_active_account() or not public.is_project_member(target,array['owner','cofounder']::public.member_role[]) then raise exception using errcode='42501',message='FORBIDDEN'; end if;
  update public.projects set name=coalesce(patch->>'name',name),problem=coalesce(patch->>'problem',problem),affected_audience=coalesce(patch->>'affected_audience',affected_audience),motivation=coalesce(patch->>'motivation',motivation),sector=coalesce(patch->>'sector',sector),location=coalesce(patch->>'location',location),public_pitch=coalesce(patch->>'public_pitch',public_pitch),team_size=coalesce((patch->>'team_size')::integer,team_size),stage=coalesce((patch->>'stage')::public.project_stage,stage)
  where id=target and revision=expected_revision returning * into result;
  if result.id is null then raise exception using errcode='40001',message='STALE_REVISION'; end if; return result;
end $$;

create or replace function public.transfer_project_ownership(target_project uuid,new_owner uuid,reason text) returns void language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(target_project::text,0));
  if not public.is_active_account() or not exists(select 1 from public.project_members where project_id=target_project and user_id=auth.uid() and role='owner') then raise exception using errcode='42501',message='FORBIDDEN'; end if;
  if length(trim(reason))<4 or not exists(select 1 from public.project_members where project_id=target_project and user_id=new_owner and role in ('cofounder','viewer')) then raise exception using errcode='P0001',message='INVALID_TRANSFER'; end if;
  update public.project_members set role='cofounder' where project_id=target_project and user_id=auth.uid();
  update public.project_members set role='owner' where project_id=target_project and user_id=new_owner;
  insert into public.audit_log(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'transfer_ownership','projects',target_project::text,jsonb_build_object('new_owner',new_owner,'reason',reason));
end $$;

create or replace function public.withdraw_interest(target_interest uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.interests set status='withdrawn',decided_at=now(),decided_by=auth.uid() where id=target_interest and investor_id=auth.uid() and status='pending';
 if not found then raise exception using errcode='P0001',message='INVALID_INTEREST_TRANSITION'; end if;
end $$;

create or replace function public.mark_thread_read(target_thread uuid) returns void language plpgsql security definer set search_path='' as $$
begin update public.chat_participants set last_read_at=now() where thread_id=target_thread and user_id=auth.uid(); if not found then raise exception using errcode='42501',message='FORBIDDEN'; end if; end $$;
create or replace function public.set_thread_status(target_thread uuid,next_status text) returns void language plpgsql security definer set search_path='' as $$
declare pid uuid;
begin select project_id into pid from public.chat_threads where id=target_thread for update; if next_status not in ('open','closed') or not (public.is_project_member(pid,array['owner','cofounder']::public.member_role[]) or public.is_thread_participant(target_thread)) then raise exception using errcode='42501',message='FORBIDDEN'; end if; update public.chat_threads set status=next_status,closed_at=case when next_status='closed' then now() else null end where id=target_thread; end $$;

create or replace function public.transition_meeting(target uuid,next_status text) returns void language plpgsql security definer set search_path='' as $$
declare item public.meeting_proposals;
begin select * into item from public.meeting_proposals where id=target for update; if item.id is null or not public.is_thread_participant(item.thread_id) then raise exception using errcode='42501',message='FORBIDDEN'; end if;
 if next_status not in ('accepted','declined','cancelled') or item.status<>'proposed' then raise exception using errcode='P0001',message='INVALID_MEETING_TRANSITION'; end if;
 if next_status='cancelled' and item.proposed_by<>auth.uid() then raise exception using errcode='42501',message='FORBIDDEN'; end if;
 update public.meeting_proposals set status=next_status,decided_by=auth.uid(),decided_at=now(),updated_at=now() where id=target; end $$;

create or replace function public.request_account_deletion(request_note text default null) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; deadline timestamptz:=now()+interval '30 days';
begin if not public.is_active_account() then raise exception using errcode='42501',message='FORBIDDEN'; end if;
 insert into public.deletion_requests(user_id,note,purge_after) values(auth.uid(),left(request_note,1000),deadline) returning id into result;
 update public.profiles set account_status='deletion_pending',purge_after=deadline where id=auth.uid(); return result; end $$;
create or replace function public.cancel_account_deletion() returns void language plpgsql security definer set search_path='' as $$
begin update public.deletion_requests set status='cancelled',phase='cancelled',cancelled_at=now() where user_id=auth.uid() and status='requested' and purge_after>now() and legal_hold_at is null;
 if not found then raise exception using errcode='P0001',message='DELETION_NOT_CANCELLABLE'; end if;
 update public.profiles set account_status=case when role='investor' and not exists(select 1 from public.entitlements where user_id=auth.uid() and starts_at<=now() and (ends_at is null or ends_at>now())) then 'pending_plan'::public.account_status else 'active'::public.account_status end,purge_after=null where id=auth.uid(); end $$;

alter table public.platform_invitations enable row level security; alter table public.project_slug_history enable row level security;
alter table public.project_revisions enable row level security; alter table public.plan_versions enable row level security;
alter table public.quota_adjustments enable row level security; alter table public.upload_sessions enable row level security;
alter table public.file_assets enable row level security; alter table public.file_scan_attempts enable row level security;
alter table public.domain_events enable row level security; alter table public.content_revisions enable row level security;
create policy platform_invites_admin on public.platform_invitations for select to authenticated using(public.is_admin() or normalized_email=lower(coalesce(auth.jwt()->>'email','')));
create policy project_slug_member on public.project_slug_history for select to authenticated using(public.is_project_member(project_id) or public.is_admin());
create policy revisions_member on public.project_revisions for select to authenticated using(public.is_project_member(project_id) or public.is_admin());
create policy plan_versions_read on public.plan_versions for select to authenticated using(public.is_active_account() or public.is_admin());
create policy quota_adjustments_self on public.quota_adjustments for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy upload_sessions_self on public.upload_sessions for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy file_assets_member on public.file_assets for select to authenticated using(owner_id=auth.uid() or (project_id is not null and public.is_project_member(project_id)) or (thread_id is not null and public.is_thread_participant(thread_id)) or public.is_admin());
create policy scan_attempts_admin on public.file_scan_attempts for select to authenticated using(public.is_admin());
create policy domain_events_admin on public.domain_events for select to authenticated using(public.is_admin());
create policy content_revisions_admin on public.content_revisions for select to authenticated using(public.is_admin());

grant select on public.platform_invitations,public.project_slug_history,public.project_revisions,public.plan_versions,public.quota_adjustments,public.upload_sessions,public.file_assets to authenticated;
grant select on public.file_scan_attempts,public.domain_events,public.content_revisions to authenticated;
grant execute on function public.is_active_account(uuid),public.complete_invited_onboarding(text,text,text,text),public.update_project(uuid,integer,jsonb),public.transfer_project_ownership(uuid,uuid,text),public.withdraw_interest(uuid),public.mark_thread_read(uuid),public.set_thread_status(uuid,text),public.transition_meeting(uuid,text),public.request_account_deletion(text),public.cancel_account_deletion() to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('quarantine','quarantine',false,20971520,array['application/pdf','image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- Quarantine objects are deliberately unreadable. A user may upload only into their own active session path.
create policy quarantine_upload on storage.objects for insert to authenticated with check(
  bucket_id='quarantine' and (storage.foldername(name))[1]=auth.uid()::text and exists(
    select 1 from public.upload_sessions s where s.user_id=auth.uid() and s.object_path=name and s.status='requested' and s.expires_at>now()
  )
);
alter publication supabase_realtime add table public.chat_participants,public.file_assets;

select pgmq.create('file_scans');
select pgmq.create('account_deletions');

create or replace function public.complete_scanned_attachment(target_session uuid,detected_type text,provider_job text,result text,destination_bucket text,destination_path text) returns uuid language plpgsql security definer set search_path='' as $$
declare s public.upload_sessions; asset uuid;
begin select * into s from public.upload_sessions where id=target_session for update; if s.status<>'scanning' then raise exception using errcode='P0001',message='INVALID_FILE_TRANSITION'; end if;
 if detected_type not in ('application/pdf','image/jpeg','image/png','image/webp') or detected_type<>s.declared_mime then raise exception using errcode='P0001',message='UPLOAD_REJECTED'; end if;
 insert into public.file_assets(upload_session_id,owner_id,project_id,thread_id,bucket_id,object_path,display_name,detected_mime,byte_size,checksum_sha256,status,provider_job_id,normalized_result,scanned_at)
 values(s.id,s.user_id,s.project_id,s.thread_id,destination_bucket,destination_path,s.original_name,detected_type,s.byte_size,coalesce(s.checksum_sha256,''),'clean',provider_job,result,now()) returning id into asset;
 update public.upload_sessions set status='clean' where id=s.id; return asset; end $$;
revoke execute on function public.complete_scanned_attachment(uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.complete_scanned_attachment(uuid,text,text,text,text,text) to service_role;

drop policy messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated with check(
  sender_id=auth.uid() and public.is_active_account() and public.is_thread_participant(thread_id)
  and exists(select 1 from public.chat_threads where id=thread_id and status='open')
);
drop policy projects_update on public.projects;
create policy projects_update on public.projects for update to authenticated using(
  (public.is_active_account() and public.is_project_member(id,array['owner','cofounder']::public.member_role[])) or public.is_admin()
) with check(public.is_active_account() or public.is_admin());
