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

const EMPTY: Partial<Work> = { title: "Фото", description: "", image_url: "", is_active: true, sort_order: 0 };
const db = supabase as any;

function WorksAdmin() {
  const [items, setItems] = useState<Work[]>([]);
  const [editing, setEditing] = useState<Partial<Work> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const { data } = await db.from("portfolio_items").select("*").order("sort_order");
    setItems((data || []) as Work[]);
  }

  useEffect(() => {
    load();
    const channel = supabase.channel("admin-portfolio-items")
      .on("postgres_changes", { event: "*", schema: "public", table: "portfolio_items" }, () => { void load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function nextSortOrder() {
    return items.reduce((max, item) => Math.max(max, Number(item.sort_order) || 0), 0) + 1;
  }

  async function updateImageUrl(url: string) {
    const editingId = editing?.id;
    setEditing((current) => current ? { ...current, image_url: url } : current);
    setError("");

    if (!editingId) return;

    setSaving(true);
    const { error: updateError } = await db
      .from("portfolio_items")
      .update({ image_url: url || null })
      .eq("id", editingId)
      .select("id")
      .maybeSingle();
    setSaving(false);

    if (updateError) {
      setError(updateError.message || "Не удалось заменить фото");
      return;
    }

    await load();
  }

  async function save() {
    if (!editing?.image_url) {
      setError("Сначала загрузите фото");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      title: editing.title?.trim() || "Фото",
      description: null,
      image_url: editing.image_url || null,
      is_active: editing.is_active ?? true,
      sort_order: Number(editing.sort_order) || 0,
    };

    const result = editing.id
      ? await db.from("portfolio_items").update(payload).eq("id", editing.id).select("id").maybeSingle()
      : await db.from("portfolio_items").insert(payload).select("id").maybeSingle();

    setSaving(false);
    if (result.error) {
      setError(result.error.message || "Не удалось сохранить фото");
      return;
    }

    await load();
    setEditing(null);
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
        <button onClick={() => { setError(""); setEditing({ ...EMPTY, sort_order: nextSortOrder() }); }} className="rounded-full bg-[#171411] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3eee5] hover:bg-black">
          + Добавить фото
        </button>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className={`border bg-white/45 p-4 transition-all duration-500 hover:-translate-y-1 hover:border-[#171411]/35 ${item.is_active ? "border-[#171411]/12" : "border-[#171411]/10 opacity-50"}`}>
            <div className="aspect-[4/5] overflow-hidden border border-[#171411]/10 bg-[#171411]/8">
              {item.image_url ? (
                isVideoMedia(item.image_url) ? <video src={item.image_url} className="h-full w-full object-cover object-center grayscale transition-transform duration-700 hover:scale-105" muted playsInline /> : <img src={item.image_url} alt="" className="h-full w-full object-cover object-center grayscale transition-transform duration-700 hover:scale-105" />
              ) : <div className="flex h-full items-center justify-center text-sm text-[#171411]/45">Нет фото</div>}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => { setError(""); setEditing(item); }} className="flex-1 border border-[#171411]/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-[#171411]">Редакт.</button>
              <button onClick={() => toggle(item)} className="border border-[#171411]/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-[#171411]">{item.is_active ? "Скрыть" : "Вкл"}</button>
              <button onClick={() => del(item.id)} className="border border-[#171411]/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-destructive hover:text-destructive">Удал.</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">{editing.id ? "Редактирование" : "Новое фото"}</div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">Фото</h2>
          <div className="mt-6 space-y-5">
            <MediaUpload label="Фото" value={editing.image_url || ""} onChange={updateImageUrl} accept="image/*" />
            <Input label="Порядок" type="number" value={String(editing.sort_order ?? 0)} onChange={v => setEditing({ ...editing, sort_order: Number(v) })} />
          </div>
          {error && <div className="mt-4 text-sm font-semibold text-destructive">{error}</div>}
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setEditing(null)} className="px-5 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#171411]/50 hover:text-[#171411]">Отмена</button>
            <button onClick={save} disabled={saving} className="rounded-full bg-[#171411] px-6 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3eee5] hover:bg-black disabled:opacity-50">{saving ? "Сохранение..." : "Сохранить"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
