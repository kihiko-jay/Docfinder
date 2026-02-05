export const normalizeKenyanPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
};

export const requireField = <T>(value: T | undefined | null, name: string): T => {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${name} is required`);
  }
  return value as T;
};
