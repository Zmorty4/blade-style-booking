import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "./admin.services";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsAdmin,
});

type S = {
  id?: string; shop_name: string; tagline: string; phone: string; address: string;
  working_hours: string; instagram: string; hero_image_url: string; logo_url: string;
};
const EMPTY: S = { shop_name: "", tagline: "", phone: "", address: "", working_hours: "", instagram: "", hero_image_url: "", logo_url: "" };

function SettingsAdmin() {
  const [form, setForm] = useState<S>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("shop_settings").select("*").limit(1).maybeSingle().then(({ data }) => {
      if (data) setForm({ ...EMPTY, ...(data as any) });
    });
  }, []);

  async function save() {
    setLoading(true); setSaved(false);
    const payload: any = { ...form };
    delete payload.id;
    if (form.id) await supabase.from("shop_settings").update(payload).eq("id", form.id);
    else {
      const { data } = await supabase.from("shop_settings").insert(payload).select().single();
      if (data) setForm({ ...form, id: (data as any).id });
    }
    setLoading(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const upd = (k: keyof S) => (v: string) => setForm({ ...form, [k]: v });

  return (
    <div>
      <div className="font-display text-[10px] tracking-[0.3em] text-gold">НАСТРОЙКИ</div>
      <h1 className="mt-2 font-serif text-4xl">Заведение</h1>

      <div className="mt-10 max-w-2xl space-y-6">
        <Input label="НАЗВАНИЕ" value={form.shop_name} onChange={upd("shop_name")} />
        <Input label="СЛОГАН" value={form.tagline} onChange={upd("tagline")} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="ТЕЛЕФОН" value={form.phone} onChange={upd("phone")} />
          <Input label="INSTAGRAM" value={form.instagram} onChange={upd("instagram")} />
        </div>
        <Input label="АДРЕС" value={form.address} onChange={upd("address")} />
        <Input label="ЧАСЫ РАБОТЫ" value={form.working_hours} onChange={upd("working_hours")} />
        <Input label="URL HERO-ФОТО" value={form.hero_image_url} onChange={upd("hero_image_url")} />
        <Input label="URL ЛОГОТИПА" value={form.logo_url} onChange={upd("logo_url")} />
        <div className="flex items-center gap-4 pt-4">
          <button onClick={save} disabled={loading} className="border border-gold bg-gold text-black px-8 py-3 font-display text-xs tracking-[0.25em] hover:bg-gold-light disabled:opacity-50 flex items-center gap-3">
            {loading && <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
            СОХРАНИТЬ
          </button>
          {saved && <span className="font-display text-xs tracking-[0.25em] text-gold">✓ СОХРАНЕНО</span>}
        </div>
      </div>
    </div>
  );
}
