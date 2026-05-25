/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertCircle, TrendingDown, Info, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface AlertItem {
  type: 'negative' | 'warning' | 'info';
  title: string;
  message: string;
}

interface AlertsProps {
  alerts: AlertItem[];
}

export default function Alerts({ alerts }: AlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-4">
      {alerts.map((alert, idx) => {
        const isNegative = alert.type === 'negative';
        const isWarning = alert.type === 'warning';
        
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "p-6 rounded-3xl border flex gap-4 items-start shadow-sm",
              isNegative ? "bg-rose-50 border-rose-100" : 
              isWarning ? "bg-amber-50 border-amber-100" : 
              "bg-blue-50 border-blue-100"
            )}
          >
            <div className={cn(
              "p-2 rounded-2xl",
              isNegative ? "bg-rose-100 text-rose-600" : 
              isWarning ? "bg-amber-100 text-amber-600" : 
              "bg-blue-100 text-blue-600"
            )}>
              {isNegative ? <TrendingDown size={20} /> : 
               isWarning ? <ShieldAlert size={20} /> : 
               <Info size={20} />}
            </div>
            <div>
              <h4 className={cn(
                "text-sm font-black uppercase tracking-widest mb-1",
                isNegative ? "text-rose-700" : 
                isWarning ? "text-amber-700" : 
                "text-blue-700"
              )}>
                {alert.title}
              </h4>
              <p className={cn(
                "text-xs font-medium leading-relaxed",
                isNegative ? "text-rose-600/80" : 
                isWarning ? "text-amber-600/80" : 
                "text-blue-600/80"
              )}>
                {alert.message}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
