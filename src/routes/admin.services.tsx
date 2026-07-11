import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, formatDuration } from "@/lib/format";

export const Route = createFileRoute("/admin/services")({
  component: ServicesAdmin,
});

type S = {
  id: string; name: string; description: string | null; price: number; duration: number;
  image_url: string | null; is_active: boolean; sort_order: number;
};

const EMPTY: Partial<S> = { name: "", description: "", price: 3000, duration: 45, image_url: "", is_active: true, sort_order: 0 };
const PORTFOLIO_PREFIX = "[portfolio-work]";

function ServicesAdmin() {
  const [items, setItems] = useState<S[]>([]);
  const [editing, setEditing] = useState<Partial<S> | null>(null);

  async function load() {
    const { data } = await supabase.from("services").select("*").order("sort_order");
    setItems(((data || []) as S[]).filter((item) => !item.name.startsWith(PORTFOLIO_PREFIX)));
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.name) return;
    const payload: any = {
      name: editing.name,
      description: editing.description || null,
      price: Number(editing.price) || 0,
      duration: Number(editing.duration) || 0,
      image_url: null,
      is_active: editing.is_active ?? true,
      sort_order: Number(editing.sort_order) || 0,
    };
    if (editing.id) await supabase.from("services").update(payload).eq("id", editing.id);
    else await supabase.from("services").insert(payload);
    setEditing(null);
    load();
  }

  async function del(id: string) {
    if (!confirm("Удалить услугу?")) return;
    await supabase.from("services").delete().eq("id", id);
    load();
  }

  async function toggle(s: S) {
    await supabase.from("services").update({ is_active: !s.is_active }).eq("id", s.id);
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">Услуги</div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.035em]">Управление услугами</h1>
          <p className="mt-2 max-w-xl text-sm text-[#171411]/56">Фото у услуг больше не используются на сайте: только название, описание, длительность и цена.</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="rounded-full bg-[#171411] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3eee5] hover:bg-black">
          + Добавить услугу
        </button>
      </div>

      <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((s) => (
          <div key={s.id} className={`border bg-white/45 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#171411]/35 ${s.is_active ? "border-[#171411]/12" : "border-[#171411]/10 opacity-50"}`}>
            <div className="flex min-h-40 flex-col justify-between">
              <div>
                <div className="text-2xl font-extrabold tracking-[-0.025em]">{s.name}</div>
                <div className="mt-2 line-clamp-2 text-sm leading-6 text-[#171411]/56">{s.description}</div>
              </div>
              <div className="mt-6 flex items-end justify-between border-t border-[#171411]/10 pt-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#171411]/38">Цена</div>
                  <div className="text-xl font-extrabold">{formatPrice(s.price)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#171411]/38">Длит.</div>
                  <div className="font-bold text-[#171411]/70">{formatDuration(s.duration)}</div>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => setEditing(s)} className="flex-1 border border-[#171411]/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-[#171411]">Ред.</button>
              <button onClick={() => toggle(s)} className="border border-[#171411]/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-[#171411]">{s.is_active ? "Скрыть" : "Вкл"}</button>
              <button onClick={() => del(s.id)} className="border border-[#171411]/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-destructive hover:text-destructive">Удал.</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">{editing.id ? "Редактирование" : "Новая услуга"}</div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">{editing.name || "Услуга"}</h2>
          <div className="mt-6 space-y-5">
            <Input label="Название" value={editing.name || ""} onChange={v => setEditing({ ...editing, name: v })} />
            <Input label="Описание" value={editing.description || ""} onChange={v => setEditing({ ...editing, description: v })} textarea />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Цена, ₸" type="number" value={String(editing.price ?? "")} onChange={v => setEditing({ ...editing, price: Number(v) })} />
              <Input label="Длит., мин" type="number" value={String(editing.duration ?? "")} onChange={v => setEditing({ ...editing, duration: Number(v) })} />
            </div>
            <Input label="Порядок" type="number" value={String(editing.sort_order ?? 0)} onChange={v => setEditing({ ...editing, sort_order: Number(v) })} />
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setEditing(null)} className="px-5 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#171411]/50 hover:text-[#171411]">Отмена</button>
            <button onClick={save} className="rounded-full bg-[#171411] px-6 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3eee5] hover:bg-black">Сохранить</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Input({ label, value, onChange, type = "text", textarea = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  return (
    <label className="block">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#171411]/45">{label}</div>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
          className="w-full resize-none border border-[#171411]/15 bg-white/55 p-3 text-sm outline-none transition-colors focus:border-[#171411]" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className="w-full border border-[#171411]/15 bg-white/55 p-3 text-sm outline-none transition-colors focus:border-[#171411]" />
      )}
    </label>
  );
}

export function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171411]/60 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[#171411]/15 bg-[#f3eee5] p-7 shadow-2xl animate-slide-in" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
