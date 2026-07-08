import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MediaUpload, isVideoMedia } from "@/components/admin/MediaUpload";
import { Input, Modal } from "./admin.services";

export const Route = createFileRoute("/admin/masters")({
  component: MastersAdmin,
});

type M = { id: string; name: string; speciality: string | null; experience: string | null; photo_url: string | null; is_active: boolean };
const EMPTY: Partial<M> = { name: "", speciality: "", experience: "", photo_url: "", is_active: true };

function MastersAdmin() {
  const [items, setItems] = useState<M[]>([]);
  const [editing, setEditing] = useState<Partial<M> | null>(null);

  async function load() {
    const { data } = await supabase.from("masters").select("*").order("created_at");
    setItems((data || []) as M[]);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.name) return;
    const payload: any = {
      name: editing.name,
      speciality: editing.speciality || null,
      experience: editing.experience || null,
      photo_url: editing.photo_url || null,
      is_active: editing.is_active ?? true,
    };
    if (editing.id) await supabase.from("masters").update(payload).eq("id", editing.id);
    else await supabase.from("masters").insert(payload);
    setEditing(null); load();
  }
  async function del(id: string) {
    if (!confirm("Удалить мастера?")) return;
    await supabase.from("masters").delete().eq("id", id); load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">Мастера</div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.035em]">Команда</h1>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="rounded-full bg-[#171411] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3eee5] hover:bg-black">
          + Добавить мастера
        </button>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((m) => (
          <div key={m.id} className="border border-[#171411]/12 bg-white/45 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#171411]/35">
            <div className="flex gap-4">
              {m.photo_url ? (
                isVideoMedia(m.photo_url) ? <video src={m.photo_url} className="h-20 w-20 object-cover grayscale" muted playsInline /> : <img src={m.photo_url} alt="" className="h-20 w-20 object-cover grayscale" />
              ) : <div className="h-20 w-20 border border-[#171411]/12 bg-[#171411]/8" />}
              <div className="min-w-0 flex-1">
                <div className="truncate text-xl font-extrabold tracking-[-0.02em]">{m.name}</div>
                <div className="text-sm text-[#171411]/58">{m.speciality}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#171411]/42">{m.experience}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setEditing(m)} className="flex-1 border border-[#171411]/15 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-[#171411]">Редакт.</button>
              <button onClick={() => del(m.id)} className="border border-[#171411]/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-destructive hover:text-destructive">Удал.</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">{editing.id ? "Редактирование" : "Новый мастер"}</div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">{editing.name || "Мастер"}</h2>
          <div className="mt-6 space-y-5">
            <Input label="Имя" value={editing.name || ""} onChange={v => setEditing({ ...editing, name: v })} />
            <Input label="Специализация" value={editing.speciality || ""} onChange={v => setEditing({ ...editing, speciality: v })} />
            <Input label="Опыт" value={editing.experience || ""} onChange={v => setEditing({ ...editing, experience: v })} />
            <MediaUpload label="Фото или видео" value={editing.photo_url || ""} onChange={v => setEditing({ ...editing, photo_url: v })} />
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
