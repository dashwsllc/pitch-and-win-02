alter table documents add column if not exists visible_to_roles text[] default '{}';
