/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { CategoryAnalysisData } from "../types";
import { fetchCategoryAnalysisData } from "../services/api";
import { formatNumber, formatCompactIDR, formatCurrency } from "../lib/utils";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  Tag,
  ChevronLeft,
  ChevronRight,
  Database,
  ArrowUpDown,
  ShoppingBag,
  Layers,
  ChevronDown,
  Loader2
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  CLEANSER: "#10b981", // Emerald
  TONER: "#3b82f6", // Blue
  SERUM: "#8b5cf6", // Purple
  MOISTURIZER: "#ec4899", // Pink
  TREATMENT: "#f59e0b", // Amber
  SUNSCREEN: "#06b6d4", // Cyan
  DECORATIVE: "#e11d48", // Rose
  UNKNOWN: "#94a3b8" // Slate
};

const getCategoryColor = (category: string) => {
  const norm = category.toUpperCase().trim();
  return CATEGORY_COLORS[norm] || CATEGORY_COLORS.UNKNOWN;
};

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}

function MultiSelect({ label, options, selected, onChange, placeholder }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => {
    onChange([]);
  };

  const displayText = selected.length === 0
    ? `All ${placeholder}s`
    : selected.length === options.length
    ? `All ${placeholder}s`
    : selected.length <= 2
    ? selected.join(", ")
    : `${selected.length} ${placeholder}s Selected`;

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 text-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-left flex items-center justify-between cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/30 min-h-[38px]"
        >
          <span className="truncate pr-4">{displayText}</span>
          <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200/60 shadow-lg rounded-xl max-h-64 flex flex-col overflow-hidden animate-fade-in">
            {options.length > 5 && (
              <div className="p-2 border-b border-slate-100">
                <input
                  type="text"
                  placeholder="Cari..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-blue-400 font-medium text-slate-600"
                />
              </div>
            )}
            <div className="overflow-y-auto flex-1 p-1.5 space-y-0.5 max-h-48 custom-scrollbar">
              <button
                type="button"
                onClick={selectAll}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer text-left"
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                  selected.length === 0 ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300"
                }`}>
                  {selected.length === 0 && <span className="text-[9px] font-bold">✓</span>}
                </div>
                <span>All {placeholder}s</span>
              </button>
              
              {filteredOptions.map((opt) => {
                const isChecked = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleOption(opt)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer text-left"
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      isChecked ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300"
                    }`}>
                      {isChecked && <span className="text-[9px] font-bold">✓</span>}
                    </div>
                    <span className="truncate">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoryAnalysisPage() {
  const [rawData, setRawData] = useState<CategoryAnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeHeatmapTab, setActiveHeatmapTab] = useState<"sell_out" | "sell_through">("sell_out");

  // Filters State
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDistributors, setSelectedDistributors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Sorting State
  const [sortField, setSortField] = useState<keyof CategoryAnalysisData | null>("sell_out_value");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Load Data
  const loadData = async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const data = await fetchCategoryAnalysisData(force);
      setRawData(data);
    } catch (err: any) {
      console.error("Failed to load Category Analysis data:", err);
      setError(err.message || "Gagal mengambil data Category Analysis.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isDemoMode = useMemo(() => {
    return rawData.length > 0 && rawData.some((item) => item._isFallback);
  }, [rawData]);

  // Unique Filter Values calculated from rawData
  const filterOptions = useMemo(() => {
    const months = new Set<string>();
    const regions = new Set<string>();
    const distributors = new Set<string>();
    const categories = new Set<string>();

    rawData.forEach((item) => {
      const cat = (item.category || "").trim();
      const sku = (item.sku || "").trim();
      const itemId = (item.item_id || "").trim();
      const region = (item.region || "").trim();
      const month = (item.month || "").trim();
      const dist = (item.distributor_name || "").trim();

      const isUnknown = 
        cat.toLowerCase() === "unknown" || cat === "" ||
        sku.toLowerCase() === "unknown" || sku === "" ||
        itemId.toLowerCase() === "unknown" || itemId === "" ||
        region.toLowerCase() === "unknown" || region === "" ||
        month.toLowerCase() === "unknown" || month === "" ||
        dist.toLowerCase() === "unknown" || dist === "";

      if (!isUnknown) {
        if (item.month) months.add(item.month);
        if (item.region) regions.add(item.region);
        if (item.distributor_name) distributors.add(item.distributor_name);
        if (item.category) categories.add(item.category);
      }
    });

    return {
      months: Array.from(months).sort(),
      regions: Array.from(regions).sort(),
      distributors: Array.from(distributors).sort(),
      categories: Array.from(categories).sort()
    };
  }, [rawData]);

  // Handle Sort Toggle
  const handleSort = (field: keyof CategoryAnalysisData) => {
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
    // Exclude records that have empty or "Unknown" values for key fields
    let result = rawData.filter((item) => {
      const cat = (item.category || "").trim().toLowerCase();
      const sku = (item.sku || "").trim().toLowerCase();
      const itemId = (item.item_id || "").trim().toLowerCase();
      const region = (item.region || "").trim().toLowerCase();
      const month = (item.month || "").trim().toLowerCase();
      const dist = (item.distributor_name || "").trim().toLowerCase();

      const isUnknown = 
        cat === "unknown" || cat === "" ||
        sku === "unknown" || sku === "" ||
        itemId === "unknown" || itemId === "" ||
        region === "unknown" || region === "" ||
        month === "unknown" || month === "" ||
        dist === "unknown" || dist === "";

      return !isUnknown;
    });

    // 1. Dropdown Filters
    if (selectedMonths.length > 0) {
      result = result.filter((item) => item.month && selectedMonths.includes(item.month));
    }
    if (selectedRegions.length > 0) {
      result = result.filter((item) => item.region && selectedRegions.includes(item.region));
    }
    if (selectedDistributors.length > 0) {
      result = result.filter((item) => item.distributor_name && selectedDistributors.includes(item.distributor_name));
    }
    if (selectedCategories.length > 0) {
      result = result.filter((item) => item.category && selectedCategories.includes(item.category));
    }

    // 2. Text Search (filters SKU, Item ID, or Distributor)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.sku.toLowerCase().includes(q) ||
          item.item_id.toLowerCase().includes(q) ||
          item.distributor_name.toLowerCase().includes(q)
      );
    }

    // 3. Sorting
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
  }, [rawData, selectedMonths, selectedRegions, selectedDistributors, selectedCategories, searchQuery, sortField, sortDirection]);

  // Reset Filters
  const resetFilters = () => {
    setSelectedMonths([]);
    setSelectedRegions([]);
    setSelectedDistributors([]);
    setSelectedCategories([]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    let totalQty = 0;
    let totalSellOut = 0;
    let totalSellThrough = 0;
    const categoryValues: Record<string, number> = {};
    const skuValues: Record<string, { name: string; value: number }> = {};

    processedData.forEach((item) => {
      totalQty += item.total_quantity || 0;
      totalSellOut += item.sell_out_value || 0;
      totalSellThrough += item.sell_through_value || 0;

      // Category total value aggregation
      const cat = item.category || "Unknown";
      categoryValues[cat] = (categoryValues[cat] || 0) + (item.sell_out_value || 0);

      // SKU total value aggregation
      const skuId = item.item_id || item.sku;
      if (!skuValues[skuId]) {
        skuValues[skuId] = { name: item.sku, value: 0 };
      }
      skuValues[skuId].value += item.sell_out_value || 0;
    });

    // Top Category
    let topCat = "N/A";
    let maxCatVal = -1;
    Object.entries(categoryValues).forEach(([cat, val]) => {
      if (val > maxCatVal) {
        maxCatVal = val;
        topCat = cat;
      }
    });

    // Top SKU
    let topSKU = "N/A";
    let maxSKUVal = -1;
    Object.values(skuValues).forEach((item) => {
      if (item.value > maxSKUVal) {
        maxSKUVal = item.value;
        topSKU = item.name;
      }
    });

    return {
      totalQty,
      totalSellOut,
      totalSellThrough,
      topCategory: topCat,
      topSKU: topSKU.replace(/^SKINTIFIC\s+/i, "") // shorten for display
    };
  }, [processedData]);

  // Recharts: Category Sales Contribution Pie Chart Data
  const categoryChartData = useMemo(() => {
    const agg: Record<string, number> = {};
    processedData.forEach((item) => {
      const cat = item.category || "Unknown";
      agg[cat] = (agg[cat] || 0) + (item.sell_out_value || 0);
    });

    return Object.entries(agg)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [processedData]);

  // Recharts: Category Sales Contribution Pie Chart Data by Sell Through
  const categorySTChartData = useMemo(() => {
    const agg: Record<string, number> = {};
    processedData.forEach((item) => {
      const cat = item.category || "Unknown";
      agg[cat] = (agg[cat] || 0) + (item.sell_through_value || 0);
    });

    return Object.entries(agg)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [processedData]);

  // Recharts: Sell Out vs Sell Through Grouped Bar Chart
  const categorySTSOChartData = useMemo(() => {
    const agg: Record<string, { name: string; "Sell Out": number; "Sell Through": number }> = {};
    processedData.forEach((item) => {
      const cat = item.category || "Unknown";
      if (!agg[cat]) {
        agg[cat] = { name: cat, "Sell Out": 0, "Sell Through": 0 };
      }
      agg[cat]["Sell Out"] += item.sell_out_value || 0;
      agg[cat]["Sell Through"] += item.sell_through_value || 0;
    });

    return Object.values(agg).sort((a, b) => b["Sell Out"] - a["Sell Out"]);
  }, [processedData]);

  // Recharts: Top 10 Item IDs horizontal bar chart
  const topItemIDsChartData = useMemo(() => {
    const agg: Record<string, { name: string; value: number }> = {};
    processedData.forEach((item) => {
      const itemId = item.item_id || "Unknown";
      if (!agg[itemId]) {
        agg[itemId] = { name: itemId, value: 0 };
      }
      agg[itemId].value += item.sell_out_value || 0;
    });

    return Object.values(agg)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [processedData]);

  // Recharts: Top 10 Item IDs horizontal bar chart (by Sell Through Value)
  const topItemIDsSTChartData = useMemo(() => {
    const agg: Record<string, { name: string; value: number }> = {};
    processedData.forEach((item) => {
      const itemId = item.item_id || "Unknown";
      if (!agg[itemId]) {
        agg[itemId] = { name: itemId, value: 0 };
      }
      agg[itemId].value += item.sell_through_value || 0;
    });

    return Object.values(agg)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [processedData]);

  // Recharts: Trend of Sell Through vs Sell Out (historical monthly comparison)
  const trendChartData = useMemo(() => {
    const monthsMap: Record<string, { label: string; sellOut: number; sellThrough: number; sortValue: number }> = {};
    
    processedData.forEach((item) => {
      const monthStr = item.month || "Unknown";
      if (!monthsMap[monthStr]) {
        const monthsOrder = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const cleanStr = monthStr.toLowerCase().trim();
        let mIdx = -1;
        monthsOrder.forEach((m, idx) => {
          if (cleanStr.includes(m)) {
            mIdx = idx;
          }
        });
        
        let year = 2026;
        const yearMatch = cleanStr.match(/\d{2,4}/);
        if (yearMatch) {
          const yVal = parseInt(yearMatch[0]);
          if (yVal < 100) {
            year = 2000 + yVal;
          } else {
            year = yVal;
          }
        }
        const sortValue = year * 12 + (mIdx !== -1 ? mIdx : 0);

        monthsMap[monthStr] = {
          label: monthStr,
          sellOut: 0,
          sellThrough: 0,
          sortValue: sortValue
        };
      }
      monthsMap[monthStr].sellOut += (item.sell_out_value || 0);
      monthsMap[monthStr].sellThrough += (item.sell_through_value || 0);
    });

    return Object.values(monthsMap)
      .sort((a, b) => a.sortValue - b.sortValue)
      .map((m) => ({
        date: m.label,
        "Sell Out": m.sellOut,
        "Sell Through": m.sellThrough
      }));
  }, [processedData]);

  // Heatmap by Category per Region Data
  const heatmapData = useMemo(() => {
    const sellOutMatrix: Record<string, Record<string, number>> = {};
    const sellThroughMatrix: Record<string, Record<string, number>> = {};
    
    const regionsSet = new Set<string>();
    const categoriesSet = new Set<string>();
    
    processedData.forEach((item) => {
      const reg = item.region || "Unknown";
      const cat = item.category || "Unknown";
      
      regionsSet.add(reg);
      categoriesSet.add(cat);
      
      if (!sellOutMatrix[reg]) sellOutMatrix[reg] = {};
      if (!sellThroughMatrix[reg]) sellThroughMatrix[reg] = {};
      
      sellOutMatrix[reg][cat] = (sellOutMatrix[reg][cat] || 0) + (item.sell_out_value || 0);
      sellThroughMatrix[reg][cat] = (sellThroughMatrix[reg][cat] || 0) + (item.sell_through_value || 0);
    });
    
    const regions = Array.from(regionsSet).sort();
    const categories = Array.from(categoriesSet).sort();
    
    // Find maximums for scaling opacity
    let maxSellOut = 0;
    let maxSellThrough = 0;
    
    // Calculate row/column totals
    const sellOutCategoryTotals: Record<string, number> = {};
    const sellOutRegionTotals: Record<string, number> = {};
    let sellOutGrandTotal = 0;
    
    const sellThroughCategoryTotals: Record<string, number> = {};
    const sellThroughRegionTotals: Record<string, number> = {};
    let sellThroughGrandTotal = 0;
    
    regions.forEach((reg) => {
      categories.forEach((cat) => {
        const soVal = sellOutMatrix[reg]?.[cat] || 0;
        const stVal = sellThroughMatrix[reg]?.[cat] || 0;
        
        if (soVal > maxSellOut) maxSellOut = soVal;
        if (stVal > maxSellThrough) maxSellThrough = stVal;
        
        sellOutCategoryTotals[cat] = (sellOutCategoryTotals[cat] || 0) + soVal;
        sellOutRegionTotals[reg] = (sellOutRegionTotals[reg] || 0) + soVal;
        sellOutGrandTotal += soVal;
        
        sellThroughCategoryTotals[cat] = (sellThroughCategoryTotals[cat] || 0) + stVal;
        sellThroughRegionTotals[reg] = (sellThroughRegionTotals[reg] || 0) + stVal;
        sellThroughGrandTotal += stVal;
      });
    });
    
    return {
      regions,
      categories,
      sellOutMatrix,
      sellThroughMatrix,
      maxSellOut,
      maxSellThrough,
      sellOutCategoryTotals,
      sellOutRegionTotals,
      sellOutGrandTotal,
      sellThroughCategoryTotals,
      sellThroughRegionTotals,
      sellThroughGrandTotal
    };
  }, [processedData]);

  // Group and aggregate records for Master Records Table
  const aggregatedMasterData = useMemo(() => {
    const groups: Record<string, {
      region: string;
      distributor_name: string;
      item_id: string;
      sku: string;
      category: string;
      qtyST: number;
      qtySO: number;
      sell_through_value: number;
      sell_out_value: number;
    }> = {};

    processedData.forEach((item) => {
      const key = `${item.region || ""}_${item.distributor_name || ""}_${item.item_id || ""}_${item.sku || ""}_${item.category || ""}`;
      
      const isST = (item.source_of || "").toUpperCase().includes("THROUGH") || (item.source_of || "").toUpperCase() === "ST";
      const isSO = (item.source_of || "").toUpperCase().includes("OUT") || (item.source_of || "").toUpperCase() === "SO";
      
      let itemQtyST = 0;
      let itemQtySO = 0;
      if (isST) {
        itemQtyST = item.total_quantity || 0;
      } else if (isSO) {
        itemQtySO = item.total_quantity || 0;
      } else {
        if ((item.sell_through_value || 0) > 0 && (item.sell_out_value || 0) === 0) {
          itemQtyST = item.total_quantity || 0;
        } else {
          itemQtySO = item.total_quantity || 0;
        }
      }

      if (!groups[key]) {
        groups[key] = {
          region: item.region || "",
          distributor_name: item.distributor_name || "",
          item_id: item.item_id || "",
          sku: item.sku || "",
          category: item.category || "",
          qtyST: 0,
          qtySO: 0,
          sell_through_value: 0,
          sell_out_value: 0,
        };
      }

      groups[key].qtyST += itemQtyST;
      groups[key].qtySO += itemQtySO;
      groups[key].sell_through_value += item.sell_through_value || 0;
      groups[key].sell_out_value += item.sell_out_value || 0;
    });

    const list = Object.values(groups);

    // Sorting of aggregated data
    if (sortField) {
      list.sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortField === "total_quantity") {
          valA = a.qtyST + a.qtySO;
          valB = b.qtyST + b.qtySO;
        } else if (sortField === "sell_through_value" || sortField === "sell_out_value" || sortField === "region" || sortField === "distributor_name" || sortField === "item_id" || sortField === "sku" || sortField === "category") {
          valA = a[sortField as keyof typeof a];
          valB = b[sortField as keyof typeof b];
        } else {
          valA = (a as any)[sortField];
          valB = (b as any)[sortField];
        }

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

    return list;
  }, [processedData, sortField, sortDirection]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return aggregatedMasterData.slice(start, start + rowsPerPage);
  }, [aggregatedMasterData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(aggregatedMasterData.length / rowsPerPage);

  // Master Table Totals for aggregatedMasterData
  const tableTotals = useMemo(() => {
    let totalQtyST = 0;
    let totalQtySO = 0;
    let totalSellThrough = 0;
    let totalSellOut = 0;
    aggregatedMasterData.forEach((item) => {
      totalQtyST += item.qtyST;
      totalQtySO += item.qtySO;
      totalSellThrough += item.sell_through_value || 0;
      totalSellOut += item.sell_out_value || 0;
    });
    return { totalQtyST, totalQtySO, totalSellThrough, totalSellOut };
  }, [aggregatedMasterData]);

  // Excel Export
  const exportToExcel = () => {
    const headers = [
      "Region",
      "Distributor Name",
      "Item ID",
      "SKU",
      "Category",
      "Qty ST",
      "Qty SO",
      "Sell Through Value",
      "Sell Out Value"
    ];

    const rows = aggregatedMasterData.map((item) => [
      item.region || "",
      item.distributor_name || "",
      item.item_id || "",
      item.sku || "",
      item.category || "",
      item.qtyST || 0,
      item.qtySO || 0,
      item.sell_through_value || 0,
      item.sell_out_value || 0
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Category Analysis");

    XLSX.writeFile(workbook, `Category_Analysis_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white text-blue-600 gap-4">
        <Loader2 className="animate-spin w-10 h-10" />
        <div className="text-center">
          <span className="font-black tracking-[0.3em] text-xs uppercase block mb-1">YOOL-DO! SYSTEMS</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase animate-pulse">Retrieving spreadsheet category data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="category-analysis-page-root">
      {/* Upper Action Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="text-blue-600 w-6 h-6" /> Category Analysis
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Analyze sell-out distribution, SKU rankings, and category performance.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
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
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 text-rose-700 text-sm">
          <AlertCircle className="shrink-0 w-5 h-5 mt-0.5" />
          <div>
            <p className="font-bold">Error Loading Data</p>
            <p className="text-xs text-rose-600 font-medium mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {isDemoMode && (
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex flex-col md:flex-row items-start gap-4 text-amber-800 text-xs shadow-sm">
          <AlertCircle className="shrink-0 w-6 h-6 text-amber-500" />
          <div className="space-y-2">
            <h4 className="font-black uppercase tracking-wider text-amber-900 text-sm">Running in Demo Mode (Mock Data)</h4>
            <p className="text-slate-600 font-medium leading-relaxed">
              We couldn't retrieve dynamic data from your Category Analysis Google Sheets URL. This usually occurs because the Web App is not configured for public access or permissions are restricted.
            </p>
            <div className="bg-white/80 border border-amber-200/50 rounded-2xl p-4 space-y-1.5 text-[11px] text-slate-700 font-medium">
              <p className="font-bold text-slate-900 mb-1">To connect your Google Sheet:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Deploy your Google Apps Script as a <strong>Web App</strong>.</li>
                <li>Set <strong>Execute as:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">Me (your-email@gmail.com)</code>.</li>
                <li>Set <strong>Who has access:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">Anyone</code> (Crucial: otherwise Google blocks direct or proxied API connections).</li>
                <li>Verify your Sheet has a tab named <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">CATEGORY_ANALYSIS</code> containing columns such as: <em>Month, Region, Distributor Name, Item ID, SKU, Category, Total Quantity, Sell Through Value, Sell Out Value</em>.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Filters Grid */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 bg-blue-600 rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Filter size={14} /> Interactive Filters
            </h3>
          </div>
          {(selectedMonths.length > 0 || selectedRegions.length > 0 || selectedDistributors.length > 0 || selectedCategories.length > 0 || searchQuery !== "") && (
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Month Filter */}
          <MultiSelect
            label="Month"
            options={filterOptions.months}
            selected={selectedMonths}
            onChange={(selected) => {
              setSelectedMonths(selected);
              setCurrentPage(1);
            }}
            placeholder="Month"
          />

          {/* Region Filter */}
          <MultiSelect
            label="Region"
            options={filterOptions.regions}
            selected={selectedRegions}
            onChange={(selected) => {
              setSelectedRegions(selected);
              setCurrentPage(1);
            }}
            placeholder="Region"
          />

          {/* Distributor Filter */}
          <MultiSelect
            label="Distributor"
            options={filterOptions.distributors}
            selected={selectedDistributors}
            onChange={(selected) => {
              setSelectedDistributors(selected);
              setCurrentPage(1);
            }}
            placeholder="Distributor"
          />

          {/* Category Filter */}
          <MultiSelect
            label="Category"
            options={filterOptions.categories}
            selected={selectedCategories}
            onChange={(selected) => {
              setSelectedCategories(selected);
              setCurrentPage(1);
            }}
            placeholder="Category"
          />
        </div>

        {/* Search input bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari SKU, ID Barang, atau distributor..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-100 focus:border-blue-500 text-xs text-slate-800 font-medium rounded-xl pl-11 pr-4 py-3 focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {processedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
          <Database className="text-slate-300 w-12 h-12 mb-3" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">No Matching Data</h3>
          <p className="text-xs text-slate-400 max-w-sm">No records match the current filter selection. Reset filters or update the spreadsheet.</p>
        </div>
      ) : (
        <>
          {/* Section 1: Executive KPI Metrics Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* Qty Sold */}
            <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Qty Sold</span>
                <div className="flex items-baseline gap-0.5 min-w-0">
                  <span className="text-xl font-black tracking-tight truncate text-slate-900" title={formatNumber(kpis.totalQty)}>
                    {formatNumber(kpis.totalQty)}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                <span className="text-[9px] font-semibold text-slate-400">Total pieces moved</span>
              </div>
            </div>

            {/* Sell Out Value */}
            <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-emerald-500">Sell Out Value</span>
                <div className="flex items-baseline gap-0.5 min-w-0">
                  <span className="text-xl font-black tracking-tight truncate text-emerald-600" title={"Rp" + formatNumber(kpis.totalSellOut)}>
                    {formatCompactIDR(kpis.totalSellOut)}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                <span className="text-[9px] font-semibold text-slate-400">Customer revenue</span>
              </div>
            </div>

            {/* Sell Through Value */}
            <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-blue-500">Sell Through Value</span>
                <div className="flex items-baseline gap-0.5 min-w-0">
                  <span className="text-xl font-black tracking-tight truncate text-blue-600" title={"Rp" + formatNumber(kpis.totalSellThrough)}>
                    {formatCompactIDR(kpis.totalSellThrough)}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                <span className="text-[9px] font-semibold text-slate-400">Distributor movement</span>
              </div>
            </div>

            {/* Top Category */}
            <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-indigo-500">Top Category</span>
                <div className="flex items-baseline gap-0.5 min-w-0">
                  <span className="text-lg font-black tracking-tight truncate text-indigo-700" title={kpis.topCategory}>
                    {kpis.topCategory}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                  <Tag size={10} className="shrink-0" /> Market Leader
                </div>
              </div>
            </div>

            {/* Top SKU */}
            <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-pink-500">Top SKU</span>
                <div className="flex items-baseline gap-0.5 min-w-0 h-10 overflow-hidden">
                  <span className="text-xs font-black tracking-tight text-pink-700 line-clamp-2 leading-snug" title={kpis.topSKU}>
                    {kpis.topSKU}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-600">
                  <TrendingUp size={10} className="shrink-0" /> Best Seller SKU
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Interactive Charts Bento-Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Category Pie Share (Sell Out) */}
            <div className="lg:col-span-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col transition-all duration-300 hover:translate-y-[-2px]">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-1 bg-blue-600 rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Category Share (Sell Out)</h3>
                </div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Sell Out Distribution</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Product Category Share by Value</p>
              </div>

              <div className="h-64 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`Rp${formatNumber(Number(val))}`, "Value"]}
                      contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", padding: "12px" }}
                      itemStyle={{ fontSize: "11px", fontWeight: 800 }}
                      labelStyle={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Pie legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6 pt-4 border-t border-slate-50 text-[10px] font-bold">
                {categoryChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getCategoryColor(item.name) }}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="text-slate-800 shrink-0">
                      {((item.value / (kpis.totalSellOut || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Pie Share (Sell Through) */}
            <div className="lg:col-span-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col transition-all duration-300 hover:translate-y-[-2px]">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-1 bg-emerald-500 rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Category Share (Sell Through)</h3>
                </div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Sell Through Distribution</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Product Category Share by Value</p>
              </div>

              <div className="h-64 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySTChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {categorySTChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [`Rp${formatNumber(Number(val))}`, "Value"]}
                      contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", padding: "12px" }}
                      itemStyle={{ fontSize: "11px", fontWeight: 800 }}
                      labelStyle={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Pie legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6 pt-4 border-t border-slate-50 text-[10px] font-bold">
                {categorySTChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getCategoryColor(item.name) }}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="text-slate-800 shrink-0">
                      {((item.value / (kpis.totalSellThrough || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sell Out vs Sell Through grouped bar */}
            <div className="lg:col-span-12 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col transition-all duration-300 hover:translate-y-[-2px]">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-1 bg-violet-500 rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Sales Comparison</h3>
                </div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Sell Out vs Sell Through</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Category Performance Comparison</p>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categorySTSOChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={9}
                      fontWeight="bold"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip
                      formatter={(val) => [`Rp${formatNumber(Number(val))}`]}
                      contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", padding: "12px" }}
                      itemStyle={{ fontSize: "11px", fontWeight: 800 }}
                      labelStyle={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}
                    />
                    <Legend verticalAlign="top" height={36} iconSize={12} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} />
                    <Bar dataKey="Sell Out" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                    <Bar dataKey="Sell Through" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Section: Category by Region Heatmap Analysis */}
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 transition-all duration-300 hover:translate-y-[-2px]" id="category-region-heatmap-section">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-1 bg-indigo-500 rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Heatmap Analysis</h3>
                </div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Category by Region Heatmap</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Distribution matrix showing concentration of sales value per region</p>
              </div>

              {/* Tab Toggles */}
              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setActiveHeatmapTab("sell_out")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeHeatmapTab === "sell_out"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Sell Out Value
                </button>
                <button
                  onClick={() => setActiveHeatmapTab("sell_through")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeHeatmapTab === "sell_through"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Sell Through Value
                </button>
              </div>
            </div>

            {/* Heatmap Matrix Grid */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 border-r border-slate-100 min-w-[150px] font-black text-slate-800 text-xs">
                      Category \ Region
                    </th>
                    {heatmapData.regions.map((reg) => (
                      <th key={reg} className="p-4 text-center border-r border-slate-100 min-w-[120px]">
                        {reg}
                      </th>
                    ))}
                    <th className="p-4 text-center text-slate-800 font-black min-w-[120px]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium">
                  {heatmapData.categories.map((cat) => {
                    const rowTotal = activeHeatmapTab === "sell_out" 
                      ? heatmapData.sellOutCategoryTotals[cat] || 0
                      : heatmapData.sellThroughCategoryTotals[cat] || 0;

                    return (
                      <tr key={cat} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        {/* Category Name */}
                        <td className="p-4 font-bold text-slate-900 border-r border-slate-100 flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: getCategoryColor(cat) }}
                          />
                          <span>{cat}</span>
                        </td>

                        {/* Region Cells */}
                        {heatmapData.regions.map((reg) => {
                          const matrix = activeHeatmapTab === "sell_out" 
                            ? heatmapData.sellOutMatrix 
                            : heatmapData.sellThroughMatrix;
                          const maxVal = activeHeatmapTab === "sell_out"
                            ? heatmapData.maxSellOut
                            : heatmapData.maxSellThrough;

                          const val = matrix[reg]?.[cat] || 0;
                          const opacity = maxVal > 0 ? val / maxVal : 0;
                          
                          // Determine style based on selection
                          const baseColor = activeHeatmapTab === "sell_out" ? "16, 185, 129" : "59, 130, 246";
                          const backgroundColor = val > 0 ? `rgba(${baseColor}, ${0.05 + opacity * 0.8})` : "transparent";
                          const textColor = opacity > 0.45 ? "text-white" : "text-slate-800";

                          return (
                            <td 
                              key={reg} 
                              className="p-4 text-center border-r border-slate-100 transition-all duration-300 relative group"
                              style={{ backgroundColor }}
                            >
                              <div className={`font-bold transition-colors ${textColor}`}>
                                {val > 0 ? formatCompactIDR(val) : "-"}
                              </div>
                              {/* Hover Tooltip */}
                              {val > 0 && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block z-20 bg-slate-900 text-white text-[9px] font-bold py-1 px-2.5 rounded-lg shadow-xl whitespace-nowrap">
                                  {cat} - {reg}: {formatCurrency(val)}
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Row Total */}
                        <td className="p-4 text-center font-bold text-slate-900 bg-slate-50/50">
                          {rowTotal > 0 ? formatCompactIDR(rowTotal) : "-"}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Column Totals Row */}
                  <tr className="bg-slate-50/80 font-bold border-t border-slate-100 text-slate-900">
                    <td className="p-4 border-r border-slate-100 text-xs font-black uppercase text-slate-800">
                      Total
                    </td>
                    {heatmapData.regions.map((reg) => {
                      const colTotal = activeHeatmapTab === "sell_out"
                        ? heatmapData.sellOutRegionTotals[reg] || 0
                        : heatmapData.sellThroughRegionTotals[reg] || 0;
                      return (
                        <td key={reg} className="p-4 text-center border-r border-slate-100">
                          {colTotal > 0 ? formatCompactIDR(colTotal) : "-"}
                        </td>
                      );
                    })}
                    <td className="p-4 text-center font-black text-blue-600 bg-blue-50/30">
                      {formatCompactIDR(
                        activeHeatmapTab === "sell_out" 
                          ? heatmapData.sellOutGrandTotal 
                          : heatmapData.sellThroughGrandTotal
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Heatmap Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span>Color Intensity:</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Low</span>
                  <div 
                    className="w-16 h-3 rounded" 
                    style={{ 
                      background: activeHeatmapTab === "sell_out"
                        ? "linear-gradient(to right, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.85))"
                        : "linear-gradient(to right, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.85))"
                    }}
                  />
                  <span className="text-slate-500">High</span>
                </div>
              </div>
              <div className="text-slate-400 text-right">
                * Hover cell to see exact values. Row and column totals show aggregated category and regional performance.
              </div>
            </div>
          </section>

          {/* Section: Trend Analysis Line Chart */}
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 transition-all duration-300 hover:translate-y-[-2px]">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-1 bg-indigo-600 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Trend Analysis</h3>
              </div>
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Sell Through vs Sell Out Trend</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Historical monthly comparison in value</p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8"
                    fontSize={9}
                    tickLine={false} 
                    axisLine={false} 
                    padding={{ left: 30, right: 30 }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={9}
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}M`}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", padding: "12px" }}
                    itemStyle={{ fontSize: "11px", fontWeight: 800 }}
                    labelStyle={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}
                    formatter={(val: any) => [`Rp${formatNumber(Number(val))}`, ""]}
                  />
                  <Legend 
                    iconType="circle"
                    wrapperStyle={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", paddingTop: "15px" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Sell Out" 
                    stroke="#2563eb" 
                    strokeWidth={4} 
                    dot={{ r: 5, strokeWidth: 3, fill: "#fff" }} 
                    activeDot={{ r: 8, strokeWidth: 0 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Sell Through" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    dot={{ r: 5, strokeWidth: 3, fill: "#fff" }} 
                    activeDot={{ r: 8, strokeWidth: 0 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Section 3: Item ID Ranking Bar Chart (Sell Through) */}
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 transition-all duration-300 hover:translate-y-[-2px]">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-1 bg-emerald-500 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Item ID Rankings (Sell Through)</h3>
              </div>
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Top 10 Item IDs</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Item IDs by Distributor Purchase Value (Sell Through)</p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItemIDsSTChartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="6 6" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={9}
                    tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}M`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#475569"
                    fontSize={10}
                    fontWeight="bold"
                    width={100}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => [`Rp${formatNumber(Number(val))}`, "Sell Through"]}
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", padding: "12px" }}
                    itemStyle={{ fontSize: "11px", fontWeight: 800 }}
                    labelStyle={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Section 3.5: Item ID Ranking Bar Chart (Sell Out) */}
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 transition-all duration-300 hover:translate-y-[-2px]">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-1 bg-pink-500 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Item ID Rankings (Sell Out)</h3>
              </div>
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Top 10 Item IDs</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Item IDs by Customer Sales Value (Sell Out)</p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItemIDsChartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="6 6" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    stroke="#94a3b8"
                    fontSize={9}
                    tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}M`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#475569"
                    fontSize={10}
                    fontWeight="bold"
                    width={100}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => [`Rp${formatNumber(Number(val))}`, "Sales"]}
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", padding: "12px" }}
                    itemStyle={{ fontSize: "11px", fontWeight: 800 }}
                    labelStyle={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}
                  />
                  <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Section 4: Paginated Master Data Table */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 overflow-hidden mt-8">
            <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-1 bg-blue-600 rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Master Records</h3>
                </div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Spreadsheet Raw Data</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  ({aggregatedMasterData.length} total records) • Click headers to sort
                </p>
              </div>

              {/* Rows Per Page dropdown */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <span>Show:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-black text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 rows</option>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="p-4 pl-6 cursor-pointer hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest text-white" onClick={() => handleSort("region")}>
                      <span className="flex items-center gap-1">Region <ArrowUpDown size={10} /></span>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest text-white" onClick={() => handleSort("distributor_name")}>
                      <span className="flex items-center gap-1">Distributor <ArrowUpDown size={10} /></span>
                    </th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white">Item ID</th>
                    <th className="p-4 cursor-pointer hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest text-white" onClick={() => handleSort("sku")}>
                      <span className="flex items-center gap-1">SKU <ArrowUpDown size={10} /></span>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest text-white" onClick={() => handleSort("category")}>
                      <span className="flex items-center gap-1">Category <ArrowUpDown size={10} /></span>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest text-white text-right" onClick={() => handleSort("total_quantity")}>
                      <span className="flex items-center gap-1 justify-end">Qty ST <ArrowUpDown size={10} /></span>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest text-white text-right" onClick={() => handleSort("total_quantity")}>
                      <span className="flex items-center gap-1 justify-end">Qty SO <ArrowUpDown size={10} /></span>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest text-white text-right" onClick={() => handleSort("sell_through_value")}>
                      <span className="flex items-center gap-1 justify-end">Sell Through <ArrowUpDown size={10} /></span>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest text-white text-right pr-6" onClick={() => handleSort("sell_out_value")}>
                      <span className="flex items-center gap-1 justify-end">Sell Out <ArrowUpDown size={10} /></span>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                  {paginatedData.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 text-slate-500 font-medium">{item.region}</td>
                      <td className="p-4 text-slate-500 font-medium truncate max-w-[180px]" title={item.distributor_name}>
                        {item.distributor_name}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-slate-400">{item.item_id}</td>
                      <td className="p-4 text-slate-900 font-bold">{item.sku}</td>
                      <td className="p-4">
                        <span
                          className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full text-white"
                          style={{ backgroundColor: getCategoryColor(item.category) }}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800">
                        {item.qtyST > 0 ? formatNumber(item.qtyST) : "-"}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800">
                        {item.qtySO > 0 ? formatNumber(item.qtySO) : "-"}
                      </td>
                      <td className="p-4 text-right font-mono text-blue-600">Rp{formatNumber(item.sell_through_value)}</td>
                      <td className="p-4 text-right font-mono text-emerald-600 pr-6">Rp{formatNumber(item.sell_out_value)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-200">
                    <td colSpan={5} className="p-4 pl-6 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      SUM TOTALS
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800 text-xs">
                      {formatNumber(tableTotals.totalQtyST)}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800 text-xs">
                      {formatNumber(tableTotals.totalQtySO)}
                    </td>
                    <td className="p-4 text-right font-mono text-blue-700 text-xs">
                      Rp{formatNumber(tableTotals.totalSellThrough)}
                    </td>
                    <td className="p-4 text-right font-mono text-emerald-700 text-xs pr-6">
                      Rp{formatNumber(tableTotals.totalSellOut)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-xs font-bold text-slate-500">
                  Showing page {currentPage} of {totalPages} ({processedData.length} records)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Render page numbers intelligently */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, index, array) => {
                      const showEllipsis = index > 0 && p - array[index - 1] > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <span className="text-slate-400 text-xs px-1">...</span>}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                    className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
