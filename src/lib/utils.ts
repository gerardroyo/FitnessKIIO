import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number) {
  const d = Math.round(seconds);
  if (d < 3600) return `${Math.round(d / 60)} min`;
  const h = Math.floor(d / 3600);
  const m = Math.round((d % 3600) / 60);
  // If exactly X hours 0 min, maybe just show X h? or Xh 0min
  // Request says "horas y minutos".
  return `${h} h ${m} min`;
}
