create or replace function public.perform_draw(
  p_event_slug text,
  p_participant_id uuid,
  p_client_seed jsonb,
  p_server_seed text
)
returns table (
  draw_id uuid,
  prize_id uuid,
  prize_label text,
  amount_vnd bigint,
  proof_hash text,
  status text,
  row_hash text,
  draw_nonce bigint
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_event record;
  v_participant record;
  v_total_stock integer;
  v_rnd_bytes bytea;
  v_rnd_num bigint;
  v_slot bigint;
  v_ticket text;
  v_seed_compact text;
  v_prev_row_hash text;
  v_selected_prize_id uuid;
  v_selected_prize_label text;
  v_selected_prize_amount bigint;
  v_running bigint := 0;
  v_prize record;
  v_proof_hash text;
  v_row_hash text;
  v_hash_created_at_text text;
  v_new_draw_id uuid;
  v_created_at timestamptz := now();
begin
  if jsonb_typeof(p_client_seed) <> 'array' or jsonb_array_length(p_client_seed) <> 3 then
    raise exception 'invalid_client_seed';
  end if;

  select * into v_event
  from public.events
  where slug = p_event_slug
  for update;

  if not found then
    raise exception 'event_not_found';
  end if;

  if v_event.state <> 'fairness_locked' then
    raise exception 'state_not_locked';
  end if;

  select * into v_participant
  from public.participants
  where id = p_participant_id
    and event_id = v_event.id
    and draw_enabled = true
  for update;

  if not found then
    raise exception 'participant_not_found_or_disabled';
  end if;

  -- Enforce strict phase rule:
  -- office phase accepts only office participants, remote phase accepts only remote participants.
  if v_participant.participation_mode <> v_event.phase then
    raise exception 'phase_blocked';
  end if;

  if exists (
    select 1
    from public.draw_records dr
    where dr.event_id = v_event.id
      and dr.participant_id = p_participant_id
      and dr.is_effective = true
      and dr.status in ('locked', 'verified')
  ) then
    raise exception 'participant_already_drawn';
  end if;

  select coalesce(sum(remaining_stock), 0)
    into v_total_stock
  from public.prizes
  where event_id = v_event.id;

  if v_total_stock <= 0 then
    raise exception 'no_prize_stock';
  end if;

  select string_agg(value, '' order by ord)
    into v_seed_compact
  from jsonb_array_elements_text(p_client_seed) with ordinality as t(value, ord);

  v_ticket := v_event.id::text || '|' || p_participant_id::text || '|' || v_seed_compact || '|' || v_event.draw_nonce::text;
  v_rnd_bytes := hmac(convert_to(v_ticket, 'UTF8'), convert_to(p_server_seed, 'UTF8'), 'sha256'::text);
  v_rnd_num := ('x' || substr(encode(v_rnd_bytes, 'hex'), 1, 12))::bit(48)::bigint;
  v_slot := (v_rnd_num % v_total_stock) + 1;

  for v_prize in
    select pz.id, pz.label, pz.amount_vnd, pz.remaining_stock
    from public.prizes pz
    where pz.event_id = v_event.id
      and pz.remaining_stock > 0
    order by pz.display_order asc, pz.id asc
  loop
    v_running := v_running + v_prize.remaining_stock;
    if v_running >= v_slot then
      v_selected_prize_id := v_prize.id;
      v_selected_prize_label := v_prize.label;
      v_selected_prize_amount := v_prize.amount_vnd;
      exit;
    end if;
  end loop;

  if v_selected_prize_id is null then
    raise exception 'no_prize_selected';
  end if;

  update public.prizes
    set remaining_stock = remaining_stock - 1
  where id = v_selected_prize_id
    and remaining_stock > 0;

  if not found then
    raise exception 'prize_update_conflict';
  end if;

  select coalesce(dr.row_hash, 'GENESIS')
    into v_prev_row_hash
  from public.draw_records dr
  where dr.event_id = v_event.id
  order by dr.created_at desc, dr.id desc
  limit 1;

  if v_prev_row_hash is null then
    v_prev_row_hash := 'GENESIS';
  end if;

  v_hash_created_at_text := v_created_at::text;
  v_proof_hash := encode(digest(v_ticket || '|' || v_selected_prize_id::text || '|' || v_hash_created_at_text, 'sha256'), 'hex');
  v_row_hash := encode(digest(v_prev_row_hash || '|' || v_ticket || '|' || v_selected_prize_id::text || '|' || v_hash_created_at_text, 'sha256'), 'hex');

  insert into public.draw_records (
    event_id,
    participant_id,
    prize_id,
    status,
    ticket,
    client_seed_json,
    draw_nonce,
    proof_hash,
    prev_row_hash,
    row_hash,
    is_effective,
    verification_status,
    hash_created_at_text,
    created_at
  ) values (
    v_event.id,
    p_participant_id,
    v_selected_prize_id,
    'locked',
    v_ticket,
    p_client_seed,
    v_event.draw_nonce,
    v_proof_hash,
    v_prev_row_hash,
    v_row_hash,
    true,
    'pending',
    v_hash_created_at_text,
    v_created_at
  ) returning id into v_new_draw_id;

  update public.events e
    set draw_nonce = e.draw_nonce + 1,
        updated_at = now()
  where e.id = v_event.id;

  draw_id := v_new_draw_id;
  prize_id := v_selected_prize_id;
  prize_label := v_selected_prize_label;
  amount_vnd := v_selected_prize_amount;
  proof_hash := v_proof_hash;
  status := 'locked';
  row_hash := v_row_hash;
  draw_nonce := v_event.draw_nonce;

  return next;
end;
$$;
