/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { IncentiveSEData } from "../types";
import { formatNumber } from "../lib/utils";
import { motion } from "motion/react";
import { Award, Target, TrendingUp, Compass, ShoppingCart, Percent, AlertTriangle, ExternalLink, Filter, ChevronDown, X, Check, Search } from "lucide-react";

interface IncentivesSETableProps {
  data: IncentiveSEData[];
}

interface MultiSelectProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}

function MultiSelect({ label, options, selectedValues, onChange, placeholder }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    return options.filter(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [options, searchQuery]);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    onChange(options);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const isAllSelected = options.length > 0 && selectedValues.length === options.length;

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === options.length) return `All ${label} (${options.length})`;
    if (selectedValues.length === 1) return selectedValues[0];
    const joined = selectedValues.join(", ");
    return joined.length > 22 ? `${selectedValues.length} Selected` : joined;
  };

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] relative" ref={dropdownRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">{label}</label>
      
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery("");
        }}
        className={`w-full text-xs bg-slate-50 border ${isOpen ? 'border-blue-500 ring-4 ring-blue-50/50' : 'border-slate-200'} rounded-xl pl-3 pr-10 py-2.5 text-slate-700 font-bold outline-none flex items-center justify-between cursor-pointer hover:bg-white hover:shadow-sm transition-all text-left relative`}
      >
        <span className="truncate pr-1">
          {getDisplayText()}
        </span>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
          <ChevronDown size={14} className={`transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 flex flex-col max-h-72 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
          {options.length > 5 && (
            <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50/50">
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
          <div className="p-1.5 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
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

          <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-4 text-[10.5px] font-medium text-slate-400">
                No items found
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = selectedValues.includes(opt);
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleOption(opt)}
                    className={`flex items-center justify-between gap-2 px-3 py-1.5 text-[11.5px] font-bold rounded-lg cursor-pointer transition-colors w-full text-left ${
                      isSelected 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IncentivesSETable({ data }: IncentivesSETableProps) {
  // Local filter states for multiple selection
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDistributors, setSelectedDistributors] = useState<string[]>([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([]);
  const [selectedSEs, setSelectedSEs] = useState<string[]>([]);

  // Reset helper
  const resetFilters = () => {
    setSelectedRegions([]);
    setSelectedDistributors([]);
    setSelectedSupervisors([]);
    setSelectedSEs([]);
  };

  // Safe percentage calculator
  const calculatePercentage = (ach: number, target: number) => {
    if (!target) return 0;
    return Math.round((ach / target) * 100);
  };

  // Status-colored performance indicator badge
  const renderPercentageBadge = (percent: number) => {
    let colorClass = "bg-rose-50 text-rose-700 border-rose-100";
    if (percent >= 100) {
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
    } else if (percent >= 90) {
      colorClass = "bg-amber-50 text-amber-700 border-amber-100";
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${colorClass}`}>
        {percent}%
      </span>
    );
  };

  // Extract unique options from raw dataset for active dropdowns
  const filterOptions = useMemo(() => {
    const regions = new Set<string>();
    const distributors = new Set<string>();
    const supervisors = new Set<string>();
    const ses = new Set<string>();

    data.forEach(item => {
      if (item.region) regions.add(item.region);
      if (item.distributor) distributors.add(item.distributor);
      if (item.supervisor) supervisors.add(item.supervisor);
      if (item.distributor_se) ses.add(item.distributor_se);
    });

    return {
      regions: Array.from(regions).sort(),
      distributors: Array.from(distributors).sort(),
      supervisors: Array.from(supervisors).sort(),
      ses: Array.from(ses).sort()
    };
  }, [data]);

  // Reactive filtered data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchRegion = selectedRegions.length === 0 || selectedRegions.includes(item.region);
      const matchDist = selectedDistributors.length === 0 || selectedDistributors.includes(item.distributor);
      const matchSpv = selectedSupervisors.length === 0 || selectedSupervisors.includes(item.supervisor);
      const matchSE = selectedSEs.length === 0 || selectedSEs.includes(item.distributor_se);
      return matchRegion && matchDist && matchSpv && matchSE;
    });
  }, [data, selectedRegions, selectedDistributors, selectedSupervisors, selectedSEs]);

  // Calculate totals for active filtered set
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => {
        acc.target_total_gmv += row.target_total_gmv;
        acc.ach_total_gmv += row.ach_total_gmv;
        acc.target_gmv_sa += row.target_gmv_sa;
        acc.ach_gmv_sa += row.ach_gmv_sa;
        acc.target_gmv_bcd += row.target_gmv_bcd;
        acc.ach_gmv_bcd += row.ach_gmv_bcd;
        acc.target_ao += row.target_ao;
        acc.ach_ao += row.ach_ao;
        acc.target_ec += row.target_ec;
        acc.ach_ec += row.ach_ec;
        acc.target_st_product_focus += row.target_st_product_focus;
        acc.ach_st_product_focus += row.ach_st_product_focus;
        acc.target_ao_product_focus += row.target_ao_product_focus;
        acc.ach_ao_product_focus += row.ach_ao_product_focus;

        acc.incentive_gmv += row.incentive_gmv;
        acc.incentive_ao += row.incentive_ao;
        acc.incentive_st_focus += row.incentive_st_focus;
        acc.incentive_ao_focus += row.incentive_ao_focus;
        acc.total_incentives += row.total_incentives;
        return acc;
      },
      {
        target_total_gmv: 0,
        ach_total_gmv: 0,
        target_gmv_sa: 0,
        ach_gmv_sa: 0,
        target_gmv_bcd: 0,
        ach_gmv_bcd: 0,
        target_ao: 0,
        ach_ao: 0,
        target_ec: 0,
        ach_ec: 0,
        target_st_product_focus: 0,
        ach_st_product_focus: 0,
        target_ao_product_focus: 0,
        ach_ao_product_focus: 0,
        incentive_gmv: 0,
        incentive_ao: 0,
        incentive_st_focus: 0,
        incentive_ao_focus: 0,
        total_incentives: 0
      }
    );
  }, [filteredData]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  };

  const hasFallback = data.some(row => row._isFallback);
  const is403 = data.some(row => row._errorType === "403_FORBIDDEN");
  const isNotConfigured = data.some(row => row._errorType === "NOT_CONFIGURED");

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12"
    >
      {/* 1. SE FILTERS ROW CARD */}
      <motion.div 
        variants={itemVariants} 
        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-10 flex flex-wrap items-end gap-6 text-slate-800"
      >
        <div className="flex flex-col gap-1.5 h-full self-start pt-1">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-105">
            <Filter size={18} />
          </div>
        </div>

        {/* Region Filter */}
        <MultiSelect
          label="Regions"
          options={filterOptions.regions}
          selectedValues={selectedRegions}
          onChange={setSelectedRegions}
          placeholder="All Regions"
        />

        {/* Distributor Filter */}
        <MultiSelect
          label="Distributors"
          options={filterOptions.distributors}
          selectedValues={selectedDistributors}
          onChange={setSelectedDistributors}
          placeholder="All Distributors"
        />

        {/* Supervisor Filter */}
        <MultiSelect
          label="Supervisors"
          options={filterOptions.supervisors}
          selectedValues={selectedSupervisors}
          onChange={setSelectedSupervisors}
          placeholder="All Supervisors"
        />

        {/* Distributor SE Filter */}
        <MultiSelect
          label="Distributor SEs"
          options={filterOptions.ses}
          selectedValues={selectedSEs}
          onChange={setSelectedSEs}
          placeholder="All Sales Executives"
        />

        <button 
          onClick={resetFilters}
          className="flex items-center gap-2 group ml-auto pb-2"
        >
          <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-rose-50 group-hover:text-rose-500 transition-all">
            <X size={14} />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-rose-600 transition-colors">
            Clear Filters
          </span>
        </button>
      </motion.div>

      {/* 2. TROUBLESHOOTING BANNER FOR GOOGLE APPS SCRIPT PENAUTAN SE */}
      {hasFallback && (
        <motion.div 
          variants={itemVariants}
          className="bg-amber-50/50 border border-amber-200/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 shadow-sm"
        >
          <div className="p-3 bg-amber-100/80 text-amber-700 rounded-2xl w-fit h-fit self-start md:self-center shrink-0">
            <AlertTriangle size={24} className="animate-pulse" />
          </div>
          <div className="space-y-3 flex-1">
            <div>
              <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-3 py-1 rounded-full uppercase tracking-wider">
                {isNotConfigured ? "PANDUAN PENAUTAN DATA BARU" : is403 ? "Google Apps Script: Akses Terbatas (403)" : "Google Apps Script: Koneksi Terputus"}
              </span>
              <h3 className="text-lg font-black text-slate-800 mt-2">Menghubungkan Menu Incentives SE ke Google Sheets</h3>
            </div>
            
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              Menu **Incentives SE** dirancang untuk menarik data dari file Google Sheets dan naskah Google Apps Script (GAS) yang berbeda, menjaga kemandirian menu lainnya. Saat ini aplikasi menggunakan **data simulasi (fallback)** agar Anda tetap dapat mengevaluasi antarmuka SE yang lengkap.
            </p>

            <div className="bg-white border border-amber-150 rounded-2xl p-5 space-y-4 text-xs font-bold text-slate-700 shadow-xs">
              <h4 className="text-slate-900 font-extrabold uppercase tracking-wide flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 bg-amber-500 text-white rounded-full text-[10px]">!</span>
                Langkah Penautan Google Sheet Terpisah Untuk SE:
              </h4>
              <ol className="list-decimal list-inside space-y-2 pl-1 leading-relaxed text-slate-600 font-semibold">
                <li>Buka Google Sheet baru pilihan Anda yang berisi struktur pencapaian **Incentives SE**.</li>
                <li>Buka editor **Google Apps Script** dari menu Extensions &rarr; Apps Script.</li>
                <li>Terapkan fungsi penangkap GET JSON (Fungsi `doGet(e)` standar) untuk merespon baris-baris SE Anda.</li>
                <li>Klik tombol <strong className="text-blue-600">Deploy</strong> (di pojok kanan atas) &rarr; <strong className="text-blue-600">New deployment</strong>.</li>
                <li>Atur konfigurasi deployment dengan nilai wajib:
                  <ul className="list-disc list-inside pl-5 mt-1 space-y-1 text-slate-500 font-medium">
                    <li><strong>Execute as:</strong> Atur ke <code className="bg-slate-50 px-1 py-0.5 rounded border text-rose-600 font-mono">"Me" (Email Anda)</code></li>
                    <li><strong>Who has access:</strong> Atur ke <code className="bg-slate-50 px-1 py-0.5 rounded border text-rose-600 font-mono">"Anyone" (Anonim / Siapa saja)</code></li>
                  </ul>
                </li>
                <li>Copy URL Web App baru yang dihasilkan.</li>
                <li>Ganti URL target konstanta <code className="bg-slate-50 px-1.5 py-0.5 rounded border text-blue-600 font-mono">SE_SCRIPT_URL</code> di dalam file server atau kode integrasi dengan URL baru Anda.</li>
              </ol>
            </div>
            
            <div className="text-[11px] text-amber-800/80 font-semibold flex items-center gap-1.5 pt-1">
              <span>💡</span>
              <span><strong>Catatan:</strong> Langkah ini sepenuhnya aman dan jaminan tidak merusak integrasi data Sell In, Sell Through, Incentives SPV Internal, maupun SPV Exclusive Anda.</span>
            </div>
          </div>
        </motion.div>
      )}

      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-100 shadow-xs text-center">
          <Compass className="text-slate-400 mb-3 animate-bounce" size={40} />
          <h4 className="text-base font-black text-slate-700">Data Tidak Ditemukan</h4>
          <p className="text-xs font-bold text-slate-500 mt-1 max-w-md">Tidak ada data Sales Executive yang cocok dengan kombinasi filter Anda saat ini. Cobalah menyetel ulang saringan.</p>
        </div>
      ) : (
        <>
          {/* A. Achievement GMV Total */}
          <motion.div id="se-table-gmv-total" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">A. Achievement GMV Total</h4>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                    <th className="py-3 px-6 text-white font-extrabold">Region</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor SE</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Target - Total GMV</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Ach. (Value) - Total GMV</th>
                    <th className="py-3 px-6 text-center text-white font-extrabold">% Ach. Total GMV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-bold">
                  {filteredData.map((row, idx) => {
                    const pct = calculatePercentage(row.ach_total_gmv, row.target_total_gmv);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-semibold">{row.region}</td>
                        <td className="py-4 px-6">{row.distributor}</td>
                        <td className="py-4 px-6">{row.supervisor}</td>
                        <td className="py-4 px-6 text-slate-800 font-black">{row.distributor_se}</td>
                        <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.target_total_gmv)}</td>
                        <td className="py-4 px-6 text-right text-blue-600 font-black">Rp {formatNumber(row.ach_total_gmv)}</td>
                        <td className="py-4 px-6 text-center">{renderPercentageBadge(pct)}</td>
                      </tr>
                    );
                  })}
                  {/* Summary row */}
                  <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                    <td className="py-4 px-6 uppercase tracking-wider" colSpan={4}>Grand Total</td>
                    <td className="py-4 px-6 text-right">Rp {formatNumber(totals.target_total_gmv)}</td>
                    <td className="py-4 px-6 text-right text-blue-700">Rp {formatNumber(totals.ach_total_gmv)}</td>
                    <td className="py-4 px-6 text-center">
                      {renderPercentageBadge(calculatePercentage(totals.ach_total_gmv, totals.target_total_gmv))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* B. Achievement GMV SA */}
          <motion.div id="se-table-gmv-sa" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Target size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">B. Achievement GMV SA</h4>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                    <th className="py-3 px-6 text-white font-extrabold">Region</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor SE</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Target - GMV SA</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Ach. (Value) - GMV SA</th>
                    <th className="py-3 px-6 text-center text-white font-extrabold">% Ach. GMV SA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-bold">
                  {filteredData.map((row, idx) => {
                    const pct = calculatePercentage(row.ach_gmv_sa, row.target_gmv_sa);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-semibold">{row.region}</td>
                        <td className="py-4 px-6">{row.distributor}</td>
                        <td className="py-4 px-6">{row.supervisor}</td>
                        <td className="py-4 px-6 text-slate-800 font-black">{row.distributor_se}</td>
                        <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.target_gmv_sa)}</td>
                        <td className="py-4 px-6 text-right text-blue-600 font-black">Rp {formatNumber(row.ach_gmv_sa)}</td>
                        <td className="py-4 px-6 text-center">{renderPercentageBadge(pct)}</td>
                      </tr>
                    );
                  })}
                  {/* Summary row */}
                  <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                    <td className="py-4 px-6 uppercase tracking-wider" colSpan={4}>Grand Total</td>
                    <td className="py-4 px-6 text-right">Rp {formatNumber(totals.target_gmv_sa)}</td>
                    <td className="py-4 px-6 text-right text-blue-700">Rp {formatNumber(totals.ach_gmv_sa)}</td>
                    <td className="py-4 px-6 text-center">
                      {renderPercentageBadge(calculatePercentage(totals.ach_gmv_sa, totals.target_gmv_sa))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* C. Achievement GMV BCD */}
          <motion.div id="se-table-gmv-bcd" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">C. Achievement GMV BCD</h4>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                    <th className="py-3 px-6 text-white font-extrabold">Region</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor SE</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Target - GMV BCD</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Ach. (Value) - GMV BCD</th>
                    <th className="py-3 px-6 text-center text-white font-extrabold">% Ach. GMV BCD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-bold">
                  {filteredData.map((row, idx) => {
                    const pct = calculatePercentage(row.ach_gmv_bcd, row.target_gmv_bcd);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-semibold">{row.region}</td>
                        <td className="py-4 px-6">{row.distributor}</td>
                        <td className="py-4 px-6">{row.supervisor}</td>
                        <td className="py-4 px-6 text-slate-800 font-black">{row.distributor_se}</td>
                        <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.target_gmv_bcd)}</td>
                        <td className="py-4 px-6 text-right text-blue-600 font-black">Rp {formatNumber(row.ach_gmv_bcd)}</td>
                        <td className="py-4 px-6 text-center">{renderPercentageBadge(pct)}</td>
                      </tr>
                    );
                  })}
                  {/* Summary row */}
                  <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                    <td className="py-4 px-6 uppercase tracking-wider" colSpan={4}>Grand Total</td>
                    <td className="py-4 px-6 text-right">Rp {formatNumber(totals.target_gmv_bcd)}</td>
                    <td className="py-4 px-6 text-right text-blue-700">Rp {formatNumber(totals.ach_gmv_bcd)}</td>
                    <td className="py-4 px-6 text-center">
                      {renderPercentageBadge(calculatePercentage(totals.ach_gmv_bcd, totals.target_gmv_bcd))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* D. Achievement AO */}
          <motion.div id="se-table-ao" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">D. Achievement AO</h4>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                    <th className="py-3 px-6 text-white font-extrabold">Region</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor SE</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Target AO</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Ach. AO</th>
                    <th className="py-3 px-6 text-center text-white font-extrabold">% Ach. AO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-bold">
                  {filteredData.map((row, idx) => {
                    const pct = calculatePercentage(row.ach_ao, row.target_ao);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-semibold">{row.region}</td>
                        <td className="py-4 px-6">{row.distributor}</td>
                        <td className="py-4 px-6">{row.supervisor}</td>
                        <td className="py-4 px-6 text-slate-800 font-black">{row.distributor_se}</td>
                        <td className="py-4 px-6 text-right text-slate-500">{formatNumber(row.target_ao)}</td>
                        <td className="py-4 px-6 text-right text-blue-600 font-black">{formatNumber(row.ach_ao)}</td>
                        <td className="py-4 px-6 text-center">{renderPercentageBadge(pct)}</td>
                      </tr>
                    );
                  })}
                  {/* Summary row */}
                  <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                    <td className="py-4 px-6 uppercase tracking-wider" colSpan={4}>Grand Total</td>
                    <td className="py-4 px-6 text-right">{formatNumber(totals.target_ao)}</td>
                    <td className="py-4 px-6 text-right text-blue-700">{formatNumber(totals.ach_ao)}</td>
                    <td className="py-4 px-6 text-center">
                      {renderPercentageBadge(calculatePercentage(totals.ach_ao, totals.target_ao))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* E. Achievement EC */}
          <motion.div id="se-table-ec" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Percent size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">E. Achievement EC</h4>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                    <th className="py-3 px-6 text-white font-extrabold">Region</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor SE</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Target EC</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Ach. EC</th>
                    <th className="py-3 px-6 text-center text-white font-extrabold">% Ach. EC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-bold">
                  {filteredData.map((row, idx) => {
                    const pct = calculatePercentage(row.ach_ec, row.target_ec);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-semibold">{row.region}</td>
                        <td className="py-4 px-6">{row.distributor}</td>
                        <td className="py-4 px-6">{row.supervisor}</td>
                        <td className="py-4 px-6 text-slate-800 font-black">{row.distributor_se}</td>
                        <td className="py-4 px-6 text-right text-slate-500">{formatNumber(row.target_ec)}</td>
                        <td className="py-4 px-6 text-right text-blue-600 font-black">{formatNumber(row.ach_ec)}</td>
                        <td className="py-4 px-6 text-center">{renderPercentageBadge(pct)}</td>
                      </tr>
                    );
                  })}
                  {/* Summary row */}
                  <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                    <td className="py-4 px-6 uppercase tracking-wider" colSpan={4}>Grand Total</td>
                    <td className="py-4 px-6 text-right">{formatNumber(totals.target_ec)}</td>
                    <td className="py-4 px-6 text-right text-blue-700">{formatNumber(totals.ach_ec)}</td>
                    <td className="py-4 px-6 text-center">
                      {renderPercentageBadge(calculatePercentage(totals.ach_ec, totals.target_ec))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* F. Achievement ST Product Focus */}
          <motion.div id="se-table-st-product" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Compass size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">F. Achievement ST Product Focus</h4>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                    <th className="py-3 px-6 text-white font-extrabold">Region</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor SE</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Target ST Product Focus</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Ach. ST Product Focus</th>
                    <th className="py-3 px-6 text-center text-white font-extrabold">% Ach. ST Focus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-bold">
                  {filteredData.map((row, idx) => {
                    const pct = calculatePercentage(row.ach_st_product_focus, row.target_st_product_focus);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-semibold">{row.region}</td>
                        <td className="py-4 px-6">{row.distributor}</td>
                        <td className="py-4 px-6">{row.supervisor}</td>
                        <td className="py-4 px-6 text-slate-800 font-black">{row.distributor_se}</td>
                        <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.target_st_product_focus)}</td>
                        <td className="py-4 px-6 text-right text-blue-600 font-black">Rp {formatNumber(row.ach_st_product_focus)}</td>
                        <td className="py-4 px-6 text-center">{renderPercentageBadge(pct)}</td>
                      </tr>
                    );
                  })}
                  {/* Summary row */}
                  <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                    <td className="py-4 px-6 uppercase tracking-wider" colSpan={4}>Grand Total</td>
                    <td className="py-4 px-6 text-right">Rp {formatNumber(totals.target_st_product_focus)}</td>
                    <td className="py-4 px-6 text-right text-blue-700">Rp {formatNumber(totals.ach_st_product_focus)}</td>
                    <td className="py-4 px-6 text-center">
                      {renderPercentageBadge(calculatePercentage(totals.ach_st_product_focus, totals.target_st_product_focus))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* G. Achievement AO Product Focus */}
          <motion.div id="se-table-ao-product" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Target size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">G. Achievement AO Product Focus</h4>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                    <th className="py-3 px-6 text-white font-extrabold">Region</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor SE</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Target AO Product Focus</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Ach. AO Product Focus</th>
                    <th className="py-3 px-6 text-center text-white font-extrabold">% Ach. AO Focus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-bold">
                  {filteredData.map((row, idx) => {
                    const pct = calculatePercentage(row.ach_ao_product_focus, row.target_ao_product_focus);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-semibold">{row.region}</td>
                        <td className="py-4 px-6">{row.distributor}</td>
                        <td className="py-4 px-6">{row.supervisor}</td>
                        <td className="py-4 px-6 text-slate-800 font-black">{row.distributor_se}</td>
                        <td className="py-4 px-6 text-right text-slate-500">{formatNumber(row.target_ao_product_focus)}</td>
                        <td className="py-4 px-6 text-right text-blue-600 font-black">{formatNumber(row.ach_ao_product_focus)}</td>
                        <td className="py-4 px-6 text-center">{renderPercentageBadge(pct)}</td>
                      </tr>
                    );
                  })}
                  {/* Summary row */}
                  <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                    <td className="py-4 px-6 uppercase tracking-wider" colSpan={4}>Grand Total</td>
                    <td className="py-4 px-6 text-right">{formatNumber(totals.target_ao_product_focus)}</td>
                    <td className="py-4 px-6 text-right text-blue-700">{formatNumber(totals.ach_ao_product_focus)}</td>
                    <td className="py-4 px-6 text-center">
                      {renderPercentageBadge(calculatePercentage(totals.ach_ao_product_focus, totals.target_ao_product_focus))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* H. Incentives Summary */}
          <motion.div id="se-table-summary" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between animate-duration-500">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-850 uppercase tracking-wider">H. Incentives Summary</h4>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                    <th className="py-3 px-6 text-white font-extrabold">Region</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                    <th className="py-3 px-6 text-white font-extrabold">Distributor SE</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Incentives GMV</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Incentives AO</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Incentives ST Focus</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Incentives AO Focus</th>
                    <th className="py-3 px-6 text-right text-white font-extrabold">Total Incentives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-bold">
                  {filteredData.map((row, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-semibold">{row.region}</td>
                        <td className="py-4 px-6">{row.distributor}</td>
                        <td className="py-4 px-6">{row.supervisor}</td>
                        <td className="py-4 px-6 text-slate-800 font-black">{row.distributor_se}</td>
                        <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.incentive_gmv)}</td>
                        <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.incentive_ao)}</td>
                        <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.incentive_st_focus)}</td>
                        <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.incentive_ao_focus)}</td>
                        <td className="py-4 px-6 text-right text-blue-600 font-black">Rp {formatNumber(row.total_incentives)}</td>
                      </tr>
                    );
                  })}
                  {/* Summary row */}
                  <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                    <td className="py-4 px-6 uppercase tracking-wider" colSpan={4}>Grand Total</td>
                    <td className="py-4 px-6 text-right">Rp {formatNumber(totals.incentive_gmv)}</td>
                    <td className="py-4 px-6 text-right">Rp {formatNumber(totals.incentive_ao)}</td>
                    <td className="py-4 px-6 text-right">Rp {formatNumber(totals.incentive_st_focus)}</td>
                    <td className="py-4 px-6 text-right">Rp {formatNumber(totals.incentive_ao_focus)}</td>
                    <td className="py-4 px-6 text-right text-blue-700 font-extrabold">Rp {formatNumber(totals.total_incentives)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
