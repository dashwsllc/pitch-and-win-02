create table if not exists team_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  content     text,
  file_url    text,
  file_name   text,
  file_type   text,
  link_url    text,
  link_title  text,
  created_at  timestamptz default now()
);

create table if not exists message_reactions (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid references team_messages on delete cascade not null,
  user_id     uuid references auth.users not null,
  emoji       text not null,
  created_at  timestamptz default now(),
  unique(message_id, user_id, emoji)
);

alter table team_messages enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'team_messages' and policyname = 'all_rw_messages') then
    create policy "all_rw_messages" on team_messages for all using (auth.role() = 'authenticated');
  end if;
end $$;

alter table message_reactions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'message_reactions' and policyname = 'all_rw_reactions') then
    create policy "all_rw_reactions" on message_reactions for all using (auth.role() = 'authenticated');
  end if;
end $$;
