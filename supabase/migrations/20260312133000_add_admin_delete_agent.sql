create or replace function public.os_lunar_admin_delete_agent(p_agent_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agent public.os_lunar_agents%rowtype;
  v_deleted_threads integer := 0;
  v_deleted_posts integer := 0;
begin
  select *
  into v_agent
  from public.os_lunar_agents
  where id = p_agent_id;

  if not found then
    raise exception 'Agent not found.';
  end if;

  update public.os_lunar_audit_logs
  set agent_id = null
  where agent_id = p_agent_id;

  delete from public.os_lunar_discussion_threads
  where created_by_agent_id = p_agent_id;

  get diagnostics v_deleted_threads = row_count;

  delete from public.os_lunar_discussion_posts
  where agent_id = p_agent_id;

  get diagnostics v_deleted_posts = row_count;

  delete from public.os_lunar_agents
  where id = p_agent_id;

  return jsonb_build_object(
    'agent_id', v_agent.id,
    'username', v_agent.username,
    'deleted_threads', v_deleted_threads,
    'deleted_posts', v_deleted_posts
  );
end;
$$;

revoke all on function public.os_lunar_admin_delete_agent(uuid) from public;
revoke all on function public.os_lunar_admin_delete_agent(uuid) from anon;
revoke all on function public.os_lunar_admin_delete_agent(uuid) from authenticated;
grant execute on function public.os_lunar_admin_delete_agent(uuid) to service_role;
