-- =====================================================================
-- Shubhi's Bake A Wish — online orders & tracking (Supabase / Postgres)
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- menu (the server's own price list; the browser is never trusted for prices) ----------
create table if not exists public.menu_items (
  slug        text primary key,
  name        text not null,
  note        text,
  price_paise integer check (price_paise is null or price_paise > 0),  -- null = price on request
  category    text not null,
  available   boolean not null default true
);

insert into public.menu_items (slug, name, note, price_paise, category) values
  ('jowar-joy', 'Jowar Joy', '100g', 16900, 'Millet Range'),
  ('ragi-rich', 'Ragi Rich', '100g', 16900, 'Millet Range'),
  ('multigrain-magic', 'Multigrain Magic', '100g', 16900, 'Millet Range'),
  ('millet-laddo', 'Millet Laddo', '200g', 32000, 'Millet Range'),
  ('millet-samosa', 'Millet Samosa', '200g', 32000, 'Millet Range'),
  ('apple-pie', 'Apple Pie', null, 23000, 'Desserts'),
  ('tiramisu', 'Tiramisu', 'a slice', 25000, 'Desserts'),
  ('strawberry-cheesecake', 'Strawberry Cheesecake', null, 25000, 'Desserts'),
  ('blueberry-cheesecake', 'Blueberry Cheesecake', null, 25000, 'Desserts'),
  ('biscoff-cheesecake', 'Biscoff Cheesecake', null, 25000, 'Desserts'),
  ('classic-tres-leches', 'Classic Tres Leches', 'per slice', 22000, 'Desserts'),
  ('lemon-chiffon', 'Lemon Chiffon', null, 19000, 'Desserts'),
  ('hummingbird-cake', 'Hummingbird Cake', 'slice', 25000, 'Desserts'),
  ('chocolate-eclair', 'Chocolate Eclair', null, 12000, 'Desserts'),
  ('cinnabon', 'Cinnabon', null, 15000, 'Desserts'),
  ('almond-raisin-cookie', 'Almond Raisin Cookie', '100g', 14900, 'Desserts'),
  ('butter-coconut-cookies', 'Butter Coconut Cookies', '100g', 14900, 'Desserts'),
  ('potato-pinwheels', 'Potato Pinwheels', null, 9000, 'Savouries'),
  ('minced-lamb-toast', 'Minced Lamb on Toast', null, 18500, 'Savouries'),
  ('mushroom-toast', 'Mushroom on Toast', null, 13000, 'Savouries'),
  ('scrambled-egg-toast', 'Scrambled Egg on Toast', null, 11000, 'Savouries'),
  ('cottage-cheese-cutlet', 'Cottage Cheese Cutlet', null, 14000, 'Savouries'),
  ('cheese-garlic-bread', 'Cheese Garlic Bread', null, 10000, 'Savouries'),
  ('garlic-bites', 'Garlic Bites', null, 6000, 'Savouries'),
  ('mushroom-croissant', 'Mushroom Croissant', null, 19000, 'Bakes & More'),
  ('cheese-corn-bun', 'Cheese Corn Bun', null, null, 'Bakes & More'),
  ('smoothie-bowl', 'Smoothie Bowl', null, 13000, 'Bakes & More'),
  ('custom-cake', 'Custom cake', 'made to order', null, 'Custom')
on conflict (slug) do update set name = excluded.name, note = excluded.note,
  price_paise = excluded.price_paise, category = excluded.category;

-- ---------- orders ----------
do $$ begin
  create type public.order_status as enum
    ('received','confirmed','baking','ready','out_for_delivery','completed','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  status          public.order_status not null default 'received',
  customer_name   text not null check (char_length(customer_name) between 2 and 80),
  phone           text not null check (phone ~ '^[0-9]{10,13}$'),
  fulfilment      text not null check (fulfilment in ('pickup','delivery')),
  address         text check (char_length(address) <= 300),
  wanted_date     date not null,
  wanted_time     text check (char_length(wanted_time) <= 20),
  note            text check (char_length(note) <= 500),
  items           jsonb not null,
  total_paise     integer not null,
  has_on_request  boolean not null default false,
  staff_message   text check (char_length(staff_message) <= 300)
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_phone_idx on public.orders (phone, created_at desc);

create table if not exists public.order_events (
  id        bigserial primary key,
  order_id  uuid not null references public.orders(id) on delete cascade,
  status    public.order_status not null,
  at        timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id, at);

-- ---------- staff (who may see and update orders) ----------
create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

-- ---------- row level security ----------
alter table public.menu_items   enable row level security;
alter table public.orders       enable row level security;
alter table public.order_events enable row level security;
alter table public.staff        enable row level security;

drop policy if exists "menu readable by all"  on public.menu_items;
drop policy if exists "staff edit menu"       on public.menu_items;
drop policy if exists "staff read orders"     on public.orders;
drop policy if exists "staff update orders"   on public.orders;
drop policy if exists "staff read events"     on public.order_events;
drop policy if exists "staff read self"       on public.staff;

create policy "menu readable by all" on public.menu_items for select using (true);
create policy "staff edit menu"      on public.menu_items for update using (public.is_staff()) with check (public.is_staff());
create policy "staff read orders"    on public.orders for select using (public.is_staff());
create policy "staff update orders"  on public.orders for update using (public.is_staff()) with check (public.is_staff());
create policy "staff read events"    on public.order_events for select using (public.is_staff());
create policy "staff read self"      on public.staff for select using (user_id = auth.uid());
-- Customers never read or write these tables directly: they go through the two functions below.

-- ---------- status changes are logged automatically ----------
create or replace function public.log_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_events (order_id, status) values (new.id, new.status);
  end if;
  if tg_op = 'UPDATE' then new.updated_at := now(); end if;
  return new;
end $$;

drop trigger if exists orders_status_log_ins on public.orders;
drop trigger if exists orders_status_log_upd on public.orders;
create trigger orders_status_log_ins after insert on public.orders for each row execute function public.log_status();
create trigger orders_status_log_upd before update on public.orders for each row execute function public.log_status();
-- (the BEFORE UPDATE trigger stamps updated_at; logging an event from BEFORE is fine because the row id already exists)

-- staff may only change status and the message to the customer, never prices or contact details
create or replace function public.guard_order_update() returns trigger
language plpgsql as $$
begin
  if (new.code, new.customer_name, new.phone, new.items, new.total_paise, new.created_at)
     is distinct from (old.code, old.customer_name, old.phone, old.items, old.total_paise, old.created_at) then
    raise exception 'Only the status and message can be changed';
  end if;
  return new;
end $$;
drop trigger if exists orders_guard on public.orders;
create trigger orders_guard before update on public.orders for each row execute function public.guard_order_update();

-- ---------- place an order (called by the website) ----------
create or replace function public.place_order(
  p_name text, p_phone text, p_fulfilment text, p_address text,
  p_date date, p_time text, p_note text, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_phone  text := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  v_lines  jsonb := '[]'::jsonb;
  v_total  integer := 0;
  v_onreq  boolean := false;
  v_item   record;
  v_menu   public.menu_items;
  v_code   text;
  v_alpha  text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  i int;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your basket is empty' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) > 30 then raise exception 'Too many lines in one order' using errcode = 'P0001'; end if;
  if char_length(trim(coalesce(p_name,''))) < 2 then raise exception 'Please add your name' using errcode = 'P0001'; end if;
  if v_phone !~ '^[0-9]{10,13}$' then raise exception 'Please add a valid phone number' using errcode = 'P0001'; end if;
  if p_fulfilment not in ('pickup','delivery') then raise exception 'Choose pickup or delivery' using errcode = 'P0001'; end if;
  if p_fulfilment = 'delivery' and char_length(trim(coalesce(p_address,''))) < 8 then
    raise exception 'Please add a delivery address' using errcode = 'P0001';
  end if;
  if p_date is null or p_date < (now() at time zone 'Asia/Kolkata')::date or p_date > (now() at time zone 'Asia/Kolkata')::date + 60 then
    raise exception 'Choose a date from today up to 60 days ahead' using errcode = 'P0001';
  end if;
  -- simple flood guard: at most 5 orders per phone number per hour
  if (select count(*) from public.orders where phone = v_phone and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many orders from this number — please message the café' using errcode = 'P0001';
  end if;

  for v_item in select * from jsonb_to_recordset(p_items) as x(slug text, qty int) loop
    if v_item.qty is null or v_item.qty < 1 or v_item.qty > 20 then
      raise exception 'Quantities must be between 1 and 20' using errcode = 'P0001';
    end if;
    select * into v_menu from public.menu_items where slug = v_item.slug and available;
    if not found then raise exception 'An item in your basket is not available' using errcode = 'P0001'; end if;
    v_lines := v_lines || jsonb_build_object('slug', v_menu.slug, 'name', v_menu.name, 'qty', v_item.qty,
                                             'unit_paise', v_menu.price_paise);
    if v_menu.price_paise is null then v_onreq := true; else v_total := v_total + v_menu.price_paise * v_item.qty; end if;
  end loop;

  loop
    v_code := 'SBW-';
    for i in 1..6 loop v_code := v_code || substr(v_alpha, 1 + (get_byte(gen_random_bytes(1),0) % length(v_alpha)), 1); end loop;
    exit when not exists (select 1 from public.orders where code = v_code);
  end loop;

  insert into public.orders (code, customer_name, phone, fulfilment, address, wanted_date, wanted_time, note,
                             items, total_paise, has_on_request)
  values (v_code, trim(p_name), v_phone, p_fulfilment,
          case when p_fulfilment = 'delivery' then trim(p_address) end,
          p_date, nullif(trim(coalesce(p_time,'')), ''), nullif(trim(coalesce(p_note,'')), ''),
          v_lines, v_total, v_onreq);

  return jsonb_build_object('code', v_code, 'total_paise', v_total, 'has_on_request', v_onreq);
end $$;

-- ---------- track an order (code + last 4 digits of the phone) ----------
create or replace function public.track_order(p_code text, p_last4 text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders
   where code = upper(trim(p_code)) and right(phone, 4) = regexp_replace(coalesce(p_last4,''), '\D', '', 'g');
  if not found then return null; end if;
  return jsonb_build_object(
    'code', o.code, 'status', o.status, 'created_at', o.created_at, 'updated_at', o.updated_at,
    'fulfilment', o.fulfilment, 'wanted_date', o.wanted_date, 'wanted_time', o.wanted_time,
    'items', o.items, 'total_paise', o.total_paise, 'has_on_request', o.has_on_request,
    'message', o.staff_message,
    'first_name', split_part(o.customer_name, ' ', 1),
    'events', (select coalesce(jsonb_agg(jsonb_build_object('status', e.status, 'at', e.at) order by e.at), '[]'::jsonb)
                 from public.order_events e where e.order_id = o.id));
end $$;

revoke all on function public.place_order(text,text,text,text,date,text,text,jsonb) from public;
revoke all on function public.track_order(text,text) from public;
grant execute on function public.place_order(text,text,text,text,date,text,text,jsonb) to anon, authenticated;
grant execute on function public.track_order(text,text) to anon, authenticated;
grant execute on function public.is_staff() to authenticated;
