/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { SIDEBAR_ITEMS } from "../constants";
import { SidebarMenu } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, ChevronDown, Coins } from "lucide-react";

interface SidebarProps {
  activeMenu: SidebarMenu;
  onMenuChange: (menu: SidebarMenu) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ activeMenu, onMenuChange, isCollapsed, onToggleCollapse }: SidebarProps) {
  const [isIncentivesExpanded, setIsIncentivesExpanded] = useState(() => 
    ["Incentives SPV Internal", "Incentives SPV Exclusive", "Incentives SE"].includes(activeMenu)
  );

  useEffect(() => {
    if (["Incentives SPV Internal", "Incentives SPV Exclusive", "Incentives SE"].includes(activeMenu)) {
      setIsIncentivesExpanded(true);
    }
  }, [activeMenu]);

  const isAnySubItemActive = ["Incentives SPV Internal", "Incentives SPV Exclusive", "Incentives SE"].includes(activeMenu);

  const menuStructure = useMemo(() => {
    const sellIn = SIDEBAR_ITEMS.find(i => i.name === 'Sell In');
    const sellThrough = SIDEBAR_ITEMS.find(i => i.name === 'Sell Through');
    const spvInternal = SIDEBAR_ITEMS.find(i => i.name === 'Incentives SPV Internal');
    const spvExclusive = SIDEBAR_ITEMS.find(i => i.name === 'Incentives SPV Exclusive');
    const seIncentives = SIDEBAR_ITEMS.find(i => i.name === 'Incentives SE');
    const poChecker = SIDEBAR_ITEMS.find(i => i.name === 'PO Checker');
    const programTracker = SIDEBAR_ITEMS.find(i => i.name === 'Program Tracker');

    return [
      sellIn && { type: 'item' as const, item: sellIn },
      sellThrough && { type: 'item' as const, item: sellThrough },
      {
        type: 'group' as const,
        name: 'Incentives',
        icon: Coins,
        subItems: [
          spvInternal,
          spvExclusive,
          seIncentives
        ].filter(Boolean) as typeof SIDEBAR_ITEMS
      },
      poChecker && { type: 'item' as const, item: poChecker },
      programTracker && { type: 'item' as const, item: programTracker }
    ].filter(Boolean);
  }, []);

  return (
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white border-r border-slate-100 h-screen fixed left-0 top-0 flex flex-col shadow-sm z-50 overflow-hidden"
    >
      <div className={cn("p-6 mb-8 relative", isCollapsed ? "flex flex-col items-center" : "")}>
        <div className={cn("transition-all duration-300", isCollapsed ? "opacity-100" : "opacity-100")}>
          <h1 className={cn("font-black tracking-tighter text-blue-600 transition-all", isCollapsed ? "text-xl" : "text-2xl")}>
            YOOL-DO!
          </h1>
          {!isCollapsed && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-slate-400 font-black tracking-[0.3em] uppercase mt-0.5"
            >
              Dashboard
            </motion.p>
          )}
        </div>

        <button 
          onClick={onToggleCollapse}
          className="absolute -right-3 top-10 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-md transition-all shadow-sm z-50 cursor-pointer"
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar pb-6">
        {menuStructure.map((elem) => {
          if (!elem) return null;

          if (elem.type === 'item') {
            const item = elem.item;
            const Icon = item.icon;
            const isActive = activeMenu === item.name;
            
            return (
              <button
                key={item.name}
                onClick={() => !item.isComingSoon && onMenuChange(item.name)}
                disabled={item.isComingSoon}
                className={cn(
                  "w-full flex items-center rounded-2xl text-sm font-bold transition-all duration-300 group relative cursor-pointer",
                  isCollapsed ? "justify-center h-12 p-0" : "gap-3 px-4 py-3.5",
                  isActive 
                    ? "bg-blue-50 text-blue-700 shadow-sm" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-blue-600",
                  item.isComingSoon && "opacity-30 cursor-not-allowed"
                )}
                title={isCollapsed ? item.name : ""}
              >
                <Icon size={18} className={cn("shrink-0 transition-colors", isActive ? "text-blue-600" : "group-hover:text-blue-500")} />
                
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="truncate text-left"
                  >
                    {item.name}
                  </motion.span>
                )}
                
                {!isCollapsed && item.isComingSoon && (
                  <span className="ml-auto text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full uppercase font-black tracking-widest whitespace-nowrap">
                    Soon
                  </span>
                )}

                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
                  />
                )}
              </button>
            );
          } else {
            return (
              <div key={elem.name} className="space-y-1">
                {/* Group Selector Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isCollapsed) {
                      onToggleCollapse();
                      setIsIncentivesExpanded(true);
                    } else {
                      setIsIncentivesExpanded(!isIncentivesExpanded);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center rounded-2xl text-sm font-bold transition-all duration-350 group relative cursor-pointer",
                    isCollapsed ? "justify-center h-12 p-0" : "gap-3 px-4 py-3.5",
                    isAnySubItemActive && !isIncentivesExpanded
                      ? "bg-blue-50/60 text-blue-600 font-extrabold" 
                      : "text-slate-400 hover:bg-slate-50 hover:text-blue-600"
                  )}
                  title={isCollapsed ? elem.name : ""}
                >
                  <Coins size={18} className={cn("shrink-0 transition-colors", isAnySubItemActive ? "text-blue-600" : "group-hover:text-blue-500")} />
                  
                  {!isCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="truncate text-left flex-1"
                    >
                      {elem.name}
                    </motion.span>
                  )}
                  
                  {!isCollapsed && (
                    <ChevronDown 
                      size={14} 
                      className={cn(
                        "text-slate-400 group-hover:text-blue-500 transition-transform duration-200 shrink-0", 
                        isIncentivesExpanded ? "rotate-180" : ""
                      )} 
                    />
                  )}
                </button>

                {/* Subitems container */}
                <AnimatePresence initial={false}>
                  {isIncentivesExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className={cn("overflow-hidden flex flex-col shrink-0", isCollapsed ? "space-y-1 p-1 bg-slate-50/50 rounded-2xl border border-slate-100" : "pl-5 space-y-1.5 border-l border-slate-100 ml-6 py-1.5")}
                    >
                      {elem.subItems.map((subItem) => {
                        const isSubActive = activeMenu === subItem.name;
                        
                        return (
                          <button
                            type="button"
                            key={subItem.name}
                            onClick={() => onMenuChange(subItem.name)}
                            className={cn(
                              "w-full flex items-center rounded-xl transition-all duration-300 relative shrink-0 cursor-pointer",
                              isCollapsed 
                                ? "justify-center h-10 p-0 hover:bg-slate-100/80" 
                                : "px-4 py-2 text-xs font-bold",
                              isSubActive 
                                ? "bg-blue-50 text-blue-700 shadow-sm" 
                                : "text-slate-400 hover:bg-slate-50 hover:text-blue-600"
                            )}
                            title={subItem.name}
                          >
                            {isCollapsed ? (
                              <span className="text-[9px] font-black text-center tracking-tighter uppercase whitespace-nowrap">
                                {subItem.name.includes("Internal") ? "INT" : subItem.name.includes("Exclusive") ? "EXC" : "SE"}
                              </span>
                            ) : (
                              <span className="truncate text-left">{subItem.name}</span>
                            )}
                            {isSubActive && !isCollapsed && (
                              <motion.div
                                layoutId="active-indicator-sub"
                                className="absolute left-0 w-0.5 h-4 bg-blue-600 rounded-r-full"
                              />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }
        })}
      </nav>

      <div className={cn("p-6 border-t border-slate-50 text-slate-300 font-bold tracking-tight transition-all shrink-0", isCollapsed ? "text-center text-[8px]" : "text-[10px]")}>
        {isCollapsed ? "© 26" : "© 2026 YOOL-DO! PLATFORM"}
      </div>
    </motion.div>
  );
}

