import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MediaUpload, isVideoMedia } from "@/components/admin/MediaUpload";
import { Input, Modal } from "./admin.services";

export const Route = createFileRoute("/admin/works")({
  component: WorksAdmin,
});

type PortfolioSlot = {
  id?: string;
  image_url: string | null;
  sort_order: number;
};

const MIN_SLOTS = 3;
const PORTFOLIO_PREFIX = "[portfolio-work]";
const db = supabase as any;

function emptySlot(sortOrder: number): PortfolioSlot {
  return { image_url: null, sort_order: sortOrder };
}

function WorksAdmin() {
  const [items, setItems] = useState<PortfolioSlot[]>([]);
  const [editing, setEditing] = useState<PortfolioSlot | null>(null);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const slots = useMemo(() => {
    const sorted = [...items].sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
    const result = [...sorted];
    for (let index = result.length; index < MIN_SLOTS; index += 1) {
      result.push(emptySlot(index + 1));
    }
    return result;
  }, [items]);

  async function load() {
    const { data, error } = await db
      .from("services")
      .select("id,name,image_url,sort_order")
      .like("name", `${PORTFOLIO_PREFIX}%`)
      .order("sort_order");

    if (error) {
      setPageError(error.message || "Не удалось загрузить фото");
      return;
    }

    setPageError("");
    setItems((data || []).map((row: any) => ({
      id: row.id,
      image_url: row.image_url,
      sort_order: Number(row.sort_order) || 0,
    })));
  }

  useEffect(() => {
    load();
    const channel = supabase.channel("admin-portfolio-service-slots")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => { void load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function save() {
    if (!editing?.image_url) {
      setPageError("Сначала загрузите фото");
      return;
    }

    setSaving(true);
    setPageError("");

    const sortOrder = Number(editing.sort_order) || 1;
    const payload = {
      name: `${PORTFOLIO_PREFIX} ${sortOrder}`,
      description: null,
      price: 0,
      duration: 0,
      image_url: editing.image_url,
      is_active: false,
      sort_order: sortOrder,
    };

    const result = editing.id
      ? await db.from("services").update(payload).eq("id", editing.id).select("id").maybeSingle()
      : await db.from("services").insert(payload).select("id").maybeSingle();

    setSaving(false);

    if (result.error) {
      setPageError(result.error.message || "Не удалось сохранить фото");
      return;
    }

    setEditing(null);
    await load();
  }

  async function del(slot: PortfolioSlot) {
    if (!slot.id) return;
    if (!confirm("Удалить фото из портфолио?")) return;
    const { error } = await db.from("services").delete().eq("id", slot.id);
    if (error) {
      setPageError(error.message || "Не удалось удалить фото");
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">Наши работы</div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.035em]">Портфолио</h1>
        </div>
        <button
          onClick={() => setEditing(emptySlot(slots.length + 1))}
          className="rounded-full bg-[#171411] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3eee5] hover:bg-black"
        >
          + Добавить фото
        </button>
      </div>

      {pageError && <div className="mt-6 border border-destructive/35 bg-destructive/10 p-4 text-sm font-semibold text-destructive">{pageError}</div>}

      <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {slots.map((slot, index) => (
          <div key={slot.id || `empty-${slot.sort_order}`} className="border border-[#171411]/12 bg-white/45 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#171411]/35">
            <div className="flex gap-4">
              {slot.image_url ? (
                isVideoMedia(slot.image_url) ? (
                  <video src={slot.image_url} className="h-24 w-24 object-cover grayscale" muted playsInline />
                ) : (
                  <img src={slot.image_url} alt="" className="h-24 w-24 object-cover grayscale" />
                )
              ) : (
                <div className="flex h-24 w-24 items-center justify-center border border-[#171411]/12 bg-[#171411]/8 text-xs font-bold uppercase tracking-[0.14em] text-[#171411]/35">
                  Фото
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-xl font-extrabold tracking-[-0.02em]">Фото {index + 1}</div>
                <div className="text-sm text-[#171411]/58">{slot.image_url ? "Загружено" : "Пустой блок"}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#171411]/42">Порядок {slot.sort_order}</div>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => { setPageError(""); setEditing(slot); }} className="flex-1 border border-[#171411]/15 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-[#171411]">Редакт.</button>
              {slot.id && <button onClick={() => del(slot)} className="border border-[#171411]/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-destructive hover:text-destructive">Удал.</button>}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">{editing.id ? "Редактирование" : "Новое фото"}</div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">Фото</h2>
          <div className="mt-6 space-y-5">
            <MediaUpload label="Фото" value={editing.image_url || ""} onChange={(url) => setEditing({ ...editing, image_url: url })} accept="image/*" />
            <Input label="Порядок" type="number" value={String(editing.sort_order ?? 1)} onChange={(value) => setEditing({ ...editing, sort_order: Number(value) })} />
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setEditing(null)} className="px-5 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#171411]/50 hover:text-[#171411]">Отмена</button>
            <button onClick={save} disabled={saving} className="rounded-full bg-[#171411] px-6 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3eee5] hover:bg-black disabled:opacity-50">{saving ? "Сохранение..." : "Сохранить"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
