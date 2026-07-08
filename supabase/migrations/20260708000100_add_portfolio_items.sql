create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

create policy "Portfolio items are public readable"
  on public.portfolio_items
  for select
  using (true);

create policy "Authenticated users can manage portfolio items"
  on public.portfolio_items
  for all
  to authenticated
  using (true)
  with check (true);

create index if not exists portfolio_items_active_sort_idx
  on public.portfolio_items (is_active, sort_order);

insert into public.portfolio_items (title, description, image_url, sort_order)
values
  ('Чистый low fade', 'Мягкий переход и аккуратный контур для ежедневного стиля.', 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=80', 1),
  ('Форма бороды', 'Линии бороды, которые собирают образ и держатся красиво.', 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=900&q=80', 2),
  ('Классика с текстурой', 'Спокойная мужская форма с легкой текстурой сверху.', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=80', 3)
on conflict do nothing;
