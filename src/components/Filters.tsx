/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilterState } from "../types";
import { Filter, ChevronDown, Check, X, Search } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface FiltersProps {
  activeMenu: string;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string | string[]) => void;
  options: {
    brands: string[];
    regions: string[];
    asms: string[];
    supervisors: string[];
    distributors: string[];
    distributorCompanies?: string[];
    distributorBranches?: string[];
    channels?: string[];
    categories?: string[];
    segments?: string[];
    baStoreNonBaStores?: string[];
  };
}

export default function Filters({ activeMenu, filters, onFilterChange, options }: FiltersProps) {
  const MultiSelect = ({ 
    label, 
    value, 
    onChange, 
    options = []
  }: { 
    label: string; 
    value: string[]; 
    onChange: (v: string[]) => void; 
    options?: string[] 
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
      if (!searchQuery) return options;
      return options.filter(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [options, searchQuery]);

    const toggleOption = (opt: string) => {
      if (value.includes(opt)) {
        onChange(value.filter(v => v !== opt));
      } else {
        onChange([...value, opt]);
      }
    };

    const handleSelectAll = () => {
      onChange(options);
    };

    const handleClearAll = () => {
      onChange([]);
    };

    return (
      <div className="flex flex-col gap-1.5 flex-1 min-w-[180px] relative" ref={containerRef}>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">{label}s</label>
        
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setSearchQuery("");
          }}
          className={cn(
            "flex items-center justify-between gap-2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white hover:shadow-sm cursor-pointer",
            isOpen && "border-blue-500 ring-4 ring-blue-50/50 bg-white"
          )}
        >
          <span className="truncate pr-2 font-bold text-slate-700">
            {value.length === 0 ? `All ${label}s` : `${value.length} Selected`}
          </span>
          <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 5, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] mt-1 p-2 max-h-[300px] flex flex-col overflow-hidden"
            >
              {options.length > 5 && (
                <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50/50 rounded-lg mb-1 shrink-0">
                  <Search size={13} className="text-slate-400 shrink-0 ml-1" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-[11px] font-semibold text-slate-700 placeholder-slate-400 bg-transparent outline-none py-1"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")} 
                      className="text-slate-400 hover:text-slate-600 transition"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}

              {/* Top Actions: Select All & Clear */}
              <div className="p-1.5 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0 rounded-lg mb-1">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[9.5px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest px-2.5 py-1 rounded-lg hover:bg-white transition-all cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[9.5px] font-black text-slate-500 hover:text-slate-700 uppercase tracking-widest px-2.5 py-1 rounded-lg hover:bg-white transition-all cursor-pointer"
                >
                  Clear
                </button>
              </div>
              
              <div className="overflow-y-auto flex-1 space-y-0.5 custom-scrollbar pr-1">
                {filteredOptions.length === 0 ? (
                  <div className="text-center py-4 text-[10.5px] font-medium text-slate-400">
                    No items found
                  </div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = value.includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleOption(opt)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all text-left group cursor-pointer",
                          isSelected 
                            ? "bg-blue-50 text-blue-700" 
                            : "text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0",
                          isSelected ? "bg-blue-600 border-blue-600" : "border-slate-200 bg-white group-hover:border-blue-300"
                        )}>
                          {isSelected && <Check size={10} className="text-white" />}
                        </div>
                        <span className="truncate">{opt}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const isIncentivesSPV = activeMenu === 'Incentives SPV Internal';
  const isIncentivesExclusive = activeMenu === 'Incentives SPV Exclusive';
  const isAnyIncentiveSPV = isIncentivesSPV || isIncentivesExclusive;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-10 flex flex-wrap items-end gap-6">
      <div className="flex flex-col gap-1.5 h-full self-start pt-1">
        <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-100">
          <Filter size={18} />
        </div>
      </div>
      
      {!isAnyIncentiveSPV && (
        <>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Start Date</label>
            <input 
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all font-bold"
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">End Date</label>
            <input 
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all font-bold"
            />
          </div>

          <MultiSelect label="Brand" value={filters.brands} onChange={(v) => onFilterChange('brands', v)} options={options.brands} />
        </>
      )}

      <MultiSelect label="Region" value={filters.regions} onChange={(v) => onFilterChange('regions', v)} options={options.regions} />
      
      {activeMenu === 'Sell Out' ? (
        <>
          <MultiSelect label="Channel" value={filters.channels || []} onChange={(v) => onFilterChange('channels', v)} options={options.channels || []} />
          <MultiSelect label="Category" value={filters.categories || []} onChange={(v) => onFilterChange('categories', v)} options={options.categories || []} />
          <MultiSelect label="Segment" value={filters.segments || []} onChange={(v) => onFilterChange('segments', v)} options={options.segments || []} />
        </>
      ) : (
        <>
          <MultiSelect label="ASM" value={filters.asms} onChange={(v) => onFilterChange('asms', v)} options={options.asms} />
          
          {isIncentivesExclusive && (
            <>
              <MultiSelect label="Distributor Company" value={filters.distributorCompanies} onChange={(v) => onFilterChange('distributorCompanies', v)} options={options.distributorCompanies || []} />
              <MultiSelect label="Distributor Branch" value={filters.distributorBranches} onChange={(v) => onFilterChange('distributorBranches', v)} options={options.distributorBranches || []} />
            </>
          )}

          {(activeMenu === 'Sell Through' || isAnyIncentiveSPV) && (
            <MultiSelect label="Supervisor" value={filters.supervisors} onChange={(v) => onFilterChange('supervisors', v)} options={options.supervisors} />
          )}

          {!isAnyIncentiveSPV && (
            <MultiSelect label="Distributor" value={filters.distributors} onChange={(v) => onFilterChange('distributors', v)} options={options.distributors} />
          )}
        </>
      )}
      
      <button 
        onClick={() => {
          onFilterChange('startDate', '');
          onFilterChange('endDate', '');
          onFilterChange('brands', []);
          onFilterChange('regions', []);
          onFilterChange('asms', []);
          onFilterChange('supervisors', []);
          onFilterChange('distributors', []);
          onFilterChange('distributorCompanies', []);
          onFilterChange('distributorBranches', []);
          onFilterChange('channels', []);
          onFilterChange('categories', []);
          onFilterChange('segments', []);
          onFilterChange('baStoreNonBaStores', []);
        }}
        className="flex items-center gap-2 group ml-auto pb-2"
      >
        <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-rose-50 group-hover:text-rose-500 transition-all">
          <X size={14} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-rose-600 transition-colors">
          Clear Filters
        </span>
      </button>
    </div>
  );
}
