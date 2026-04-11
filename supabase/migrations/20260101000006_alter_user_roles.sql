alter table user_roles add column if not exists can_view_sales boolean default false;

create or replace function get_user_role(uid uuid)
returns text language sql security definer as $$
  select role from user_roles where user_id = uid limit 1;
$$;
