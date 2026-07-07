import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="min-h-screen bg-black" />;
  if (!session) return <LoginScreen />;
  return <AdminShell />;
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr("Неверный email или пароль");
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm">
        <Link to="/" className="font-display text-[10px] tracking-[0.3em] text-muted-foreground hover:text-gold">← НА САЙТ</Link>
        <div className="mt-6 font-display text-[10px] tracking-[0.3em] text-gold">АДМИН-ПАНЕЛЬ</div>
        <h1 className="mt-3 font-serif text-4xl">Вход</h1>
        <div className="mt-10 space-y-6">
          <label className="block">
            <div className="font-display text-[10px] tracking-[0.3em] text-gold mb-2">EMAIL</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-transparent border-b border-divider focus:border-gold outline-none py-3" />
          </label>
          <label className="block">
            <div className="font-display text-[10px] tracking-[0.3em] text-gold mb-2">ПАРОЛЬ</div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-transparent border-b border-divider focus:border-gold outline-none py-3" />
          </label>
          {err && <div className="text-destructive text-sm">{err}</div>}
          <button disabled={loading} className="w-full border border-gold py-4 font-display text-xs tracking-[0.3em] text-gold hover:bg-gold hover:text-black transition-colors flex justify-center items-center gap-3">
            {loading && <span className="inline-block w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />}
            ВОЙТИ
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

  const items = [
    { to: "/admin/bookings", label: "Заявки", badge: newCount },
    { to: "/admin/services", label: "Услуги" },
    { to: "/admin/masters", label: "Мастера" },
    { to: "/admin/settings", label: "Настройки" },
  ];

  useEffect(() => {
    if (pathname === "/admin") navigate({ to: "/admin/bookings", replace: true });
  }, [pathname, navigate]);

  return (
    <div className="min-h-screen bg-black text-foreground flex">
      <aside className="w-64 border-r border-divider min-h-screen p-6 flex flex-col">
        <Link to="/" className="font-display text-lg tracking-[0.25em]">BLADE &amp; STYLE</Link>
        <div className="font-display text-[10px] tracking-[0.3em] text-gold mt-1">АДМИН</div>
        <nav className="mt-10 space-y-1 flex-1">
          {items.map((it) => {
            const active = pathname === it.to;
            return (
              <Link key={it.to} to={it.to}
                className={`flex items-center justify-between px-3 py-3 font-display text-xs tracking-[0.2em] transition-colors ${active ? "bg-card text-gold border-l-2 border-gold" : "text-foreground/70 hover:text-gold border-l-2 border-transparent"}`}>
                <span>{it.label.toUpperCase()}</span>
                {"badge" in it && it.badge ? <span className="bg-gold text-black px-2 py-0.5 text-[10px]">{it.badge}</span> : null}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={async () => { await supabase.auth.signOut(); }}
          className="mt-6 text-left font-display text-[10px] tracking-[0.3em] text-muted-foreground hover:text-gold"
        >
          ВЫЙТИ →
        </button>
      </aside>
      <main className="flex-1 p-10 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
