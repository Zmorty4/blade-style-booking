export const DEFAULT_ADDRESS = "Проспект Абая, 104";
export const ADDRESS_MAP_URL = "https://2gis.kz/uralsk/geo/22800108812199967/51.389220,51.218845";

export function normalizeAddress(value?: string | null) {
  const address = value?.trim();
  if (!address) return DEFAULT_ADDRESS;
  return address.replace(/\s+,/g, ",").replace(/,\s*/g, ", ");
}

export function instagramHref(value?: string | null) {
  const handle = value?.trim().replace(/^@/, "");
  return handle ? `https://instagram.com/${handle}` : "";
}

export function phoneHref(value?: string | null) {
  const phone = value?.trim();
  return phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";
}
