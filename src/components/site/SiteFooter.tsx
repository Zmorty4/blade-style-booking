import { Link } from "@tanstack/react-router";
import { DEFAULT_SHOP_NAME } from "@/lib/brand";

export function SiteFooter({
  shopName = DEFAULT_SHOP_NAME,
  phone = "",
  address = "",
  instagram = "",
}: { shopName?: string; phone?: string; address?: string; instagram?: string }) {
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
            <div className="mt-4 flex flex-col gap-2 text-sm text-[#f3eee5]/75">
              {address && <span>{address}</span>}
              {phone && <a href={`tel:${phone}`} className="hover:text-[#f3eee5]">{phone}</a>}
              {instagram && <a href={`https://instagram.com/${instagram.replace("@","")}`} target="_blank" rel="noreferrer" className="hover:text-[#f3eee5]">{instagram}</a>}
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
