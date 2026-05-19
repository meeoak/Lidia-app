import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd HH:mm");
}

export function formatRelative(date: string | Date | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ko });
}

export function calculateDDay(approvalDate: string | null, deadline = 3): {
  remaining: number;
  label: string;
  variant: "ok" | "warning" | "danger" | "expired" | "none";
} {
  if (!approvalDate) return { remaining: 0, label: "-", variant: "none" };

  const approved = new Date(approvalDate);
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - approved.getTime()) / (1000 * 60 * 60 * 24));
  const remaining = deadline - elapsed;

  if (remaining < 0) return { remaining, label: "마감", variant: "expired" };
  if (remaining === 0) return { remaining, label: "D-Day", variant: "danger" };
  if (remaining <= 1) return { remaining, label: `D-${remaining}`, variant: "danger" };
  if (remaining <= 3) return { remaining, label: `D-${remaining}`, variant: "warning" };
  return { remaining, label: `D-${remaining}`, variant: "ok" };
}

export function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
