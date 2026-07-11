export const DEFAULT_ADDRESS = "Проспект Нурсултана Назарбаева, 129";
export const DEFAULT_PHONE = "+7 776 116 07 07";
export const DEFAULT_INSTAGRAM = "@bro_barbershop.07";
export const ADDRESS_MAP_URL = "https://2gis.kz/uralsk/geo/70000001024809573";

export function normalizeAddress(value?: string | null) {
  const address = value?.trim();
  if (!address) return DEFAULT_ADDRESS;
  const cleanAddress = address.replace(/\s+,/g, ",").replace(/,\s*/g, ", ");
  if (/Абая/i.test(cleanAddress) || /104/.test(cleanAddress) || /Молдагуловой/i.test(cleanAddress) || /47/.test(cleanAddress)) return DEFAULT_ADDRESS;
  return cleanAddress;
}

export function instagramHref(value?: string | null) {
  const handle = normalizeInstagram(value).replace(/^@/, "");
  return handle ? `https://instagram.com/${handle}` : "";
}

export function phoneHref(value?: string | null) {
  const phone = normalizePhone(value);
  return phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";
}

export function normalizePhone(value?: string | null) {
  const phone = value?.trim();
  if (!phone || phone.includes("776 939") || phone.includes("707 626")) return DEFAULT_PHONE;
  return phone;
}

export function normalizeInstagram(value?: string | null) {
  const instagram = value?.trim();
  if (!instagram || instagram.includes("zaman_barbershop07") || instagram.includes("zaman.barbershop04")) return DEFAULT_INSTAGRAM;
  return instagram.startsWith("@") ? instagram : `@${instagram}`;
}
