-- Event Photo Organizer schema

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  description text,
  event_date date,
  created_by uuid references auth.users on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  updated_at timestamptz default now()
);

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events on delete cascade,
  uploaded_by uuid references auth.users on delete cascade,
  github_path text not null,
  filename text not null,
  uploaded_at timestamptz default now()
);

create table if not exists public.persons (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events on delete cascade,
  label text,
  created_at timestamptz default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events on delete cascade,
  user_id uuid references auth.users on delete cascade,
  joined_at timestamptz default now()
);

create table if not exists public.face_embeddings (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references public.persons on delete cascade,
  image_id uuid references public.images on delete cascade,
  descriptor jsonb not null,
  created_at timestamptz default now()
);

-- RLS: allow only owners to create/select events they created
alter table public.events enable row level security;
create policy "Users can insert their own events" on public.events
  for insert
  with check (auth.uid() = created_by);
create policy "Users can select their own events" on public.events
  for select
  using (auth.uid() = created_by);
create policy "Users can delete their own events" on public.events
  for delete
  using (auth.uid() = created_by);

-- Images: only allow inserting with matching uploaded_by
alter table public.images enable row level security;
create policy "Insert own images" on public.images
  for insert
  with check (auth.uid() = uploaded_by);
create policy "Select images for events user owns" on public.images
  for select
  using (
    exists (select 1 from public.events e where e.id = event_id and e.created_by = auth.uid())
    OR exists (select 1 from public.participants p where p.event_id = event_id and p.user_id = auth.uid())
  );

-- Persons and embeddings limited to event owners
alter table public.persons enable row level security;
create policy "Select persons for event owner" on public.persons
  for select
  using (exists (select 1 from public.events e where e.id = event_id and e.created_by = auth.uid()));

alter table public.face_embeddings enable row level security;
create policy "Select embeddings for event owner" on public.face_embeddings
  for select
  using (exists (select 1 from public.events e join public.persons p on p.event_id = e.id where face_embeddings.person_id = p.id and e.created_by = auth.uid()));

-- Indexes
create index if not exists idx_images_event_id on public.images (event_id);
create index if not exists idx_persons_event_id on public.persons (event_id);
