import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCompactTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};
