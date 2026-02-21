-- =====================================================
-- Event Photo Organizer (Production + AI Version)
-- =====================================================

-- Required extension for vector similarity
create extension if not exists vector;

-- =====================================================
-- EVENTS
-- =====================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  description text,
  event_date date,
  created_by uuid references auth.users on delete cascade,
  created_at timestamptz default now()
);

-- =====================================================
-- PROFILES
-- =====================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  updated_at timestamptz default now()
);

-- =====================================================
-- IMAGES
-- =====================================================

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events on delete cascade,
  uploaded_by uuid references auth.users on delete cascade,
  github_path text not null,
  filename text not null,
  uploaded_at timestamptz default now(),
  processed boolean default false,
  processed_at timestamptz,
  processed_count int default 0
);

-- =====================================================
-- PERSONS (Logical grouped person in event)
-- =====================================================

create table if not exists public.persons (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events on delete cascade,
  name text, -- Editable name for person
  label text,
  created_at timestamptz default now()
);

-- =====================================================
-- PARTICIPANTS
-- =====================================================

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events on delete cascade,
  user_id uuid references auth.users on delete cascade,
  joined_at timestamptz default now()
);

-- =====================================================
-- FACE EMBEDDINGS (pgvector powered)
-- =====================================================

create table if not exists public.face_embeddings (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references public.persons on delete cascade,
  image_id uuid references public.images on delete cascade,
  descriptor vector(512) not null,
  box jsonb,
  created_at timestamptz default now()
);

-- Vector index for cosine similarity
create index if not exists idx_face_embeddings_descriptor
on public.face_embeddings
using ivfflat (descriptor vector_cosine_ops);

-- =====================================================
-- VECTOR MATCHING FUNCTION (AI CLUSTERING)
-- =====================================================

create or replace function match_face(
  query_embedding vector(512),
  match_event_id uuid,
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  person_id uuid,
  distance float
)
language sql stable
as $$
  select
    fe.id,
    fe.person_id,
    fe.descriptor <-> query_embedding as distance
  from public.face_embeddings fe
  join public.persons p on p.id = fe.person_id
  where p.event_id = match_event_id
    and fe.descriptor <-> query_embedding < match_threshold
  order by fe.descriptor <-> query_embedding
  limit match_count;
$$;

-- =====================================================
-- INDEXES
-- =====================================================

create index if not exists idx_images_event_id on public.images (event_id);
create index if not exists idx_persons_event_id on public.persons (event_id);
create index if not exists idx_embeddings_person_id on public.face_embeddings (person_id);
create index if not exists idx_participants_event_id on public.participants (event_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- EVENTS
alter table public.events enable row level security;

create policy "Users can insert their own events"
on public.events
for insert
with check (auth.uid() = created_by);

create policy "Users can select their own events"
on public.events
for select
using (
  auth.uid() = created_by
  OR exists (
    select 1 from public.participants p
    where p.event_id = id and p.user_id = auth.uid()
  )
);

create policy "Users can delete their own events"
on public.events
for delete
using (auth.uid() = created_by);

-- IMAGES
alter table public.images enable row level security;

create policy "Insert own images"
on public.images
for insert
with check (auth.uid() = uploaded_by);

create policy "Select images if owner or participant"
on public.images
for select
using (
  exists (
    select 1 from public.events e
    where e.id = event_id
    and (
      e.created_by = auth.uid()
      OR exists (
        select 1 from public.participants p
        where p.event_id = e.id
        and p.user_id = auth.uid()
      )
    )
  )
);

-- PERSONS
alter table public.persons enable row level security;

create policy "Select persons for event access"
on public.persons
for select
using (
  exists (
    select 1 from public.events e
    where e.id = event_id
    and (
      e.created_by = auth.uid()
      OR exists (
        select 1 from public.participants p
        where p.event_id = e.id
        and p.user_id = auth.uid()
      )
    )
  )
);

-- FACE EMBEDDINGS
alter table public.face_embeddings enable row level security;

create policy "Select embeddings if event accessible"
on public.face_embeddings
for select
using (
  exists (
    select 1
    from public.persons p
    join public.events e on p.event_id = e.id
    where p.id = person_id
    and (
      e.created_by = auth.uid()
      OR exists (
        select 1 from public.participants pa
        where pa.event_id = e.id
        and pa.user_id = auth.uid()
      )
    )
  )
);

-- Note:
-- No public insert policy for face_embeddings.
-- Insert should happen via service role only.