import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function SiteHeader({ shopName = "BLADE & STYLE" }: { shopName?: string }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/90 backdrop-blur border-b border-divider" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-display text-lg text-foreground tracking-[0.2em]">
          {shopName}
        </Link>
        <nav className="hidden gap-10 md:flex">
          {[
            { href: "#services", label: "Услуги" },
            { href: "#masters", label: "Мастера" },
            { href: "#how", label: "Процесс" },
            { href: "#contacts", label: "Контакты" },
          ].map((l) => (
            <a key={l.href} href={l.href} className="font-display text-xs text-foreground/80 hover:text-gold transition-colors tracking-[0.2em]">
              {l.label}
            </a>
          ))}
        </nav>
        <Link
          to="/booking"
          className="border border-gold px-5 py-2 font-display text-xs text-gold hover:bg-gold hover:text-black transition-colors tracking-[0.2em]"
        >
          Записаться
        </Link>
      </div>
    </header>
  );
}
