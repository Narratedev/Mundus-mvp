import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return "—";
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(n)) return "—";
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

export function formatPct(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || isNaN(pct)) return "—";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function calcPerformance(
  entry: number,
  current: number,
  direction: "bullish" | "bearish"
): number {
  if (!entry || !current) return 0;
  if (direction === "bullish") {
    return ((current - entry) / entry) * 100;
  }
  // Bearish: performance in the predicted direction (price drop is positive)
  return ((entry - current) / entry) * 100;
}

export function shortAddress(addr: string, chars = 4): string {
  if (!addr) return "";
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}
