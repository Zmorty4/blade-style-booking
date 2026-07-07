import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { formatPrice, formatDuration } from "@/lib/format";
import { useReveal } from "@/hooks/useReveal";

export const Route = createFileRoute("/")({
  component: Landing,
});

type Service = { id: string; name: string; description: string | null; price: number; duration: number; image_url: string | null };
type Master = { id: string; name: string; speciality: string | null; experience: string | null; photo_url: string | null };
type Settings = { shop_name: string | null; tagline: string | null; phone: string | null; address: string | null; working_hours: string | null; instagram: string | null; hero_image_url: string | null };

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=2000&q=80";

function Landing() {
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    (async () => {
      const [s, m, cfg] = await Promise.all([
        supabase.from("services").select("id,name,description,price,duration,image_url").eq("is_active", true).order("sort_order"),
        supabase.from("masters").select("id,name,speciality,experience,photo_url").eq("is_active", true),
        supabase.from("shop_settings").select("*").limit(1).maybeSingle(),
      ]);
      if (s.data) setServices(s.data as Service[]);
      if (m.data) setMasters(m.data as Master[]);
      if (cfg.data) setSettings(cfg.data as Settings);
    })();
  }, []);

  const shopName = settings?.shop_name || "BLADE & STYLE";
  const tagline = settings?.tagline || "Твой стиль — наше мастерство";
  const heroImg = settings?.hero_image_url || HERO_FALLBACK;

  return (
    <div className="min-h-screen bg-black text-foreground">
      <SiteHeader shopName={shopName} />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
        </div>
        {/* vertical signature */}
        <div className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2 -rotate-90 origin-left">
          <span className="font-display text-gold/40 text-sm tracking-[0.6em] whitespace-nowrap">B A R B E R S H O P</span>
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-32 w-full">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4">
              <span className="gold-divider" />
              <span className="font-display text-gold text-xs tracking-[0.3em]">SINCE 2017</span>
            </div>
            <h1 className="mt-8 font-serif text-[52px] leading-[1.05] md:text-[96px] md:leading-[0.95] text-foreground">
              Твой стиль —<br />
              <span className="italic text-gold-light">наше мастерство</span>
            </h1>
            <p className="mt-8 text-base md:text-lg text-foreground/70 max-w-xl">
              {tagline}. Запись онлайн · Работаем без выходных
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-6">
              <Link to="/booking" className="border border-gold px-10 py-4 font-display text-sm text-gold hover:bg-gold hover:text-black transition-colors tracking-[0.25em]">
                Записаться
              </Link>
              <a href="#services" className="font-display text-xs text-foreground/60 hover:text-gold tracking-[0.25em]">
                Смотреть услуги →
              </a>
            </div>
          </div>

          <div className="mt-24 grid grid-cols-3 gap-6 max-w-3xl border-t border-divider pt-8">
            {[
              ["1200+", "КЛИЕНТОВ"],
              ["5", "МАСТЕРОВ"],
              ["8", "ЛЕТ ОПЫТА"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-3xl md:text-5xl text-gold">{n}</div>
                <div className="mt-1 font-display text-[10px] tracking-[0.3em] text-foreground/50">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <Section id="services" label="НАШИ УСЛУГИ" title="Что мы делаем" subtitle="Каждая услуга — про внимание к деталям.">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <ServiceCard key={s.id} s={s} index={i} />
          ))}
          {services.length === 0 && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-96 bg-card animate-pulse" />)}
        </div>
      </Section>

      {/* MASTERS */}
      <Section id="masters" label="НАШИ МАСТЕРА" title="Команда" subtitle="Профессионалы, для которых стрижка — ремесло.">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {masters.map((m) => <MasterCard key={m.id} m={m} />)}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how" label="ПРОЦЕСС" title="Как это работает" subtitle="Всего четыре шага до идеальной стрижки.">
        <div className="grid gap-8 md:grid-cols-4 relative">
          {[
            ["01", "Выбери услугу"],
            ["02", "Выбери мастера"],
            ["03", "Выбери время"],
            ["04", "Приходи!"],
          ].map(([n, t], i) => (
            <div key={n} className="relative">
              <div className="font-display text-5xl text-gold">{n}</div>
              <div className="mt-6 h-px bg-gold/30" />
              <div className="mt-4 font-serif text-2xl">{t}</div>
              {i < 3 && (
                <div className="hidden md:block absolute top-6 -right-4 w-8 h-px bg-gold/30" />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* REVIEWS */}
      <Section label="ОТЗЫВЫ" title="Что говорят клиенты" subtitle="">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { name: "Артём", text: "Хожу второй год — Алексей знает мою голову лучше меня. Атмосфера, кофе, идеальный фейд." },
            { name: "Дмитрий", text: "Королевское бритьё — must try. Горячее полотенце, опасная бритва, чувствуешь себя джентльменом." },
            { name: "Игорь", text: "Записался онлайн за минуту, приехал — всё вовремя. Борода как у Хемингуэя. Рекомендую." },
          ].map((r) => (
            <div key={r.name} className="bg-card border border-divider p-8">
              <div className="flex gap-1 text-gold">
                {"★★★★★".split("").map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="mt-4 font-serif text-lg leading-relaxed text-foreground/85">«{r.text}»</p>
              <div className="mt-6 font-display text-xs tracking-[0.25em] text-gold">— {r.name.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* CONTACTS */}
      <section id="contacts" className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="border border-gold/40 p-10 md:p-16 grid gap-10 md:grid-cols-2 items-center">
            <div>
              <div className="font-display text-[10px] tracking-[0.3em] text-gold">КОНТАКТЫ</div>
              <h2 className="mt-4 font-serif text-4xl md:text-5xl">Приходите<br />к нам в гости</h2>
              <div className="mt-8 space-y-4 text-sm">
                <div>
                  <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground">АДРЕС</div>
                  <div className="mt-1 text-foreground/90">{settings?.address}</div>
                </div>
                <div>
                  <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground">ТЕЛЕФОН</div>
                  <a href={`tel:${settings?.phone}`} className="mt-1 block text-foreground/90 hover:text-gold">{settings?.phone}</a>
                </div>
                <div>
                  <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground">ЧАСЫ РАБОТЫ</div>
                  <div className="mt-1 text-foreground/90">{settings?.working_hours}</div>
                </div>
                <div>
                  <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground">INSTAGRAM</div>
                  <div className="mt-1 text-foreground/90">{settings?.instagram}</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-6">
              <p className="font-serif text-2xl text-foreground/80 md:text-right">Забронируйте кресло<br />за пару минут.</p>
              <Link to="/booking" className="border border-gold bg-gold text-black px-10 py-5 font-display text-sm hover:bg-gold-light tracking-[0.25em]">
                Записаться онлайн →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter shopName={shopName} phone={settings?.phone || ""} address={settings?.address || ""} instagram={settings?.instagram || ""} />
    </div>
  );
}

function Section({ id, label, title, subtitle, children }: { id?: string; label: string; title: string; subtitle: string; children: React.ReactNode }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section id={id} className="py-24 md:py-32">
      <div ref={ref} className={`mx-auto max-w-7xl px-6 fade-in-up ${visible ? "fade-in-up-visible" : ""}`}>
        <div className="mb-16 flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-4">
              <span className="gold-divider" />
              <span className="font-display text-gold text-xs tracking-[0.3em]">{label}</span>
            </div>
            <h2 className="mt-4 font-serif text-4xl md:text-6xl">{title}</h2>
          </div>
          {subtitle && <p className="max-w-md text-sm text-foreground/60">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function ServiceCard({ s }: { s: Service; index: number }) {
  const img = s.image_url ||
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80";
  return (
    <Link
      to="/booking"
      search={{ service: s.id }}
      className="group relative flex flex-col bg-card border border-divider hover:border-gold transition-colors duration-300"
    >
      <div className="aspect-[16/10] overflow-hidden">
        <img src={img} alt={s.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-serif text-2xl">{s.name}</h3>
        {s.description && <p className="mt-2 text-sm text-foreground/60 flex-1">{s.description}</p>}
        <div className="mt-6 flex items-end justify-between border-t border-divider pt-4">
          <div>
            <div className="font-display text-xs tracking-[0.25em] text-muted-foreground">ЦЕНА</div>
            <div className="mt-1 font-display text-2xl text-gold">{formatPrice(s.price)}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-xs tracking-[0.25em] text-muted-foreground">ДЛИТ.</div>
            <div className="mt-1 font-display text-2xl text-foreground/80">{formatDuration(s.duration)}</div>
          </div>
        </div>
        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="font-display text-xs tracking-[0.25em] text-gold">ЗАБРОНИРОВАТЬ →</span>
        </div>
      </div>
    </Link>
  );
}

function MasterCard({ m }: { m: Master }) {
  const img = m.photo_url ||
    "https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?auto=format&fit=crop&w=600&q=80";
  return (
    <div className="group bg-card border border-divider overflow-hidden">
      <div className="aspect-square overflow-hidden">
        <img src={img} alt={m.name} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
      </div>
      <div className="p-6">
        <h3 className="font-serif text-2xl">{m.name}</h3>
        {m.speciality && <p className="mt-1 text-sm text-foreground/60">{m.speciality}</p>}
        {m.experience && <div className="mt-4 font-display text-sm text-gold tracking-[0.2em]">{m.experience}</div>}
      </div>
    </div>
  );
}
