create table if not exists playbooks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  content      text not null,
  type         text check (type in (
                 'sdr_approach',
                 'closer_inspiration',
                 'objection_handler',
                 'general'
               )) not null,
  target_roles text[] not null default '{}',
  tags         text[] default '{}',
  is_active    boolean default true,
  created_by   uuid references auth.users,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table playbooks enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'playbooks' and policyname = 'exec_crud') then
    create policy "exec_crud" on playbooks for all using (is_executive(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'playbooks' and policyname = 'role_read') then
    create policy "role_read" on playbooks
      for select using (
        is_active = true
        and (get_user_role(auth.uid()) = any(target_roles) or 'all' = any(target_roles))
      );
  end if;
end $$;

create trigger playbooks_updated_at before update on playbooks
  for each row execute function update_updated_at_column();
