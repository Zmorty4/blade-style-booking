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
type Work = { id: string; title: string; description: string | null; image_url: string | null };
type Settings = { shop_name: string | null; tagline: string | null; phone: string | null; address: string | null; working_hours: string | null; instagram: string | null; hero_image_url: string | null };

const HERO_FALLBACK = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=2000&q=80";
const SERVICE_FALLBACK = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80";
const MASTER_FALLBACK = "https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?auto=format&fit=crop&w=600&q=80";
const WORK_FALLBACKS = [
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=80",
];
const DEFAULT_WORKS: Work[] = [
  { id: "demo-1", title: "Чистый low fade", description: "Мягкий переход и аккуратный контур.", image_url: WORK_FALLBACKS[0] },
  { id: "demo-2", title: "Форма бороды", description: "Линии, которые собирают образ.", image_url: WORK_FALLBACKS[1] },
  { id: "demo-3", title: "Классика с текстурой", description: "Спокойная форма с живым верхом.", image_url: WORK_FALLBACKS[2] },
];
const db = supabase as any;

function isVideoMedia(url?: string | null) {
  return Boolean(url && /\.(mp4|webm|mov)(\?|$)/i.test(url));
}

function MediaFrame({ src, fallback, alt, className = "" }: { src?: string | null; fallback: string; alt: string; className?: string }) {
  const media = src || fallback;
  if (isVideoMedia(media)) {
    return <video src={media} className={className} autoPlay muted loop playsInline />;
  }
  return <img src={media} alt={alt} className={className} />;
}

async function cleanupPastBookings() {
  try {
    await db.rpc("cleanup_past_bookings");
  } catch {
    // Landing should stay available even if background cleanup fails.
  }
}

function Landing() {
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [works, setWorks] = useState<Work[]>(DEFAULT_WORKS);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    void cleanupPastBookings();
    (async () => {
      const [s, m, w, cfg] = await Promise.all([
        supabase.from("services").select("id,name,description,price,duration,image_url").eq("is_active", true).order("sort_order"),
        supabase.from("masters").select("id,name,speciality,experience,photo_url").eq("is_active", true),
        db.from("portfolio_items").select("id,title,description,image_url").eq("is_active", true).order("sort_order"),
        supabase.from("shop_settings").select("*").limit(1).maybeSingle(),
      ]);
      if (s.data) setServices(s.data as Service[]);
      if (m.data) setMasters(m.data as Master[]);
      if (w.data?.length) setWorks(w.data as Work[]);
      if (cfg.data) setSettings(cfg.data as Settings);
    })();
  }, []);

  const shopName = settings?.shop_name || "BLADE & STYLE";
  const tagline = settings?.tagline || "Твой стиль — наше мастерство";
  const heroMedia = settings?.hero_image_url || HERO_FALLBACK;

  return (
    <div className="min-h-screen bg-black text-foreground">
      <SiteHeader shopName={shopName} />

      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <MediaFrame src={heroMedia} fallback={HERO_FALLBACK} alt="BLADE & STYLE" className="h-full w-full object-cover scale-[1.04] motion-safe:animate-ken-burns" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black" />
        </div>
        <div className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2 -rotate-90 origin-left">
          <span className="font-display text-gold/45 text-sm tracking-[0.6em] whitespace-nowrap">EUROPEAN BARBERSHOP</span>
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-32 w-full">
          <div className="max-w-3xl animate-hero-rise">
            <div className="flex items-center gap-4">
              <span className="gold-divider" />
              <span className="font-display text-gold text-xs tracking-[0.3em]">BLADE & STYLE</span>
            </div>
            <h1 className="mt-8 font-serif text-[52px] leading-[1.05] md:text-[98px] md:leading-[0.95] text-foreground">
              Стиль без<br />
              <span className="italic text-gold-light">лишнего шума</span>
            </h1>
            <p className="mt-8 text-base md:text-lg text-foreground/70 max-w-xl leading-8">
              {tagline}. Чистая форма, уверенный контур и запись онлайн без звонков.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-6">
              <Link to="/booking" className="group border border-gold bg-gold px-10 py-4 font-display text-sm text-black hover:bg-gold-light transition-colors tracking-[0.25em]">
                Записаться <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a href="#services" className="group font-display text-xs text-foreground/65 hover:text-gold tracking-[0.25em]">
                Смотреть услуги <span className="inline-block transition-transform group-hover:translate-x-2">→</span>
              </a>
            </div>
          </div>

          <div className="mt-24 grid grid-cols-3 gap-6 max-w-3xl border-t border-divider pt-8 animate-hero-rise [animation-delay:160ms]">
            {[["1200+", "КЛИЕНТОВ"], ["5", "МАСТЕРОВ"], ["8", "ЛЕТ ОПЫТА"]].map(([n, l]) => (
              <div key={l} className="group">
                <div className="font-display text-3xl md:text-5xl text-gold transition-transform group-hover:-translate-y-1">{n}</div>
                <div className="mt-1 font-display text-[10px] tracking-[0.3em] text-foreground/50">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section id="services" label="НАШИ УСЛУГИ" title="Ровная работа, точная форма" subtitle="Классика и современная геометрия без перегруза.">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => <ServiceCard key={s.id} s={s} index={i} />)}
          {services.length === 0 && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-96 bg-card animate-pulse" />)}
        </div>
      </Section>

      <Section id="masters" label="НАШИ МАСТЕРА" title="Команда" subtitle="Мастера, которые держат стиль тихим и уверенным.">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {masters.map((m, i) => <MasterCard key={m.id} m={m} index={i} />)}
        </div>
      </Section>

      <Section id="works" label="НАШИ РАБОТЫ" title="До деталей" subtitle="Живые примеры стрижек, бороды и формы, которые можно обновлять из админки.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((work, i) => <WorkCard key={work.id} work={work} index={i} />)}
        </div>
      </Section>

      <Section id="how" label="ПРОЦЕСС" title="Как это работает" subtitle="Четыре коротких шага, и кресло забронировано.">
        <div className="grid gap-8 md:grid-cols-4 relative">
          {[["01", "Выбери услугу"], ["02", "Выбери мастера"], ["03", "Выбери время"], ["04", "Приходи"]].map(([n, t], i) => (
            <div key={n} className="group relative transition-transform duration-300 hover:-translate-y-1">
              <div className="font-display text-5xl text-gold transition-transform group-hover:translate-x-1">{n}</div>
              <div className="mt-6 h-px bg-gold/30" />
              <div className="mt-4 font-serif text-2xl">{t}</div>
              {i < 3 && <div className="hidden md:flex absolute top-5 -right-5 h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold/70 transition-all group-hover:translate-x-2 group-hover:border-gold">→</div>}
            </div>
          ))}
        </div>
      </Section>

      <Section label="ОТЗЫВЫ" title="Что говорят клиенты" subtitle="">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { name: "Артём", text: "Хожу второй год. Атмосфера спокойная, мастер слышит задачу, фейд всегда чистый." },
            { name: "Дмитрий", text: "Королевское бритьё — отдельный ритуал. Без спешки, аккуратно, очень достойно." },
            { name: "Игорь", text: "Записался онлайн за минуту, приехал — всё вовремя. Борода выглядит собранно." },
          ].map((r) => (
            <div key={r.name} className="glass-panel border border-divider p-8 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50">
              <div className="flex gap-1 text-gold">{"★★★★★".split("").map((_, i) => <span key={i}>★</span>)}</div>
              <p className="mt-4 font-serif text-lg leading-relaxed text-foreground/85">«{r.text}»</p>
              <div className="mt-6 font-display text-xs tracking-[0.25em] text-gold">— {r.name.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </Section>

      <section id="contacts" className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="glass-panel border border-gold/40 p-10 md:p-16 grid gap-10 md:grid-cols-2 items-center">
            <div>
              <div className="font-display text-[10px] tracking-[0.3em] text-gold">КОНТАКТЫ</div>
              <h2 className="mt-4 font-serif text-4xl md:text-5xl">Приходите<br />к нам в гости</h2>
              <div className="mt-8 space-y-4 text-sm">
                <Info label="АДРЕС" value={settings?.address} />
                <div>
                  <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground">ТЕЛЕФОН</div>
                  <a href={`tel:${settings?.phone}`} className="mt-1 block text-foreground/90 hover:text-gold">{settings?.phone}</a>
                </div>
                <Info label="ЧАСЫ РАБОТЫ" value={settings?.working_hours} />
                <Info label="INSTAGRAM" value={settings?.instagram} />
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-6">
              <p className="font-serif text-2xl text-foreground/80 md:text-right">Забронируйте кресло<br />за пару минут.</p>
              <Link to="/booking" className="group border border-gold bg-gold text-black px-10 py-5 font-display text-sm hover:bg-gold-light tracking-[0.25em]">
                Записаться онлайн <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter shopName={shopName} phone={settings?.phone || ""} address={settings?.address || ""} instagram={settings?.instagram || ""} />
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-foreground/90">{value || "—"}</div>
    </div>
  );
}

function Section({ id, label, title, subtitle, children }: { id?: string; label: string; title: string; subtitle: string; children: React.ReactNode }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section id={id} className="relative py-24 md:py-32 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      <div ref={ref} className={`mx-auto max-w-7xl px-6 fade-in-up ${visible ? "fade-in-up-visible" : ""}`}>
        <div className="mb-16 flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-4"><span className="gold-divider" /><span className="font-display text-gold text-xs tracking-[0.3em]">{label}</span></div>
            <h2 className="mt-4 font-serif text-4xl md:text-6xl">{title}</h2>
          </div>
          {subtitle && <p className="max-w-md text-sm leading-7 text-foreground/60">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function ServiceCard({ s, index }: { s: Service; index: number }) {
  return (
    <Link to="/booking" search={{ service: s.id }} className="group relative flex flex-col glass-panel border border-divider hover:border-gold transition-all duration-500 hover:-translate-y-2 overflow-hidden" style={{ transitionDelay: `${Math.min(index * 45, 180)}ms` }}>
      <div className="pointer-events-none absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-black/45 text-gold backdrop-blur transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:bg-gold group-hover:text-black">→</div>
      <div className="aspect-[16/10] overflow-hidden">
        <MediaFrame src={s.image_url} fallback={SERVICE_FALLBACK} alt={s.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-serif text-2xl">{s.name}</h3>
        {s.description && <p className="mt-2 text-sm leading-6 text-foreground/60 flex-1">{s.description}</p>}
        <div className="mt-6 flex items-end justify-between border-t border-divider pt-4">
          <div><div className="font-display text-xs tracking-[0.25em] text-muted-foreground">ЦЕНА</div><div className="mt-1 font-display text-2xl text-gold">{formatPrice(s.price)}</div></div>
          <div className="text-right"><div className="font-display text-xs tracking-[0.25em] text-muted-foreground">ДЛИТ.</div><div className="mt-1 font-display text-2xl text-foreground/80">{formatDuration(s.duration)}</div></div>
        </div>
        <div className="mt-4 opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all"><span className="font-display text-xs tracking-[0.25em] text-gold">ЗАБРОНИРОВАТЬ →</span></div>
      </div>
    </Link>
  );
}

function MasterCard({ m, index }: { m: Master; index: number }) {
  return (
    <div className="group glass-panel border border-divider overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-gold/50" style={{ transitionDelay: `${Math.min(index * 45, 180)}ms` }}>
      <div className="aspect-square overflow-hidden relative">
        <MediaFrame src={m.photo_url} fallback={MASTER_FALLBACK} alt={m.name} className="h-full w-full object-cover group-hover:scale-[1.08] transition-transform duration-700" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 text-gold opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">→</div>
      </div>
      <div className="p-6">
        <h3 className="font-serif text-2xl">{m.name}</h3>
        {m.speciality && <p className="mt-1 text-sm text-foreground/60">{m.speciality}</p>}
        {m.experience && <div className="mt-4 font-display text-sm text-gold tracking-[0.2em]">{m.experience}</div>}
      </div>
    </div>
  );
}

function WorkCard({ work, index }: { work: Work; index: number }) {
  return (
    <div className="group relative overflow-hidden border border-divider bg-card transition-all duration-500 hover:-translate-y-2 hover:border-gold/60" style={{ transitionDelay: `${Math.min(index * 45, 180)}ms` }}>
      <div className="aspect-[4/5] overflow-hidden">
        <MediaFrame src={work.image_url} fallback={WORK_FALLBACKS[index % WORK_FALLBACKS.length]} alt={work.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent opacity-90" />
      <div className="absolute inset-x-0 bottom-0 p-6 translate-y-3 transition-transform duration-300 group-hover:translate-y-0">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 text-gold transition-all group-hover:bg-gold group-hover:text-black">→</div>
        <h3 className="font-serif text-3xl">{work.title}</h3>
        {work.description && <p className="mt-2 text-sm leading-6 text-foreground/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">{work.description}</p>}
      </div>
    </div>
  );
}
