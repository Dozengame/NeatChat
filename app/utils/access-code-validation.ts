function toLocalDayKey(time: number) {
  if (!Number.isFinite(time) || time <= 0) return "";

  const date = new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isAccessCodeValidatedToday(
  validatedAt: number,
  now = Date.now(),
) {
  return toLocalDayKey(validatedAt) === toLocalDayKey(now);
}
