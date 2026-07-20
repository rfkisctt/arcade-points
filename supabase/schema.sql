create table if not exists leaderboard (
  id          text primary key, 
  slug        text unique not null,       
  name        text not null,
  avatar_url  text not null default '',
  total_points  integer not null default 0,
  base_points   integer not null default 0,
  milestone_name  text not null default 'Belum Milestone',
  milestone_bonus integer not null default 0,
  game_count    integer not null default 0,
  skill_count   integer not null default 0,
  trivia_count  integer not null default 0,
  profile_url   text,                   
  owner_token   text,                  
  hidden      boolean not null default false,
  saved_at    bigint not null default extract(epoch from now()) * 1000
);

create index if not exists leaderboard_slug_idx on leaderboard (slug);

alter table leaderboard enable row level security;

create policy "Public read non-hidden"
  on leaderboard for select
  using (hidden = false);