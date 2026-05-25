/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatNumber, cn } from "../lib/utils";

interface RankingTableProps {
  data: { name: string; value: number }[];
  title: string;
}

import { motion } from "motion/react";

export default function RankingTable({ data, title }: RankingTableProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
      <h3 className="text-[10px] font-black text-slate-900 mb-8 flex items-center justify-between uppercase tracking-[0.2em] shrink-0">
        {title}
        <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest leading-none">Live Metric</span>
      </h3>
      
      <div className="space-y-6 flex-1 min-w-0 overflow-y-auto pr-2 custom-scrollbar">
        {data.map((item, idx) => (
          <div key={item.name} className="flex items-center gap-4 group cursor-default min-w-0">
            <div className={cn(
              "w-8 h-8 flex items-center justify-center rounded-xl text-[10px] font-black shrink-0 transition-transform group-hover:scale-110",
              idx === 0 ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : 
              idx === 1 ? "bg-blue-500 text-white shadow-lg shadow-blue-100" :
              idx === 2 ? "bg-blue-400 text-white shadow-lg shadow-blue-50" : "bg-blue-50 text-blue-400"
            )}>
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex justify-between items-end mb-2 gap-3 min-w-0">
                <span className="text-xs font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors" title={item.name}>
                  {item.name}
                </span>
                <span className="text-[10px] font-black text-slate-400 shrink-0 tabular-nums">
                  {formatNumber(item.value)}
                </span>
              </div>
              <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / (data[0]?.value || 1)) * 100}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: idx * 0.05 }}
                  className="bg-blue-500 h-full rounded-full" 
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
