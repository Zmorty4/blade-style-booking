import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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

const HERO_FALLBACK = "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=2000&q=80";
const MASTER_FALLBACK = "https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?auto=format&fit=crop&w=900&q=80";
const WORK_FALLBACKS = [
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1000&q=80",
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
  const mastersRef = useRef<HTMLDivElement>(null);
  const worksRef = useRef<HTMLDivElement>(null);

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

      <section className="relative min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <MediaFrame src={heroMedia} fallback={HERO_FALLBACK} alt="BLADE & STYLE" className="h-full w-full object-cover grayscale scale-[1.04] motion-safe:animate-ken-burns" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-36 md:pb-24">
          <div className="max-w-5xl animate-hero-rise">
            <p className="font-sans text-sm font-semibold uppercase tracking-[0.18em] text-white/80">Premium barbershop</p>
            <h1 className="mt-7 max-w-5xl font-sans text-[52px] font-extrabold leading-[0.96] tracking-[-0.03em] text-white md:text-[104px]">
              Hair shaped with precision, made naturally yours.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
              {tagline}. Спокойное пространство, аккуратная форма, чистый контур и запись онлайн без лишних звонков.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/booking" className="rounded-full bg-white px-8 py-4 font-sans text-sm font-bold text-black hover:bg-gold-light">
                Записаться сейчас
              </Link>
              <a href="#works" className="rounded-full border border-white/60 px-8 py-4 font-sans text-sm font-bold text-white hover:border-white hover:bg-white hover:text-black">
                Смотреть работы
              </a>
            </div>
          </div>
        </div>
      </section>

      <Section id="services" label="OUR SERVICES" title="Услуги без лишнего шума" subtitle="Чистый прайс: услуга, длительность и цена. Никаких случайных фото, только понятный выбор.">
        <div className="divide-y divide-white/10 border-y border-white/10">
          {services.map((s, i) => <ServiceRow key={s.id} s={s} index={i} />)}
          {services.length === 0 && Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse bg-white/[0.03]" />)}
        </div>
      </Section>

      <PhotoSection
        id="masters"
        label="OUR TEAM"
        title="Мастера, которые держат стиль."
        subtitle="Листай команду стрелками — фото двигаются влево и вправо."
        railRef={mastersRef}
      >
        {masters.map((m, i) => <MasterCard key={m.id} m={m} index={i} />)}
      </PhotoSection>

      <PhotoSection
        id="works"
        label="OUR WORKS"
        title="Наши работы, крупно и честно."
        subtitle="Фото можно менять из админки, а на сайте они листаются как портфолио."
        railRef={worksRef}
      >
        {works.map((work, i) => <WorkCard key={work.id} work={work} index={i} />)}
      </PhotoSection>

      <Section id="how" label="PROCESS" title="Запись в четыре шага" subtitle="Быстро, понятно и без ожидания ответа в телефоне.">
        <div className="grid gap-4 md:grid-cols-4">
          {[["01", "Выбери услугу"], ["02", "Выбери мастера"], ["03", "Выбери время"], ["04", "Приходи"]].map(([n, t], i) => (
            <div key={n} className="group relative border border-white/10 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/45">
              <div className="font-sans text-5xl font-extrabold text-white">{n}</div>
              <div className="mt-8 font-sans text-2xl font-bold text-white">{t}</div>
              {i < 3 && <div className="absolute -right-5 top-8 hidden h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-black text-white transition-transform group-hover:translate-x-2 md:flex">→</div>}
            </div>
          ))}
        </div>
      </Section>

      <Section label="REVIEWS" title="Что говорят клиенты" subtitle="">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: "Артём", text: "Хожу второй год. Атмосфера спокойная, мастер слышит задачу, фейд всегда чистый." },
            { name: "Дмитрий", text: "Королевское бритьё — отдельный ритуал. Без спешки, аккуратно, очень достойно." },
            { name: "Игорь", text: "Записался онлайн за минуту, приехал — всё вовремя. Борода выглядит собранно." },
          ].map((r) => (
            <div key={r.name} className="border border-white/10 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/45">
              <div className="flex gap-1 text-white">{"★★★★★".split("").map((_, i) => <span key={i}>★</span>)}</div>
              <p className="mt-5 text-lg font-semibold leading-relaxed text-white/90">«{r.text}»</p>
              <div className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white/50">— {r.name}</div>
            </div>
          ))}
        </div>
      </Section>

      <section id="contacts" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 border border-white/14 p-8 md:grid-cols-2 md:p-14">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Contacts</div>
              <h2 className="mt-5 font-sans text-5xl font-extrabold tracking-[-0.03em] text-white md:text-7xl">Приходите к нам.</h2>
              <div className="mt-8 space-y-4 text-sm">
                <Info label="АДРЕС" value={settings?.address} />
                <div>
                  <div className="text-[10px] font-bold tracking-[0.25em] text-white/45">ТЕЛЕФОН</div>
                  <a href={`tel:${settings?.phone}`} className="mt-1 block text-white/90 hover:text-white">{settings?.phone}</a>
                </div>
                <Info label="ЧАСЫ РАБОТЫ" value={settings?.working_hours} />
                <Info label="INSTAGRAM" value={settings?.instagram} />
              </div>
            </div>
            <div className="flex flex-col items-start justify-end gap-6 md:items-end">
              <p className="max-w-sm text-2xl font-semibold leading-tight text-white/80 md:text-right">Забронируйте кресло за пару минут.</p>
              <Link to="/booking" className="rounded-full bg-white px-9 py-4 font-sans text-sm font-bold text-black hover:bg-gold-light">
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

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-[0.25em] text-white/45">{label}</div>
      <div className="mt-1 text-white/90">{value || "—"}</div>
    </div>
  );
}

function scrollRail(ref: React.RefObject<HTMLDivElement>, direction: -1 | 1) {
  const el = ref.current;
  if (!el) return;
  el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.9, 620), behavior: "smooth" });
}

function Section({ id, label, title, subtitle, children }: { id?: string; label: string; title: string; subtitle: string; children: React.ReactNode }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section id={id} className="relative py-20 md:py-28">
      <div ref={ref} className={`mx-auto max-w-7xl px-6 fade-in-up ${visible ? "fade-in-up-visible" : ""}`}>
        <SectionHeading label={label} title={title} subtitle={subtitle} />
        {children}
      </div>
    </section>
  );
}

function SectionHeading({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-3xl">
        <div className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">{label}</div>
        <h2 className="mt-6 font-sans text-5xl font-extrabold leading-[0.98] tracking-[-0.035em] text-white md:text-7xl">{title}</h2>
      </div>
      {subtitle && <p className="max-w-md text-sm leading-7 text-white/58">{subtitle}</p>}
    </div>
  );
}

function PhotoSection({ id, label, title, subtitle, railRef, children }: { id: string; label: string; title: string; subtitle: string; railRef: React.RefObject<HTMLDivElement>; children: React.ReactNode }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section id={id} className="relative py-20 md:py-28">
      <div ref={ref} className={`mx-auto max-w-7xl px-6 fade-in-up ${visible ? "fade-in-up-visible" : ""}`}>
        <div className="mb-12 grid gap-7 md:grid-cols-[1fr_auto] md:items-end">
          <SectionHeading label={label} title={title} subtitle={subtitle} />
          <CarouselControls onPrev={() => scrollRail(railRef, -1)} onNext={() => scrollRail(railRef, 1)} />
        </div>
        <div ref={railRef} className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-3 scroll-smooth">
          {children}
        </div>
      </div>
    </section>
  );
}

function CarouselControls({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center gap-4">
      <button onClick={onPrev} className="flex h-14 w-14 items-center justify-center rounded-full border border-white/70 text-3xl text-white hover:bg-white hover:text-black" aria-label="Листать влево">←</button>
      <button onClick={onNext} className="flex h-14 w-14 items-center justify-center rounded-full border border-white/70 text-3xl text-white hover:bg-white hover:text-black" aria-label="Листать вправо">→</button>
    </div>
  );
}

function ServiceRow({ s, index }: { s: Service; index: number }) {
  return (
    <Link to="/booking" search={{ service: s.id }} className="group grid gap-5 py-7 transition-all duration-300 hover:bg-white/[0.04] md:grid-cols-[1fr_140px_180px_60px] md:items-center md:px-5" style={{ transitionDelay: `${Math.min(index * 35, 160)}ms` }}>
      <div>
        <h3 className="font-sans text-2xl font-extrabold tracking-[-0.02em] text-white md:text-4xl">{s.name}</h3>
        {s.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{s.description}</p>}
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Длительность</div>
        <div className="mt-1 text-lg font-bold text-white/85">{formatDuration(s.duration)}</div>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Цена</div>
        <div className="mt-1 text-2xl font-extrabold text-white">{formatPrice(s.price)}</div>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 text-white transition-all group-hover:translate-x-1 group-hover:border-white group-hover:bg-white group-hover:text-black">→</div>
    </Link>
  );
}

function MasterCard({ m, index }: { m: Master; index: number }) {
  return (
    <div className="group min-w-[78vw] snap-start sm:min-w-[420px] lg:min-w-[500px]" style={{ transitionDelay: `${Math.min(index * 45, 180)}ms` }}>
      <div className="aspect-[4/5] overflow-hidden bg-white/5">
        <MediaFrame src={m.photo_url} fallback={MASTER_FALLBACK} alt={m.name} className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" />
      </div>
      <div className="mt-5">
        {m.speciality && <p className="text-sm text-white/50">{m.speciality}</p>}
        <h3 className="mt-1 font-sans text-3xl font-extrabold tracking-[-0.02em] text-white">{m.name}</h3>
        {m.experience && <div className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-white/40">{m.experience}</div>}
      </div>
    </div>
  );
}

function WorkCard({ work, index }: { work: Work; index: number }) {
  return (
    <div className="group relative min-w-[78vw] snap-start overflow-hidden bg-white/5 sm:min-w-[420px] lg:min-w-[500px]" style={{ transitionDelay: `${Math.min(index * 45, 180)}ms` }}>
      <div className="aspect-[4/5] overflow-hidden">
        <MediaFrame src={work.image_url} fallback={WORK_FALLBACKS[index % WORK_FALLBACKS.length]} alt={work.title} className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <h3 className="font-sans text-3xl font-extrabold tracking-[-0.02em] text-white">{work.title}</h3>
        {work.description && <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">{work.description}</p>}
      </div>
    </div>
  );
}
