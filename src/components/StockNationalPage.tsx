/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { StockNationalData } from "../types";
import { fetchStockNationalData } from "../services/api";
import { formatNumber, cn } from "../lib/utils";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Boxes,
  ChevronDown,
  Loader2,
  FileSpreadsheet,
  CheckCircle,
  X,
  Code,
  Building2,
  Package,
  Layers,
  ArrowUpDown,
  Check,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

const BRAND_COLORS: Record<string, string> = {
  FACERINNA: "#7F2CCB",
  SKINTIFIC: "#3b82f6",
  GLAD2GLOW: "#10b981",
  TIMEPHORIA: "#ec4899",
  UNKNOWN: "#94a3b8"
};

const getBrandColor = (brand: string) => {
  const norm = (brand || "").toUpperCase().trim();
  return BRAND_COLORS[norm] || "#3b82f6";
};

const MultiSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = ""
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  options?: string[];
  placeholder?: string;
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
    return options.filter((opt) => (opt || "").toLowerCase().includes(searchQuery.toLowerCase()));
  }, [options, searchQuery]);

  const toggleOption = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  const handleSelectAll = () => {
    onChange(options);
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange([]);
  };

  const renderDisplayText = () => {
    if (value.length === 0) {
      return <span className="text-slate-400 font-semibold truncate">{placeholder || `All ${label}s`}</span>;
    }
    if (value.length === 1) {
      return <span className="text-slate-800 font-bold truncate">{value[0]}</span>;
    }
    return (
      <div className="flex items-center gap-1.5 truncate">
        <span className="text-slate-800 font-bold">{value.length} Selected</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[180px] relative" ref={containerRef}>
      <label className="text-[10px] font-black tracking-wider uppercase text-slate-400 block select-none">
        {label}
      </label>

      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery("");
        }}
        className={cn(
          "w-full h-11 flex items-center justify-between gap-2 text-xs bg-slate-50/80 border border-slate-200 hover:border-slate-300 hover:bg-white rounded-xl px-3.5 py-2.5 text-left transition-all cursor-pointer appearance-none shadow-xs",
          isOpen && "border-blue-500 ring-2 ring-blue-100 bg-white"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {renderDisplayText()}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value.length > 0 && (
            <span
              onClick={handleClearAll}
              title="Clear selection"
              className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] p-2 max-h-[300px] flex flex-col overflow-hidden"
          >
            {options.length > 5 && (
              <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-xl mb-1 shrink-0">
                <Search size={13} className="text-slate-400 shrink-0 ml-1" />
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-[11px] font-semibold text-slate-700 placeholder-slate-400 bg-transparent outline-none py-0.5"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 p-0.5">
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-1 text-[10px] font-bold shrink-0 bg-slate-50/50 rounded-lg">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                Select All ({options.length})
              </button>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 space-y-0.5 pr-1">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-[10px] text-slate-400 font-medium">No matches found</div>
              ) : (
                filteredOptions.map((opt) => {
                  const isChecked = value.includes(opt);
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => toggleOption(opt)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-left cursor-pointer",
                        isChecked
                          ? "bg-blue-50/80 text-blue-700 font-bold"
                          : "text-slate-600 hover:bg-slate-50 font-medium"
                      )}
                    >
                      <span className="truncate pr-2">{opt || "N/A"}</span>
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                          isChecked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
                        )}
                      >
                        {isChecked && <Check size={10} strokeWidth={3} />}
                      </div>
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

export default function StockNationalPage() {
  const [data, setData] = useState<StockNationalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Filters
  const [searchSKU, setSearchSKU] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSKUNumbers, setSelectedSKUNumbers] = useState<string[]>([]);

  // Sorting
  const [sortField, setSortField] = useState<keyof StockNationalData>("national_stock");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const loadData = async (forceRefresh = false) => {
    if (forceRefresh) setSyncing(true);
    else setLoading(true);
    setSyncError(null);
    setSyncSuccess(null);

    try {
      const res = await fetchStockNationalData(forceRefresh);
      setData(res);
      if (forceRefresh) {
        setSyncSuccess("Berhasil menyinkronkan data Stock National dari Google Spreadsheet!");
        setTimeout(() => setSyncSuccess(null), 4000);
      }
    } catch (err: any) {
      console.log("Stock National load error:", err);
      setSyncError(err?.message || "Gagal memuat data Stock National.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isDemoMode = useMemo(() => {
    return data.length > 0 && data.some((item) => (item as any)._isFallback);
  }, [data]);

  // Filter options
  const filterOptions = useMemo(() => {
    const brandsSet = new Set<string>();
    const statusesSet = new Set<string>();
    const skuNumbersSet = new Set<string>();

    data.forEach((item) => {
      if (item.brand) brandsSet.add(item.brand.trim());
      if (item.supply_control_status_gt) statusesSet.add(item.supply_control_status_gt.trim());
      if (item.sku_number) skuNumbersSet.add(item.sku_number.trim());
    });

    return {
      brands: Array.from(brandsSet).sort(),
      statuses: Array.from(statusesSet).sort(),
      skuNumbers: Array.from(skuNumbersSet).sort()
    };
  }, [data]);

  // Filtered Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (searchSKU.trim() !== "") {
        const query = searchSKU.toLowerCase();
        const matchesSKU = (item.sku || "").toLowerCase().includes(query);
        const matchesSKUNum = (item.sku_number || "").toLowerCase().includes(query);
        const matchesBrand = (item.brand || "").toLowerCase().includes(query);
        if (!matchesSKU && !matchesSKUNum && !matchesBrand) return false;
      }

      if (selectedBrands.length > 0 && (!item.brand || !selectedBrands.includes(item.brand.trim()))) {
        return false;
      }

      if (selectedStatuses.length > 0 && (!item.supply_control_status_gt || !selectedStatuses.includes(item.supply_control_status_gt.trim()))) {
        return false;
      }

      if (selectedSKUNumbers.length > 0 && (!item.sku_number || !selectedSKUNumbers.includes(item.sku_number.trim()))) {
        return false;
      }

      return true;
    });
  }, [data, searchSKU, selectedBrands, selectedStatuses, selectedSKUNumbers]);

  // Sorted Data
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA || "").toLowerCase();
      const strB = String(valB || "").toLowerCase();
      if (strA < strB) return sortDirection === "asc" ? -1 : 1;
      if (strA > strB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // Paginated Data
  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleSort = (field: keyof StockNationalData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    let totalNat = 0;
    let totalJkt = 0;
    let totalSby = 0;
    let totalMks = 0;
    let totalKal = 0;

    filteredData.forEach((item) => {
      totalNat += item.national_stock || 0;
      totalJkt += item.jakarta_wh || 0;
      totalSby += item.surabaya_wh || 0;
      totalMks += item.makassar_wh || 0;
      totalKal += item.kalimantan_wh || 0;
    });

    return {
      totalNat,
      totalJkt,
      totalSby,
      totalMks,
      totalKal,
      skuCount: filteredData.length,
      jktPercent: totalNat > 0 ? ((totalJkt / totalNat) * 100).toFixed(1) : "0",
      sbyPercent: totalNat > 0 ? ((totalSby / totalNat) * 100).toFixed(1) : "0",
      mksPercent: totalNat > 0 ? ((totalMks / totalNat) * 100).toFixed(1) : "0",
      kalPercent: totalNat > 0 ? ((totalKal / totalNat) * 100).toFixed(1) : "0"
    };
  }, [filteredData]);

  // Chart 1 Data: Stock Distribution by Brand across Warehouses
  const brandWhChartData = useMemo(() => {
    const brandMap: Record<string, { brand: string; Jakarta: number; Surabaya: number; Makassar: number; Kalimantan: number }> = {};

    filteredData.forEach((item) => {
      if (!item.brand || !item.brand.trim() || item.brand.trim().toLowerCase() === "other") return;
      const b = item.brand.trim();
      if (!brandMap[b]) {
        brandMap[b] = { brand: b, Jakarta: 0, Surabaya: 0, Makassar: 0, Kalimantan: 0 };
      }
      brandMap[b].Jakarta += item.jakarta_wh || 0;
      brandMap[b].Surabaya += item.surabaya_wh || 0;
      brandMap[b].Makassar += item.makassar_wh || 0;
      brandMap[b].Kalimantan += item.kalimantan_wh || 0;
    });

    return Object.values(brandMap);
  }, [filteredData]);

  // Chart 2 Data: Supply Control Status Breakdown
  const statusChartData = useMemo(() => {
    const statusMap: Record<string, number> = {};

    filteredData.forEach((item) => {
      const st = item.supply_control_status_gt || "Unspecified";
      statusMap[st] = (statusMap[st] || 0) + 1;
    });

    const colors = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b"];

    return Object.entries(statusMap).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  }, [filteredData]);

  const exportToExcel = () => {
    const exportRows = sortedData.map((item, idx) => ({
      No: idx + 1,
      Brand: item.brand,
      "SKU Number": item.sku_number,
      SKU: item.sku,
      "Jakarta WH": item.jakarta_wh,
      "Surabaya WH": item.surabaya_wh,
      "Makassar WH": item.makassar_wh,
      "Kalimantan WH": item.kalimantan_wh,
      "National Stock": item.national_stock,
      "Supply Control Status-GT": item.supply_control_status_gt,
      Remarks: item.remarks
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock National");
    XLSX.writeFile(workbook, `Stock_National_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const gasScriptCode = `function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // Parameter ?sheet=NamaTab (Contoh: ?sheet=National atau ?sheet=Stock%20Cabang)
  var sheetName = e && e.parameter && e.parameter.sheet ? e.parameter.sheet : "National";
  var sheet;
  
  if (sheetName) {
    sheet = ss.getSheetByName(sheetName);
  }
  if (!sheet) {
    sheet = ss.getActiveSheet() || ss.getSheets()[0];
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0];
  var rows = data.slice(1);
  var tz = ss.getSpreadsheetTimeZone();
  
  var result = rows.map(function(row) {
    var obj = {};
    var hasData = false;
    
    headers.forEach(function(header, i) {
      if (!header) return;
      
      var rawKey = header.toString().trim();
      var key = rawKey.toLowerCase().replace(/[\\s_\\-\\.\\(\\)]/g, '_');
      
      // Mapping Alias Kolom Stock Analysis & Stock National
      if (key.includes('update_date') || key.includes('tanggal') || key === 'date') key = 'update_date';
      if (key.includes('distributor') || key.includes('distributor_name')) key = 'distributor';
      if (key.includes('product_code') || key.includes('item_id') || key.includes('product_id') || key === 'item_code') key = 'item_id';
      if (key === 'sku' || key.includes('sku_name') || key.includes('nama_barang') || key === 'product') key = 'sku';
      if (key.includes('soh_qty') || key === 'soh' || key.includes('stock_on_hand')) key = 'soh_qty';
      if (key.includes('in_transit') || key.includes('intransit') || key === 'transit') key = 'in_transit_stock_qty';
      if (key.includes('avg_am') || key.includes('am_l3m')) key = 'avg_am_l3m_qty';
      if (key.includes('last_month_st') || key.includes('lm_st')) key = 'last_month_st_qty';
      if (key === 'brand' || key.includes('brand_of')) key = 'brand';
      if (key.includes('avg_st') || key.includes('st_l3m')) key = 'avg_st_l3m';
      if (key.includes('stock_total') || key.includes('total_stock') || key === 'total') key = 'stock_total';
      if (key.includes('woi_st') || key === 'woi' || key.includes('woi_l3m')) key = 'woi_st_l3m';
      if (key.includes('death_stock') || key.includes('dead_stock') || key.includes('deadstock')) key = 'death_stock_flag';
      if (key.includes('remarks_woi') || key.includes('woi_remarks') || key === 'remarks') key = 'remarks_woi';
      if (key.includes('po_remarks') || key.includes('po_remark')) key = 'po_remarks';
      
      // Mapping Alias Kolom Stock National
      if (key.includes('jakarta')) key = 'jakarta_wh';
      if (key.includes('surabaya')) key = 'surabaya_wh';
      if (key.includes('makassar')) key = 'makassar_wh';
      if (key.includes('kalimantan')) key = 'kalimantan_wh';
      if (key.includes('national_stock') || key.includes('stock_national')) key = 'national_stock';
      if (key.includes('supply_control') || key.includes('gt_status')) key = 'supply_control_status_gt';

      var val = row[i];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, tz, "MM/dd/yyyy");
      }
      if (val !== "" && val !== null && val !== undefined) {
        hasData = true;
      }
      
      obj[key] = val;
    });
    
    return hasData ? obj : null;
  }).filter(function(item) {
    return item !== null;
  });
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(gasScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const getStatusBadge = (status: string) => {
    const lower = (status || "").toLowerCase();
    if (lower.includes("normal") || lower.includes("safe") || lower.includes("ok")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (lower.includes("low") || lower.includes("risk") || lower.includes("warning") || lower.includes("oos")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (lower.includes("critical") || lower.includes("stop") || lower.includes("urgent")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (lower.includes("overstock") || lower.includes("high")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white text-blue-600 gap-4">
        <Loader2 className="animate-spin w-10 h-10" />
        <div className="text-center">
          <span className="font-black tracking-[0.3em] text-xs uppercase block mb-1">YOOL-DO! SYSTEMS</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase animate-pulse">Retrieving national stock inventory data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in" id="stock-national-page-root">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-50">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-1">Stock National Dashboard</h2>
            {isDemoMode && (
              <span className="bg-amber-100 text-amber-800 text-[9px] px-2.5 py-1 rounded-full uppercase font-black tracking-wider shadow-sm flex items-center gap-1">
                DEMO DATA
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm font-medium">
            Strategic national multi-warehouse inventory tracking and GT supply control analytics.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3 w-full lg:w-auto">
          <button
            onClick={() => loadData(true)}
            disabled={syncing}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              syncing
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-white border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 shadow-sm cursor-pointer"
            }`}
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync Spreadsheet"}
          </button>

          <button
            onClick={exportToExcel}
            disabled={filteredData.length === 0}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-xs font-bold text-white rounded-xl hover:bg-blue-700 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            Export Excel
          </button>
        </div>
      </header>

      {/* Notifications */}
      {syncError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-rose-700 text-xs font-bold"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span>{syncError}</span>
          </div>
          <button onClick={() => setSyncError(null)} className="p-1 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer">
            <X size={14} />
          </button>
        </motion.div>
      )}

      {syncSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-700 text-xs font-bold"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <span>{syncSuccess}</span>
          </div>
          <button onClick={() => setSyncSuccess(null)} className="p-1 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer">
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* Filters Box */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 bg-blue-600 rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Filters ({filteredData.length} records)
            </h3>
          </div>

          {(searchSKU || selectedBrands.length > 0 || selectedStatuses.length > 0 || selectedSKUNumbers.length > 0) && (
            <button
              onClick={() => {
                setSearchSKU("");
                setSelectedBrands([]);
                setSelectedStatuses([]);
                setSelectedSKUNumbers([]);
                setCurrentPage(1);
              }}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
            >
              <X size={12} /> Reset All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Brand */}
          <MultiSelect
            label="Brand"
            value={selectedBrands}
            onChange={setSelectedBrands}
            options={filterOptions.brands}
            placeholder="All Brands"
          />

          {/* Supply Control Status-GT */}
          <MultiSelect
            label="Supply Control Status-GT"
            value={selectedStatuses}
            onChange={setSelectedStatuses}
            options={filterOptions.statuses}
            placeholder="All Statuses"
          />

          {/* SKU Number */}
          <MultiSelect
            label="SKU Number"
            value={selectedSKUNumbers}
            onChange={setSelectedSKUNumbers}
            options={filterOptions.skuNumbers}
            placeholder="All SKU Numbers"
          />

          {/* Search Box */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block mb-1.5">
              Search SKU
            </span>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="SKU, code, brand..."
                value={searchSKU}
                onChange={(e) => {
                  setSearchSKU(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-100 hover:border-blue-500 hover:bg-white focus:bg-white p-3 pl-10 rounded-xl text-xs font-bold text-slate-700 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Total National Stock (Highlighted Blue Card) */}
          <div className="p-5 rounded-2xl border border-blue-700 bg-blue-600 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden text-white">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest mb-1 truncate text-blue-100">
                National Total Stock
              </span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-xl font-black tracking-tight text-white" title={formatNumber(kpis.totalNat)}>
                  {formatNumber(kpis.totalNat)}
                </span>
                <span className="text-xs font-bold opacity-70 text-blue-100 ml-1">Items</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                {kpis.skuCount} Active SKUs
              </div>
            </div>
          </div>

          {/* Jakarta WH */}
          <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Jakarta WH</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-xl font-black tracking-tight text-slate-900" title={formatNumber(kpis.totalJkt)}>
                  {formatNumber(kpis.totalJkt)}
                </span>
                <span className="text-xs font-bold opacity-70 text-slate-500 ml-1">Items</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-semibold">Share:</span>
              <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{kpis.jktPercent}%</span>
            </div>
          </div>

          {/* Surabaya WH */}
          <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Surabaya WH</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-xl font-black tracking-tight text-slate-900" title={formatNumber(kpis.totalSby)}>
                  {formatNumber(kpis.totalSby)}
                </span>
                <span className="text-xs font-bold opacity-70 text-slate-500 ml-1">Items</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-semibold">Share:</span>
              <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{kpis.sbyPercent}%</span>
            </div>
          </div>

          {/* Makassar WH */}
          <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Makassar WH</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-xl font-black tracking-tight text-slate-900" title={formatNumber(kpis.totalMks)}>
                  {formatNumber(kpis.totalMks)}
                </span>
                <span className="text-xs font-bold opacity-70 text-slate-500 ml-1">Items</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-semibold">Share:</span>
              <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{kpis.mksPercent}%</span>
            </div>
          </div>

          {/* Kalimantan WH */}
          <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Kalimantan WH</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-xl font-black tracking-tight text-slate-900" title={formatNumber(kpis.totalKal)}>
                  {formatNumber(kpis.totalKal)}
                </span>
                <span className="text-xs font-bold opacity-70 text-slate-500 ml-1">Items</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-semibold">Share:</span>
              <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{kpis.kalPercent}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Warehouse Distribution by Brand</h3>
              <p className="text-[11px] text-slate-400 font-medium">Comparison of physical stock across regional warehouses</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 size={18} />
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandWhChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="brand" tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip
                  formatter={(value: any) => [formatNumber(Number(value)), "Stock Qty"]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px", fontWeight: "bold" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "bold", paddingTop: "10px" }} />
                <Bar dataKey="Jakarta" fill="#1e40af" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Surabaya" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Makassar" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Kalimantan" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Supply Control Status</h3>
              <p className="text-[11px] text-slate-400 font-medium">Distribution of GT status tags</p>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Layers size={18} />
            </div>
          </div>

          <div className="h-[220px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} SKUs`, "Count"]}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "11px", fontWeight: "bold" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 max-h-[100px] overflow-y-auto custom-scrollbar pr-1 mt-2 border-t border-slate-100 pt-3">
            {statusChartData.map((st) => (
              <div key={st.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                  <span className="font-bold text-slate-700 truncate max-w-[140px]">{st.name}</span>
                </div>
                <span className="font-black text-slate-900">{st.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-blue-500/5 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">National Inventory Records</h3>
            <p className="text-xs text-slate-400 font-medium">Showing {sortedData.length} records</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-black tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Brand</th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort("sku_number")}>
                  <div className="flex items-center gap-1">
                    <span>SKU Number</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort("sku")}>
                  <div className="flex items-center gap-1">
                    <span>SKU Description</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort("jakarta_wh")}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Jakarta</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort("surabaya_wh")}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Surabaya</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort("makassar_wh")}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Makassar</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort("kalimantan_wh")}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Kalimantan</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort("national_stock")}>
                  <div className="flex items-center justify-end gap-1">
                    <span>National Total</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4">Status GT</th>
                <th className="py-3.5 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-bold">
                    No items found matching selected filters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={`${item.sku_number}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span
                        className="font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider text-white"
                        style={{ backgroundColor: getBrandColor(item.brand) }}
                      >
                        {item.brand || "N/A"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 text-[11px]">{item.sku_number || "-"}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[280px]">{item.sku}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">{formatNumber(item.jakarta_wh)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">{formatNumber(item.surabaya_wh)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">{formatNumber(item.makassar_wh)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">{formatNumber(item.kalimantan_wh)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-blue-700 text-sm bg-blue-50/40">
                      {formatNumber(item.national_stock)}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.supply_control_status_gt ? (
                        <span className={cn("px-2.5 py-1 rounded-lg border text-[10px] font-extrabold uppercase tracking-wide", getStatusBadge(item.supply_control_status_gt))}>
                          {item.supply_control_status_gt}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium text-[11px] max-w-[180px] truncate">{item.remarks || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-500 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span>Show per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div>
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition-all cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
