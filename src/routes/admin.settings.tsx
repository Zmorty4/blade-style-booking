import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { DEFAULT_WORKING_HOURS, normalizeWorkingHours } from "@/lib/schedule";
import { Input } from "./admin.services";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsAdmin,
});

type S = {
  id?: string; shop_name: string; tagline: string; phone: string; address: string;
  working_hours: string; instagram: string; hero_image_url: string; logo_url: string;
};
const EMPTY: S = { shop_name: "", tagline: "", phone: "", address: "", working_hours: DEFAULT_WORKING_HOURS, instagram: "", hero_image_url: "", logo_url: "" };

function SettingsAdmin() {
  const [form, setForm] = useState<S>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("shop_settings").select("*").limit(1).maybeSingle().then(({ data }) => {
      if (data) {
        const next = { ...EMPTY, ...(data as any) };
        next.working_hours = normalizeWorkingHours(next.working_hours);
        setForm(next);
      }
    });
  }, []);

  async function save() {
    setLoading(true); setSaved(false); setError("");
    const payload: any = { ...form };
    delete payload.id;
    const result = form.id
      ? await supabase.from("shop_settings").update(payload).eq("id", form.id).select().single()
      : await supabase.from("shop_settings").insert(payload).select().single();

    if (result.error) {
      setError(result.error.message || "Не удалось сохранить настройки");
      setLoading(false);
      return;
    }

    const next = { ...EMPTY, ...(result.data as any) };
    setForm(next);
    window.dispatchEvent(new CustomEvent("shop-settings-updated", {
      detail: { shop_name: next.shop_name, logo_url: next.logo_url },
    }));
    setLoading(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const upd = (k: keyof S) => (v: string) => setForm(current => ({ ...current, [k]: v }));
  const updateHeroMedia = useCallback((value: string) => {
    setForm(current => ({ ...current, hero_image_url: value }));
  }, []);
  const updateLogo = useCallback((value: string) => {
    setForm(current => ({ ...current, logo_url: value }));
  }, []);

  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45">Настройки</div>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.035em]">Заведение</h1>

      <div className="mt-9 max-w-3xl border border-[#171411]/12 bg-white/35 p-5 md:p-7">
        <div className="space-y-6">
          <Input label="Название" value={form.shop_name} onChange={upd("shop_name")} />
          <Input label="Слоган" value={form.tagline} onChange={upd("tagline")} />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Телефон" value={form.phone} onChange={upd("phone")} />
            <Input label="Instagram" value={form.instagram} onChange={upd("instagram")} />
          </div>
          <Input label="Адрес" value={form.address} onChange={upd("address")} />
          <Input label="Часы работы" value={form.working_hours} onChange={upd("working_hours")} />
          <MediaUpload label="Hero-фото или видео" value={form.hero_image_url} onChange={updateHeroMedia} />
          <MediaUpload label="Логотип" value={form.logo_url} onChange={updateLogo} accept="image/*" />
          <div className="flex items-center gap-4 pt-2">
            <button onClick={save} disabled={loading} className="flex items-center gap-3 rounded-full bg-[#171411] px-8 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3eee5] hover:bg-black disabled:opacity-50">
              {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#f3eee5] border-t-transparent" />}
              Сохранить
            </button>
            {saved && <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#171411]/62">✓ Сохранено</span>}
          </div>
          {error && <div className="text-sm font-semibold text-destructive">{error}</div>}
        </div>
      </div>
    </div>
  );
}
