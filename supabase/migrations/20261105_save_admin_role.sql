begin;

create or replace function public.save_admin_role(
  p_role_id bigint,
  p_name text,
  p_description text,
  p_permission_ids bigint[]
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_id bigint;
  old_name text;
  new_name text := btrim(p_name);
begin
  if coalesce(new_name, '') = '' then
    raise exception 'Nama peran wajib diisi' using errcode = '22023';
  end if;

  -- Account assignments use names, so names must be unique across guards.
  lock table public.roles in share row exclusive mode;

  if p_role_id is not null then
    select name into strict old_name from public.roles where id = p_role_id;
  end if;

  if new_name is distinct from old_name then
    if lower(new_name) = 'superadmin' or lower(old_name) = 'superadmin' then
      raise exception 'Nama peran Superadmin dilindungi' using errcode = '22023';
    end if;

    if exists (select 1 from public.roles where name = new_name) then
      raise exception 'Nama peran sudah digunakan' using errcode = '23505';
    end if;
  end if;

  if p_role_id is null then
    insert into public.roles (name, description, guard_name)
    values (new_name, p_description, 'web') returning id into saved_id;
  else
    update public.roles
    set name = new_name, description = p_description, updated_at = now()
    where id = p_role_id returning id into saved_id;

    if old_name <> new_name then
      update auth.users as u
      set raw_app_meta_data = u.raw_app_meta_data
        || case when u.raw_app_meta_data->>'role' = old_name
             then jsonb_build_object('role', new_name) else '{}'::jsonb end
        || case when jsonb_typeof(u.raw_app_meta_data->'roles') = 'array'
                  and u.raw_app_meta_data->'roles' ? old_name then
             jsonb_build_object('roles', (
               select jsonb_agg(
                 case when value = to_jsonb(old_name) then to_jsonb(new_name) else value end
                 order by position
               )
               from jsonb_array_elements(u.raw_app_meta_data->'roles') with ordinality as roles(value, position)
             )) else '{}'::jsonb end
      where u.raw_app_meta_data->>'role' = old_name
         or u.raw_app_meta_data->'roles' ? old_name;
    end if;

    delete from public.role_has_permissions where role_id = saved_id;
  end if;

  insert into public.role_has_permissions (role_id, permission_id)
  select distinct saved_id, permission_id from unnest(p_permission_ids) as selected(permission_id);

  return saved_id;
end;
$$;

revoke all on function public.save_admin_role(bigint, text, text, bigint[]) from public, anon, authenticated;
grant execute on function public.save_admin_role(bigint, text, text, bigint[]) to service_role;

create or replace function public.delete_admin_role(p_role_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  role_name text;
begin
  lock table public.roles in share row exclusive mode;
  select name into strict role_name from public.roles where id = p_role_id;

  if lower(role_name) = 'superadmin' then
    raise exception 'Peran Superadmin dilindungi' using errcode = '22023';
  end if;

  if exists (
    select 1 from auth.users as u
    where u.raw_app_meta_data->>'role' = role_name or u.raw_app_meta_data->'roles' ? role_name
  ) then
    raise exception 'Pindahkan akun yang memakai peran ini sebelum menghapusnya' using errcode = '23503';
  end if;

  delete from public.roles where id = p_role_id;
  return p_role_id;
end;
$$;

revoke all on function public.delete_admin_role(bigint) from public, anon, authenticated;
grant execute on function public.delete_admin_role(bigint) to service_role;

notify pgrst, 'reload schema';
commit;
