import { Link } from "@tanstack/react-router";
import { Instagram, MapPin, Phone } from "lucide-react";
import { DEFAULT_SHOP_NAME } from "@/lib/brand";
import { ADDRESS_MAP_URL, instagramHref, normalizeAddress, phoneHref } from "@/lib/contact";

export function SiteFooter({
  shopName = DEFAULT_SHOP_NAME,
  phone = "",
  address = "",
  instagram = "",
}: { shopName?: string; phone?: string; address?: string; instagram?: string }) {
  const displayAddress = normalizeAddress(address);
  const phoneLink = phoneHref(phone);
  const instagramLink = instagramHref(instagram);

  return (
    <footer className="border-t border-[#f3eee5]/10 bg-[#171411] text-[#f3eee5]">
      <div className="mx-auto max-w-7xl px-5 py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_0.9fr_0.7fr]">
          <div>
            <div className="text-2xl font-extrabold uppercase tracking-[-0.04em]">{shopName}</div>
            <div className="mt-3 max-w-xs text-sm leading-7 text-[#f3eee5]/58">
              Мужской барбершоп с чистой формой, спокойным сервисом и онлайн-записью.
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#f3eee5]/42">Навигация</div>
            <div className="mt-4 flex flex-col gap-2 text-sm font-semibold">
              <a href="/#services" className="text-[#f3eee5]/75 hover:text-[#f3eee5]">Услуги</a>
              <a href="/#masters" className="text-[#f3eee5]/75 hover:text-[#f3eee5]">Мастера</a>
              <a href="/#works" className="text-[#f3eee5]/75 hover:text-[#f3eee5]">Работы</a>
              <Link to="/booking" className="text-[#f3eee5]/75 hover:text-[#f3eee5]">Записаться</Link>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#f3eee5]/42">Контакты</div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[#f3eee5]/75">
              <a href={ADDRESS_MAP_URL} target="_blank" rel="noreferrer" className="flex items-start gap-2 hover:text-[#f3eee5]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{displayAddress}</span>
              </a>
              {phone && (
                <a href={phoneLink} className="flex items-center gap-2 hover:text-[#f3eee5]">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{phone}</span>
                </a>
              )}
              {instagram && (
                <a href={instagramLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#f3eee5]">
                  <Instagram className="h-4 w-4 shrink-0" />
                  <span>{instagram}</span>
                </a>
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#f3eee5]/42">Админ</div>
            <div className="mt-4">
              <Link to="/admin" className="text-sm font-semibold text-[#f3eee5]/65 hover:text-[#f3eee5]">Панель управления</Link>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-[#f3eee5]/10 pt-6 text-xs text-[#f3eee5]/42 md:flex-row">
          <div>© 2025 {shopName}. Все права защищены.</div>
          <div>Сделано с уважением к ремеслу</div>
        </div>
      </div>
    </footer>
  );
}
