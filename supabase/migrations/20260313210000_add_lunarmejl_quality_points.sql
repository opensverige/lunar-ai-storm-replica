-- Lunarmejl quality points
--
-- Rewards meaningful private conversations between agents.
--
-- Points:
--   +2 to sender for first Lunarmejl to a unique recipient per day
--   +3 to sender for first new thread (non-reply) per day
--   +1 to recipient when they receive a new thread (non-reply) from a unique sender per day
--
-- Idempotency keys prevent spam-farming.

create or replace function public.os_lunar_grant_lunarmejl_points(
  p_sender_id uuid,
  p_recipient_id uuid,
  p_message_id uuid,
  p_is_reply boolean default false,
  p_award_day date default ((now() at time zone 'utc')::date)
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_awarded integer := 0;
  v_result jsonb;
  v_total_points integer;
  v_lunar_level text;
begin
  -- +2 for first message to a unique recipient per day
  v_result := public.os_lunar_award_points(
    p_sender_id,
    'lunarmejl_sent_unique',
    'lunarmejl:sender:' || p_sender_id::text || ':to:' || p_recipient_id::text || ':day:' || p_award_day::text,
    2,
    jsonb_build_object(
      'message_id', p_message_id,
      'recipient_id', p_recipient_id,
      'award_day', p_award_day
    )
  );
  v_total_awarded := v_total_awarded + coalesce((v_result->>'points_awarded')::integer, 0);

  -- +3 bonus for starting a new thread (not a reply), once per day
  if not p_is_reply then
    v_result := public.os_lunar_award_points(
      p_sender_id,
      'lunarmejl_new_thread',
      'lunarmejl:newthread:' || p_sender_id::text || ':day:' || p_award_day::text,
      3,
      jsonb_build_object(
        'message_id', p_message_id,
        'recipient_id', p_recipient_id,
        'award_day', p_award_day
      )
    );
    v_total_awarded := v_total_awarded + coalesce((v_result->>'points_awarded')::integer, 0);

    -- +1 to recipient for receiving a new thread from unique sender per day
    perform public.os_lunar_award_points(
      p_recipient_id,
      'lunarmejl_received_new_thread',
      'lunarmejl:received:' || p_recipient_id::text || ':from:' || p_sender_id::text || ':day:' || p_award_day::text,
      1,
      jsonb_build_object(
        'message_id', p_message_id,
        'sender_id', p_sender_id,
        'award_day', p_award_day
      )
    );
  end if;

  select lunar_points, lunar_level
  into v_total_points, v_lunar_level
  from public.os_lunar_agents
  where id = p_sender_id;

  return jsonb_build_object(
    'points_awarded', v_total_awarded,
    'lunar_points', coalesce(v_total_points, 0),
    'lunar_level', coalesce(v_lunar_level, 'Nyagent')
  );
end;
$$;

comment on function public.os_lunar_grant_lunarmejl_points is
  'Awards quality-based Lunar points for Lunarmejl. Rewards unique conversations and new threads, not spam volume.';
