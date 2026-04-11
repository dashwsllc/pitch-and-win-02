-- CRM de Leads
create table if not exists crm_leads (
  id            uuid primary key default gen_random_uuid(),
  created_by    uuid references auth.users not null,
  name          text not null,
  whatsapp      text,
  email         text,
  source        text,
  qualification text check (qualification in ('cold','warm','hot')) default 'cold',
  notes         text,
  last_contact_at timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists crm_activities (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references crm_leads on delete cascade not null,
  user_id     uuid references auth.users not null,
  type        text check (type in ('call','message','meeting','note','status_change')) not null,
  description text,
  created_at  timestamptz default now()
);

alter table crm_leads enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'crm_leads' and policyname = 'bdr_own') then
    create policy "bdr_own" on crm_leads for all using (created_by = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'crm_leads' and policyname = 'exec_all') then
    create policy "exec_all" on crm_leads for all using (is_executive(auth.uid()));
  end if;
end $$;

alter table crm_activities enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'crm_activities' and policyname = 'own_activities') then
    create policy "own_activities" on crm_activities for all using (user_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'crm_activities' and policyname = 'exec_all_activities') then
    create policy "exec_all_activities" on crm_activities for all using (is_executive(auth.uid()));
  end if;
end $$;

create trigger crm_leads_updated_at before update on crm_leads
  for each row execute function update_updated_at_column();
