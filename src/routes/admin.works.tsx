import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MediaUpload, isVideoMedia } from "@/components/admin/MediaUpload";

export const Route = createFileRoute("/admin/works")({
  component: WorksAdmin,
});

type Work = {
  id?: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

const MIN_SLOTS = 3;
const db = supabase as any;

function emptySlot(sortOrder: number): Work {
  return {
    title: "Фото",
    description: null,
    image_url: null,
    is_active: false,
    sort_order: sortOrder,
  };
}

function WorksAdmin() {
  const [items, setItems] = useState<Work[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
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
    const { data, error } = await db.from("portfolio_items").select("*").order("sort_order").order("created_at");
    if (error) {
      setPageError(error.message || "Не удалось загрузить работы");
      return;
    }
    setPageError("");
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
    return slots.reduce((max, item) => Math.max(max, Number(item.sort_order) || 0), 0) + 1;
  }

  async function saveSlot(slot: Work, changes: Partial<Work>) {
    const tempKey = slot.id || `slot-${slot.sort_order}`;
    setSavingId(tempKey);
    setPageError("");

    const payload = {
      title: changes.title ?? slot.title ?? "Фото",
      description: null,
      image_url: changes.image_url ?? slot.image_url ?? null,
      is_active: changes.is_active ?? Boolean(changes.image_url ?? slot.image_url),
      sort_order: Number(changes.sort_order ?? slot.sort_order) || nextSortOrder(),
    };

    const result = slot.id
      ? await db.from("portfolio_items").update(payload).eq("id", slot.id).select("*").maybeSingle()
      : await db.from("portfolio_items").insert(payload).select("*").maybeSingle();

    setSavingId(null);

    if (result.error) {
      setPageError(result.error.message || "Не удалось сохранить фото");
      return;
    }

    await load();
  }

  async function addSlot() {
    await saveSlot(emptySlot(nextSortOrder()), { is_active: false });
  }

  async function deleteSlot(slot: Work) {
    if (!slot.id) return;
    if (!confirm("Удалить фото из портфолио?")) return;
    setSavingId(slot.id);
    const { error } = await db.from("portfolio_items").delete().eq("id", slot.id);
    setSavingId(null);
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
          onClick={addSlot}
          className="rounded-full bg-[#171411] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3eee5] hover:bg-black"
        >
          + Добавить фото
        </button>
      </div>

      {pageError && <div className="mt-6 border border-destructive/35 bg-destructive/10 p-4 text-sm font-semibold text-destructive">{pageError}</div>}

      <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {slots.map((slot, index) => {
          const slotKey = slot.id || `empty-${slot.sort_order}`;
          const saving = savingId === slotKey;

          return (
            <div key={slotKey} className={`border bg-white/45 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#171411]/35 ${slot.is_active ? "border-[#171411]/12" : "border-[#171411]/10 opacity-80"}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#171411]/45">Фото {index + 1}</div>
                  <div className="mt-1 text-sm font-semibold text-[#171411]/55">{slot.image_url ? "Можно заменить" : "Загрузите фото"}</div>
                </div>
                {saving && <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#171411]/45">Сохранение...</span>}
              </div>

              <MediaUpload
                label=""
                value={slot.image_url || ""}
                onChange={(url) => saveSlot(slot, { image_url: url, is_active: Boolean(url) })}
                accept="image/*"
              />

              <div className="mt-5 flex items-end gap-3">
                <label className="min-w-0 flex-1">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#171411]/45">Порядок</div>
                  <input
                    type="number"
                    value={slot.sort_order}
                    onChange={(event) => saveSlot(slot, { sort_order: Number(event.target.value) })}
                    className="w-full border border-[#171411]/15 bg-white/55 px-3 py-2 outline-none focus:border-[#171411]"
                  />
                </label>
                {slot.id && (
                  <button
                    onClick={() => saveSlot(slot, { is_active: !slot.is_active })}
                    className="border border-[#171411]/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-[#171411]"
                  >
                    {slot.is_active ? "Скрыть" : "Вкл"}
                  </button>
                )}
                {slot.id && (
                  <button
                    onClick={() => deleteSlot(slot)}
                    className="border border-[#171411]/15 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] hover:border-destructive hover:text-destructive"
                  >
                    Удал.
                  </button>
                )}
              </div>

              {slot.image_url && (
                <div className="mt-4 aspect-[4/5] overflow-hidden border border-[#171411]/10 bg-[#171411]/8">
                  {isVideoMedia(slot.image_url) ? (
                    <video src={slot.image_url} className="h-full w-full object-cover object-center grayscale" muted playsInline />
                  ) : (
                    <img src={slot.image_url} alt="" className="h-full w-full object-cover object-center grayscale" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
