
create type tipo_atividade as enum ('OAT', 'VA');

-- =====================================================
-- profiles · dados editáveis do usuário (auth.users é gerida pelo Supabase)
-- =====================================================
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  nome                  text,
  percentual_aprovacao  numeric(5,2) not null default 70.00
                        check (percentual_aprovacao > 0 and percentual_aprovacao <= 100),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- =====================================================
-- materias
-- =====================================================
create table public.materias (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  nome                  text not null,
  percentual_aprovacao  numeric(5,2) not null default 70.00
                        check (percentual_aprovacao > 0 and percentual_aprovacao <= 100),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_materias_user_id on public.materias(user_id);

-- =====================================================
-- atividades
-- =====================================================
create table public.atividades (
  id              uuid primary key default gen_random_uuid(),
  materia_id      uuid not null references public.materias(id) on delete cascade,
  nome            text not null,
  tipo            tipo_atividade not null,
  pontos_maximos  numeric(5,2) not null check (pontos_maximos > 0),
  pontos_obtidos  numeric(5,2) check (pontos_obtidos >= 0),
  ordem           int not null default 0,
  data_prevista   date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint pontos_obtidos_dentro_do_maximo
    check (pontos_obtidos is null or pontos_obtidos <= pontos_maximos)
);

create index idx_atividades_materia_id on public.atividades(materia_id);

-- =====================================================
-- Triggers automáticos
-- =====================================================

-- updated_at automático em qualquer UPDATE
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at   before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_materias_updated_at   before update on public.materias
  for each row execute function public.set_updated_at();
create trigger trg_atividades_updated_at before update on public.atividades
  for each row execute function public.set_updated_at();

-- Cria profile automaticamente ao registrar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, new.raw_user_meta_data->>'nome');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cria as 4 atividades padrão ao criar uma matéria
create or replace function public.criar_atividades_padrao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.atividades (materia_id, nome, tipo, pontos_maximos, ordem) values
    (new.id, 'OAT1', 'OAT', 20, 1),
    (new.id, 'VA1',  'VA',  30, 2),
    (new.id, 'OAT2', 'OAT', 20, 3),
    (new.id, 'VA2',  'VA',  30, 4);
  return new;
end;
$$;

create trigger on_materia_created
  after insert on public.materias
  for each row execute function public.criar_atividades_padrao();

-- =====================================================
-- Row Level Security · cada usuário só enxerga o que é dele
-- =====================================================
alter table public.profiles   enable row level security;
alter table public.materias   enable row level security;
alter table public.atividades enable row level security;

-- profiles
create policy "profile_select_self" on public.profiles
  for select using (auth.uid() = id);
create policy "profile_update_self" on public.profiles
  for update using (auth.uid() = id);

-- materias (CRUD completo do próprio usuário)
create policy "materias_all_self" on public.materias
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- atividades (acessa via dono da matéria)
create policy "atividades_all_self" on public.atividades
  for all
  using (
    exists (
      select 1 from public.materias m
      where m.id = atividades.materia_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.materias m
      where m.id = atividades.materia_id and m.user_id = auth.uid()
    )
  );