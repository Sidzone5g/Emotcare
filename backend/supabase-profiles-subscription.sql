alter table public.profiles
  add column if not exists plan_purchased text,
  add column if not exists current_period_end timestamptz,
  add column if not exists subscription_status text default 'inactive';

update public.profiles
set subscription_status = 'inactive'
where subscription_status is null;
