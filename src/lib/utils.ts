import { getDay, parse, differenceInMinutes } from "date-fns";

export const getExpectedHours = (date: Date): number => {
  const day = getDay(date); // 0 = Sunday, 6 = Saturday
  if (day === 0) return 0; // Sunday
  if (day === 6) return 4; // Saturday
  return 8.5; // Weekdays
};

export const calculateWorkedHours = (inTime: string | null, outTime: string | null): number => {
  if (!inTime || !outTime) return 0;
  try {
    const start = parse(inTime, "HH:mm", new Date());
    const end = parse(outTime, "HH:mm", new Date());
    const diffInMinutes = differenceInMinutes(end, start);
    return Math.max(0, diffInMinutes / 60);
  } catch {
    return 0;
  }
};