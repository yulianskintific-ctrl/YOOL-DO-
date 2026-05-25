/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SidebarMenu } from "./types";
import { 
  BarChart3, 
  TrendingUp, 
  Coins, 
  Crown, 
  UserCheck, 
  ClipboardCheck, 
  Truck 
} from "lucide-react";

export const SIDEBAR_ITEMS: { name: SidebarMenu; icon: any; isComingSoon: boolean }[] = [
  { name: 'Sell In', icon: BarChart3, isComingSoon: false },
  { name: 'Sell Through', icon: TrendingUp, isComingSoon: false },
  { name: 'Incentives SPV Internal', icon: Coins, isComingSoon: false },
  { name: 'Incentives SPV Exclusive', icon: Crown, isComingSoon: false },
  { name: 'Incentives SE', icon: UserCheck, isComingSoon: false },
  { name: 'PO Checker', icon: ClipboardCheck, isComingSoon: true },
  { name: 'Program Tracker', icon: Truck, isComingSoon: true },
];

export const COLORS = {
  primary: "#1e40af", // blue-800
  secondary: "#3b82f6", // blue-500
  accent: "#60a5fa", // blue-400
  muted: "#94a3b8", // slate-400
  background: "#f8fafc", // slate-50
  card: "#ffffff",
  text: "#1e293b", // slate-800
};

export const BRAND_COLORS = [
  "#1e40af", "#3b82f6", "#60a5fa", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4"
];

export const BRAND_COLOR_MAP: Record<string, string> = {
  "FACERINNA": "#7F2CCB",
  "SKINTIFIC": "#60a5fa",
  "GLAD2GLOW": "#3b82f6",
  "TIMEPHORIA": "#414361"
};

export const getBrandColor = (brand: string, index: number) => {
  const normalized = brand.toUpperCase().trim();
  return BRAND_COLOR_MAP[normalized] || BRAND_COLORS[index % BRAND_COLORS.length];
};
