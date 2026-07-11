export const DEFAULT_ADDRESS = "Проспект Алии Молдагуловой, 47";
export const DEFAULT_PHONE = "+7 707 626 4043";
export const DEFAULT_INSTAGRAM = "@zaman.barbershop04";
export const ADDRESS_MAP_URL = "https://2gis.kz/aktobe/geo/70000001065307977";

export function normalizeAddress(value?: string | null) {
  const address = value?.trim();
  if (!address) return DEFAULT_ADDRESS;
  const cleanAddress = address.replace(/\s+,/g, ",").replace(/,\s*/g, ", ");
  if (/Абая/i.test(cleanAddress) || /104/.test(cleanAddress)) return DEFAULT_ADDRESS;
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
  if (!phone || phone.includes("776 939")) return DEFAULT_PHONE;
  return phone;
}

export function normalizeInstagram(value?: string | null) {
  const instagram = value?.trim();
  if (!instagram || instagram.includes("zaman_barbershop07")) return DEFAULT_INSTAGRAM;
  return instagram.startsWith("@") ? instagram : `@${instagram}`;
}
