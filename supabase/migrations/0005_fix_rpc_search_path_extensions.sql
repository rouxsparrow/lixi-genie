alter function public.event_state_projection(text)
  set search_path = public, extensions;

alter function public.perform_draw(text, uuid, jsonb, text)
  set search_path = public, extensions;

alter function public.void_latest_draw(text, text)
  set search_path = public, extensions;

alter function public.reveal_and_verify_event(text, text)
  set search_path = public, extensions;
