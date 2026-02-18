-- Profiles table for Uvero
-- Links to auth.users via uid

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now(),
  primary key (id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

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
