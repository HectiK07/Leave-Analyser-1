import { getDay, parse, differenceInMinutes, isValid } from "date-fns";

// Rule 1: Monday-Friday = 8.5h, Saturday = 4h, Sunday = 0h
export const getExpected = (date: Date) => {
  const day = getDay(date);
  if (day === 0) return 0;
  if (day === 6) return 4;
  return 8.5;
};

// Rule 2: Actual Worked Hours
export const getActual = (inT: string, outT: string) => {
  if (!inT || !outT) return 0;
  const start = parse(inT, "HH:mm", new Date());
  const end = parse(outT, "HH:mm", new Date());
  if (!isValid(start) || !isValid(end)) return 0;
  return Math.max(0, differenceInMinutes(end, start) / 60);
};