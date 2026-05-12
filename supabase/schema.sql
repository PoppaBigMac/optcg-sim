-- OPTCG Sim schema

create table if not exists games (
  id          uuid primary key default gen_random_uuid(),
  room_code   text unique not null,
  state       jsonb not null,          -- serialized GameState
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists game_players (
  game_id     uuid references games(id) on delete cascade,
  user_id     uuid references auth.users(id),
  slot        text not null check (slot in ('p1', 'p2')),
  display_name text not null,
  joined_at   timestamptz default now(),
  primary key (game_id, slot)
);

-- RLS
alter table games enable row level security;
alter table game_players enable row level security;

-- Players can read games they are in
create policy "game participants can read"
  on games for select
  using (
    exists (
      select 1 from game_players
      where game_id = games.id and user_id = auth.uid()
    )
  );

-- Players can update games they are in
create policy "game participants can update"
  on games for update
  using (
    exists (
      select 1 from game_players
      where game_id = games.id and user_id = auth.uid()
    )
  );

-- Anyone can create a game (host creates it)
create policy "anyone can create a game"
  on games for insert
  with check (true);

-- Players can read their own game_players rows
create policy "read own game_player rows"
  on game_players for select
  using (user_id = auth.uid());

-- Players can insert their own game_player row
create policy "insert own game_player row"
  on game_players for insert
  with check (user_id = auth.uid());

-- Auto-update updated_at on games
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger games_updated_at
  before update on games
  for each row execute function update_updated_at();
