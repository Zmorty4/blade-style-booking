import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MediaUpload, isVideoMedia } from "@/components/admin/MediaUpload";
import { formatPrice, formatDuration } from "@/lib/format";

export const Route = createFileRoute("/admin/services")({
  component: ServicesAdmin,
});

type S = {
  id: string; name: string; description: string | null; price: number; duration: number;
  image_url: string | null; is_active: boolean; sort_order: number;
};

const EMPTY: Partial<S> = { name: "", description: "", price: 2000, duration: 45, image_url: "", is_active: true, sort_order: 0 };

function ServicesAdmin() {
  const [items, setItems] = useState<S[]>([]);
  const [editing, setEditing] = useState<Partial<S> | null>(null);

  async function load() {
    const { data } = await supabase.from("services").select("*").order("sort_order");
    setItems((data || []) as S[]);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.name) return;
    const payload: any = {
      name: editing.name,
      description: editing.description || null,
      price: Number(editing.price) || 0,
      duration: Number(editing.duration) || 0,
      image_url: editing.image_url || null,
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
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="font-display text-[10px] tracking-[0.3em] text-gold">УСЛУГИ</div>
          <h1 className="mt-2 font-serif text-4xl">Управление услугами</h1>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="border border-gold px-6 py-3 font-display text-xs tracking-[0.25em] text-gold hover:bg-gold hover:text-black transition-colors">
          + ДОБАВИТЬ УСЛУГУ
        </button>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {items.map((s) => (
          <div key={s.id} className={`bg-card border p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 ${s.is_active ? "border-divider" : "border-divider opacity-50"}`}>
            {s.image_url && (
              <div className="mb-5 aspect-[16/8] overflow-hidden border border-divider bg-black">
                {isVideoMedia(s.image_url) ? (
                  <video src={s.image_url} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <img src={s.image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            )}
            <div className="flex justify-between gap-4">
              <div className="min-w-0">
                <div className="font-serif text-2xl">{s.name}</div>
                <div className="mt-1 text-sm text-foreground/60 line-clamp-2">{s.description}</div>
                <div className="mt-4 flex gap-6">
                  <div className="font-display text-lg text-gold">{formatPrice(s.price)}</div>
                  <div className="font-display text-sm text-muted-foreground">{formatDuration(s.duration)}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => setEditing(s)} className="border border-divider hover:border-gold px-3 py-1.5 text-xs font-display tracking-[0.2em]">РЕД.</button>
                <button onClick={() => toggle(s)} className="border border-divider hover:border-gold px-3 py-1.5 text-xs font-display tracking-[0.2em]">{s.is_active ? "СКРЫТЬ" : "ВКЛ"}</button>
                <button onClick={() => del(s.id)} className="border border-divider hover:border-destructive hover:text-destructive px-3 py-1.5 text-xs font-display tracking-[0.2em]">УДАЛ.</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="font-display text-[10px] tracking-[0.3em] text-gold">{editing.id ? "РЕДАКТИРОВАНИЕ" : "НОВАЯ УСЛУГА"}</div>
          <h2 className="mt-2 font-serif text-3xl">{editing.name || "Услуга"}</h2>
          <div className="mt-6 space-y-5">
            <Input label="НАЗВАНИЕ" value={editing.name || ""} onChange={v => setEditing({ ...editing, name: v })} />
            <Input label="ОПИСАНИЕ" value={editing.description || ""} onChange={v => setEditing({ ...editing, description: v })} textarea />
            <div className="grid grid-cols-2 gap-4">
              <Input label="ЦЕНА, ₽" type="number" value={String(editing.price ?? "")} onChange={v => setEditing({ ...editing, price: Number(v) })} />
              <Input label="ДЛИТ., МИН" type="number" value={String(editing.duration ?? "")} onChange={v => setEditing({ ...editing, duration: Number(v) })} />
            </div>
            <MediaUpload label="ФОТО ИЛИ ВИДЕО" value={editing.image_url || ""} onChange={v => setEditing({ ...editing, image_url: v })} />
            <Input label="ПОРЯДОК" type="number" value={String(editing.sort_order ?? 0)} onChange={v => setEditing({ ...editing, sort_order: Number(v) })} />
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setEditing(null)} className="px-6 py-2 font-display text-xs tracking-[0.25em] text-muted-foreground">ОТМЕНА</button>
            <button onClick={save} className="border border-gold bg-gold text-black px-6 py-2 font-display text-xs tracking-[0.25em] hover:bg-gold-light">СОХРАНИТЬ</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Input({ label, value, onChange, type = "text", textarea = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  return (
    <label className="block">
      <div className="font-display text-[10px] tracking-[0.3em] text-gold mb-2">{label}</div>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
          className="w-full bg-black border border-divider focus:border-gold outline-none p-3 text-sm resize-none transition-colors" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-black border border-divider focus:border-gold outline-none p-3 text-sm transition-colors" />
      )}
    </label>
  );
}

export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-dark border border-gold/40 p-8 animate-slide-in" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
