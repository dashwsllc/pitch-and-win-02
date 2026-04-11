create table if not exists company_goals (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  period      text check (period in ('daily','weekly','monthly')) not null,
  target      numeric,
  unit        text default 'BRL',
  current     numeric default 0,
  status      text check (status in ('on_track','at_risk','completed')) default 'on_track',
  deadline    date,
  created_by  uuid references auth.users,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table company_goals enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'company_goals' and policyname = 'exec_crud_goals') then
    create policy "exec_crud_goals" on company_goals for all using (is_executive(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'company_goals' and policyname = 'all_read_goals') then
    create policy "all_read_goals" on company_goals for select using (auth.role() = 'authenticated');
  end if;
end $$;

create trigger goals_updated_at before update on company_goals
  for each row execute function update_updated_at_column();
