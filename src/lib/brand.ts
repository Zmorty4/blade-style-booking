export const DEFAULT_SHOP_NAME = "Bro";

export function normalizeShopName(value?: string | null) {
  const name = value?.trim();
  if (!name || /zaman/i.test(name)) return DEFAULT_SHOP_NAME;
  return name;
}
