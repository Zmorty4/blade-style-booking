import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SHOP_NAME } from "@/lib/brand";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type AdminBrandSettings = {
  shop_name: string | null;
  logo_url: string | null;
};

const DEFAULT_BRAND: AdminBrandSettings = { shop_name: DEFAULT_SHOP_NAME, logo_url: "" };

function AdminLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="min-h-screen bg-[#f3eee5]" />;
  if (!session) return <LoginScreen />;
  return <AdminShell />;
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [brand, setBrand] = useState<AdminBrandSettings>(DEFAULT_BRAND);

  useEffect(() => {
    supabase.from("shop_settings").select("shop_name,logo_url").limit(1).maybeSingle().then(({ data }) => {
      if (data) setBrand({ ...DEFAULT_BRAND, ...(data as AdminBrandSettings) });
    });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr("Неверный email или пароль");
  }

  const brandName = brand.shop_name || DEFAULT_SHOP_NAME;
  const logoUrl = brand.logo_url || "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3eee5] px-5 text-[#171411]">
      <form onSubmit={submit} className="w-full max-w-sm border border-[#171411]/12 bg-white/45 p-7 shadow-sm">
        <Link to="/" className="text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/50 hover:text-[#171411]">← На сайт</Link>
        <div className="mt-7 flex items-center gap-3">
          {logoUrl && <img src={logoUrl} alt={`${brandName} logo`} className="h-12 w-12 rounded-full border border-[#171411]/12 object-cover" />}
          <div className="min-w-0">
            <div className="truncate text-xl font-extrabold uppercase tracking-[-0.04em]">{brandName}</div>
            <div className="text-xs font-semibold text-[#171411]/52">Admin workspace</div>
          </div>
        </div>
        <div className="mt-7 inline-flex rounded-full border border-[#171411]/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#171411]/62">Админ-панель</div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.035em]">Вход</h1>
        <div className="mt-9 space-y-6">
          <label className="block">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#171411]/45">Email</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border-b border-[#171411]/18 bg-transparent py-3 outline-none focus:border-[#171411]" />
          </label>
          <label className="block">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#171411]/45">Пароль</div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border-b border-[#171411]/18 bg-transparent py-3 outline-none focus:border-[#171411]" />
          </label>
          {err && <div className="border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-full bg-[#171411] py-4 text-xs font-extrabold uppercase tracking-[0.2em] text-[#f3eee5] hover:bg-black disabled:opacity-50">
            {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#f3eee5] border-t-transparent" />}
            Войти
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [newCount, setNewCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [brand, setBrand] = useState<AdminBrandSettings>(DEFAULT_BRAND);

  useEffect(() => {
    (async () => {
      const { count } = await supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "new");
      setNewCount(count || 0);
    })();
    const ch = supabase.channel("admin-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, async () => {
        const { count } = await supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "new");
        setNewCount(count || 0);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadBrand() {
      const { data } = await supabase.from("shop_settings").select("shop_name,logo_url").limit(1).maybeSingle();
      if (alive && data) setBrand({ ...DEFAULT_BRAND, ...(data as AdminBrandSettings) });
    }

    void loadBrand();
    const ch = supabase.channel("admin-brand-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_settings" }, () => { void loadBrand(); })
      .subscribe();

    const onUpdated = (event: Event) => {
      const detail = (event as CustomEvent<AdminBrandSettings>).detail;
      if (detail) setBrand({ ...DEFAULT_BRAND, ...detail });
      else void loadBrand();
    };
    window.addEventListener("shop-settings-updated", onUpdated);

    return () => {
      alive = false;
      window.removeEventListener("shop-settings-updated", onUpdated);
      supabase.removeChannel(ch);
    };
  }, []);

  const items = [
    { to: "/admin/bookings", label: "Заявки", badge: newCount },
    { to: "/admin/services", label: "Услуги" },
    { to: "/admin/masters", label: "Мастера" },
    { to: "/admin/works", label: "Работы" },
    { to: "/admin/settings", label: "Настройки" },
  ];

  useEffect(() => {
    if (pathname === "/admin") navigate({ to: "/admin/bookings", replace: true });
    setMenuOpen(false);
  }, [pathname, navigate]);

  const brandName = brand.shop_name || DEFAULT_SHOP_NAME;
  const logoUrl = brand.logo_url || "";

  const brandLink = (
    <Link to="/" className="flex items-center gap-3 text-[#171411]">
      {logoUrl && <img src={logoUrl} alt={`${brandName} logo`} className="h-12 w-12 shrink-0 rounded-full border border-[#171411]/12 object-cover" />}
      <span className="min-w-0">
        <span className="block truncate text-xl font-extrabold uppercase tracking-[-0.04em]">{brandName}</span>
        <span className="mt-1 block text-xs font-semibold text-[#171411]/52">Admin workspace</span>
      </span>
    </Link>
  );

  const nav = (
    <>
      {brandLink}
      <nav className="mt-9 flex-1 space-y-1">
        {items.map((it) => {
          const active = pathname === it.to;
          return (
            <Link key={it.to} to={it.to}
              className={`flex items-center justify-between rounded-full px-4 py-3 text-sm font-extrabold transition-colors ${active ? "bg-[#171411] text-[#f3eee5]" : "text-[#171411]/62 hover:bg-[#171411]/8 hover:text-[#171411]"}`}>
              <span>{it.label}</span>
              {"badge" in it && it.badge ? <span className={`px-2 py-0.5 text-[10px] ${active ? "bg-[#f3eee5] text-[#171411]" : "bg-[#171411] text-[#f3eee5]"}`}>{it.badge}</span> : null}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={async () => { await supabase.auth.signOut(); }}
        className="mt-6 text-left text-xs font-bold uppercase tracking-[0.2em] text-[#171411]/45 hover:text-[#171411]"
      >
        Выйти →
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f3eee5] text-[#171411] lg:flex">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#171411]/10 bg-[#f3eee5]/90 px-4 py-4 backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          {logoUrl && <img src={logoUrl} alt={`${brandName} logo`} className="h-10 w-10 shrink-0 rounded-full border border-[#171411]/12 object-cover" />}
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold uppercase tracking-[-0.03em]">{brandName}</div>
            <div className="text-[11px] font-semibold text-[#171411]/52">Админ</div>
          </div>
        </div>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="rounded-full border border-[#171411]/20 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#171411]"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "Закрыть" : "Меню"}
        </button>
      </header>

      {menuOpen && <button className="fixed inset-0 z-40 bg-[#171411]/50 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню" />}

      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-72 max-w-[86vw] flex-col border-r border-[#171411]/10 bg-[#f3eee5] p-6 transition-transform duration-300 lg:sticky lg:z-auto lg:w-64 lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {nav}
      </aside>

      <main className="min-w-0 flex-1 overflow-x-auto p-4 sm:p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}
