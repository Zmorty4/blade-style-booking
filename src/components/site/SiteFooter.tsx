import { Link } from "@tanstack/react-router";

export function SiteFooter({
  shopName = "BLADE & STYLE",
  phone = "",
  address = "",
  instagram = "",
}: { shopName?: string; phone?: string; address?: string; instagram?: string }) {
  return (
    <footer className="bg-black border-t border-divider">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="font-display text-lg tracking-[0.25em] text-foreground">{shopName}</div>
            <div className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Мужской барбершоп<br />премиум-класса
            </div>
          </div>
          <div>
            <div className="font-display text-[10px] tracking-[0.3em] text-gold">НАВИГАЦИЯ</div>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <a href="/#services" className="text-foreground/80 hover:text-gold">Услуги</a>
              <a href="/#masters" className="text-foreground/80 hover:text-gold">Мастера</a>
              <Link to="/booking" className="text-foreground/80 hover:text-gold">Записаться</Link>
            </div>
          </div>
          <div>
            <div className="font-display text-[10px] tracking-[0.3em] text-gold">КОНТАКТЫ</div>
            <div className="mt-4 flex flex-col gap-2 text-sm text-foreground/80">
              {address && <span>{address}</span>}
              {phone && <a href={`tel:${phone}`} className="hover:text-gold">{phone}</a>}
              {instagram && <a href={`https://instagram.com/${instagram.replace("@","")}`} target="_blank" rel="noreferrer" className="hover:text-gold">{instagram}</a>}
            </div>
          </div>
          <div>
            <div className="font-display text-[10px] tracking-[0.3em] text-gold">АДМИН</div>
            <div className="mt-4">
              <Link to="/admin" className="text-sm text-foreground/60 hover:text-gold">Панель управления</Link>
            </div>
          </div>
        </div>
        <div className="mt-14 border-t border-divider pt-6 flex flex-col md:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <div>© 2025 {shopName}. Все права защищены.</div>
          <div>Сделано с уважением к ремеслу</div>
        </div>
      </div>
    </footer>
  );
}
