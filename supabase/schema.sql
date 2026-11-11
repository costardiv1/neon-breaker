-- Neon Breaker: online leaderboard.
-- Run this once in the Supabase project (SQL Editor > New query > Run).
-- Then put the project URL and the anon public key in www/js/online.js.

create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  player     uuid        not null,             -- random id of the device
  name       text        not null,             -- nickname, 3 to 10 letters/digits
  score      integer     not null,
  cleared    integer     not null,             -- stages cleared in the run
  stage      integer     not null,             -- stage where the run ended
  version    text        not null,
  created_at timestamptz not null default now()
);
create index if not exists scores_score on public.scores (score desc);
create index if not exists scores_player on public.scores (player, created_at desc);
create index if not exists scores_created on public.scores (created_at);

-- No policies: nobody reads or writes the table directly, only through the
-- two functions below (security definer).
alter table public.scores enable row level security;

create or replace function public.submit_score(
  p_player uuid, p_name text, p_score integer, p_cleared integer, p_stage integer, p_version text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_name !~ '^[A-Z0-9]{3,10}$' then raise exception 'invalid name' using errcode = '22023'; end if;
  if p_score <= 0 or p_cleared < 0 or p_cleared > 5000 or p_stage < 0 or p_stage > 100
     or length(p_version) > 12 then
    raise exception 'invalid data' using errcode = '22023';
  end if;
  -- points per stage have a ceiling; a run cannot have more than that
  if p_score > (p_cleared + 1) * 10000 then raise exception 'impossible score' using errcode = '22023'; end if;
  -- at most one run every 20 seconds per device
  if exists (select 1 from scores where player = p_player and created_at > now() - interval '20 seconds') then
    raise exception 'too fast' using errcode = '22023';
  end if;
  insert into scores (player, name, score, cleared, stage, version)
  values (p_player, p_name, p_score, p_cleared, p_stage, p_version);
end $$;

-- p_period: 'all' or 'week' (since Monday, UTC). Best run of each device,
-- the top 100 and the position of p_player.
create or replace function public.top_scores(p_period text, p_player uuid)
returns json language sql stable security definer set search_path = public as $$
  with pool as (
    select * from scores where p_period <> 'week' or created_at >= date_trunc('week', now())
  ), best as (
    select distinct on (player) player, name, score, stage
    from pool order by player, score desc, created_at
  ), ranked as (
    select *, rank() over (order by score desc) as pos from best
  )
  select json_build_object(
    'rows', coalesce((select json_agg(json_build_object('pos', pos, 'name', name, 'score', score, 'stage', stage) order by pos)
                      from (select * from ranked order by pos limit 100) t), '[]'::json),
    'me', (select json_build_object('pos', pos, 'score', score) from ranked where player = p_player)
  );
$$;

revoke all on function public.submit_score(uuid, text, integer, integer, integer, text) from public;
revoke all on function public.top_scores(text, uuid) from public;
grant execute on function public.submit_score(uuid, text, integer, integer, integer, text) to anon;
grant execute on function public.top_scores(text, uuid) to anon;
