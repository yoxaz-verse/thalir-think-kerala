begin;
select plan(12);

select has_table('public','platform_invitations','platform invitations exist');
select has_table('public','project_revisions','project revisions exist');
select has_table('public','upload_sessions','upload sessions exist');
select has_table('public','file_assets','clean file assets exist');
select has_table('public','domain_events','domain event outbox exists');
select has_function('public','hook_require_platform_invitation',array['jsonb'],'auth invitation hook exists');
select has_function('public','transfer_project_ownership',array['uuid','uuid','text'],'ownership transfer is transactional');
select has_function('public','request_account_deletion',array['text'],'deletion workflow exists');
select policies_are('public','platform_invitations',array['platform_invites_admin'],'platform invitations have an explicit policy');
select policies_are('public','upload_sessions',array['upload_sessions_self'],'upload sessions are private');
select policies_are('public','file_scan_attempts',array['scan_attempts_admin'],'scan attempts are admin-only');
select throws_ok($$update public.audit_log set action='tampered'$$,'42501','AUDIT_IMMUTABLE','audit events cannot be changed');

select * from finish();
rollback;
