-- ============================================================
-- JELLYRATE — Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- PROFILES (extiende auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- JELLYRATES (posts)
create table public.jellyrates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  photo_url text not null,
  score integer not null check (score >= 1 and score <= 10),
  title text not null,
  description text,
  category text,
  place_name text,
  privacy text default 'public' check (privacy in ('public', 'followers')),
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- REJELLIES (calificaciones adicionales de un mismo ítem)
create table public.rejellies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  jellyrate_id uuid references public.jellyrates(id) on delete cascade not null,
  score integer not null check (score >= 1 and score <= 10),
  comment text,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  unique(user_id, jellyrate_id)
);

-- FOLLOWS
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- LIKES
create table public.likes (
  user_id uuid references public.profiles(id) on delete cascade not null,
  jellyrate_id uuid references public.jellyrates(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  primary key (user_id, jellyrate_id)
);

-- SAVES (favoritos)
create table public.saves (
  user_id uuid references public.profiles(id) on delete cascade not null,
  jellyrate_id uuid references public.jellyrates(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc', now()) not null,
  primary key (user_id, jellyrate_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.jellyrates enable row level security;
alter table public.rejellies enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;

-- Profiles: todos pueden leer, cada uno edita el suyo
create policy "Profiles son públicos" on public.profiles for select using (true);
create policy "Usuarios editan su perfil" on public.profiles for update using (auth.uid() = id);

-- Jellyrates: públicos son visibles para todos
create policy "JellyRates públicos visibles" on public.jellyrates for select using (privacy = 'public' or auth.uid() = user_id);
create policy "Usuarios crean sus JellyRates" on public.jellyrates for insert with check (auth.uid() = user_id);
create policy "Usuarios eliminan los suyos" on public.jellyrates for delete using (auth.uid() = user_id);

-- ReJellies
create policy "ReJellies visibles" on public.rejellies for select using (true);
create policy "Usuarios crean ReJellies" on public.rejellies for insert with check (auth.uid() = user_id);
create policy "Usuarios actualizan sus ReJellies" on public.rejellies for update using (auth.uid() = user_id);

-- Follows
create policy "Follows visibles" on public.follows for select using (true);
create policy "Usuarios siguen" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Usuarios dejan de seguir" on public.follows for delete using (auth.uid() = follower_id);

-- Likes
create policy "Likes visibles" on public.likes for select using (true);
create policy "Usuarios dan like" on public.likes for insert with check (auth.uid() = user_id);
create policy "Usuarios quitan like" on public.likes for delete using (auth.uid() = user_id);

-- Saves
create policy "Saves propios visibles" on public.saves for select using (auth.uid() = user_id);
create policy "Usuarios guardan" on public.saves for insert with check (auth.uid() = user_id);
create policy "Usuarios quitan guardados" on public.saves for delete using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: crear perfil automáticamente al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STORAGE: bucket para fotos de JellyRates
-- ============================================================
-- Ejecutar en Supabase Dashboard > Storage:
-- 1. Crear bucket llamado "jellyrates" (público)
-- 2. O ejecutar:

insert into storage.buckets (id, name, public) values ('jellyrates', 'jellyrates', true);

create policy "Fotos de JellyRates públicas" on storage.objects
  for select using (bucket_id = 'jellyrates');

create policy "Usuarios suben sus fotos" on storage.objects
  for insert with check (bucket_id = 'jellyrates' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Usuarios eliminan sus fotos" on storage.objects
  for delete using (bucket_id = 'jellyrates' and auth.uid()::text = (storage.foldername(name))[1]);
