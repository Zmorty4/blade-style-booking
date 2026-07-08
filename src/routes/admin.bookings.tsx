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
  { key: "all", label: "Все" },
  { key: "new", label: "Новые" },
  { key: "confirmed", label: "Подтверждены" },
  { key: "cancelled", label: "Отменены" },
];

async function cleanupPastBookings() {
  try {
    await (supabase as any).rpc("cleanup_past_bookings");
  } catch {
    // Cleanup is helpful, but the admin table should still load if it fails.
  }
}

function BookingsAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    await cleanupPastBookings();
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">Заявки</div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.035em]">Записи клиентов</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] transition-colors ${filter === f.key ? "border-[#171411] bg-[#171411] text-[#f3eee5]" : "border-[#171411]/15 text-[#171411]/65 hover:border-[#171411] hover:text-[#171411]"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-9 overflow-x-auto border border-[#171411]/12 bg-white/35">
        <div className="grid min-w-[1100px] grid-cols-[100px_100px_1fr_140px_1fr_1fr_120px_160px] gap-4 border-b border-[#171411]/12 bg-white/55 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#171411]/45">
          <div>Дата</div><div>Время</div><div>Клиент</div><div>Телефон</div><div>Услуга</div><div>Мастер</div><div>Статус</div><div className="text-right">Действия</div>
        </div>
        {loading && <div className="p-8 text-center text-[#171411]/50">Загрузка…</div>}
        {!loading && rows.length === 0 && <div className="p-8 text-center text-[#171411]/50">Заявок пока нет</div>}
        {rows.map((r) => (
          <div key={r.id}
            className={`grid min-w-[1100px] grid-cols-[100px_100px_1fr_140px_1fr_1fr_120px_160px] items-center gap-4 border-b border-[#171411]/10 px-4 py-4 text-sm transition-colors hover:bg-white/60 ${r.status === "new" ? "border-l-4 border-l-[#171411]" : ""}`}>
            <div>{new Date(r.booking_date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}</div>
            <div className="font-extrabold">{r.booking_time.slice(0,5)}</div>
            <div className="font-semibold">{r.client_name}</div>
            <div className="text-xs text-[#171411]/62">{r.phone}</div>
            <div>{r.services?.name || "—"}</div>
            <div className="text-[#171411]/62">{r.masters?.name || "Любой"}</div>
            <div><StatusBadge status={r.status} /></div>
            <div className="flex justify-end gap-2">
              {r.status !== "confirmed" && <button onClick={() => updateStatus(r.id, "confirmed")} className="border border-[#171411]/18 px-3 py-1.5 text-xs font-extrabold hover:border-[#171411] hover:bg-[#171411] hover:text-[#f3eee5]">✓</button>}
              {r.status !== "cancelled" && <button onClick={() => updateStatus(r.id, "cancelled")} className="border border-[#171411]/18 px-3 py-1.5 text-xs font-extrabold text-[#171411]/60 hover:border-destructive hover:text-destructive">✕</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    new: ["НОВАЯ", "border-[#171411] bg-[#171411] text-[#f3eee5]"],
    confirmed: ["ПОДТВ.", "border-emerald-700/45 text-emerald-800 bg-emerald-50/70"],
    cancelled: ["ОТМЕНА", "border-[#171411]/15 text-[#171411]/50"],
  };
  const [l, c] = map[status] || [status, "border-[#171411]/15 text-[#171411]/50"];
  return <span className={`inline-block border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${c}`}>{l}</span>;
}
