begin;
set local lock_timeout = '10s';
set local statement_timeout = '30s';

-- No default or backfill: older complaints remain explicitly unfilled.
alter table public.complaints
  add column if not exists replacement_shipment_status text,
  add column if not exists replacement_shipped_date date;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.complaints'::regclass
      and conname = 'complaints_replacement_shipment_check'
  ) then
    alter table public.complaints
      add constraint complaints_replacement_shipment_check check (
        (replacement_shipment_status is null and replacement_shipped_date is null)
        or (replacement_shipment_status is not null and (
          (replacement_shipment_status = 'shipped' and replacement_shipped_date is not null)
          or (replacement_shipment_status in ('pending', 'not_required') and replacement_shipped_date is null)
        ))
      );
  end if;
end $$;

-- Check permissions and append internal history atomically, including writes
-- through the general complaint PATCH endpoint or directly through PostgREST.
-- Run the audit as owner so users do not need direct history INSERT access.
-- The complaint UPDATE still follows the caller's existing RLS policies.
create or replace function public.audit_complaint_replacement_shipment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_roles jsonb := coalesce(auth.jwt()->'app_metadata'->'roles', '[]'::jsonb);
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
    actor_roles @> '["Superadmin"]'::jsonb
    or actor_roles @> '["superadmin"]'::jsonb
    or exists (
      select 1 from public.user_complaint_profiles p
      where p.user_id = actor_id and p.is_active = true
        and p.complaint_permissions @> '{"canUpdateComplaintStatus":true}'::jsonb
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

revoke all on function public.audit_complaint_replacement_shipment() from public;

drop trigger if exists audit_complaint_replacement_shipment on public.complaints;
create trigger audit_complaint_replacement_shipment
  before update of replacement_shipment_status, replacement_shipped_date on public.complaints
  for each row execute function public.audit_complaint_replacement_shipment();

-- Shipment data is filled after the complaint exists. Block prefilled values
-- on INSERT so no history row can reference an as-yet uninserted complaint.
create or replace function public.check_initial_complaint_replacement_shipment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.replacement_shipment_status is not null or new.replacement_shipped_date is not null then
    raise exception 'Isi pengiriman setelah komplain dibuat' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.check_initial_complaint_replacement_shipment() from public;
drop trigger if exists check_initial_complaint_replacement_shipment on public.complaints;
create trigger check_initial_complaint_replacement_shipment
  before insert on public.complaints
  for each row execute function public.check_initial_complaint_replacement_shipment();

notify pgrst, 'reload schema';
commit;
