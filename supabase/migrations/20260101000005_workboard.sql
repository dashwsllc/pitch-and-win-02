create table if not exists workboard_tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  created_by   uuid references auth.users not null,
  assigned_to  uuid[],
  target_roles text[],
  deadline     date,
  priority     text check (priority in ('low','medium','high')) default 'medium',
  is_active    boolean default true,
  created_at   timestamptz default now()
);

create table if not exists workboard_completions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid references workboard_tasks on delete cascade not null,
  user_id      uuid references auth.users not null,
  completed_at timestamptz default now(),
  unique(task_id, user_id)
);

alter table workboard_tasks enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'workboard_tasks' and policyname = 'exec_crud_tasks') then
    create policy "exec_crud_tasks" on workboard_tasks for all using (is_executive(auth.uid()));
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'workboard_tasks' and policyname = 'member_read_tasks') then
    create policy "member_read_tasks" on workboard_tasks
      for select using (
        is_active = true
        and (
          assigned_to is null
          or auth.uid() = any(assigned_to)
        )
        and (
          target_roles is null
          or get_user_role(auth.uid()) = any(target_roles)
        )
      );
  end if;
end $$;

alter table workboard_completions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'workboard_completions' and policyname = 'own_completions') then
    create policy "own_completions" on workboard_completions for all using (user_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'workboard_completions' and policyname = 'exec_read_completions') then
    create policy "exec_read_completions" on workboard_completions for select using (is_executive(auth.uid()));
  end if;
end $$;
