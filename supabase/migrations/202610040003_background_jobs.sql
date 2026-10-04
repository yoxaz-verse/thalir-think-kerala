-- Connect durable domain state to pgmq-backed workers. Workers authenticate with
-- the service role; browser roles cannot read, acknowledge, or enqueue jobs.

create or replace function public.enqueue_file_scan() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'uploaded' and old.status is distinct from new.status then
    perform pgmq.send('file_scans', jsonb_build_object(
      'upload_session_id', new.id,
      'correlation_id', new.correlation_id
    ));
  end if;
  return new;
end $$;

create trigger upload_session_enqueue_scan
after update of status on public.upload_sessions
for each row execute function public.enqueue_file_scan();

create or replace function public.enqueue_account_deletion() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pgmq.send('account_deletions', jsonb_build_object(
    'deletion_request_id', new.id,
    'user_id', new.user_id,
    'correlation_id', new.correlation_id
  ), greatest(ceil(extract(epoch from (new.purge_after - now())))::integer, 0));
  return new;
end $$;

create trigger deletion_request_enqueue
after insert on public.deletion_requests
for each row execute function public.enqueue_account_deletion();

create or replace function public.claim_background_jobs(queue_name text, visibility_timeout integer, batch_size integer)
returns table(message_id bigint, read_count integer, enqueued_at timestamptz, visible_at timestamptz, payload jsonb)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() <> 'service_role' then raise exception using errcode='42501',message='FORBIDDEN'; end if;
  if queue_name not in ('file_scans','account_deletions') then raise exception using errcode='22023',message='UNKNOWN_QUEUE'; end if;
  return query select msg_id,read_ct,enqueued_at,vt,message from pgmq.read(queue_name,greatest(visibility_timeout,1),least(greatest(batch_size,1),20));
end $$;

create or replace function public.complete_background_job(queue_name text, message_id bigint)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() <> 'service_role' then raise exception using errcode='42501',message='FORBIDDEN'; end if;
  if queue_name not in ('file_scans','account_deletions') then raise exception using errcode='22023',message='UNKNOWN_QUEUE'; end if;
  return pgmq.delete(queue_name,message_id);
end $$;

create or replace function public.retry_background_job(queue_name text, message_id bigint, payload jsonb, delay_seconds integer)
returns bigint language plpgsql security definer set search_path = '' as $$
declare next_id bigint;
begin
  if auth.role() <> 'service_role' then raise exception using errcode='42501',message='FORBIDDEN'; end if;
  if queue_name not in ('file_scans','account_deletions') then raise exception using errcode='22023',message='UNKNOWN_QUEUE'; end if;
  perform pgmq.delete(queue_name,message_id);
  select pgmq.send(queue_name,payload,greatest(delay_seconds,1)) into next_id;
  return next_id;
end $$;

revoke all on function public.claim_background_jobs(text,integer,integer) from public,anon,authenticated;
revoke all on function public.complete_background_job(text,bigint) from public,anon,authenticated;
revoke all on function public.retry_background_job(text,bigint,jsonb,integer) from public,anon,authenticated;
grant execute on function public.claim_background_jobs(text,integer,integer) to service_role;
grant execute on function public.complete_background_job(text,bigint) to service_role;
grant execute on function public.retry_background_job(text,bigint,jsonb,integer) to service_role;

-- Email uses email_outbox as the single durable queue. Claiming is atomic so
-- overlapping scheduled invocations cannot deliver the same row concurrently.
create or replace function public.claim_email_jobs(batch_size integer default 20)
returns setof public.email_outbox language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() <> 'service_role' then raise exception using errcode='42501',message='FORBIDDEN'; end if;
  return query
    with candidates as (
      select id from public.email_outbox
      where (status='pending' and next_attempt_at<=now())
         or (status='processing' and next_attempt_at<=now()-interval '15 minutes')
      order by created_at for update skip locked limit least(greatest(batch_size,1),50)
    )
    update public.email_outbox o set status='processing',attempts=o.attempts+1,next_attempt_at=now()
    from candidates c where o.id=c.id returning o.*;
end $$;

revoke all on function public.claim_email_jobs(integer) from public,anon,authenticated;
grant execute on function public.claim_email_jobs(integer) to service_role;

create or replace function public.complete_account_deletion(target_request uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare item public.deletion_requests;
begin
  if auth.role() <> 'service_role' then raise exception using errcode='42501',message='FORBIDDEN'; end if;
  select * into item from public.deletion_requests where id=target_request for update;
  if item.id is null or item.status <> 'requested' or item.legal_hold_at is not null or item.purge_after > now() then
    raise exception using errcode='P0001',message='DELETION_NOT_READY';
  end if;

  update public.platform_invitations set email='deleted+'||item.user_id::text||'@invalid.local',token_hash=encode(extensions.digest(gen_random_uuid()::text,'sha256'),'hex') where accepted_by=item.user_id;
  update public.profiles set email='deleted+'||item.user_id::text||'@invalid.local',full_name='Deleted user',avatar_path=null,email_summaries_enabled=false,product_email_enabled=false,chat_email_enabled=false,account_status='deleted',purge_after=null,deleted_at=now(),updated_at=now() where id=item.user_id;
  update public.deletion_requests set status='completed',phase='completed',completed_at=now(),failure_reason=null where id=item.id;
  insert into public.audit_log(actor_id,action,entity_type,entity_id,metadata) values(null,'complete_deletion','profiles',item.user_id::text,jsonb_build_object('correlation_id',item.correlation_id));
end $$;

revoke all on function public.complete_account_deletion(uuid) from public,anon,authenticated;
grant execute on function public.complete_account_deletion(uuid) to service_role;
