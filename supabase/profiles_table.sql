-- Profiles table for Uvero
-- Links to auth.users via uid

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade,
  email text,
  full_name text,
  username text unique,
  created_at timestamptz default now(),
  primary key (id)
);

-- User settings table for preferences
create table if not exists public.user_settings (
  user_id uuid references auth.users on delete cascade,
  theme text, -- null means follow system preference
  updated_at timestamptz default now(),
  primary key (user_id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

-- Allow users to manage their own settings
create policy "Manage own settings" on public.user_settings
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- Allow users to insert their own profile (on sign-up via function or trigger)
create policy "Insert own profile" on public.profiles
  for insert
  with check ( auth.uid() = id );

-- Allow users to select their own profile
create policy "Select own profile" on public.profiles
  for select
  using ( auth.uid() = id );

-- Allow users to update their own profile
create policy "Update own profile" on public.profiles
  for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- Allow users to delete their own profile (optional)
create policy "Delete own profile" on public.profiles
  for delete
  using ( auth.uid() = id );

-- Optional: create a trigger to keep email in profiles synced with auth.users
-- (Requires creating a function that listens to auth.users changes; omitted here)

-- Helpful: create an index on email
create index if not exists idx_profiles_email on public.profiles (email);

-- Username support
alter table public.profiles
  add column if not exists username text;

update public.profiles
set username = nullif(lower(trim(username)), '')
where username is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_lowercase'
  ) then
    alter table public.profiles
      add constraint profiles_username_lowercase
      check (username is null or username = lower(username));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format'
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (
        username is null
        or username ~ '^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$'
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_no_consecutive_dots'
  ) then
    alter table public.profiles
      add constraint profiles_username_no_consecutive_dots
      check (
        username is null
        or position('..' in username) = 0
      );
  end if;
end $$;

create unique index if not exists idx_profiles_username_unique
on public.profiles (username)
where username is not null;
