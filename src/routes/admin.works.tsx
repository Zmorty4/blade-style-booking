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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">Наши работы</div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.035em]">Портфолио</h1>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="rounded-full bg-[#171411] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3eee5] hover:bg-black">
          + Добавить работу
        </button>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className={`border bg-white/45 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#171411]/35 ${item.is_active ? "border-[#171411]/12" : "border-[#171411]/10 opacity-50"}`}>
            <div className="aspect-[4/5] overflow-hidden border border-[#171411]/10 bg-[#171411]/8">
              {item.image_url ? (
                isVideoMedia(item.image_url) ? <video src={item.image_url} className="h-full w-full object-cover grayscale" muted playsInline /> : <img src={item.image_url} alt="" className="h-full w-full object-cover grayscale" />
              ) : <div className="flex h-full items-center justify-center text-sm text-[#171411]/45">Нет фото</div>}
            </div>
            <div className="mt-5">
              <div className="text-2xl font-extrabold tracking-[-0.025em]">{item.title}</div>
              <div className="mt-1 min-h-10 line-clamp-2 text-sm text-[#171411]/56">{item.description}</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => setEditing(item)} className="flex-1 border border-[#171411]/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-[#171411]">Редакт.</button>
              <button onClick={() => toggle(item)} className="border border-[#171411]/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-[#171411]">{item.is_active ? "Скрыть" : "Вкл"}</button>
              <button onClick={() => del(item.id)} className="border border-[#171411]/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-destructive hover:text-destructive">Удал.</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">{editing.id ? "Редактирование" : "Новая работа"}</div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">{editing.title || "Работа"}</h2>
          <div className="mt-6 space-y-5">
            <Input label="Название" value={editing.title || ""} onChange={v => setEditing({ ...editing, title: v })} />
            <Input label="Описание" value={editing.description || ""} onChange={v => setEditing({ ...editing, description: v })} textarea />
            <MediaUpload label="Фото или видео" value={editing.image_url || ""} onChange={v => setEditing({ ...editing, image_url: v })} />
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
