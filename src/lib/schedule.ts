export const DEFAULT_WORKING_HOURS = "Ежедневно 10:00–21:00";

export function normalizeWorkingHours(value?: string | null) {
  const hours = value?.trim();
  if (!hours || hours === "Пн-Сб: 10:00–21:00" || hours === "Ежедневно 10:00–20:00") return DEFAULT_WORKING_HOURS;
  return hours;
}
