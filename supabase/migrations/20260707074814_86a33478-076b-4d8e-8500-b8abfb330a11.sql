
-- shop_settings
CREATE TABLE public.shop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name text DEFAULT 'BLADE & STYLE',
  tagline text DEFAULT 'Твой стиль — наше мастерство',
  phone text DEFAULT '+7 (777) 000-00-00',
  address text DEFAULT 'ул. Примерная, 1',
  working_hours text DEFAULT 'Пн-Сб: 10:00–21:00',
  instagram text DEFAULT '@barbershop',
  hero_image_url text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_settings TO authenticated;
GRANT ALL ON public.shop_settings TO service_role;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop_settings public read" ON public.shop_settings FOR SELECT USING (true);
CREATE POLICY "shop_settings admin write" ON public.shop_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- services
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price integer NOT NULL,
  duration integer NOT NULL,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services public read" ON public.services FOR SELECT USING (true);
CREATE POLICY "services admin write" ON public.services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- masters
CREATE TABLE public.masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  speciality text,
  experience text,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.masters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.masters TO authenticated;
GRANT ALL ON public.masters TO service_role;
ALTER TABLE public.masters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "masters public read" ON public.masters FOR SELECT USING (true);
CREATE POLICY "masters admin write" ON public.masters FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  client_name text NOT NULL,
  phone text NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  master_id uuid REFERENCES public.masters(id) ON DELETE SET NULL,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  comment text,
  status text NOT NULL DEFAULT 'new'
);
GRANT SELECT, INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- public can read booking date/time to render busy slots, and insert new bookings
CREATE POLICY "bookings public read" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "bookings public insert" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings admin update" ON public.bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "bookings admin delete" ON public.bookings FOR DELETE TO authenticated USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_shop_settings_updated BEFORE UPDATE ON public.shop_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_masters_updated BEFORE UPDATE ON public.masters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- seed data
INSERT INTO public.services (name, description, price, duration, sort_order) VALUES
('Стрижка', 'Классическая мужская стрижка под ваш стиль', 2500, 45, 1),
('Стрижка + борода', 'Стрижка и оформление бороды', 3500, 75, 2),
('Борода', 'Оформление, моделирование бороды', 1500, 30, 3),
('Королевское бритьё', 'Опасная бритва, горячее полотенце', 2000, 40, 4);

INSERT INTO public.masters (name, speciality, experience) VALUES
('Алексей Громов', 'Классические стрижки', '8 лет опыта'),
('Данил Ковалёв', 'Фейд и борода', '5 лет опыта'),
('Максим Орлов', 'Современные тренды', '4 года опыта');

INSERT INTO public.shop_settings (shop_name) VALUES ('BLADE & STYLE');
