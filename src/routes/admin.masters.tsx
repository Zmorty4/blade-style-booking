import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="font-display text-[10px] tracking-[0.3em] text-gold">МАСТЕРА</div>
          <h1 className="mt-2 font-serif text-4xl">Команда</h1>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="border border-gold px-6 py-3 font-display text-xs tracking-[0.25em] text-gold hover:bg-gold hover:text-black transition-colors">
          + ДОБАВИТЬ МАСТЕРА
        </button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <div key={m.id} className="bg-card border border-divider p-6">
            <div className="flex gap-4">
              {m.photo_url ? <img src={m.photo_url} alt="" className="w-20 h-20 object-cover" /> : <div className="w-20 h-20 bg-black border border-divider" />}
              <div className="min-w-0 flex-1">
                <div className="font-serif text-xl truncate">{m.name}</div>
                <div className="text-sm text-foreground/60">{m.speciality}</div>
                <div className="mt-1 font-display text-xs text-gold tracking-[0.2em]">{m.experience}</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setEditing(m)} className="flex-1 border border-divider hover:border-gold py-2 text-xs font-display tracking-[0.2em]">РЕДАКТ.</button>
              <button onClick={() => del(m.id)} className="border border-divider hover:border-destructive hover:text-destructive px-3 py-2 text-xs font-display tracking-[0.2em]">УДАЛ.</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="font-display text-[10px] tracking-[0.3em] text-gold">{editing.id ? "РЕДАКТИРОВАНИЕ" : "НОВЫЙ МАСТЕР"}</div>
          <h2 className="mt-2 font-serif text-3xl">{editing.name || "Мастер"}</h2>
          <div className="mt-6 space-y-5">
            <Input label="ИМЯ" value={editing.name || ""} onChange={v => setEditing({ ...editing, name: v })} />
            <Input label="СПЕЦИАЛИЗАЦИЯ" value={editing.speciality || ""} onChange={v => setEditing({ ...editing, speciality: v })} />
            <Input label="ОПЫТ" value={editing.experience || ""} onChange={v => setEditing({ ...editing, experience: v })} />
            <Input label="URL ФОТО" value={editing.photo_url || ""} onChange={v => setEditing({ ...editing, photo_url: v })} />
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
