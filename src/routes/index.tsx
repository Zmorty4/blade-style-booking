import { createFileRoute, Link } from "@tanstack/react-router";
import { Instagram, MapPin, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { DEFAULT_SHOP_NAME } from "@/lib/brand";
import { ADDRESS_MAP_URL, instagramHref, normalizeAddress, phoneHref } from "@/lib/contact";
import { normalizeWorkingHours } from "@/lib/schedule";
import { formatPrice, formatDuration } from "@/lib/format";
import { useReveal } from "@/hooks/useReveal";

export const Route = createFileRoute("/")({
  component: Landing,
});

type Service = { id: string; name: string; description: string | null; price: number; duration: number; image_url: string | null };
type Master = { id: string; name: string; speciality: string | null; experience: string | null; photo_url: string | null };
type Work = { id: string; title: string; description: string | null; image_url: string | null };
type Settings = { shop_name: string | null; tagline: string | null; phone: string | null; address: string | null; working_hours: string | null; instagram: string | null; hero_image_url: string | null; logo_url: string | null };

type RailRef = RefObject<HTMLDivElement | null>;

const HERO_FALLBACK = "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1800&q=80";
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
const PORTFOLIO_PREFIX = "[portfolio-work]";

function toPortfolioWorks(rows?: Array<{ id: string; description: string | null; image_url: string | null; sort_order?: number | null }> | null): Work[] {
  const result = DEFAULT_WORKS.map((work) => ({ ...work }));
  const sortedRows = [...(rows || [])].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  sortedRows.forEach((item, index) => {
    if (!item.image_url) return;
    const position = Math.max(0, Number(item.sort_order || index + 1) - 1);
    const work = {
      id: item.id,
      title: `Фото ${position + 1}`,
      description: item.description,
      image_url: item.image_url,
    };
    if (position < result.length) {
      result[position] = work;
    } else {
      result.push(work);
    }
  });
  return result;
}

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
    let alive = true;
    void cleanupPastBookings();

    async function loadWorks() {
      const { data } = await db
        .from("services")
        .select("id,name,description,image_url,sort_order")
        .like("name", `${PORTFOLIO_PREFIX}%`)
        .not("image_url", "is", null)
        .order("sort_order");
      if (!alive) return;
      setWorks(data?.length ? data.map((item: any, index: number) => ({
        id: item.id,
        title: `Фото ${index + 1}`,
        description: item.description,
        image_url: item.image_url,
      })) as Work[] : DEFAULT_WORKS);
      setWorks(toPortfolioWorks(data as any));
    }

    async function loadSettings() {
      const { data } = await supabase.from("shop_settings").select("*").limit(1).maybeSingle();
      if (!alive || !data) return;
      setSettings(data as Settings);
    }

    (async () => {
      const [s, m, w, cfg] = await Promise.all([
        supabase.from("services").select("id,name,description,price,duration,image_url").eq("is_active", true).order("sort_order"),
        supabase.from("masters").select("id,name,speciality,experience,photo_url").eq("is_active", true),
        db.from("services").select("id,name,description,image_url,sort_order").like("name", `${PORTFOLIO_PREFIX}%`).not("image_url", "is", null).order("sort_order"),
        supabase.from("shop_settings").select("*").limit(1).maybeSingle(),
      ]);
      if (!alive) return;
      if (s.data) setServices(s.data as Service[]);
      if (m.data) setMasters(m.data as Master[]);
      setWorks(w.data?.length ? w.data.map((item: any, index: number) => ({
        id: item.id,
        title: `Фото ${index + 1}`,
        description: item.description,
        image_url: item.image_url,
      })) as Work[] : DEFAULT_WORKS);
      setWorks(toPortfolioWorks(w.data as any));
      if (cfg.data) setSettings(cfg.data as Settings);
    })();

    const channel = supabase.channel("landing-live-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => { void loadWorks(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_settings" }, () => { void loadSettings(); })
      .subscribe();

    const onFocus = () => {
      void loadWorks();
      void loadSettings();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, []);

  const shopName = settings?.shop_name || DEFAULT_SHOP_NAME;
  const tagline = settings?.tagline || "Твой стиль — наше мастерство";
  const heroMedia = settings?.hero_image_url || HERO_FALLBACK;
  const logoUrl = settings?.logo_url || "";

  return (
    <div className="min-h-screen bg-[#f3eee5] text-[#171411]">
      <SiteHeader shopName={shopName} logoUrl={logoUrl} />

      <section className="relative overflow-hidden px-5 pb-16 pt-32 md:pb-24 md:pt-36">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
          <div className="animate-hero-rise">
            <div className="inline-flex rounded-full border border-[#171411]/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#171411]/65">
              Барбершоп премиум-класса
            </div>
            <h1 className="mt-7 max-w-4xl font-sans text-[44px] font-extrabold leading-[0.98] tracking-[-0.035em] text-[#171411] sm:text-[58px] lg:text-[78px]">
              Острые линии, чистый фейд и стиль без суеты.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#171411]/68 md:text-lg">
              {tagline}. Аккуратная форма, спокойный сервис и запись онлайн за пару минут.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/booking" className="rounded-full bg-[#171411] px-7 py-4 text-sm font-extrabold text-[#f3eee5] hover:bg-black">
                Записаться сейчас
              </Link>
              <a href="#works" className="rounded-full border border-[#171411]/30 px-7 py-4 text-sm font-extrabold text-[#171411] hover:border-[#171411] hover:bg-[#171411] hover:text-[#f3eee5]">
                Смотреть работы
              </a>
            </div>
            <div className="mt-12 grid max-w-xl grid-cols-3 gap-3 border-y border-[#171411]/12 py-5">
              {[["1200+", "клиентов"], ["5", "мастеров"], ["8", "лет опыта"]].map(([n, l]) => (
                <div key={l}>
                  <div className="text-3xl font-extrabold tracking-[-0.03em]">{n}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#171411]/45">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-hero-rise [animation-delay:120ms]">
            <div className="aspect-[4/5] overflow-hidden bg-[#171411]">
              <MediaFrame src={heroMedia} fallback={HERO_FALLBACK} alt={shopName} className="h-full w-full object-cover grayscale motion-safe:animate-ken-burns" />
            </div>
            <Link to="/booking" className="absolute -bottom-5 left-5 rounded-full bg-white px-6 py-4 text-sm font-extrabold text-[#171411] shadow-2xl hover:bg-[#171411] hover:text-white">
              Записаться →
            </Link>
            <div className="absolute -right-3 top-8 hidden max-w-[180px] border border-white/45 bg-[#171411] p-4 text-sm font-semibold leading-6 text-[#f3eee5] shadow-xl sm:block">
              Чистая работа. Спокойная атмосфера. Точный результат.
            </div>
          </div>
        </div>
      </section>

      <Marquee words={["Уверенность", "Точность", "Комфорт", "Опыт", "Чистый фейд", "Хорошее настроение"]} />

      <Section id="services" label="Любимые услуги" title="Услуги и цены" subtitle="Понятный выбор, длительность и цена перед записью.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((s, i) => <ServiceCard key={s.id} s={s} index={i} />)}
          {services.length === 0 && Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse bg-[#171411]/5" />)}
        </div>
      </Section>

      <PhotoSection
        id="masters"
        label="Наша команда"
        title="Мастера, которым доверяют форму."
        subtitle=""
        railRef={mastersRef}
      >
        {masters.map((m, i) => <MasterCard key={m.id} m={m} index={i} />)}
      </PhotoSection>

      <PhotoSection
        id="works"
        label="Наши работы"
        title="Работы крупным планом."
        subtitle="Фотографии берутся из админки и двигаются стрелками как портфолио."
        railRef={worksRef}
      >
        {works.map((work, i) => <WorkCard key={work.id} work={work} index={i} />)}
      </PhotoSection>

      <Section id="how" label="Процесс" title="Как проходит запись" subtitle="Простой путь от выбора услуги до кресла мастера.">
        <div className="grid gap-4 md:grid-cols-4">
          {[["01", "Выбери услугу"], ["02", "Выбери мастера"], ["03", "Выбери время"], ["04", "Приходи"]].map(([n, t], i) => (
            <div key={n} className="group relative border border-[#171411]/12 bg-white/35 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#171411]/35 hover:bg-white/70">
              <div className="text-4xl font-extrabold tracking-[-0.03em] text-[#171411]">{n}</div>
              <div className="mt-10 text-xl font-extrabold text-[#171411]">{t}</div>
              {i < 3 && <div className="absolute -right-5 top-8 hidden h-10 w-10 items-center justify-center rounded-full border border-[#171411]/25 bg-[#f3eee5] text-[#171411] transition-transform group-hover:translate-x-2 md:flex">→</div>}
            </div>
          ))}
        </div>
      </Section>

      <section className="bg-[#171411] px-5 py-20 text-[#f3eee5] md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#f3eee5]/50">О нас</div>
            <h2 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] md:text-6xl">
              Не просто стрижка, а спокойная точная работа.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-8 text-[#f3eee5]/68">
            Здесь ценят аккуратность, спокойную атмосферу и результат, который держит форму после выхода из кресла. Мастера внимательно слушают пожелания, подбирают стрижку под стиль клиента и доводят детали до чистого, уверенного вида.
          </p>
        </div>
      </section>

      <Section label="Отзывы" title="Клиенты возвращаются" subtitle={`Коротко о том, почему выбирают ${shopName}.`}>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: "Артём", text: "Хожу второй год. Атмосфера спокойная, мастер слышит задачу, фейд всегда чистый." },
            { name: "Дмитрий", text: "Королевское бритьё — отдельный ритуал. Без спешки, аккуратно, очень достойно." },
            { name: "Игорь", text: "Записался онлайн за минуту, приехал — всё вовремя. Борода выглядит собранно." },
          ].map((r) => (
            <div key={r.name} className="border border-[#171411]/12 bg-white/35 p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-white/70">
              <div className="flex gap-1 text-[#171411]">{"★★★★★".split("").map((_, i) => <span key={i}>★</span>)}</div>
              <p className="mt-5 text-lg font-semibold leading-relaxed text-[#171411]/82">«{r.text}»</p>
              <div className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">— {r.name}</div>
            </div>
          ))}
        </div>
      </Section>

      <section id="contacts" className="px-5 py-20 md:py-28">
        <div className="mx-auto max-w-7xl border border-[#171411]/14 bg-white/35 p-7 md:p-12">
          <div className="grid gap-10 md:grid-cols-2 md:items-end">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">Контакты</div>
              <h2 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] text-[#171411] md:text-6xl">Приходите за свежей формой.</h2>
              <div className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
                <ContactItem icon={<MapPin className="h-4 w-4" />} label="АДРЕС" value={normalizeAddress(settings?.address)} href={ADDRESS_MAP_URL} external />
                <ContactItem icon={<Phone className="h-4 w-4" />} label="ТЕЛЕФОН" value={settings?.phone} href={phoneHref(settings?.phone)} />
                <Info label="ЧАСЫ РАБОТЫ" value={normalizeWorkingHours(settings?.working_hours)} />
                <ContactItem icon={<Instagram className="h-4 w-4" />} label="INSTAGRAM" value={settings?.instagram} href={instagramHref(settings?.instagram)} external />
              </div>
            </div>
            <div className="flex flex-col items-start gap-5 md:items-end md:text-right">
              <p className="max-w-sm text-xl font-semibold leading-tight text-[#171411]/65">Забронируйте кресло онлайн, а мы подготовим всё остальное.</p>
              <Link to="/booking" className="rounded-full bg-[#171411] px-8 py-4 text-sm font-extrabold text-[#f3eee5] hover:bg-black">
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
      <div className="text-[10px] font-bold tracking-[0.25em] text-[#171411]/42">{label}</div>
      <div className="mt-1 text-[#171411]/90">{value || "—"}</div>
    </div>
  );
}

function ContactItem({ icon, label, value, href, external = false }: { icon: ReactNode; label: string; value?: string | null; href: string; external?: boolean }) {
  const content = (
    <span className="mt-1 flex items-center gap-2 text-[#171411]/90 hover:text-black">
      <span className="text-[#171411]/45">{icon}</span>
      <span>{value || "—"}</span>
    </span>
  );

  return (
    <div>
      <div className="text-[10px] font-bold tracking-[0.25em] text-[#171411]/42">{label}</div>
      {href && value ? (
        <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
          {content}
        </a>
      ) : content}
    </div>
  );
}

function scrollRail(ref: RailRef, direction: -1 | 1) {
  const el = ref.current;
  if (!el) return;
  el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.88, 620), behavior: "smooth" });
}

function Marquee({ words }: { words: string[] }) {
  const repeated = [...words, ...words, ...words];
  return (
    <div className="overflow-hidden border-y border-[#171411]/10 bg-[#171411] py-4 text-[#f3eee5]">
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap text-sm font-extrabold uppercase tracking-[0.18em]">
        {repeated.map((word, i) => <span key={`${word}-${i}`}>{word}</span>)}
      </div>
    </div>
  );
}

function Section({ id, label, title, subtitle, children }: { id?: string; label: string; title: string; subtitle: string; children: ReactNode }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section id={id} className="relative px-5 py-20 md:py-28">
      <div ref={ref} className={`mx-auto max-w-7xl fade-in-up ${visible ? "fade-in-up-visible" : ""}`}>
        <SectionHeading label={label} title={title} subtitle={subtitle} />
        {children}
      </div>
    </section>
  );
}

function SectionHeading({ label, title, subtitle }: { label: string; title: string; subtitle: string }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-12">
      <div className="max-w-3xl">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">{label}</div>
        <h2 className="mt-5 text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] text-[#171411] md:text-6xl">{title}</h2>
      </div>
      {subtitle && <p className="max-w-md text-sm leading-7 text-[#171411]/58">{subtitle}</p>}
    </div>
  );
}

function PhotoSection({ id, label, title, subtitle, railRef, children }: { id: string; label: string; title: string; subtitle: string; railRef: RailRef; children: ReactNode }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section id={id} className="relative bg-[#171411] px-5 py-20 text-[#f3eee5] md:py-28">
      <div ref={ref} className={`mx-auto max-w-7xl fade-in-up ${visible ? "fade-in-up-visible" : ""}`}>
        <div className="mb-10 grid gap-7 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#f3eee5]/50">{label}</div>
            <h2 className="mt-5 text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] md:text-6xl">{title}</h2>
            {subtitle && <p className="mt-5 max-w-md text-sm leading-7 text-[#f3eee5]/58">{subtitle}</p>}
          </div>
          <CarouselControls onPrev={() => scrollRail(railRef, -1)} onNext={() => scrollRail(railRef, 1)} />
        </div>
        <div ref={railRef} className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[11vw] pb-3 scroll-smooth sm:px-5">
          {children}
        </div>
      </div>
    </section>
  );
}

function CarouselControls({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onPrev} className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f3eee5]/55 text-2xl text-[#f3eee5] hover:bg-[#f3eee5] hover:text-[#171411]" aria-label="Листать влево">←</button>
      <button onClick={onNext} className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f3eee5]/55 text-2xl text-[#f3eee5] hover:bg-[#f3eee5] hover:text-[#171411]" aria-label="Листать вправо">→</button>
    </div>
  );
}

function ServiceCard({ s, index }: { s: Service; index: number }) {
  return (
    <Link to="/booking" search={{ service: s.id }} className="group flex min-h-36 flex-col justify-between border border-[#171411]/12 bg-white/35 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#171411]/35 hover:bg-white/75" style={{ transitionDelay: `${Math.min(index * 35, 160)}ms` }}>
      <div>
        <h3 className="text-xl font-extrabold leading-tight tracking-[-0.025em] text-[#171411]">{s.name}</h3>
        {s.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#171411]/56">{s.description}</p>}
      </div>
      <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#171411]/10 pt-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#171411]/38">Длительность</div>
          <div className="mt-1 text-sm font-bold text-[#171411]/82">{formatDuration(s.duration)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#171411]/38">Цена</div>
          <div className="mt-1 text-xl font-extrabold text-[#171411]">{formatPrice(s.price)}</div>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#171411]/20 text-[#171411] transition-all group-hover:translate-x-1 group-hover:bg-[#171411] group-hover:text-[#f3eee5]">→</div>
      </div>
    </Link>
  );
}

function MasterCard({ m, index }: { m: Master; index: number }) {
  return (
    <div className="group min-w-[78vw] snap-center sm:min-w-[390px] lg:min-w-[440px]" style={{ transitionDelay: `${Math.min(index * 45, 180)}ms` }}>
      <div className="aspect-[4/5] overflow-hidden bg-[#f3eee5]/8">
        <MediaFrame src={m.photo_url} fallback={MASTER_FALLBACK} alt={m.name} className="h-full w-full object-cover object-center grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" />
      </div>
      <div className="mt-5">
        {m.speciality && <p className="text-sm text-[#f3eee5]/50">{m.speciality}</p>}
        <h3 className="mt-1 text-2xl font-extrabold tracking-[-0.025em] text-[#f3eee5]">{m.name}</h3>
        {m.experience && <div className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-[#f3eee5]/40">{m.experience}</div>}
      </div>
    </div>
  );
}

function WorkCard({ work, index }: { work: Work; index: number }) {
  return (
    <div className="group relative min-w-[78vw] snap-center overflow-hidden bg-[#f3eee5]/8 sm:min-w-[390px] lg:min-w-[440px]" style={{ transitionDelay: `${Math.min(index * 45, 180)}ms` }}>
      <div className="aspect-[4/5] overflow-hidden">
        <MediaFrame src={work.image_url} fallback={WORK_FALLBACKS[index % WORK_FALLBACKS.length]} alt={work.title || "Работа барбершопа"} className="h-full w-full object-cover object-center grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" />
      </div>
    </div>
  );
}
