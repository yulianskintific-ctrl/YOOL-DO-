import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;
}

export function formatCompactIDR(value: number) {
  if (value === 0) return "Rp0";
  const absValue = Math.abs(value);
  let formatted = "";
  if (absValue >= 1e12) {
    formatted = (value / 1e12).toFixed(1) + " T";
  } else if (absValue >= 1e9) {
    formatted = (value / 1e9).toFixed(1) + " M";
  } else if (absValue >= 1e6) {
    formatted = (value / 1e6).toFixed(1) + " Jt";
  } else {
    return "Rp" + formatNumber(value);
  }
  // Remove trailing .0 and format decimal separator as comma
  const result = formatted.replace(".0 ", " ").replace(".", ",");
  return "Rp" + result;
}
