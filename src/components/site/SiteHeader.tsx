import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DEFAULT_SHOP_NAME } from "@/lib/brand";

export function SiteHeader({ shopName = DEFAULT_SHOP_NAME, logoUrl = "" }: { shopName?: string; logoUrl?: string }) {
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
    <header className={`fixed inset-x-0 top-0 z-50 border-b border-[#171411]/10 bg-white/95 backdrop-blur-xl transition-all duration-300 ${scrolled || open ? "shadow-sm" : ""}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-3 leading-none text-[#171411] transition-opacity hover:opacity-70" onClick={() => setOpen(false)}>
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${shopName} logo`}
              className="h-11 w-11 shrink-0 rounded-full border border-[#171411]/12 object-cover"
            />
          )}
          <span>
            <span className="block text-xl font-extrabold uppercase tracking-[-0.04em] sm:text-2xl">{shopName}</span>
            <span className="mt-0.5 block text-xs font-semibold text-[#171411]/58 sm:text-sm">Hair Studio</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-bold text-[#171411]/62 hover:text-[#171411]">
              {l.label}
            </a>
          ))}
          <Link to="/booking" className="rounded-full bg-[#171411] px-5 py-2.5 text-sm font-extrabold text-[#f3eee5] hover:bg-black">
            Записаться
          </Link>
        </nav>

        <button
          onClick={() => setOpen(v => !v)}
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-expanded={open}
          aria-label="Открыть меню"
        >
          <span className={`h-0.5 w-8 bg-[#171411] transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-8 bg-[#171411] transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-8 bg-[#171411] transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      <div className={`grid overflow-hidden transition-[grid-template-rows] duration-300 md:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <nav className="min-h-0 border-t border-[#171411]/10 px-5">
          <div className="space-y-1 py-5">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-4 text-2xl font-extrabold tracking-[-0.03em] text-[#171411]">
                {l.label}
              </a>
            ))}
            <Link to="/booking" onClick={() => setOpen(false)} className="mt-4 block rounded-full bg-[#171411] px-6 py-4 text-center text-sm font-extrabold text-[#f3eee5]">
              Записаться онлайн
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
