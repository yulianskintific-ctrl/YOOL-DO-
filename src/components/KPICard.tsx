/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrendingDown, TrendingUp } from "lucide-react";
import { cn, formatPercent } from "../lib/utils";
import { motion } from "motion/react";

interface KPICardProps {
  label: string;
  value: string | number;
  subValue?: number;
  isPositive?: boolean;
  prefix?: string;
  className?: string;
  index: number;
}

export default function KPICard({ label, value, subValue, isPositive, prefix, className, index }: KPICardProps) {
  const isDark = className?.includes('bg-blue-600');
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "p-5 rounded-2xl border flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden",
        isDark ? "bg-blue-600 border-blue-700 shadow-blue-200/50 shadow-lg text-white" : "bg-white border-slate-100 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col min-w-0">
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-widest mb-1 truncate",
          isDark ? "text-blue-100" : "text-slate-400"
        )}>{label}</span>
        <div className="flex items-baseline gap-0.5 min-w-0">
          {prefix && <span className={cn("text-sm font-bold opacity-70", isDark ? "text-blue-100" : "text-slate-500")}>{prefix}</span>}
          <span className={cn(
            "text-xl font-black tracking-tight truncate",
            isDark ? "text-white" : "text-slate-900"
          )} title={String(value)}>
            {value}
          </span>
        </div>
      </div>
      
      {subValue !== undefined && (
        <div className="mt-4 flex items-center gap-1.5">
          <div className={cn(
            "flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full",
            isPositive 
              ? (isDark ? "bg-blue-500/50 text-white" : "bg-emerald-50 text-emerald-600") 
              : (isDark ? "bg-rose-500/50 text-white" : "bg-rose-50 text-rose-600")
          )}>
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {formatPercent(subValue)}
          </div>
          <span className={cn("text-[9px] font-semibold", isDark ? "text-blue-200" : "text-slate-400")}>vs prev</span>
        </div>
      )}
    </motion.div>
  );
}
