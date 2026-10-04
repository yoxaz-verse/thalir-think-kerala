create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.user_role as enum ('founder','investor','admin');
create type public.investor_tier as enum ('community_backer','venture_investor');
create type public.member_role as enum ('owner','cofounder','viewer');
create type public.project_stage as enum ('idea','prototype','early_users','revenue','scaling');
create type public.project_visibility as enum ('draft','discovery','hidden','deleted');
create type public.interest_status as enum ('pending','approved','declined','withdrawn');
create type public.content_kind as enum ('program','opportunity','event','story','organization');
create type public.publication_status as enum ('draft','published','archived');
create type public.notification_type as enum ('invitation','interest','interest_approved','interest_declined','message','meeting','weekly_summary','system');
create type public.delivery_status as enum ('pending','processing','sent','failed','cancelled');
create type public.deletion_status as enum ('requested','approved','completed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  avatar_path text,
  locale text not null default 'en' check (locale in ('en','ml')),
  role public.user_role,
  investor_tier public.investor_tier,
  onboarding_completed_at timestamptz,
  email_summaries_enabled boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investor_tier_role check (investor_tier is null or role = 'investor')
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_ml text not null,
  role public.user_role not null check (role in ('founder','investor')),
  investor_tier public.investor_tier,
  profile_views_per_month integer not null default 0 check (profile_views_per_month >= 0),
  open_chats_per_month integer not null default 0 check (open_chats_per_month >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  exclude using gist (user_id with =, tstzrange(starts_at, coalesce(ends_at, 'infinity')) with &&)
);

create table public.quota_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  profile_views integer not null default 0 check (profile_views >= 0),
  chats_opened integer not null default 0 check (chats_opened >= 0),
  primary key (user_id, period_start)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  problem text not null,
  affected_audience text not null,
  motivation text not null,
  sector text not null,
  stage public.project_stage not null,
  team_size integer not null check (team_size between 1 and 10000),
  location text not null,
  public_pitch text not null check (char_length(public_pitch) <= 180),
  visibility public.project_visibility not null default 'draft',
  created_by uuid not null references public.profiles(id),
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null,
  created_at timestamptz not null default now(),
  primary key (project_id,user_id)
);

create table public.project_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  role public.member_role not null check (role <> 'owner'),
  token_hash text not null unique,
  invited_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.profile_views (
  investor_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  period_start date not null,
  viewed_at timestamptz not null default now(),
  primary key (investor_id,project_id,period_start)
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  investor_id uuid not null references public.profiles(id) on delete cascade,
  note text check (char_length(note) <= 1000),
  status public.interest_status not null default 'pending',
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique(project_id,investor_id)
);

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  interest_id uuid not null unique references public.interests(id) on delete cascade,
  status text not null default 'open' check (status in ('open','closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.chat_participants (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key(thread_id,user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create table public.chat_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  content_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 20971520),
  created_at timestamptz not null default now()
);

create table public.meeting_proposals (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  proposed_by uuid not null references public.profiles(id),
  starts_at timestamptz not null,
  note text,
  status text not null default 'proposed' check (status in ('proposed','accepted','declined','cancelled')),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title_en text not null,
  title_ml text not null,
  body_en text not null,
  body_ml text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications(id) on delete cascade,
  recipient text not null,
  template text not null,
  locale text not null check (locale in ('en','ml')),
  payload jsonb not null default '{}',
  idempotency_key text not null unique,
  status public.delivery_status not null default 'pending',
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind public.content_kind not null,
  status public.publication_status not null default 'draft',
  title_en text not null, title_ml text not null,
  summary_en text not null, summary_ml text not null,
  body_en text not null, body_ml text not null,
  category_en text not null, category_ml text not null,
  audience text[] not null default '{}',
  event_date date,
  location_en text, location_ml text,
  seo_title_en text, seo_title_ml text,
  seo_description_en text, seo_description_ml text,
  featured boolean not null default false,
  display_order integer not null default 0,
  publish_at timestamptz,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_bilingual check (status <> 'published' or (title_en <> '' and title_ml <> '' and summary_en <> '' and summary_ml <> '' and body_en <> '' and body_ml <> ''))
);

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.deletion_status not null default 'requested',
  requested_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  note text
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and deleted_at is null)
$$;
create or replace function public.is_project_member(project uuid, allowed public.member_role[] default array['owner','cofounder','viewer']::public.member_role[]) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.project_members where project_id = project and user_id = auth.uid() and role = any(allowed))
$$;
create or replace function public.is_thread_participant(thread uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.chat_participants where thread_id = thread and user_id = auth.uid())
$$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,email,full_name,avatar_path)
  values(new.id, coalesce(new.email,''), coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',''), new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.prevent_profile_role_change() returns trigger language plpgsql as $$
begin
  if old.role is not null and new.role is distinct from old.role and not public.is_admin() then raise exception 'Primary role cannot be changed'; end if;
  return new;
end $$;
create trigger profiles_role_immutable before update on public.profiles for each row execute function public.prevent_profile_role_change();

create or replace function public.add_project_owner() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.project_members(project_id,user_id,role) values(new.id,new.created_by,'owner');
  return new;
end $$;
create trigger project_owner_after_insert after insert on public.projects for each row execute function public.add_project_owner();

create or replace function public.accept_project_invitation(raw_token text) returns uuid language plpgsql security definer set search_path = '' as $$
declare invitation public.project_invitations;
begin
  select * into invitation from public.project_invitations where token_hash=encode(extensions.digest(raw_token,'sha256'),'hex') for update;
  if invitation.id is null or invitation.accepted_at is not null or invitation.revoked_at is not null or invitation.expires_at<=now() then raise exception 'Invitation is invalid or expired'; end if;
  if lower(invitation.email)<>lower(coalesce(auth.jwt()->>'email','')) then raise exception 'Invitation belongs to another email'; end if;
  insert into public.project_members(project_id,user_id,role) values(invitation.project_id,auth.uid(),invitation.role) on conflict(project_id,user_id) do update set role=excluded.role;
  update public.project_invitations set accepted_at=now() where id=invitation.id;
  return invitation.project_id;
end $$;

create or replace function public.consume_project_view(target_project uuid) returns table(allowed boolean, remaining integer, already_viewed boolean) language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); period date := date_trunc('month', now())::date; quota integer; used integer; inserted integer;
begin
  if not exists(select 1 from public.profiles where id=uid and role='investor' and deleted_at is null) then raise exception 'Investor account required'; end if;
  if not exists(select 1 from public.projects where id=target_project and visibility='discovery') then raise exception 'Project unavailable'; end if;
  select p.profile_views_per_month into quota from public.entitlements e join public.plans p on p.id=e.plan_id where e.user_id=uid and e.starts_at<=now() and (e.ends_at is null or e.ends_at>now()) and p.active order by e.starts_at desc limit 1;
  quota := coalesce(quota,0);
  insert into public.profile_views(investor_id,project_id,period_start) values(uid,target_project,period) on conflict do nothing;
  get diagnostics inserted = row_count;
  insert into public.quota_usage(user_id,period_start,profile_views) values(uid,period,inserted) on conflict(user_id,period_start) do update set profile_views=public.quota_usage.profile_views+inserted;
  select profile_views into used from public.quota_usage where user_id=uid and period_start=period for update;
  if used > quota then
    if inserted=1 then delete from public.profile_views where investor_id=uid and project_id=target_project and period_start=period; update public.quota_usage set profile_views=profile_views-1 where user_id=uid and period_start=period; end if;
    return query select false, greatest(quota-(used-inserted),0), inserted=0; return;
  end if;
  return query select true, greatest(quota-used,0), inserted=0;
end $$;

create or replace function public.express_interest(target_project uuid, interest_note text default null) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid; owner_id uuid;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='investor' and deleted_at is null) then raise exception 'Investor account required'; end if;
  insert into public.interests(project_id,investor_id,note) values(target_project,auth.uid(),left(interest_note,1000))
  on conflict(project_id,investor_id) do update set note=excluded.note,status='pending',decided_by=null,decided_at=null returning id into result;
  select user_id into owner_id from public.project_members where project_id=target_project and role='owner' limit 1;
  insert into public.notifications(user_id,type,title_en,title_ml,body_en,body_ml,href) values(owner_id,'interest','New investor interest','പുതിയ നിക്ഷേപക താൽപര്യം','An investor is interested in your project.','ഒരു നിക്ഷേപകൻ നിങ്ങളുടെ പ്രോജക്റ്റിൽ താൽപര്യം പ്രകടിപ്പിച്ചു.','/app/interests');
  return result;
end $$;

create or replace function public.decide_interest(target_interest uuid, decision public.interest_status) returns uuid language plpgsql security definer set search_path = '' as $$
declare item public.interests; thread uuid; period date := date_trunc('month',now())::date; quota integer; used integer;
begin
  if decision not in ('approved','declined') then raise exception 'Invalid decision'; end if;
  select * into item from public.interests where id=target_interest for update;
  if not public.is_project_member(item.project_id,array['owner','cofounder']::public.member_role[]) then raise exception 'Forbidden'; end if;
  if decision='approved' then
    select p.open_chats_per_month into quota from public.entitlements e join public.plans p on p.id=e.plan_id where e.user_id=item.investor_id and e.starts_at<=now() and (e.ends_at is null or e.ends_at>now()) and p.active order by e.starts_at desc limit 1;
    insert into public.quota_usage(user_id,period_start) values(item.investor_id,period) on conflict do nothing;
    select chats_opened into used from public.quota_usage where user_id=item.investor_id and period_start=period for update;
    if used >= coalesce(quota,0) then raise exception 'Chat quota exhausted'; end if;
    update public.quota_usage set chats_opened=chats_opened+1 where user_id=item.investor_id and period_start=period;
    insert into public.chat_threads(project_id,interest_id) values(item.project_id,item.id) returning id into thread;
    insert into public.chat_participants(thread_id,user_id) select thread,user_id from public.project_members where project_id=item.project_id and role in ('owner','cofounder') on conflict do nothing;
    insert into public.chat_participants(thread_id,user_id) values(thread,item.investor_id) on conflict do nothing;
  end if;
  update public.interests set status=decision,decided_by=auth.uid(),decided_at=now() where id=item.id;
  insert into public.notifications(user_id,type,title_en,title_ml,body_en,body_ml,href) values(item.investor_id,case when decision='approved' then 'interest_approved'::public.notification_type else 'interest_declined'::public.notification_type,case when decision='approved' then 'Introduction approved' else 'Interest update' end,case when decision='approved' then 'പരിചയപ്പെടുത്തൽ അംഗീകരിച്ചു' else 'താൽപര്യ അപ്ഡേറ്റ്' end,case when decision='approved' then 'The founder opened a private conversation.' else 'The founder has declined this introduction.' end,case when decision='approved' then 'സ്ഥാപകൻ സ്വകാര്യ സംഭാഷണം തുറന്നു.' else 'സ്ഥാപകൻ ഈ പരിചയപ്പെടുത്തൽ നിരസിച്ചു.' end,case when thread is null then '/app/discover' else '/app/chat/'||thread end);
  return thread;
end $$;

alter table public.profiles enable row level security; alter table public.plans enable row level security; alter table public.entitlements enable row level security; alter table public.quota_usage enable row level security; alter table public.projects enable row level security; alter table public.project_members enable row level security; alter table public.project_invitations enable row level security; alter table public.profile_views enable row level security; alter table public.interests enable row level security; alter table public.chat_threads enable row level security; alter table public.chat_participants enable row level security; alter table public.messages enable row level security; alter table public.chat_attachments enable row level security; alter table public.meeting_proposals enable row level security; alter table public.notifications enable row level security; alter table public.email_outbox enable row level security; alter table public.content_items enable row level security; alter table public.deletion_requests enable row level security; alter table public.audit_log enable row level security;

create policy profiles_self on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy plans_read on public.plans for select to authenticated using(active or public.is_admin());
create policy entitlements_read on public.entitlements for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy quota_read on public.quota_usage for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy projects_read on public.projects for select to authenticated using(visibility='discovery' or public.is_project_member(id) or public.is_admin());
create policy projects_insert on public.projects for insert to authenticated with check(created_by=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and role='founder'));
create policy projects_update on public.projects for update to authenticated using(public.is_project_member(id,array['owner','cofounder']::public.member_role[]) or public.is_admin());
create policy members_read on public.project_members for select to authenticated using(public.is_project_member(project_id) or public.is_admin());
create policy invitations_read on public.project_invitations for select to authenticated using(invited_by=auth.uid() or lower(email)=lower(coalesce(auth.jwt()->>'email','')) or public.is_admin());
create policy views_read on public.profile_views for select to authenticated using(investor_id=auth.uid() or public.is_project_member(project_id) or public.is_admin());
create policy interests_read on public.interests for select to authenticated using(investor_id=auth.uid() or public.is_project_member(project_id) or public.is_admin());
create policy threads_read on public.chat_threads for select to authenticated using(public.is_thread_participant(id) or public.is_admin());
create policy participants_read on public.chat_participants for select to authenticated using(public.is_thread_participant(thread_id) or public.is_admin());
create policy messages_read on public.messages for select to authenticated using(public.is_thread_participant(thread_id) or public.is_admin());
create policy messages_insert on public.messages for insert to authenticated with check(sender_id=auth.uid() and public.is_thread_participant(thread_id));
create policy attachments_read on public.chat_attachments for select to authenticated using(exists(select 1 from public.messages m where m.id=message_id and public.is_thread_participant(m.thread_id)) or public.is_admin());
create policy meetings_all on public.meeting_proposals for all to authenticated using(public.is_thread_participant(thread_id) or public.is_admin()) with check(proposed_by=auth.uid() and public.is_thread_participant(thread_id));
create policy notifications_self on public.notifications for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy notifications_update on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy content_public on public.content_items for select to anon,authenticated using((status='published' and (publish_at is null or publish_at<=now())) or public.is_admin());
create policy content_admin on public.content_items for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy deletion_self on public.deletion_requests for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy deletion_insert on public.deletion_requests for insert to authenticated with check(user_id=auth.uid());
create policy audit_admin on public.audit_log for select to authenticated using(public.is_admin());

revoke all on all tables in schema public from anon,authenticated;
grant select on public.content_items to anon,authenticated;
grant select,update on public.profiles to authenticated; grant select on public.plans,public.entitlements,public.quota_usage,public.projects,public.project_members,public.project_invitations,public.profile_views,public.interests,public.chat_threads,public.chat_participants,public.messages,public.chat_attachments,public.meeting_proposals,public.notifications,public.deletion_requests to authenticated;
grant insert on public.projects,public.messages,public.meeting_proposals,public.deletion_requests to authenticated;
grant update on public.projects,public.meeting_proposals,public.notifications to authenticated;
grant all on public.content_items to authenticated; grant select on public.audit_log to authenticated;
grant execute on function public.consume_project_view(uuid),public.express_interest(uuid,text),public.decide_interest(uuid,public.interest_status),public.accept_project_invitation(text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('avatars','avatars',false,5242880,array['image/jpeg','image/png','image/webp']),
('project-assets','project-assets',false,20971520,array['application/pdf','image/jpeg','image/png','image/webp']),
('chat-attachments','chat-attachments',false,20971520,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy avatar_owner on storage.objects for all to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy project_asset_members on storage.objects for select to authenticated using(bucket_id='project-assets' and public.is_project_member(((storage.foldername(name))[1])::uuid));
create policy project_asset_write on storage.objects for insert to authenticated with check(bucket_id='project-assets' and public.is_project_member(((storage.foldername(name))[1])::uuid,array['owner','cofounder']::public.member_role[]));
create policy chat_attachment_members on storage.objects for select to authenticated using(bucket_id='chat-attachments' and public.is_thread_participant(((storage.foldername(name))[1])::uuid));
create policy chat_attachment_write on storage.objects for insert to authenticated with check(bucket_id='chat-attachments' and public.is_thread_participant(((storage.foldername(name))[1])::uuid));

alter publication supabase_realtime add table public.messages,public.notifications,public.meeting_proposals;

insert into public.plans(code,name_en,name_ml,role,investor_tier,profile_views_per_month,open_chats_per_month) values
('founder-pilot','Founder pilot','സ്ഥാപക പൈലറ്റ്','founder',null,0,0),
('community-backer-pilot','Community Backer pilot','കമ്മ്യൂണിറ്റി ബാക്കർ പൈലറ്റ്','investor','community_backer',20,2),
('venture-investor-pilot','Venture Investor pilot','വെഞ്ചർ ഇൻവെസ്റ്റർ പൈലറ്റ്','investor','venture_investor',100,10);
