import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MediaUpload, isVideoMedia } from "@/components/admin/MediaUpload";
import { Input, Modal } from "./admin.services";

export const Route = createFileRoute("/admin/works")({
  component: WorksAdmin,
});

type Work = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

const EMPTY: Partial<Work> = { title: "", description: "", image_url: "", is_active: true, sort_order: 0 };
const db = supabase as any;

function WorksAdmin() {
  const [items, setItems] = useState<Work[]>([]);
  const [editing, setEditing] = useState<Partial<Work> | null>(null);

  async function load() {
    const { data } = await db.from("portfolio_items").select("*").order("sort_order");
    setItems((data || []) as Work[]);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.title) return;
    const payload = {
      title: editing.title,
      description: editing.description || null,
      image_url: editing.image_url || null,
      is_active: editing.is_active ?? true,
      sort_order: Number(editing.sort_order) || 0,
    };
    if (editing.id) await db.from("portfolio_items").update(payload).eq("id", editing.id);
    else await db.from("portfolio_items").insert(payload);
    setEditing(null);
    load();
  }

  async function del(id: string) {
    if (!confirm("Удалить работу?")) return;
    await db.from("portfolio_items").delete().eq("id", id);
    load();
  }

  async function toggle(item: Work) {
    await db.from("portfolio_items").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  }

  return (
    <div>
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="font-display text-[10px] tracking-[0.3em] text-gold">НАШИ РАБОТЫ</div>
          <h1 className="mt-2 font-serif text-4xl">Портфолио</h1>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="border border-gold px-6 py-3 font-display text-xs tracking-[0.25em] text-gold hover:bg-gold hover:text-black transition-colors">
          + ДОБАВИТЬ РАБОТУ
        </button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className={`bg-card border p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 ${item.is_active ? "border-divider" : "border-divider opacity-50"}`}>
            <div className="aspect-[4/5] overflow-hidden border border-divider bg-black">
              {item.image_url ? (
                isVideoMedia(item.image_url) ? <video src={item.image_url} className="h-full w-full object-cover" muted playsInline /> : <img src={item.image_url} alt="" className="h-full w-full object-cover" />
              ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Нет фото</div>}
            </div>
            <div className="mt-5">
              <div className="font-serif text-2xl">{item.title}</div>
              <div className="mt-1 min-h-10 text-sm text-foreground/60 line-clamp-2">{item.description}</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => setEditing(item)} className="flex-1 border border-divider hover:border-gold px-3 py-2 text-xs font-display tracking-[0.2em]">РЕДАКТ.</button>
              <button onClick={() => toggle(item)} className="border border-divider hover:border-gold px-3 py-2 text-xs font-display tracking-[0.2em]">{item.is_active ? "СКРЫТЬ" : "ВКЛ"}</button>
              <button onClick={() => del(item.id)} className="border border-divider hover:border-destructive hover:text-destructive px-3 py-2 text-xs font-display tracking-[0.2em]">УДАЛ.</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="font-display text-[10px] tracking-[0.3em] text-gold">{editing.id ? "РЕДАКТИРОВАНИЕ" : "НОВАЯ РАБОТА"}</div>
          <h2 className="mt-2 font-serif text-3xl">{editing.title || "Работа"}</h2>
          <div className="mt-6 space-y-5">
            <Input label="НАЗВАНИЕ" value={editing.title || ""} onChange={v => setEditing({ ...editing, title: v })} />
            <Input label="ОПИСАНИЕ" value={editing.description || ""} onChange={v => setEditing({ ...editing, description: v })} textarea />
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
