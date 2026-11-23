begin;

-- Authorize internal writes through the app API. Public complaint forms also use the API.
revoke insert, update, delete, truncate on table
  public.complaints,
  public.complaint_responses,
  public.complaint_observations,
  public.complaint_investigations,
  public.complaint_lab_testing,
  public.complaint_approvals,
  public.complaint_assignments,
  public.user_complaint_profiles,
  public.complaint_system_settings,
  public.complaint_categories,
  public.complaint_sub_categories,
  public.complaint_case_types
from public, anon, authenticated;

-- Keep the caller JWT for the shipping audit. The trigger checks the caller and records history.
grant update (replacement_shipment_status, replacement_shipped_date)
on public.complaints to authenticated;

create or replace function public.audit_complaint_replacement_shipment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_metadata jsonb := coalesce(auth.jwt()->'app_metadata', '{}'::jsonb);
  actor_roles jsonb := actor_metadata->'roles';
  actor_name text;
  old_status text;
  old_date date;
  old_label text;
  new_label text;
begin
  if TG_OP = 'UPDATE' then
    if new.replacement_shipment_status is not distinct from old.replacement_shipment_status
      and new.replacement_shipped_date is not distinct from old.replacement_shipped_date then
      return new;
    end if;
    old_status := old.replacement_shipment_status;
    old_date := old.replacement_shipped_date;
  elsif new.replacement_shipment_status is null and new.replacement_shipped_date is null then
    return new;
  end if;

  if actor_id is null or not (
    coalesce(exists (
      select 1
      from jsonb_array_elements_text(case when jsonb_typeof(actor_roles) = 'array' then actor_roles else '[]'::jsonb end) as roles(name)
      where lower(roles.name) = 'superadmin'
    ) or (
      not exists (
        select 1 from jsonb_array_elements(case when jsonb_typeof(actor_roles) = 'array' then actor_roles else '[]'::jsonb end) as roles(value)
        where jsonb_typeof(roles.value) = 'string' and roles.value <> '""'::jsonb
      ) and lower(actor_metadata->>'role') = 'superadmin'
    ), false)
    or exists (
      select 1 from public.user_complaint_profiles p
      where p.user_id = actor_id and p.is_active = true
        and p.complaint_permissions @> '{"canViewComplaints":true}'::jsonb
        and coalesce(p.complaint_permissions->'canEditComplaints', p.complaint_permissions->'canUpdateComplaintStatus') = 'true'::jsonb
        and (coalesce(cardinality(p.assigned_regions), 0) = 0 or old.customer_province = any(p.assigned_regions))
    )
  ) then
    raise exception 'Anda tidak memiliki hak untuk memperbarui pengiriman' using errcode = '42501';
  end if;

  -- Clear stale dates when changing away from Sudah.
  if new.replacement_shipment_status is distinct from 'shipped' then
    new.replacement_shipped_date := null;
  end if;

  old_label := case old_status
    when 'shipped' then 'Sudah'
    when 'pending' then 'Belum'
    when 'not_required' then 'Tidak Ada Penggantian Benih'
    else 'Belum diisi' end;
  new_label := case new.replacement_shipment_status
    when 'shipped' then 'Sudah'
    when 'pending' then 'Belum'
    when 'not_required' then 'Tidak Ada Penggantian Benih'
    else 'Belum diisi' end;

  select p.full_name into actor_name
  from public.user_complaint_profiles p where p.user_id = actor_id;
  actor_name := coalesce(nullif(actor_name, ''), auth.jwt()->'user_metadata'->>'name', auth.jwt()->>'email', 'Admin');

  insert into public.complaint_responses (complaint_id, message, admin_name, admin_id, is_internal)
  values (
    new.id,
    format('Pengiriman benih pengganti diubah dari "%s" (tanggal: %s) menjadi "%s" (tanggal: %s).',
      old_label, coalesce(to_char(old_date, 'DD/MM/YYYY'), '-'),
      new_label, coalesce(to_char(new.replacement_shipped_date, 'DD/MM/YYYY'), '-')),
    actor_name, actor_id, true
  );

  new.updated_at := now();
  return new;
end;
$$;

notify pgrst, 'reload schema';
commit;
