create table if not exists announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  pinned      boolean default false,
  created_by  uuid references auth.users not null,
  created_at  timestamptz default now()
);

alter table announcements enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'announcements' and policyname = 'exec_crud_ann') then
    create policy "exec_crud_ann" on announcements for all using (is_executive(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'announcements' and policyname = 'all_read_ann') then
    create policy "all_read_ann" on announcements for select using (auth.role() = 'authenticated');
  end if;
end $$;
