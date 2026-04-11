create table if not exists traffic_metrics (
  id              uuid primary key default gen_random_uuid(),
  manager_id      uuid references auth.users not null,
  date            date not null,
  platform        text check (platform in ('meta','google','tiktok','youtube','other')) not null default 'meta',
  campaign_name   text not null,
  ad_set_name     text,
  impressions     integer default 0,
  clicks          integer default 0,
  ctr             numeric,
  cpc             numeric,
  cpl             numeric,
  spend           numeric not null default 0,
  leads_generated integer default 0,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(manager_id, date, platform, campaign_name)
);

create or replace function calc_ctr() returns trigger language plpgsql as $$
begin
  new.ctr := case when new.impressions > 0
    then round((new.clicks::numeric / new.impressions * 100)::numeric, 2)
    else 0 end;
  new.cpc := case when new.clicks > 0
    then round((new.spend / new.clicks)::numeric, 2)
    else 0 end;
  new.cpl := case when new.leads_generated > 0
    then round((new.spend / new.leads_generated)::numeric, 2)
    else 0 end;
  return new;
end;
$$;

create trigger traffic_ctr before insert or update on traffic_metrics
  for each row execute function calc_ctr();

alter table traffic_metrics enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'traffic_metrics' and policyname = 'manager_own') then
    create policy "manager_own" on traffic_metrics for all using (manager_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'traffic_metrics' and policyname = 'exec_all') then
    create policy "exec_all" on traffic_metrics for all using (is_executive(auth.uid()));
  end if;
end $$;

create trigger traffic_updated_at before update on traffic_metrics
  for each row execute function update_updated_at_column();
