import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseBigNumber(val: number): string {
  if (val < 1000) return `${val}`;
  if (val < 10000000) return `${val / 1000}k`;
  return `${val / 1000000}m`;
}

export function parseBigStorage(val: number): string {
  if (val < 1024) return `${val} B`;
  if (val < 1024 * 1024) return `${Math.floor(val / 1024)} KB`;
  if (val < 1024 * 1024 * 1024) return `${Math.floor(val / (1024 * 1024))} MB`;
  return `${Math.floor(val / (1024 * 1024 * 1024))} GB`;
}

export function calculateStoragePercentage(
  usedBytes: number,
  limitGB: number = 2
): number {
  const limitBytes = limitGB * 1024 * 1024 * 1024; // Convert GB to bytes
  const percentage = (usedBytes / limitBytes) * 100;
  return Math.min(Math.floor(percentage), 100); // Cap at 100% and remove decimals
}
