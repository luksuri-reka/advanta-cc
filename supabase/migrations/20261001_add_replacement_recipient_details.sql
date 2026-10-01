-- Keep replacement delivery data structured so fulfilment and exports do not
-- depend on parsing a single free-text address.

alter table public.complaint_observations
  add column if not exists replacement_recipient_name text,
  add column if not exists replacement_recipient_phone text,
  add column if not exists replacement_destination_village text,
  add column if not exists replacement_destination_district text,
  add column if not exists replacement_destination_regency text,
  add column if not exists replacement_destination_province text;
alter table public.complaint_approvals
  add column if not exists replacement_recipient_name text,
  add column if not exists replacement_recipient_phone text,
  add column if not exists replacement_destination_village text,
  add column if not exists replacement_destination_district text,
  add column if not exists replacement_destination_regency text,
  add column if not exists replacement_destination_province text;
