export const formatPrice = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;
export const formatDuration = (m: number) => {
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} ч ${r} мин` : `${h} ч`;
};
export const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  const d = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
  const p = d.padEnd(11, "_").split("");
  return `+7 (${p.slice(1,4).join("")}) ${p.slice(4,7).join("")}-${p.slice(7,9).join("")}-${p.slice(9,11).join("")}`;
};
export const cleanPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  return digits.startsWith("8") ? "7" + digits.slice(1) : digits;
};
