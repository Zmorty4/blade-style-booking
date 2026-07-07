import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
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

const ANY_MASTER: Master = { id: "any", name: "Любой мастер", speciality: "Первый освободившийся", photo_url: null };

function BookingPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [busy, setBusy] = useState<{ date: string; time: string }[]>([]);

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
    (async () => {
      const [s, m] = await Promise.all([
        supabase.from("services").select("id,name,price,duration,image_url").eq("is_active", true).order("sort_order"),
        supabase.from("masters").select("id,name,speciality,photo_url").eq("is_active", true),
      ]);
      if (s.data) {
        setServices(s.data as Service[]);
        if (search.service) {
          const preset = (s.data as Service[]).find((x) => x.id === search.service);
          if (preset) { setService(preset); setStep(2); }
        }
      }
      if (m.data) setMasters([ANY_MASTER, ...(m.data as Master[])]);
    })();
  }, [search.service]);

  useEffect(() => {
    if (!date) return;
    const iso = date.toISOString().slice(0, 10);
    (async () => {
      let q = supabase.from("bookings").select("booking_date, booking_time, master_id").eq("booking_date", iso).neq("status", "cancelled");
      if (master && master.id !== "any") q = q.eq("master_id", master.id);
      const { data } = await q;
      if (data) setBusy(data.map((b: any) => ({ date: b.booking_date, time: (b.booking_time as string).slice(0,5) })));
    })();
  }, [date, master]);

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
      const payload = {
        client_name: name.trim(),
        phone: "+" + cleanPhone(phone),
        service_id: service.id,
        master_id: master.id === "any" ? null : master.id,
        booking_date: date.toISOString().slice(0, 10),
        booking_time: time + ":00",
        comment: comment.trim() || null,
      };
      const { error: e } = await supabase.from("bookings").insert(payload);
      if (e) throw e;
      // fire-and-forget notify
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

  const steps = ["Услуга", "Мастер", "Дата", "Время", "Данные"];

  return (
    <div className="min-h-screen bg-black text-foreground">
      <SiteHeader />
      <div className="pt-32 pb-24">
        <div className="mx-auto max-w-4xl px-6">
          <Link to="/" className="font-display text-[10px] tracking-[0.3em] text-muted-foreground hover:text-gold">← НА ГЛАВНУЮ</Link>
          <h1 className="mt-4 font-serif text-4xl md:text-6xl">Онлайн-запись</h1>

          {step <= 5 && (
            <>
              <div className="mt-10 flex items-center gap-2">
                {steps.map((label, i) => {
                  const n = i + 1;
                  const active = n === step;
                  const done = n < step;
                  return (
                    <div key={label} className="flex-1">
                      <div className={`h-[2px] ${done || active ? "bg-gold" : "bg-divider"} transition-colors`} />
                      <div className={`mt-2 font-display text-[10px] tracking-[0.25em] ${active ? "text-gold" : done ? "text-foreground/70" : "text-muted-foreground"}`}>
                        {String(n).padStart(2, "0")} · {label.toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div key={step} className="mt-12 animate-slide-in">
                {step === 1 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {services.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setService(s)}
                        className={`text-left bg-card border p-6 transition-colors ${service?.id === s.id ? "border-gold" : "border-divider hover:border-gold/50"}`}
                      >
                        <div className="font-serif text-2xl">{s.name}</div>
                        <div className="mt-4 flex justify-between items-end">
                          <div className="font-display text-xl text-gold">{formatPrice(s.price)}</div>
                          <div className="font-display text-sm text-muted-foreground">{formatDuration(s.duration)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {step === 2 && (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {masters.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMaster(m)}
                        className={`text-left bg-card border p-6 transition-colors ${master?.id === m.id ? "border-gold" : "border-divider hover:border-gold/50"}`}
                      >
                        <div className="font-serif text-xl">{m.name}</div>
                        <div className="mt-1 text-sm text-foreground/60">{m.speciality}</div>
                      </button>
                    ))}
                  </div>
                )}
                {step === 3 && <CalendarPicker value={date} onChange={setDate} />}
                {step === 4 && (
                  <TimeGrid
                    busyTimes={busy.map(b => b.time)}
                    value={time}
                    onChange={setTime}
                  />
                )}
                {step === 5 && (
                  <div className="grid gap-8 md:grid-cols-[1fr_320px]">
                    <div className="space-y-6">
                      <Field label="ВАШЕ ИМЯ">
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Александр"
                          className="w-full bg-transparent border-b border-divider focus:border-gold outline-none py-3 text-lg"
                        />
                      </Field>
                      <Field label="ТЕЛЕФОН">
                        <input
                          value={phone}
                          onChange={(e) => setPhone(formatPhone(e.target.value))}
                          className="w-full bg-transparent border-b border-divider focus:border-gold outline-none py-3 text-lg font-mono"
                        />
                      </Field>
                      <Field label="КОММЕНТАРИЙ (НЕОБЯЗАТЕЛЬНО)">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={3}
                          maxLength={500}
                          placeholder="Пожелания к стрижке, аллергии, etc."
                          className="w-full bg-transparent border border-divider focus:border-gold outline-none p-3 text-sm resize-none"
                        />
                      </Field>
                      {error && <div className="text-destructive text-sm">{error}</div>}
                    </div>
                    <Summary service={service} master={master} date={date} time={time} />
                  </div>
                )}
              </div>

              <div className="mt-12 flex justify-between border-t border-divider pt-6">
                <button
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1}
                  className="font-display text-xs tracking-[0.25em] text-foreground/60 hover:text-gold disabled:opacity-30"
                >
                  ← НАЗАД
                </button>
                {step < 5 ? (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canNext}
                    className="border border-gold px-8 py-3 font-display text-xs tracking-[0.25em] text-gold hover:bg-gold hover:text-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gold transition-colors"
                  >
                    ДАЛЕЕ →
                  </button>
                ) : (
                  <button
                    onClick={submit}
                    disabled={!canNext || submitting}
                    className="border border-gold bg-gold text-black px-8 py-3 font-display text-xs tracking-[0.25em] hover:bg-gold-light disabled:opacity-40 transition-colors flex items-center gap-3"
                  >
                    {submitting && <Spinner />}
                    ПОДТВЕРДИТЬ ЗАПИСЬ
                  </button>
                )}
              </div>
            </>
          )}

          {step === 6 && (
            <div className="mt-16 text-center animate-slide-in">
              <div className="mx-auto w-24 h-24 border-2 border-gold flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-12 h-12 text-gold">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h2 className="mt-8 font-serif text-5xl">Вы записаны!</h2>
              <p className="mt-4 text-foreground/70">Мы перезвоним для подтверждения в ближайшее время.</p>
              <div className="mt-10 max-w-md mx-auto text-left">
                <Summary service={service} master={master} date={date} time={time} />
              </div>
              <button
                onClick={() => navigate({ to: "/" })}
                className="mt-10 border border-gold px-10 py-3 font-display text-xs tracking-[0.25em] text-gold hover:bg-gold hover:text-black transition-colors"
              >
                НА ГЛАВНУЮ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-display text-[10px] tracking-[0.3em] text-gold mb-2">{label}</div>
      {children}
    </label>
  );
}

function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />;
}

function Summary({ service, master, date, time }: { service: Service | null; master: Master | null; date: Date | null; time: string | null }) {
  return (
    <div className="bg-card border border-gold/40 p-6">
      <div className="font-display text-[10px] tracking-[0.3em] text-gold">ВАША ЗАПИСЬ</div>
      <div className="mt-4 space-y-3 text-sm">
        <Row k="Услуга" v={service?.name} />
        <Row k="Мастер" v={master?.name} />
        <Row k="Дата" v={date ? date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) : undefined} />
        <Row k="Время" v={time || undefined} />
        {service && (
          <div className="pt-3 mt-3 border-t border-divider flex justify-between">
            <span className="text-muted-foreground">Итого</span>
            <span className="font-display text-xl text-gold">{formatPrice(service.price)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
function Row({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-foreground/90 text-right">{v || "—"}</span>
    </div>
  );
}

function CalendarPicker({ value, onChange }: { value: Date | null; onChange: (d: Date) => void }) {
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const today = new Date(); today.setHours(0,0,0,0);
  const first = new Date(month);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
  const startWeekday = (first.getDay() + 6) % 7; // Mon=0
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(month.getFullYear(), month.getMonth(), i));

  return (
    <div className="bg-card border border-divider p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth()-1, 1))} className="text-gold hover:text-gold-light font-display">←</button>
        <div className="font-serif text-xl capitalize">
          {month.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
        </div>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth()+1, 1))} className="text-gold hover:text-gold-light font-display">→</button>
      </div>
      <div className="mt-6 grid grid-cols-7 gap-1 text-center">
        {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(d => (
          <div key={d} className="font-display text-[10px] tracking-[0.2em] text-muted-foreground py-2">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const past = d < today;
          const sunday = d.getDay() === 0;
          const disabled = past || sunday;
          const selected = value && d.toDateString() === value.toDateString();
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onChange(d)}
              className={`aspect-square text-sm transition-colors ${
                selected ? "bg-gold text-black" :
                disabled ? "text-muted-foreground/30" :
                "text-foreground hover:bg-gold/20"
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-4 font-display text-[10px] tracking-[0.25em] text-muted-foreground text-center">
        ВОСКРЕСЕНЬЕ — ВЫХОДНОЙ
      </div>
    </div>
  );
}

function TimeGrid({ busyTimes, value, onChange }: { busyTimes: string[]; value: string | null; onChange: (t: string) => void }) {
  const slots: string[] = [];
  for (let h = 10; h < 20; h++) {
    slots.push(`${String(h).padStart(2,"0")}:00`);
    slots.push(`${String(h).padStart(2,"0")}:30`);
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-w-2xl mx-auto">
      {slots.map((t) => {
        const busy = busyTimes.includes(t);
        const sel = value === t;
        return (
          <button
            key={t}
            disabled={busy}
            onClick={() => onChange(t)}
            className={`py-3 font-display text-sm tracking-[0.15em] border transition-colors ${
              sel ? "bg-gold text-black border-gold" :
              busy ? "border-divider text-muted-foreground/40 cursor-not-allowed line-through" :
              "border-divider text-foreground hover:border-gold hover:text-gold"
            }`}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
