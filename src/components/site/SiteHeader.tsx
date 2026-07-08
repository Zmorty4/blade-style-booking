import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function SiteHeader({ shopName = "BLADE & STYLE" }: { shopName?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#services", label: "Услуги" },
    { href: "#masters", label: "Мастера" },
    { href: "#works", label: "Работы" },
    { href: "#contacts", label: "Контакты" },
  ];

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled || open ? "bg-black/88 backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="leading-none text-white transition-opacity hover:opacity-75" onClick={() => setOpen(false)}>
          <span className="block font-sans text-2xl font-extrabold uppercase tracking-[-0.04em]">{shopName}</span>
          <span className="mt-0.5 block text-sm font-medium text-white/80">Hair Studio</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-semibold text-white/72 hover:text-white">
              {l.label}
            </a>
          ))}
          <Link to="/booking" className="rounded-full border border-white/65 px-5 py-2 text-sm font-bold text-white hover:bg-white hover:text-black">
            Записаться
          </Link>
        </nav>

        <button
          onClick={() => setOpen(v => !v)}
          className="flex h-12 w-12 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-expanded={open}
          aria-label="Открыть меню"
        >
          <span className={`h-0.5 w-8 bg-white transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-8 bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-8 bg-white transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      <div className={`grid overflow-hidden transition-[grid-template-rows] duration-300 md:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <nav className="min-h-0 border-t border-white/10 px-6">
          <div className="space-y-1 py-5">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-4 text-2xl font-extrabold tracking-[-0.03em] text-white">
                {l.label}
              </a>
            ))}
            <Link to="/booking" onClick={() => setOpen(false)} className="mt-4 block rounded-full bg-white px-6 py-4 text-center text-sm font-bold text-black">
              Записаться онлайн
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
