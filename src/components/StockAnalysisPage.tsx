/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { StockAnalysisData } from "../types";
import { fetchStockAnalysisData } from "../services/api";
import { formatNumber, cn } from "../lib/utils";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  BarChart2,
  Boxes,
  Tag,
  ChevronLeft,
  ChevronRight,
  Database,
  ArrowUpDown,
  ShoppingBag,
  Layers,
  ChevronDown,
  Loader2,
  Info,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  Truck,
  Check,
  X
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
  const norm = brand.toUpperCase().trim();
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

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[180px] relative" ref={containerRef}>
      <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block mb-1.5">{label}</span>
      
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery("");
        }}
        className={cn(
          "w-full flex items-center justify-between gap-2 text-xs bg-slate-50 border border-slate-100 hover:border-blue-500 hover:bg-white rounded-xl p-3 text-left transition-all cursor-pointer appearance-none shadow-sm",
          isOpen && "border-blue-500 ring-4 ring-blue-50/50 bg-white"
        )}
      >
        <span className="truncate pr-2 font-bold text-slate-700">
          {value.length === 0 ? (placeholder || `All ${label}s`) : `${value.length} Selected`}
        </span>
        <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-300 shrink-0", isOpen && "rotate-180")} />
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
                      <span className="truncate">{opt || "Non-Dead Stock / Normal"}</span>
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

export default function StockAnalysisPage() {
  const [rawData, setRawData] = useState<StockAnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showScriptGuide, setShowScriptGuide] = useState(false);

  // Filters State
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedDistributors, setSelectedDistributors] = useState<string[]>([]);
  const [selectedDeadStocks, setSelectedDeadStocks] = useState<string[]>([]);
  const [selectedWoiRemarks, setSelectedWoiRemarks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting State
  const [sortField, setSortField] = useState<keyof StockAnalysisData | null>("stock_total");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Load Data
  const loadData = async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const data = await fetchStockAnalysisData(force);
      setRawData(data);
    } catch (err: any) {
      console.log("Failed to load Stock Analysis data:", err);
      setError(err.message || "Gagal menyelaraskan data Stock Analysis.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isDemoMode = useMemo(() => {
    return rawData.length > 0 && rawData.some((item) => (item as any)._isFallback);
  }, [rawData]);

  // Unique Filter Values
  const filterOptions = useMemo(() => {
    const brands = new Set<string>();
    const distributors = new Set<string>();
    const deadStockFlags = new Set<string>();
    const woiRemarks = new Set<string>();

    rawData.forEach((item) => {
      if (item.brand) brands.add(item.brand.trim());
      if (item.distributor) distributors.add(item.distributor.trim());
      if (item.death_stock_flag) deadStockFlags.add(item.death_stock_flag.trim());
      if (item.remarks_woi) woiRemarks.add(item.remarks_woi.trim());
    });

    return {
      brands: Array.from(brands).sort(),
      distributors: Array.from(distributors).sort(),
      deadStockFlags: Array.from(deadStockFlags).sort(),
      woiRemarks: Array.from(woiRemarks).sort()
    };
  }, [rawData]);

  // Handle Sort Toggle
  const handleSort = (field: keyof StockAnalysisData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // Filter and Sort Data
  const processedData = useMemo(() => {
    let result = [...rawData];

    // Dropdown Filters (Multiple Selection)
    if (selectedBrands.length > 0) {
      result = result.filter((item) => item.brand && selectedBrands.includes(item.brand.trim()));
    }
    if (selectedDistributors.length > 0) {
      result = result.filter((item) => item.distributor && selectedDistributors.includes(item.distributor.trim()));
    }
    if (selectedDeadStocks.length > 0) {
      result = result.filter((item) => selectedDeadStocks.includes((item.death_stock_flag || "").trim()));
    }
    if (selectedWoiRemarks.length > 0) {
      result = result.filter((item) => selectedWoiRemarks.includes((item.remarks_woi || "").trim()));
    }

    // Text Search (filters SKU, Item ID, or Distributor)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.sku.toLowerCase().includes(q) ||
          item.item_id.toLowerCase().includes(q) ||
          item.product_code.toLowerCase().includes(q) ||
          item.distributor.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortField) {
      result.sort((a, b) => {
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
    }

    return result;
  }, [rawData, selectedBrands, selectedDistributors, selectedDeadStocks, selectedWoiRemarks, searchQuery, sortField, sortDirection]);

  // Aggregate stats for KPIs
  const kpiStats = useMemo(() => {
    let sohUnits = 0;
    let transitUnits = 0;
    let totalStockUnits = 0;
    let deadStockItems = 0;
    let totalItems = processedData.length;
    let highWoiCount = 0;
    let oosRiskCount = 0;

    processedData.forEach((item) => {
      sohUnits += item.soh_qty || 0;
      transitUnits += item.in_transit_stock_qty || 0;
      totalStockUnits += item.stock_total || 0;

      if (item.death_stock_flag && item.death_stock_flag.toLowerCase().includes("dead")) {
        deadStockItems++;
      }
      if (item.remarks_woi && item.remarks_woi.toLowerCase().includes("high")) {
        highWoiCount++;
      }
      if (item.remarks_woi && item.remarks_woi.toLowerCase().includes("oos")) {
        oosRiskCount++;
      }
    });

    return {
      sohUnits,
      transitUnits,
      totalStockUnits,
      deadStockItems,
      totalItems,
      highWoiCount,
      oosRiskCount
    };
  }, [processedData]);

  // Recharts Chart 1: Stock volume by Brand (Stacked Bar)
  const chartDataBrandVolume = useMemo(() => {
    const brandMap: Record<string, { brand: string; soh: number; transit: number }> = {};

    processedData.forEach((item) => {
      const brand = item.brand || "Unknown";
      if (!brandMap[brand]) {
        brandMap[brand] = { brand, soh: 0, transit: 0 };
      }
      brandMap[brand].soh += item.soh_qty || 0;
      brandMap[brand].transit += item.in_transit_stock_qty || 0;
    });

    return Object.values(brandMap).sort((a, b) => (b.soh + b.transit) - (a.soh + a.transit));
  }, [processedData]);

  // Recharts Chart 2: Avg WOI and SOH ratio per Brand
  const chartDataBrandWoi = useMemo(() => {
    const brandWoiMap: Record<string, { name: string; sumWoi: number; count: number; avgWoi: number }> = {};

    processedData.forEach((item) => {
      const brand = item.brand || "Unknown";
      if (!brandWoiMap[brand]) {
        brandWoiMap[brand] = { name: brand, sumWoi: 0, count: 0, avgWoi: 0 };
      }
      if (item.woi_st_l3m !== undefined) {
        brandWoiMap[brand].sumWoi += item.woi_st_l3m;
        brandWoiMap[brand].count++;
      }
    });

    return Object.values(brandWoiMap)
      .map((item) => ({
        ...item,
        avgWoi: item.count > 0 ? parseFloat((item.sumWoi / item.count).toFixed(1)) : 0
      }))
      .sort((a, b) => b.avgWoi - a.avgWoi);
  }, [processedData]);

  // Heatmap Data for WOI and Total Stock by Distributor and Brand
  const heatmapData = useMemo(() => {
    const brandsSet = new Set<string>();
    const distributorsSet = new Set<string>();

    processedData.forEach((item) => {
      if (item.brand) brandsSet.add(item.brand.trim());
      if (item.distributor) distributorsSet.add(item.distributor.trim());
    });

    const uniqueBrands = Array.from(brandsSet).sort();
    const uniqueDistributors = Array.from(distributorsSet).sort();

    const matrix: Record<string, Record<string, { totalStock: number; woiSum: number; woiCount: number }>> = {};

    uniqueDistributors.forEach((dist) => {
      matrix[dist] = {};
      uniqueBrands.forEach((br) => {
        matrix[dist][br] = { totalStock: 0, woiSum: 0, woiCount: 0 };
      });
    });

    processedData.forEach((item) => {
      const dist = item.distributor?.trim();
      const br = item.brand?.trim();
      if (dist && br && matrix[dist] && matrix[dist][br]) {
        matrix[dist][br].totalStock += item.stock_total || 0;
        if (typeof item.woi_st_l3m === "number") {
          matrix[dist][br].woiSum += item.woi_st_l3m;
          matrix[dist][br].woiCount++;
        }
      }
    });

    return {
      brands: uniqueBrands,
      distributors: uniqueDistributors,
      matrix
    };
  }, [processedData]);

  const maxTotalStock = useMemo(() => {
    let maxVal = 1;
    const { distributors, brands, matrix } = heatmapData;
    distributors.forEach((dist) => {
      brands.forEach((br) => {
        const cell = matrix[dist]?.[br];
        if (cell && cell.totalStock > maxVal) {
          maxVal = cell.totalStock;
        }
      });
    });
    return maxVal;
  }, [heatmapData]);

  // Top 10 items with highest WOI
  const topTenWoiItems = useMemo(() => {
    return [...processedData]
      .filter((item) => typeof item.woi_st_l3m === "number" && (item.item_id || item.sku))
      .sort((a, b) => (b.woi_st_l3m || 0) - (a.woi_st_l3m || 0))
      .slice(0, 10);
  }, [processedData]);

  // Top 10 items with highest Total Stock
  const topTenStockItems = useMemo(() => {
    return [...processedData]
      .filter((item) => typeof item.stock_total === "number" && (item.item_id || item.sku))
      .sort((a, b) => (b.stock_total || 0) - (a.stock_total || 0))
      .slice(0, 10);
  }, [processedData]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return processedData.slice(start, start + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / rowsPerPage));

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrands, selectedDistributors, selectedDeadStocks, selectedWoiRemarks, searchQuery]);

  // Excel Exporter using xlsx library
  const exportToExcel = () => {
    const headers = [
      "Update Date",
      "Brand",
      "Distributor",
      "Product Code",
      "Item ID",
      "SKU",
      "SOH Qty",
      "In Transit Stock Qty",
      "Total Stock",
      "Avg AM L3M Qty",
      "Last Month ST Qty",
      "Avg ST L3M",
      "WOI ST L3M",
      "Death Stock Flag",
      "Remarks WOI",
      "PO Remarks"
    ];

    const rows = processedData.map((item) => [
      item.update_date || "",
      item.brand || "",
      item.distributor || "",
      item.product_code || "",
      item.item_id || "",
      item.sku || "",
      item.soh_qty || 0,
      item.in_transit_stock_qty || 0,
      item.stock_total || 0,
      item.avg_am_l3m_qty || 0,
      item.last_month_st_qty || 0,
      item.avg_st_l3m || 0,
      item.woi_st_l3m || 0,
      item.death_stock_flag || "",
      item.remarks_woi || "",
      item.po_remarks || ""
    ]);

    // Build the worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Analysis");

    // Write file to XLSX format
    XLSX.writeFile(workbook, `Stock_Analysis_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white text-blue-600 gap-4">
        <Loader2 className="animate-spin w-10 h-10" />
        <div className="text-center">
          <span className="font-black tracking-[0.3em] text-xs uppercase block mb-1">YOOL-DO! SYSTEMS</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase animate-pulse">Retrieving spreadsheet stock inventory data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in" id="stock-analysis-page-root">
      
      {/* ========================================== */}
      {/* SECTION 1: EXECUTIVE SUMMARY (KPIs) */}
      {/* ========================================== */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-50">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-1">Stock Cabang Dashboard</h2>
            {isDemoMode && (
              <span className="bg-amber-100 text-amber-800 text-[9px] px-2.5 py-1 rounded-full uppercase font-black tracking-wider shadow-sm flex items-center gap-1">
                <AlertTriangle size={11} className="text-amber-600" /> DEMO DATA
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm font-medium">Strategic supply chain tracking and Weeks of Inventory (WOI) analytics.</p>
        </div>
        <div className="flex items-center flex-wrap gap-3 w-full lg:w-auto">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              refreshing
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-white border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 shadow-sm cursor-pointer"
            }`}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Syncing..." : "Sync Spreadsheet"}
          </button>
          <button
            onClick={exportToExcel}
            disabled={processedData.length === 0}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-xs font-bold text-white rounded-xl hover:bg-blue-700 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            Export Excel
          </button>
        </div>
      </header>

      {/* ========================================== */}
      {/* SECTION 3: ADVANCED INTERACTIVE FILTERS */}
      {/* ========================================== */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-8 h-1 bg-blue-600 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Filters ({processedData.length} records)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Brand Dropdown */}
          <MultiSelect
            label="Brand"
            value={selectedBrands}
            onChange={setSelectedBrands}
            options={filterOptions.brands}
            placeholder="All Brands"
          />

          {/* Distributor Dropdown */}
          <MultiSelect
            label="Distributor"
            value={selectedDistributors}
            onChange={setSelectedDistributors}
            options={filterOptions.distributors}
            placeholder="All Distributors"
          />

          {/* Dead Stock Dropdown */}
          <MultiSelect
            label="Dead Stock Status"
            value={selectedDeadStocks}
            onChange={setSelectedDeadStocks}
            options={filterOptions.deadStockFlags}
            placeholder="All Statuses"
          />

          {/* WOI Remarks Dropdown */}
          <MultiSelect
            label="WOI Remarks"
            value={selectedWoiRemarks}
            onChange={setSelectedWoiRemarks}
            options={filterOptions.woiRemarks}
            placeholder="All Remarks"
          />

          {/* Search Box */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block mb-1.5">Search SKU</span>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="SKU, product code, id..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 hover:border-blue-500 hover:bg-white focus:bg-white p-3 pl-10 rounded-xl text-xs font-bold text-slate-700 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* SOH KPI */}
          <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Stock On Hand (SOH)</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-xl font-black tracking-tight text-slate-900" title={formatNumber(kpiStats.sohUnits)}>
                  {formatNumber(kpiStats.sohUnits)}
                </span>
                <span className="text-xs font-bold opacity-70 text-slate-500 ml-1">Items</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="text-[9px] font-semibold text-slate-400">Active items across distributors</span>
            </div>
          </div>

          {/* In Transit KPI */}
          <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">In-Transit Stock</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-xl font-black tracking-tight text-slate-900" title={formatNumber(kpiStats.transitUnits)}>
                  {formatNumber(kpiStats.transitUnits)}
                </span>
                <span className="text-xs font-bold opacity-70 text-slate-500 ml-1">Items</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                +{formatNumber(Math.round((kpiStats.transitUnits / Math.max(1, kpiStats.sohUnits)) * 100))}%
              </div>
              <span className="text-[9px] font-semibold text-slate-400">of SOH qty</span>
            </div>
          </div>

          {/* Total Stock KPI */}
          <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Total Inventory Qty</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-xl font-black tracking-tight text-slate-900" title={formatNumber(kpiStats.totalStockUnits)}>
                  {formatNumber(kpiStats.totalStockUnits)}
                </span>
                <span className="text-xs font-bold opacity-70 text-slate-500 ml-1">Items</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="text-[9px] font-semibold text-slate-400">{kpiStats.totalItems} distinct SKU records</span>
            </div>
          </div>

          {/* Dead Stock & Risks - Brand focus style */}
          <div className="p-5 rounded-2xl border border-blue-700 bg-blue-600 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest mb-1 truncate text-blue-100">Dead Stock & Risks</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-xl font-black tracking-tight text-white truncate">
                  {kpiStats.deadStockItems} <span className="text-sm font-semibold opacity-70">Items</span>
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                {kpiStats.highWoiCount} High WOI | {kpiStats.oosRiskCount} OOS
              </div>
              <span className="text-[9px] font-bold text-blue-100">Risks</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* SECTION 2: VISUAL ANALYTICS CHARTS */}
      {/* ========================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Brand Stock Breakdown */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 h-[450px] flex flex-col">
          <div className="mb-10 shrink-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Stock Volume by Brand</h3>
            </div>
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Brand Distribution</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SOH vs In-Transit quantities</p>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDataBrandVolume}
                margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="brand" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 800 }} 
                  interval={0}
                  dy={15} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return val;
                  }}
                  tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 800 }} 
                  width={50}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", padding: "12px" }}
                  itemStyle={{ fontSize: "11px", fontWeight: 800 }}
                  labelStyle={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}
                  formatter={(val: any) => [formatNumber(val), ""]}
                />
                <Legend 
                  iconType="circle"
                  wrapperStyle={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", paddingTop: "20px" }}
                />
                <Bar name="Stock On Hand (SOH)" dataKey="soh" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
                <Bar name="In-Transit Qty" dataKey="transit" stackId="a" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brand WOI Analysis */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 h-[450px] flex flex-col">
          <div className="mb-10 shrink-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Weeks of Inventory (WOI)</h3>
            </div>
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Average Stock Longevity</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Weeks of supply based on sales run-rate</p>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDataBrandWoi}
                margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 800 }} 
                  interval={0}
                  dy={15} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val} Wks`}
                  tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 800 }} 
                  width={50}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", padding: "12px" }}
                  itemStyle={{ fontSize: "11px", fontWeight: 800 }}
                  labelStyle={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}
                  formatter={(val: any) => [`${val} Weeks`, "Average WOI"]}
                />
                <Bar name="Average WOI" dataKey="avgWoi" fill="#2563eb" radius={[6, 6, 0, 0]}>
                  {chartDataBrandWoi.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBrandColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* SECTION 2.5: TOP 10 ITEMS ANALYTICS */}
      {/* ========================================== */}
      <section className="grid grid-cols-1 gap-8">
        {/* Top 10 Items by Highest WOI */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col">
          <div className="mb-6 shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-1 bg-rose-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Inventory Alert Analytics</h3>
            </div>
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Top 10 Item IDs with Highest WOI</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Items that have the highest weeks of supply and are at risk of being overstocked.</p>
          </div>

          {topTenWoiItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 min-h-[300px]">
              <AlertCircle className="text-slate-300 mb-2" size={24} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No items found for selected filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-12 text-[9px] font-black uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 px-2">
                <span className="col-span-1 text-center">Rank</span>
                <span className="col-span-2">Item ID</span>
                <span className="col-span-3">SKU / Brand</span>
                <span className="col-span-2">Distributor</span>
                <span className="col-span-2 text-right">Avg ST L3M</span>
                <span className="col-span-1 text-right">Stock Total</span>
                <span className="col-span-1 text-right">WOI</span>
              </div>
              <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto pr-1">
                {topTenWoiItems.map((item, index) => {
                  const woi = item.woi_st_l3m || 0;
                  const stL3m = item.avg_st_l3m || 0;
                  const stockTotal = item.stock_total || 0;
                  const rankColors = [
                    "bg-rose-500 text-white",
                    "bg-rose-400 text-white",
                    "bg-rose-300 text-rose-800",
                    "bg-amber-100 text-amber-800",
                    "bg-amber-50 text-amber-700"
                  ];
                  const rankBadge = rankColors[index] || "bg-slate-100 text-slate-600";
                  return (
                    <div key={`${item.item_id || item.sku}-${index}`} className="grid grid-cols-12 items-center py-2.5 text-xs hover:bg-slate-50/50 transition-all rounded-xl px-2">
                      <div className="col-span-1 flex justify-center">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-black ${rankBadge}`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="col-span-2 font-mono font-bold text-slate-800 truncate pr-2" title={item.item_id}>
                        {item.item_id || "-"}
                      </div>
                      <div className="col-span-3 pr-2">
                        <div className="font-bold text-slate-700 truncate text-[11px]" title={item.sku}>{item.sku || "-"}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.brand || "-"}</div>
                      </div>
                      <div className="col-span-2 text-[10px] text-slate-500 font-medium truncate pr-2" title={item.distributor}>
                        {item.distributor || "-"}
                      </div>
                      <div className="col-span-2 text-right font-bold text-slate-700 font-mono pr-2">
                        {formatNumber(stL3m)}
                      </div>
                      <div className="col-span-1 text-right font-black text-blue-600 font-mono pr-2">
                        {formatNumber(stockTotal)}
                      </div>
                      <div className="col-span-1 text-right">
                        <span className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                          woi > 24 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {woi.toFixed(1)} Wks
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Top 10 Items by Highest Total Stock */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col">
          <div className="mb-6 shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Volume Stock Analytics</h3>
            </div>
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Top 10 Item IDs with Highest Total Stock</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Items with the highest volume of physical inventory in stock (SOH + In Transit).</p>
          </div>

          {topTenStockItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 min-h-[300px]">
              <AlertCircle className="text-slate-300 mb-2" size={24} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No items found for selected filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-12 text-[9px] font-black uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 px-2">
                <span className="col-span-1 text-center">Rank</span>
                <span className="col-span-2">Item ID</span>
                <span className="col-span-3">SKU / Brand</span>
                <span className="col-span-2">Distributor</span>
                <span className="col-span-2 text-right">Avg ST L3M</span>
                <span className="col-span-1 text-right">Stock Total</span>
                <span className="col-span-1 text-right">WOI</span>
              </div>
              <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto pr-1">
                {topTenStockItems.map((item, index) => {
                  const woi = item.woi_st_l3m || 0;
                  const stL3m = item.avg_st_l3m || 0;
                  const stockTotal = item.stock_total || 0;
                  const rankColors = [
                    "bg-blue-600 text-white",
                    "bg-blue-500 text-white",
                    "bg-blue-400 text-white",
                    "bg-indigo-100 text-indigo-800",
                    "bg-indigo-50 text-indigo-700"
                  ];
                  const rankBadge = rankColors[index] || "bg-slate-100 text-slate-600";
                  return (
                    <div key={`${item.item_id || item.sku}-${index}`} className="grid grid-cols-12 items-center py-2.5 text-xs hover:bg-slate-50/50 transition-all rounded-xl px-2">
                      <div className="col-span-1 flex justify-center">
                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-black ${rankBadge}`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="col-span-2 font-mono font-bold text-slate-800 truncate pr-2" title={item.item_id}>
                        {item.item_id || "-"}
                      </div>
                      <div className="col-span-3 pr-2">
                        <div className="font-bold text-slate-700 truncate text-[11px]" title={item.sku}>{item.sku || "-"}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.brand || "-"}</div>
                      </div>
                      <div className="col-span-2 text-[10px] text-slate-500 font-medium truncate pr-2" title={item.distributor}>
                        {item.distributor || "-"}
                      </div>
                      <div className="col-span-2 text-right font-bold text-slate-700 font-mono pr-2">
                        {formatNumber(stL3m)}
                      </div>
                      <div className="col-span-1 text-right font-black text-blue-600 font-mono pr-2">
                        {formatNumber(stockTotal)}
                      </div>
                      <div className="col-span-1 text-right">
                        <span className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                          woi > 24 ? "bg-rose-50 text-rose-700" : woi > 12 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {woi.toFixed(1)} Wks
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================== */}
      {/* SECTION 3: HEATMAP ANALYTICS */}
      {/* ========================================== */}
      <section className="grid grid-cols-1 gap-8">
        {/* Heatmap 1: Weeks of Inventory (WOI) by Distributor */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col">
          <div className="mb-6 shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-1 bg-violet-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Weeks of Inventory (WOI) Heatmap</h3>
            </div>
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">WOI by Distributor & Brand</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average weeks of supply. Green is healthy, Amber is warning, Red is overstocked.</p>
          </div>

          {heatmapData.distributors.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 min-h-[220px]">
              <AlertCircle className="text-slate-300 mb-2" size={24} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No distributor data found for selected filters</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400 min-w-[160px] border-r border-slate-100">
                        Distributor / Brand
                      </th>
                      {heatmapData.brands.map((brand) => (
                        <th key={brand} className="px-3 py-3 text-center text-[9px] font-black uppercase tracking-wider text-slate-500 min-w-[100px]">
                          {brand}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.distributors.map((dist) => (
                      <tr key={dist} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-all">
                        <td className="px-4 py-3 text-left text-[10px] font-black text-slate-700 truncate max-w-[200px] border-r border-slate-100" title={dist}>
                          {dist}
                        </td>
                        {heatmapData.brands.map((brand) => {
                          const cell = heatmapData.matrix[dist]?.[brand];
                          const hasData = cell && cell.woiCount > 0;
                          const avgWoi = hasData ? cell.woiSum / cell.woiCount : 0;
                          
                          let bgClass = "bg-slate-50 text-slate-300";
                          let borderClass = "border-slate-100";
                          if (hasData) {
                            if (avgWoi > 24) {
                              bgClass = "bg-rose-50 text-rose-700 hover:bg-rose-100";
                              borderClass = "border-rose-100";
                            } else if (avgWoi > 12) {
                              bgClass = "bg-amber-50 text-amber-700 hover:bg-amber-100";
                              borderClass = "border-amber-100";
                            } else {
                              bgClass = "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
                              borderClass = "border-emerald-100";
                            }
                          }

                          return (
                            <td key={brand} className="p-1 text-center">
                              <div
                                className={`m-1 p-2 rounded-xl text-[10px] font-black border transition-all duration-200 cursor-help hover:scale-[1.04] hover:shadow-sm ${bgClass} ${borderClass}`}
                                title={`${dist} • ${brand}\nAverage WOI: ${hasData ? avgWoi.toFixed(2) + " Weeks" : "No Data"}`}
                              >
                                {hasData ? `${avgWoi.toFixed(1)} Wks` : "-"}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Heatmap 1 Legend */}
              <div className="mt-6 flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 text-[9px] font-black uppercase tracking-wider text-slate-400">
                <span className="mr-2">Legend:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-100 block" />
                  <span>Healthy (&lt; 12 Wks)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-50 border border-amber-100 block" />
                  <span>Warning (12 - 24 Wks)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-50 border border-rose-100 block" />
                  <span>Overstocked (&gt; 24 Wks)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-50 border border-slate-100 block" />
                  <span>N/A</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Heatmap 2: Total Stock by Distributor */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col">
          <div className="mb-6 shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Total Stock Heatmap</h3>
            </div>
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Total Stock by Distributor & Brand</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total inventory volume in items. Darker blue indicates higher stock density.</p>
          </div>

          {heatmapData.distributors.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 min-h-[220px]">
              <AlertCircle className="text-slate-300 mb-2" size={24} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No distributor data found for selected filters</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-wider text-slate-400 min-w-[160px] border-r border-slate-100">
                        Distributor / Brand
                      </th>
                      {heatmapData.brands.map((brand) => (
                        <th key={brand} className="px-3 py-3 text-center text-[9px] font-black uppercase tracking-wider text-slate-500 min-w-[100px]">
                          {brand}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.distributors.map((dist) => (
                      <tr key={dist} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-all">
                        <td className="px-4 py-3 text-left text-[10px] font-black text-slate-700 truncate max-w-[200px] border-r border-slate-100" title={dist}>
                          {dist}
                        </td>
                        {heatmapData.brands.map((brand) => {
                          const cell = heatmapData.matrix[dist]?.[brand];
                          const totalStock = cell ? cell.totalStock : 0;
                          const hasData = totalStock > 0;
                          
                          let bgClass = "bg-slate-50 text-slate-300";
                          let borderClass = "border-slate-100";
                          if (hasData) {
                            const ratio = totalStock / maxTotalStock;
                            if (ratio > 0.7) {
                              bgClass = "bg-blue-600 text-white hover:bg-blue-700";
                              borderClass = "border-blue-700";
                            } else if (ratio > 0.35) {
                              bgClass = "bg-blue-400 text-white hover:bg-blue-500";
                              borderClass = "border-blue-500";
                            } else if (ratio > 0.15) {
                              bgClass = "bg-blue-100 text-blue-800 hover:bg-blue-200";
                              borderClass = "border-blue-200";
                            } else {
                              bgClass = "bg-blue-50 text-blue-600 hover:bg-blue-100";
                              borderClass = "border-blue-100";
                            }
                          }

                          return (
                            <td key={brand} className="p-1 text-center">
                              <div
                                className={`m-1 p-2 rounded-xl text-[10px] font-black border transition-all duration-200 cursor-help hover:scale-[1.04] hover:shadow-sm ${bgClass} ${borderClass}`}
                                title={`${dist} • ${brand}\nTotal Stock: ${formatNumber(totalStock)} Items`}
                              >
                                {hasData ? formatNumber(totalStock) : "-"}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>


            </div>
          )}
        </div>
      </section>

      {/* ========================================== */}
      {/* SECTION 4: DETAILED STOCK TABLE */}
      {/* ========================================== */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 overflow-hidden" id="stock-analysis-table-section">
        <div className="p-6 bg-slate-50/40 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-5 h-1 bg-blue-600 rounded-full" />
              <h3 className="font-bold text-slate-800 text-sm">Detailed Inventory Records</h3>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider pl-8">Click on headers to sort records chronologically or by quantities</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 cursor-pointer shadow-sm outline-none hover:border-blue-500 transition-all"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-left pl-8 text-white">Product Details</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-left cursor-pointer select-none text-white hover:opacity-80" onClick={() => handleSort("brand")}>
                  <div className="flex items-center gap-1">Brand <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-left cursor-pointer select-none text-white hover:opacity-80" onClick={() => handleSort("distributor")}>
                  <div className="flex items-center gap-1">Distributor <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right cursor-pointer select-none text-white hover:opacity-80" onClick={() => handleSort("soh_qty")}>
                  <div className="flex items-center justify-end gap-1">SOH <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right cursor-pointer select-none text-white hover:opacity-80" onClick={() => handleSort("in_transit_stock_qty")}>
                  <div className="flex items-center justify-end gap-1">In Transit <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right cursor-pointer select-none text-white hover:opacity-80" onClick={() => handleSort("stock_total")}>
                  <div className="flex items-center justify-end gap-1">Total Stock <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right cursor-pointer select-none text-white hover:opacity-80" onClick={() => handleSort("avg_st_l3m")}>
                  <div className="flex items-center justify-end gap-1">Avg ST L3M <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right cursor-pointer select-none text-white hover:opacity-80" onClick={() => handleSort("woi_st_l3m")}>
                  <div className="flex items-center justify-end gap-1">WOI <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center pr-8 text-white">Risk & Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">
                    No stock inventory records matched your selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => {
                  const isDeadStock = item.death_stock_flag && item.death_stock_flag.toLowerCase().includes("dead");
                  const isHighWoi = item.remarks_woi && item.remarks_woi.toLowerCase().includes("high");
                  const isOosRisk = item.remarks_woi && item.remarks_woi.toLowerCase().includes("oos");

                  return (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 pl-8 max-w-sm">
                        <div className="font-bold text-slate-900 text-xs truncate" title={item.sku}>
                          {item.sku}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono font-bold bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100">
                            ID: {item.item_id || item.product_code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                            <Calendar size={10} /> {item.update_date}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className="text-[9px] font-black tracking-wider uppercase px-2 py-1 rounded-lg shadow-sm"
                          style={{
                            backgroundColor: `${getBrandColor(item.brand)}15`,
                            color: getBrandColor(item.brand)
                          }}
                        >
                          {item.brand}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-slate-600 truncate max-w-[180px]" title={item.distributor}>
                          {item.distributor}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-slate-700 font-mono">
                        {formatNumber(item.soh_qty)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {item.in_transit_stock_qty > 0 ? (
                          <span className="text-emerald-600 font-black flex items-center justify-end gap-1 font-mono">
                            <Truck size={10} /> {formatNumber(item.in_transit_stock_qty)}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right font-black text-blue-600 font-mono">
                        {formatNumber(item.stock_total)}
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-slate-700 font-mono">
                        {formatNumber(item.avg_st_l3m)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-black px-2.5 py-0.5 rounded-full text-[10px] ${
                            (item.woi_st_l3m || 0) > 24
                              ? "bg-rose-50 text-rose-700"
                              : (item.woi_st_l3m || 0) > 12
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {typeof item.woi_st_l3m === "number" ? item.woi_st_l3m.toFixed(2) : "0.00"} Wks
                        </span>
                      </td>

                      <td className="px-6 py-4 pr-8">
                        <div className="flex flex-col items-center gap-1">
                          {isDeadStock && (
                            <span className="bg-rose-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider block">
                              DEAD STOCK
                            </span>
                          )}
                          {isHighWoi && (
                            <span className="bg-amber-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider block">
                              HIGH WOI
                            </span>
                          )}
                          {isOosRisk && (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider block">
                              OOS RISK
                            </span>
                          )}
                          {!isDeadStock && !isHighWoi && !isOosRisk && (
                            <span className="text-[10px] font-bold text-slate-400 italic">
                              Healthy
                            </span>
                          )}
                          {item.po_remarks && (
                            <span className={`text-[8px] font-black uppercase mt-0.5 ${
                              item.po_remarks.toLowerCase().includes("stop") ? "text-rose-600" : "text-emerald-600"
                            }`}>
                              ({item.po_remarks})
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-6 bg-slate-50/40 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs font-bold text-slate-500">
              Showing page {currentPage} of {totalPages} ({processedData.length} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, index, array) => {
                  const showEllipsis = index > 0 && p - array[index - 1] > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="text-slate-400 text-xs px-1">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          currentPage === p
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 shadow-sm"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
