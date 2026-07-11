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
    <footer className="border-t border-[#171411]/10 bg-white text-[#171411]">
      <div className="mx-auto max-w-7xl px-5 py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_0.9fr_0.7fr]">
          <div>
            <div className="text-2xl font-extrabold uppercase tracking-[-0.04em]">{shopName}</div>
            <div className="mt-3 max-w-xs text-sm leading-7 text-[#171411]/58">
              Барбершоп в Уральске: мужские и детские стрижки, бритьё и удобная онлайн-запись.
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#171411]/42">Навигация</div>
            <div className="mt-4 flex flex-col gap-2 text-sm font-semibold">
              <a href="/#services" className="text-[#171411]/70 hover:text-[#171411]">Услуги</a>
              <a href="/#masters" className="text-[#171411]/70 hover:text-[#171411]">Мастера</a>
              <a href="/#works" className="text-[#171411]/70 hover:text-[#171411]">Работы</a>
              <Link to="/booking" className="text-[#171411]/70 hover:text-[#171411]">Записаться</Link>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#171411]/42">Контакты</div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[#171411]/70">
              <a href={ADDRESS_MAP_URL} target="_blank" rel="noreferrer" className="flex items-start gap-2 hover:text-[#171411]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{displayAddress}</span>
              </a>
              {phone && (
                <a href={phoneLink} className="flex items-center gap-2 hover:text-[#171411]">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{phone}</span>
                </a>
              )}
              {instagram && (
                <a href={instagramLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#171411]">
                  <Instagram className="h-4 w-4 shrink-0" />
                  <span>{instagram}</span>
                </a>
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#171411]/42">Админ</div>
            <div className="mt-4">
              <Link to="/admin" className="text-sm font-semibold text-[#171411]/65 hover:text-[#171411]">Панель управления</Link>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-[#171411]/10 pt-6 text-xs text-[#171411]/42 md:flex-row">
          <div>© 2025 {shopName}. Все права защищены.</div>
          <div>Сделано с уважением к ремеслу</div>
        </div>
      </div>
    </footer>
  );
}
