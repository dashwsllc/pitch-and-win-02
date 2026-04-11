create table if not exists closing_forms (
  id               uuid primary key default gen_random_uuid(),
  closer_id        uuid references auth.users not null,
  lead_name        text not null,
  lead_whatsapp    text,
  product          text not null,
  value            numeric not null,
  objections_raised text,
  how_closed       text,
  next_steps       text,
  status           text check (status in ('won','lost','pending')) default 'pending',
  closed_at        timestamptz,
  created_at       timestamptz default now()
);

alter table closing_forms enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'closing_forms' and policyname = 'closer_own') then
    create policy "closer_own" on closing_forms for all using (closer_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'closing_forms' and policyname = 'exec_all') then
    create policy "exec_all" on closing_forms for all using (is_executive(auth.uid()));
  end if;
end $$;
