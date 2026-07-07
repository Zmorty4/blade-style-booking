import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/bookings")({
  component: BookingsAdmin,
});

type Row = {
  id: string;
  created_at: string;
  client_name: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  comment: string | null;
  status: string;
  services: { name: string } | null;
  masters: { name: string } | null;
};

const FILTERS = [
  { key: "all", label: "ВСЕ" },
  { key: "new", label: "НОВЫЕ" },
  { key: "confirmed", label: "ПОДТВЕРЖДЕНЫ" },
  { key: "cancelled", label: "ОТМЕНЕНЫ" },
];

function BookingsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    await (supabase as any).rpc("cleanup_past_bookings").catch(() => {});
    let q = supabase.from("bookings").select("*, services(name), masters(name)").order("booking_date", { ascending: true }).order("booking_time", { ascending: true });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRows((data || []) as any);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function updateStatus(id: string, status: string) {
    await supabase.from("bookings").update({ status }).eq("id", id);
    load();
  }

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="font-display text-[10px] tracking-[0.3em] text-gold">ЗАЯВКИ</div>
          <h1 className="mt-2 font-serif text-4xl">Записи клиентов</h1>
        </div>
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 font-display text-[10px] tracking-[0.25em] border transition-colors ${filter === f.key ? "bg-gold text-black border-gold" : "border-divider text-foreground/70 hover:border-gold"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 border border-divider overflow-x-auto">
        <div className="min-w-[1100px] grid grid-cols-[100px_100px_1fr_140px_1fr_1fr_120px_160px] gap-4 px-4 py-3 border-b border-divider font-display text-[10px] tracking-[0.25em] text-muted-foreground bg-card">
          <div>ДАТА</div><div>ВРЕМЯ</div><div>КЛИЕНТ</div><div>ТЕЛЕФОН</div><div>УСЛУГА</div><div>МАСТЕР</div><div>СТАТУС</div><div className="text-right">ДЕЙСТВИЯ</div>
        </div>
        {loading && <div className="p-8 text-center text-muted-foreground">Загрузка…</div>}
        {!loading && rows.length === 0 && <div className="p-8 text-center text-muted-foreground">Заявок пока нет</div>}
        {rows.map((r) => (
          <div key={r.id}
            className={`min-w-[1100px] grid grid-cols-[100px_100px_1fr_140px_1fr_1fr_120px_160px] gap-4 px-4 py-4 border-b border-divider items-center text-sm transition-colors hover:bg-card/60 ${r.status === "new" ? "border-l-2 border-l-gold" : ""}`}>
            <div>{new Date(r.booking_date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}</div>
            <div className="font-display text-gold">{r.booking_time.slice(0,5)}</div>
            <div>{r.client_name}</div>
            <div className="text-foreground/70 text-xs">{r.phone}</div>
            <div>{r.services?.name || "—"}</div>
            <div className="text-foreground/70">{r.masters?.name || "Любой"}</div>
            <div><StatusBadge status={r.status} /></div>
            <div className="flex justify-end gap-2">
              {r.status !== "confirmed" && <button onClick={() => updateStatus(r.id, "confirmed")} className="px-3 py-1.5 border border-gold text-gold text-xs hover:bg-gold hover:text-black transition-colors">✓</button>}
              {r.status !== "cancelled" && <button onClick={() => updateStatus(r.id, "cancelled")} className="px-3 py-1.5 border border-divider text-muted-foreground text-xs hover:border-destructive hover:text-destructive transition-colors">✕</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    new: ["НОВАЯ", "text-gold border-gold"],
    confirmed: ["ПОДТВ.", "text-emerald-400 border-emerald-400/60"],
    cancelled: ["ОТМЕНА", "text-muted-foreground border-divider"],
  };
  const [l, c] = map[status] || [status, "text-muted-foreground border-divider"];
  return <span className={`inline-block px-2 py-1 border font-display text-[10px] tracking-[0.2em] ${c}`}>{l}</span>;
}
