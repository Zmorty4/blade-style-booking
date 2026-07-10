import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { DEFAULT_SHOP_NAME } from "@/lib/brand";
import { formatPrice, formatDuration, formatPhone, cleanPhone } from "@/lib/format";

const searchSchema = z.object({
  service: z.string().optional(),
});

export const Route = createFileRoute("/booking")({
  validateSearch: searchSchema,
  component: BookingPage,
});

type Service = { id: string; name: string; price: number; duration: number; image_url: string | null };
type Master = { id: string; name: string; speciality: string | null; photo_url: string | null };
type BookingSlot = { booking_date: string; booking_time: string; master_id: string | null };
type Settings = { shop_name: string | null; logo_url: string | null };

const ANY_MASTER: Master = { id: "any", name: "Любой мастер", speciality: "Первый освободившийся", photo_url: null };
const SLOTS = Array.from({ length: 20 }, (_, i) => {
  const hour = 10 + Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthBounds(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return { start: dateKey(start), end: dateKey(end) };
}

async function cleanupPastBookings() {
  try {
    await (supabase as any).rpc("cleanup_past_bookings");
  } catch {
    // Booking should still work even if background cleanup fails.
  }
}

function BookingPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [monthBookings, setMonthBookings] = useState<BookingSlot[]>([]);

  const [service, setService] = useState<Service | null>(null);
  const [master, setMaster] = useState<Master | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7 (___) ___-__-__");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void cleanupPastBookings();
    (async () => {
      const [s, m, cfg] = await Promise.all([
        supabase.from("services").select("id,name,price,duration,image_url").eq("is_active", true).order("sort_order"),
        supabase.from("masters").select("id,name,speciality,photo_url").eq("is_active", true),
        supabase.from("shop_settings").select("shop_name,logo_url").limit(1).maybeSingle(),
      ]);
      if (s.data) {
        setServices(s.data as Service[]);
        if (search.service) {
          const preset = (s.data as Service[]).find((x) => x.id === search.service);
          if (preset) { setService(preset); setStep(2); }
        }
      }
      if (m.data) setMasters([ANY_MASTER, ...(m.data as Master[])]);
      if (cfg.data) setSettings(cfg.data as Settings);
    })();
  }, [search.service]);

  useEffect(() => {
    let alive = true;

    async function loadSettings() {
      const { data } = await supabase.from("shop_settings").select("shop_name,logo_url").limit(1).maybeSingle();
      if (alive && data) setSettings(data as Settings);
    }

    const channel = supabase.channel("booking-shop-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_settings" }, () => { void loadSettings(); })
      .subscribe();
    window.addEventListener("focus", loadSettings);

    return () => {
      alive = false;
      window.removeEventListener("focus", loadSettings);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const { start, end } = monthBounds(month);
    (async () => {
      let q = supabase
        .from("bookings")
        .select("booking_date, booking_time, master_id")
        .gte("booking_date", start)
        .lte("booking_date", end)
        .neq("status", "cancelled");
      if (master && master.id !== "any") q = q.eq("master_id", master.id);
      const { data } = await q;
      setMonthBookings((data || []) as BookingSlot[]);
    })();
  }, [month, master]);

  const activeMasterCount = Math.max(masters.length - 1, 1);

  const unavailableDates = useMemo(() => {
    const byDate = new Map<string, Map<string, number>>();
    monthBookings.forEach((b) => {
      const timeKey = (b.booking_time || "").slice(0, 5);
      if (!byDate.has(b.booking_date)) byDate.set(b.booking_date, new Map());
      const times = byDate.get(b.booking_date)!;
      times.set(timeKey, (times.get(timeKey) || 0) + 1);
    });

    return Array.from(byDate.entries())
      .filter(([, times]) => SLOTS.every((slot) => (times.get(slot) || 0) >= (master?.id === "any" ? activeMasterCount : 1)))
      .map(([day]) => day);
  }, [activeMasterCount, master?.id, monthBookings]);

  const busyTimes = useMemo(() => {
    if (!date) return [];
    const selectedDay = dateKey(date);
    const counts = new Map<string, number>();
    monthBookings
      .filter((b) => b.booking_date === selectedDay)
      .forEach((b) => {
        const timeKey = (b.booking_time || "").slice(0, 5);
        counts.set(timeKey, (counts.get(timeKey) || 0) + 1);
      });
    return SLOTS.filter((slot) => (counts.get(slot) || 0) >= (master?.id === "any" ? activeMasterCount : 1));
  }, [activeMasterCount, date, master?.id, monthBookings]);
  const shopName = settings?.shop_name || DEFAULT_SHOP_NAME;
  const logoUrl = settings?.logo_url || "";

  useEffect(() => {
    if (time && busyTimes.includes(time)) setTime(null);
  }, [busyTimes, time]);

  const canNext = useMemo(() => {
    if (step === 1) return !!service;
    if (step === 2) return !!master;
    if (step === 3) return !!date;
    if (step === 4) return !!time;
    if (step === 5) return name.trim().length >= 2 && cleanPhone(phone).length === 11;
    return false;
  }, [step, service, master, date, time, name, phone]);

  async function submit() {
    if (!service || !master || !date || !time) return;
    setSubmitting(true); setError("");
    try {
      const bookingDate = dateKey(date);
      let check = supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("booking_date", bookingDate)
        .eq("booking_time", time + ":00")
        .neq("status", "cancelled");
      if (master.id !== "any") check = check.eq("master_id", master.id);
      const { count } = await check;
      if ((count || 0) >= (master.id === "any" ? activeMasterCount : 1)) {
        throw new Error("Это время уже занято. Выберите другой слот.");
      }

      const payload = {
        client_name: name.trim(),
        phone: "+" + cleanPhone(phone),
        service_id: service.id,
        master_id: master.id === "any" ? null : master.id,
        booking_date: bookingDate,
        booking_time: time + ":00",
        comment: comment.trim() || null,
      };
      const { error: e } = await supabase.from("bookings").insert(payload);
      if (e) throw e;
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: payload.client_name,
          phone: payload.phone,
          service_name: service.name,
          master_name: master.name,
          booking_date: payload.booking_date,
          booking_time: time,
          comment: comment.trim(),
        }),
      }).catch(() => {});
      setStep(6);
    } catch (e: any) {
      setError(e.message || "Не удалось сохранить запись");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3eee5] text-[#171411]">
      <SiteHeader shopName={shopName} logoUrl={logoUrl} />
      <div className="px-5 pb-20 pt-32 md:pt-36">
        <div className="mx-auto max-w-6xl">
          <Link to="/" className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/50 hover:text-[#171411]">← На главную</Link>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <div className="inline-flex rounded-full border border-[#171411]/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#171411]/62">Online booking</div>
              <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] md:text-6xl">Запись без звонков и ожидания.</h1>
            </div>
            {step <= 5 && <Summary service={service} master={master} date={date} time={time} compact />}
          </div>

          {step <= 5 && (
            <>
              <div key={step} className="mt-10 animate-slide-in">
                {step === 1 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {services.map((s) => <ServiceOption key={s.id} item={s} selected={service?.id === s.id} onClick={() => setService(s)} />)}
                  </div>
                )}
                {step === 2 && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {masters.map((m) => <MasterOption key={m.id} item={m} selected={master?.id === m.id} onClick={() => { setMaster(m); setDate(null); setTime(null); }} />)}
                  </div>
                )}
                {step === 3 && <CalendarPicker value={date} month={month} unavailableDates={unavailableDates} onMonthChange={setMonth} onChange={(d) => { setDate(d); setTime(null); }} />}
                {step === 4 && <TimeGrid busyTimes={busyTimes} value={time} onChange={setTime} />}
                {step === 5 && (
                  <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                    <div className="space-y-6 border border-[#171411]/12 bg-white/35 p-5 md:p-7">
                      <Field label="Ваше имя">
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Александр" className="w-full border-b border-[#171411]/18 bg-transparent py-3 text-lg outline-none focus:border-[#171411]" />
                      </Field>
                      <Field label="Телефон">
                        <input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className="w-full border-b border-[#171411]/18 bg-transparent py-3 font-mono text-lg outline-none focus:border-[#171411]" />
                      </Field>
                      <Field label="Комментарий, необязательно">
                        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={500} placeholder="Пожелания к стрижке" className="w-full resize-none border border-[#171411]/18 bg-transparent p-3 text-sm outline-none focus:border-[#171411]" />
                      </Field>
                      {error && <div className="border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                    </div>
                    <Summary service={service} master={master} date={date} time={time} />
                  </div>
                )}
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-[#171411]/12 pt-6">
                <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="rounded-full border border-[#171411]/20 px-5 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#171411] hover:border-[#171411] disabled:opacity-30">
                  ← Назад
                </button>
                {step < 5 ? (
                  <button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="rounded-full bg-[#171411] px-7 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3eee5] hover:bg-black disabled:opacity-35">
                    Далее →
                  </button>
                ) : (
                  <button onClick={submit} disabled={!canNext || submitting} className="flex items-center gap-3 rounded-full bg-[#171411] px-7 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3eee5] hover:bg-black disabled:opacity-35">
                    {submitting && <Spinner />}
                    Подтвердить запись
                  </button>
                )}
              </div>
            </>
          )}

          {step === 6 && (
            <div className="mx-auto mt-16 max-w-xl text-center animate-slide-in">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#171411] text-[#f3eee5]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-12 w-12"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h2 className="mt-8 text-5xl font-extrabold tracking-[-0.035em]">Вы записаны!</h2>
              <p className="mt-4 text-[#171411]/65">Мы перезвоним для подтверждения в ближайшее время.</p>
              <div className="mt-10 text-left"><Summary service={service} master={master} date={date} time={time} /></div>
              <button onClick={() => navigate({ to: "/" })} className="mt-10 rounded-full bg-[#171411] px-8 py-4 text-sm font-extrabold text-[#f3eee5] hover:bg-black">
                На главную
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceOption({ item, selected, onClick }: { item: Service; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`relative min-h-44 border p-5 text-left transition-all duration-300 hover:-translate-y-1 ${selected ? "border-[#171411] bg-[#171411] text-[#f3eee5] shadow-xl" : "border-[#171411]/12 bg-white/35 text-[#171411] hover:border-[#171411]/35 hover:bg-white/75"}`}>
      {selected && <SelectedMark />}
      <h3 className="pr-16 text-2xl font-extrabold tracking-[-0.025em]">{item.name}</h3>
      <div className={`mt-8 flex items-end justify-between border-t pt-4 ${selected ? "border-[#f3eee5]/18" : "border-[#171411]/10"}`}>
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${selected ? "text-[#f3eee5]/50" : "text-[#171411]/38"}`}>Длительность</div>
          <div className="mt-1 font-bold">{formatDuration(item.duration)}</div>
        </div>
        <div className="text-right">
          <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${selected ? "text-[#f3eee5]/50" : "text-[#171411]/38"}`}>Цена</div>
          <div className="mt-1 text-2xl font-extrabold">{formatPrice(item.price)}</div>
        </div>
      </div>
    </button>
  );
}

function MasterOption({ item, selected, onClick }: { item: Master; selected: boolean; onClick: () => void }) {
  const initials = item.id === "any" ? "*" : item.name.trim().slice(0, 1).toUpperCase();

  return (
    <button onClick={onClick} className={`relative min-h-36 border p-5 text-left transition-all duration-300 hover:-translate-y-1 ${selected ? "border-[#171411] bg-[#171411] text-[#f3eee5] shadow-xl" : "border-[#171411]/12 bg-white/35 text-[#171411] hover:border-[#171411]/35 hover:bg-white/75"}`}>
      {selected && <SelectedMark />}
      <div className="flex items-center gap-4 pr-16">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border ${selected ? "border-[#f3eee5]/35 bg-[#f3eee5]/12 text-[#f3eee5]" : "border-[#171411]/15 bg-[#171411]/8 text-[#171411]"}`}>
          {item.photo_url ? (
            <img src={item.photo_url} alt={item.name} className="h-full w-full object-cover grayscale" />
          ) : (
            <span className="text-lg font-extrabold">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-extrabold tracking-[-0.025em]">{item.name}</div>
          <div className={`mt-2 text-sm ${selected ? "text-[#f3eee5]/62" : "text-[#171411]/58"}`}>{item.speciality}</div>
        </div>
      </div>
    </button>
  );
}

function SelectedMark() {
  return <div className="absolute right-4 top-4 rounded-full bg-[#f3eee5] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[#171411]">✓ Выбрано</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#171411]/45">{label}</div>{children}</label>;
}
function Spinner() { return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#f3eee5] border-t-transparent" />; }

function Summary({ service, master, date, time, compact = false }: { service: Service | null; master: Master | null; date: Date | null; time: string | null; compact?: boolean }) {
  return (
    <div className={`border border-[#171411]/14 bg-white/45 ${compact ? "p-4" : "p-6"}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#171411]/45">Ваша запись</div>
      <div className="mt-4 space-y-3 text-sm">
        <Row k="Услуга" v={service?.name} />
        <Row k="Мастер" v={master?.name} />
        <Row k="Дата" v={date ? date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) : undefined} />
        <Row k="Время" v={time || undefined} />
        {service && <div className="mt-3 flex justify-between border-t border-[#171411]/10 pt-3"><span className="text-[#171411]/50">Итого</span><span className="text-xl font-extrabold text-[#171411]">{formatPrice(service.price)}</span></div>}
      </div>
    </div>
  );
}
function Row({ k, v }: { k: string; v?: string }) { return <div className="flex justify-between gap-3"><span className="text-[#171411]/50">{k}</span><span className="text-right font-semibold text-[#171411]">{v || "—"}</span></div>; }

function CalendarPicker({ value, month, unavailableDates, onMonthChange, onChange }: { value: Date | null; month: Date; unavailableDates: string[]; onMonthChange: (d: Date) => void; onChange: (d: Date) => void }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const first = new Date(month);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
  const startWeekday = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(month.getFullYear(), month.getMonth(), i));

  return (
    <div className="mx-auto max-w-md border border-[#171411]/12 bg-white/45 p-5 md:p-6">
      <div className="flex items-center justify-between">
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth()-1, 1))} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#171411]/20 text-[#171411] hover:border-[#171411]">←</button>
        <div className="text-xl font-extrabold capitalize tracking-[-0.025em]">{month.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</div>
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth()+1, 1))} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#171411]/20 text-[#171411] hover:border-[#171411]">→</button>
      </div>
      <div className="mt-6 grid grid-cols-7 gap-1 text-center">
        {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d => <div key={d} className="py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#171411]/38">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = dateKey(d);
          const past = d < today;
          const sunday = d.getDay() === 0;
          const fullyBooked = unavailableDates.includes(key);
          const disabled = past || sunday || fullyBooked;
          const selected = value && d.toDateString() === value.toDateString();
          return (
            <button key={i} disabled={disabled} onClick={() => onChange(d)} title={fullyBooked ? "Все часы заняты" : undefined}
              className={`aspect-square text-sm font-bold transition-colors ${selected ? "bg-[#171411] text-[#f3eee5]" : disabled ? "bg-[#171411]/8 text-[#171411]/24 cursor-not-allowed line-through" : "text-[#171411] hover:bg-[#171411]/10"}`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#171411]/38">Серые даты недоступны</div>
    </div>
  );
}

function TimeGrid({ busyTimes, value, onChange }: { busyTimes: string[]; value: string | null; onChange: (t: string) => void }) {
  return (
    <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {SLOTS.map((t) => {
        const busy = busyTimes.includes(t);
        const sel = value === t;
        return (
          <button key={t} disabled={busy} onClick={() => onChange(t)} title={busy ? "Время уже занято" : undefined}
            className={`border py-3 text-sm font-extrabold tracking-[0.1em] transition-colors ${sel ? "border-[#171411] bg-[#171411] text-[#f3eee5]" : busy ? "border-[#171411]/10 bg-[#171411]/8 text-[#171411]/28 cursor-not-allowed line-through" : "border-[#171411]/14 bg-white/35 text-[#171411] hover:border-[#171411] hover:bg-white/75"}`}>
            {t}
          </button>
        );
      })}
    </div>
  );
}
