-- UTEC Carpool — Initial Schema
-- Run this in Supabase SQL editor or via supabase db push

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null check (email like '%@utec.edu.pe'),
  role        text not null check (role in ('passenger', 'driver', 'both')),
  gender      text not null check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  age         int  not null check (age >= 16 and age <= 99),
  career      text not null,
  cycle       int  not null check (cycle >= 1 and cycle <= 10),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read all profiles"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ─────────────────────────────────────────
-- driver_profiles
-- ─────────────────────────────────────────
create table public.driver_profiles (
  id                  uuid primary key references public.profiles(id) on delete cascade,
  license_photo_url   text,
  license_number      text not null,
  plate               text not null,
  car_brand           text not null,
  car_model           text not null,
  car_color           text not null,
  car_year            int  not null,
  yape_qr_url         text,
  search_radius_km    float not null default 3.0,
  preferred_routes    jsonb not null default '{}',
  is_verified         boolean not null default false
);

alter table public.driver_profiles enable row level security;

create policy "Anyone can read driver profiles"
  on public.driver_profiles for select using (true);

create policy "Drivers can update own profile"
  on public.driver_profiles for update using (auth.uid() = id);

create policy "Drivers can insert own profile"
  on public.driver_profiles for insert with check (auth.uid() = id);

-- ─────────────────────────────────────────
-- locations
-- ─────────────────────────────────────────
create table public.locations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  label      text not null,
  lat        float not null,
  lng        float not null,
  address    text not null,
  is_home    boolean not null default false
);

alter table public.locations enable row level security;

create policy "Users can read own locations"
  on public.locations for select using (auth.uid() = user_id);

create policy "Users can insert own locations"
  on public.locations for insert with check (auth.uid() = user_id);

create policy "Users can update own locations"
  on public.locations for update using (auth.uid() = user_id);

create policy "Users can delete own locations"
  on public.locations for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- schedules
-- ─────────────────────────────────────────
create table public.schedules (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles(id) on delete cascade,
  day_of_week              int  not null check (day_of_week >= 0 and day_of_week <= 6),
  departure_time           time not null,
  direction                text not null check (direction in ('to_utec', 'from_utec')),
  google_calendar_event_id text,
  is_active                boolean not null default true
);

alter table public.schedules enable row level security;

create policy "Users can read own schedules"
  on public.schedules for select using (auth.uid() = user_id);

create policy "Drivers can be found by passengers (active schedules)"
  on public.schedules for select using (is_active = true);

create policy "Users can insert own schedules"
  on public.schedules for insert with check (auth.uid() = user_id);

create policy "Users can update own schedules"
  on public.schedules for update using (auth.uid() = user_id);

create policy "Users can delete own schedules"
  on public.schedules for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- trips
-- ─────────────────────────────────────────
create table public.trips (
  id                     uuid primary key default gen_random_uuid(),
  driver_id              uuid not null references public.profiles(id) on delete cascade,
  schedule_id            uuid not null references public.schedules(id) on delete cascade,
  available_seats        int  not null check (available_seats >= 0 and available_seats <= 4),
  status                 text not null default 'open' check (status in ('open', 'full', 'cancelled')),
  estimated_price_soles  float not null check (estimated_price_soles >= 0),
  created_at             timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "Anyone can read open trips"
  on public.trips for select using (status = 'open');

create policy "Drivers can read all own trips"
  on public.trips for select using (auth.uid() = driver_id);

create policy "Drivers can insert own trips"
  on public.trips for insert with check (auth.uid() = driver_id);

create policy "Drivers can update own trips"
  on public.trips for update using (auth.uid() = driver_id);

-- ─────────────────────────────────────────
-- trip_requests
-- ─────────────────────────────────────────
create table public.trip_requests (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references public.trips(id) on delete cascade,
  passenger_id    uuid not null references public.profiles(id) on delete cascade,
  pickup_lat      float not null,
  pickup_lng      float not null,
  pickup_address  text not null,
  status          text not null default 'pending'
                  check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at      timestamptz not null default now(),
  unique (trip_id, passenger_id)
);

alter table public.trip_requests enable row level security;

create policy "Passengers can read own requests"
  on public.trip_requests for select using (auth.uid() = passenger_id);

create policy "Drivers can read requests for own trips"
  on public.trip_requests for select
  using (exists (
    select 1 from public.trips
    where trips.id = trip_requests.trip_id
      and trips.driver_id = auth.uid()
  ));

create policy "Passengers can insert own requests"
  on public.trip_requests for insert with check (auth.uid() = passenger_id);

create policy "Drivers can update request status"
  on public.trip_requests for update
  using (exists (
    select 1 from public.trips
    where trips.id = trip_requests.trip_id
      and trips.driver_id = auth.uid()
  ));

create policy "Passengers can cancel own requests"
  on public.trip_requests for update
  using (auth.uid() = passenger_id);

-- ─────────────────────────────────────────
-- Trigger: auto-create profile on signup
-- ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- Profile is created explicitly in /auth/register flow
  -- This function exists for future automation hooks
  return new;
end;
$$;

-- ─────────────────────────────────────────
-- Trigger: close trip when seats hit 0
-- ─────────────────────────────────────────
create or replace function public.update_trip_status()
returns trigger language plpgsql as $$
begin
  if new.available_seats = 0 then
    new.status := 'full';
  elsif new.available_seats > 0 and old.status = 'full' then
    new.status := 'open';
  end if;
  return new;
end;
$$;

create trigger trip_seats_status
  before update of available_seats on public.trips
  for each row execute function public.update_trip_status();

-- ─────────────────────────────────────────
-- Storage buckets (run separately in Supabase dashboard or CLI)
-- ─────────────────────────────────────────
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('licenses', 'licenses', false);
-- insert into storage.buckets (id, name, public) values ('yape-qr', 'yape-qr', true);
