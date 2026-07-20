/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Building, 
  User, 
  Tag, 
  Sparkles, 
  Code, 
  CheckCircle2, 
  XCircle, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter, 
  RefreshCw, 
  HelpCircle, 
  FileSpreadsheet,
  TrendingUp,
  Award,
  Store,
  Target,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { fetchSKUFocusStoreData, fetchSKUFocusSPVData } from "../services/api";
import { SKUFocusStoreData, SKUFocusSPVData } from "../types";
import { formatNumber, cn } from "../lib/utils";

export default function SKUFocusPage() {
  const [activeTab, setActiveTab] = useState<"store" | "spv">("store");
  const [storeData, setStoreData] = useState<SKUFocusStoreData[]>([]);
  const [spvData, setSpvData] = useState<SKUFocusSPVData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedDistributor, setSelectedDistributor] = useState("All");
  const [selectedSPV, setSelectedSPV] = useState("All");
  const [selectedSKU, setSelectedSKU] = useState("All");
  const [selectedEligibility, setSelectedEligibility] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100); // 100 rows per page default as requested!

  // Sort State
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Apps Script Guide Modal State
  const [showGuide, setShowGuide] = useState(false);

  // Reset pagination on tab or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedRegion, selectedDistributor, selectedSPV, selectedSKU, selectedEligibility, searchQuery]);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const [storeRes, spvRes] = await Promise.all([
        fetchSKUFocusStoreData(force),
        fetchSKUFocusSPVData(force)
      ]);
      setStoreData(storeRes);
      setSpvData(spvRes);
    } catch (err: any) {
      console.log("Error loading SKU Focus Data:", err);
      if (err.message && err.message.startsWith("LIBRARY_URL_DETECTED:")) {
        setError(err.message.replace("LIBRARY_URL_DETECTED: ", ""));
      } else {
        setError("Failed to fetch SKU Focus data. Please check your network connection or try sync now.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualSync = async () => {
    setRefreshing(true);
    try {
      await loadData(true);
    } finally {
      setRefreshing(false);
    }
  };

  // Check if current dataset is fallback
  const isFallbackActive = useMemo(() => {
    if (activeTab === "store") {
      return storeData.some(item => item._isFallback);
    } else {
      return spvData.some(item => item._isFallback);
    }
  }, [storeData, spvData, activeTab]);

  // Extract unique filter choices based on entire dataset to populate select boxes
  const filterOptions = useMemo(() => {
    const regions = new Set<string>();
    const distributors = new Set<string>();
    const spvs = new Set<string>();
    const skus = new Set<string>();

    storeData.forEach(d => {
      if (d.region) regions.add(d.region);
      if (d.distributor_name) distributors.add(d.distributor_name);
      if (d.spv) spvs.add(d.spv);
      if (d.sku) skus.add(d.sku);
    });

    spvData.forEach(d => {
      if (d.region) regions.add(d.region);
      if (d.distributor_name) distributors.add(d.distributor_name);
      if (d.spv) spvs.add(d.spv);
      if (d.sku) skus.add(d.sku);
    });

    return {
      regions: Array.from(regions).sort(),
      distributors: Array.from(distributors).sort(),
      spvs: Array.from(spvs).sort(),
      skus: Array.from(skus).sort()
    };
  }, [storeData, spvData]);

  // Handle Header Click for Sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to desc for numeric, can change depending on type
    }
  };

  // Filter & Sort Store Achievement Data
  const processedStoreData = useMemo(() => {
    if (activeTab !== "store") return [];

    let result = [...storeData];

    // Fuzzy text search (stores, ASMs, SEs, SKU names, Cust ID)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        (d.cust_name && d.cust_name.toLowerCase().includes(q)) ||
        (d.cust_id && d.cust_id.toLowerCase().includes(q)) ||
        (d.sku && d.sku.toLowerCase().includes(q)) ||
        (d.spv && d.spv.toLowerCase().includes(q)) ||
        (d.asm && d.asm.toLowerCase().includes(q)) ||
        (d.distributor_se && d.distributor_se.toLowerCase().includes(q))
      );
    }

    // Dropdown filters
    if (selectedRegion !== "All") {
      result = result.filter(d => d.region === selectedRegion);
    }
    if (selectedDistributor !== "All") {
      result = result.filter(d => d.distributor_name === selectedDistributor);
    }
    if (selectedSPV !== "All") {
      result = result.filter(d => d.spv === selectedSPV);
    }
    if (selectedSKU !== "All") {
      result = result.filter(d => d.sku === selectedSKU);
    }
    if (selectedEligibility !== "All") {
      result = result.filter(d => d.eligibility === selectedEligibility);
    }

    // Sort execution
    if (sortField) {
      result.sort((a: any, b: any) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [storeData, activeTab, searchQuery, selectedRegion, selectedDistributor, selectedSPV, selectedSKU, selectedEligibility, sortField, sortDirection]);

  // Filter & Sort SPV Achievement Data
  const processedSpvData = useMemo(() => {
    if (activeTab !== "spv") return [];

    let result = [...spvData];

    // Fuzzy text search (distributors, SPVs, ASMs, SKU)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        (d.spv && d.spv.toLowerCase().includes(q)) ||
        (d.sku && d.sku.toLowerCase().includes(q)) ||
        (d.asm && d.asm.toLowerCase().includes(q)) ||
        (d.distributor_name && d.distributor_name.toLowerCase().includes(q)) ||
        (d.distributor_se && d.distributor_se.toLowerCase().includes(q))
      );
    }

    // Dropdown filters
    if (selectedRegion !== "All") {
      result = result.filter(d => d.region === selectedRegion);
    }
    if (selectedDistributor !== "All") {
      result = result.filter(d => d.distributor_name === selectedDistributor);
    }
    if (selectedSPV !== "All") {
      result = result.filter(d => d.spv === selectedSPV);
    }
    if (selectedSKU !== "All") {
      result = result.filter(d => d.sku === selectedSKU);
    }

    // Sort execution
    if (sortField) {
      result.sort((a: any, b: any) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [spvData, activeTab, searchQuery, selectedRegion, selectedDistributor, selectedSPV, selectedSKU, sortField, sortDirection]);

  // Calculate Metrics based on filtered data subset
  const metrics = useMemo(() => {
    if (activeTab === "store") {
      let totalQty = 0;
      let totalST = 0;
      let eligibleST = 0;
      let eligibleCount = 0;

      processedStoreData.forEach(d => {
        totalQty += d.qty || 0;
        totalST += d.st || 0;
        eligibleST += d.eligible_st || 0;
        if (d.eligibility === "Eligible" || d.eligibility === "Yes") {
          eligibleCount++;
        }
      });

      const eligibilityRate = processedStoreData.length > 0
        ? Math.round((eligibleCount / processedStoreData.length) * 100)
        : 0;

      return {
        totalQty,
        totalST,
        eligibleST,
        eligibilityRate,
        totalRecords: processedStoreData.length
      };
    } else {
      let totalTargetST = 0;
      let totalSTEligible = 0;
      let totalAO = 0;
      let totalTargetAO = 0;

      processedSpvData.forEach(d => {
        totalTargetST += d.target_st || 0;
        totalSTEligible += d.st_eligible || 0;
        totalAO += d.ao || 0;
        totalTargetAO += d.target_ao || 0;
      });

      const stAchRate = totalTargetST > 0
        ? Math.round((totalSTEligible / totalTargetST) * 100)
        : 0;

      const aoAchRate = totalTargetAO > 0
        ? Math.round((totalAO / totalTargetAO) * 100)
        : 0;

      return {
        totalTargetST,
        totalSTEligible,
        stAchRate,
        totalAO,
        totalTargetAO,
        aoAchRate,
        totalRecords: processedSpvData.length
      };
    }
  }, [activeTab, processedStoreData, processedSpvData]);

  // Pagination Slice
  const paginatedStoreData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedStoreData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedStoreData, currentPage, rowsPerPage]);

  const paginatedSpvData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedSpvData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedSpvData, currentPage, rowsPerPage]);

  const totalPages = useMemo(() => {
    const totalRecords = activeTab === "store" ? processedStoreData.length : processedSpvData.length;
    return Math.max(1, Math.ceil(totalRecords / rowsPerPage));
  }, [activeTab, processedStoreData, processedSpvData, rowsPerPage]);

  const appsScriptCode = `/**
 * Google Apps Script Web App for SKU Focus Module ("SKT Product Focus Jun Kal")
 * Deploy as Web App:
 * - Execute as: Me
 * - Who has access: Anyone
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = e.parameter.sheet || "Store Ach";
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Sheet '" + sheetName + "' not found. Available sheets: " + ss.getSheets().map(function(s) { return s.getName(); }).join(", ")
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  
  var result = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, idx) {
      obj[header] = row[idx];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  return (
    <div id="sku-focus-container" className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          {isFallbackActive && (
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest text-amber-800 bg-amber-100 uppercase animate-pulse">
                Demo Mode
              </span>
            </div>
          )}
          <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-1 flex items-center gap-3">
            <Target className="text-blue-800" size={32} /> SKU Focus
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            Dedicated SKU focus performance from spreadsheet &ldquo;SKT Product Focus Jun Kal&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={handleManualSync}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-blue-800 hover:bg-blue-900 text-white shadow-md hover:shadow-lg transition-all"
          >
            <RefreshCw size={14} className={cn(refreshing && "animate-spin")} />
            {refreshing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </div>

      {/* Demo state banner */}
      {isFallbackActive && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Menggunakan Data Simulasi</h4>
              <p className="text-xs text-slate-500 font-medium">Tersedia Google Apps Script terpisah untuk menghubungkan dashboard dengan spreadsheet Anda secara real-time.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowGuide(true)}
            className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-xl transition-all self-stretch sm:self-auto text-center"
          >
            Hubungkan Spreadsheet
          </button>
        </motion.div>
      )}

      {/* Tab Selector */}
      <div className="flex border-b border-slate-100 gap-2">
        <button
          onClick={() => {
            setActiveTab("store");
            setSortField("");
          }}
          className={cn(
            "px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === "store" 
              ? "border-blue-800 text-blue-800 font-black" 
              : "border-transparent text-slate-400 hover:text-slate-600 font-bold"
          )}
        >
          <Store size={14} /> Store Achievement (Store Ach)
        </button>
        <button
          onClick={() => {
            setActiveTab("spv");
            setSortField("");
          }}
          className={cn(
            "px-6 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === "spv" 
              ? "border-blue-800 text-blue-800 font-black" 
              : "border-transparent text-slate-400 hover:text-slate-600 font-bold"
          )}
        >
          <Award size={14} /> SPV Achievement (SPV Ach)
        </button>
      </div>

      {/* Metrics Cards depending on Active Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "store" ? (
          <motion.section 
            key="store-metrics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Qty Focus</div>
              <div className="text-3xl font-black text-slate-900">{formatNumber(metrics.totalQty || 0)}</div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">Total unit dari {metrics.totalRecords} baris terfilter</div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Sell Through (ST)</div>
              <div className="text-3xl font-black text-slate-900">Rp {formatNumber(metrics.totalST || 0)}</div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">Akumulasi nilai sales (ST) kotor</div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Eligible Sell Through</div>
              <div className="text-3xl font-black text-blue-800">Rp {formatNumber(metrics.eligibleST || 0)}</div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">Hanya mencakup outlet yang Eligible</div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Store Eligibility Rate</div>
              <div className="text-3xl font-black text-emerald-600">{metrics.eligibilityRate}%</div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">Persentase outlet berstatus Eligible</div>
            </div>
          </motion.section>
        ) : (
          <motion.section 
            key="spv-metrics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Target ST</div>
              <div className="text-3xl font-black text-slate-900">Rp {formatNumber((metrics as any).totalTargetST || 0)}</div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">Kumulatif target yang dibebankan</div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total ST Eligible Achieved</div>
              <div className="text-3xl font-black text-blue-800">Rp {formatNumber((metrics as any).totalSTEligible || 0)}</div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">Kumulatif ST Eligible yang diraih</div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ST Target Achievement</div>
              <div className={cn(
                "text-3xl font-black",
                (metrics as any).stAchRate >= 100 ? "text-emerald-600" : (metrics as any).stAchRate >= 80 ? "text-amber-500" : "text-rose-500"
              )}>
                {(metrics as any).stAchRate}%
              </div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">Rasio pencapaian ST Eligible vs Target</div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Outlet (AO) vs Target</div>
              <div className="text-3xl font-black text-slate-900">
                {formatNumber((metrics as any).totalAO || 0)} / {formatNumber((metrics as any).totalTargetAO || 0)}
              </div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">Pencapaian Active Outlet ({(metrics as any).aoAchRate}%)</div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* FILTER BAR PANEL */}
      <section className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-blue-800" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Filter Data SKU Focus</h3>
          </div>
          <button 
            onClick={() => {
              setSearchQuery("");
              setSelectedRegion("All");
              setSelectedDistributor("All");
              setSelectedSPV("All");
              setSelectedSKU("All");
              setSelectedEligibility("All");
            }}
            className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-blue-800 hover:underline self-end lg:self-auto"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Fuzzy Search */}
          <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search store, SPV, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800 shadow-sm"
            />
          </div>

          {/* Region Dropdown */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800 shadow-sm appearance-none cursor-pointer"
            >
              <option value="All">All Regions</option>
              {filterOptions.regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Distributor Dropdown */}
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              value={selectedDistributor}
              onChange={(e) => setSelectedDistributor(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800 shadow-sm appearance-none cursor-pointer"
            >
              <option value="All">All Distributors</option>
              {filterOptions.distributors.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* SPV Dropdown */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              value={selectedSPV}
              onChange={(e) => setSelectedSPV(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800 shadow-sm appearance-none cursor-pointer"
            >
              <option value="All">All Supervisors (SPV)</option>
              {filterOptions.spvs.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Eligibility Filter (Only for Store Achievement) or SKU */}
          {activeTab === "store" ? (
            <div className="relative">
              <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select
                value={selectedEligibility}
                onChange={(e) => setSelectedEligibility(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800 shadow-sm appearance-none cursor-pointer"
              >
                <option value="All">All Eligibility</option>
                <option value="Eligible">Eligible</option>
                <option value="Not Eligible">Not Eligible</option>
              </select>
            </div>
          ) : (
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select
                value={selectedSKU}
                onChange={(e) => setSelectedSKU(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800 shadow-sm appearance-none cursor-pointer"
              >
                <option value="All">All SKUs</option>
                {filterOptions.skus.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {activeTab === "store" && (
          <div className="flex md:items-center justify-between gap-4 pt-1 flex-col md:flex-row">
            <div className="relative w-full md:w-64">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <select
                value={selectedSKU}
                onChange={(e) => setSelectedSKU(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800 shadow-sm appearance-none cursor-pointer"
              >
                <option value="All">All SKUs</option>
                {filterOptions.skus.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Menampilkan {metrics.totalRecords} Toko / Outlet
            </div>
          </div>
        )}
      </section>

      {/* Main Table Segment */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-blue-600 gap-4">
            <Loader2 className="animate-spin w-10 h-10" />
            <div className="text-center">
              <span className="font-black tracking-[0.3em] text-xs uppercase block mb-1">YOOL-DO! SYSTEMS</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase animate-pulse">Loading SKU Focus Records...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 p-6 text-center">
            <XCircle className="text-rose-500 mb-3" size={32} />
            <h4 className="text-md font-black text-slate-900 mb-1">Gagal Memuat Data</h4>
            <p className="text-slate-500 text-xs max-w-sm mb-4">{error}</p>
            <button onClick={() => loadData(true)} className="text-xs font-black uppercase tracking-wider text-white bg-blue-800 hover:bg-blue-900 px-5 py-2.5 rounded-xl transition-all">
              Coba Lagi
            </button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              {activeTab === "store" ? (
                /* STORE ACHIEVEMENT TABLE */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      <th onClick={() => handleSort("region")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-1.5">Region <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("distributor_name")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-1.5">Distributor <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("cust_id")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-1.5">Cust ID <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("cust_name")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-1.5">Cust Name <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("spv")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-1.5">SPV <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("distributor_se")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-1.5">SE <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("sku")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-1.5">SKU <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("qty")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all text-right">
                        <div className="flex items-center gap-1.5 justify-end">Qty <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("st")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all text-right">
                        <div className="flex items-center gap-1.5 justify-end">Total ST <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("eligible_st")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all text-right">
                        <div className="flex items-center gap-1.5 justify-end">Eligible ST <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("eligibility")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all text-center">
                        <div className="flex items-center gap-1.5 justify-center">Eligibility <ArrowUpDown size={10} /></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStoreData.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400 font-bold text-xs">
                          No matching Store Achievement records found.
                        </td>
                      </tr>
                    ) : (
                      paginatedStoreData.map((row, idx) => {
                        const isEligible = row.eligibility === "Eligible" || row.eligibility === "Yes";
                        return (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all text-xs font-semibold text-slate-700">
                            <td className="py-3 px-6 text-slate-400 font-bold uppercase text-[10px] tracking-wide">{row.region}</td>
                            <td className="py-3 px-6 max-w-[140px] truncate">{row.distributor_name}</td>
                            <td className="py-3 px-6 font-mono text-slate-400 text-[10px]">{row.cust_id}</td>
                            <td className="py-3 px-6 font-bold text-slate-900">{row.cust_name}</td>
                            <td className="py-3 px-6 text-slate-600">{row.spv}</td>
                            <td className="py-3 px-6 text-slate-500">{row.distributor_se}</td>
                            <td className="py-3 px-6 text-slate-900 max-w-[180px] truncate">{row.sku}</td>
                            <td className="py-3 px-6 text-right font-mono font-bold">{row.qty}</td>
                            <td className="py-3 px-6 text-right font-mono text-slate-900">Rp {formatNumber(row.st)}</td>
                            <td className="py-3 px-6 text-right font-mono text-blue-800 font-bold">Rp {formatNumber(row.eligible_st)}</td>
                            <td className="py-3 px-6 text-center">
                              <span className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                isEligible 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                  : "bg-rose-50 text-rose-700 border-rose-100"
                              )}>
                                {row.eligibility}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                /* SPV ACHIEVEMENT TABLE */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      <th onClick={() => handleSort("region")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-1.5">Region <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("distributor_name")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-1.5">Distributor <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("asm")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-1.5">ASM <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("spv")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-1.5">SPV <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("distributor_se")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-1.5">SE <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("sku")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all">
                        <div className="flex items-center gap-1.5">SKU <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("target_st")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all text-right">
                        <div className="flex items-center gap-1.5 justify-end">Target ST <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("st_eligible")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all text-right">
                        <div className="flex items-center gap-1.5 justify-end">ST Eligible <ArrowUpDown size={10} /></div>
                      </th>
                      <th className="py-4 px-6 text-center">ST Ach %</th>
                      <th onClick={() => handleSort("ao")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all text-right">
                        <div className="flex items-center gap-1.5 justify-end">AO <ArrowUpDown size={10} /></div>
                      </th>
                      <th onClick={() => handleSort("target_ao")} className="py-4 px-6 cursor-pointer hover:bg-slate-100 transition-all text-right">
                        <div className="flex items-center gap-1.5 justify-end">Target AO <ArrowUpDown size={10} /></div>
                      </th>
                      <th className="py-4 px-6 text-center">AO Ach %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSpvData.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-12 text-center text-slate-400 font-bold text-xs">
                          No matching SPV Achievement records found.
                        </td>
                      </tr>
                    ) : (
                      paginatedSpvData.map((row, idx) => {
                        const stAchPercent = row.target_st > 0 ? Math.round((row.st_eligible / row.target_st) * 100) : 0;
                        const aoAchPercent = row.target_ao > 0 ? Math.round((row.ao / row.target_ao) * 100) : 0;

                        return (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all text-xs font-semibold text-slate-700">
                            <td className="py-3 px-6 text-slate-400 font-bold uppercase text-[10px] tracking-wide">{row.region}</td>
                            <td className="py-3 px-6 truncate max-w-[130px]">{row.distributor_name}</td>
                            <td className="py-3 px-6 text-slate-500">{row.asm}</td>
                            <td className="py-3 px-6 text-slate-900 font-bold">{row.spv}</td>
                            <td className="py-3 px-6 text-slate-500">{row.distributor_se}</td>
                            <td className="py-3 px-6 font-bold text-slate-900 max-w-[160px] truncate">{row.sku}</td>
                            <td className="py-3 px-6 text-right font-mono">Rp {formatNumber(row.target_st)}</td>
                            <td className="py-3 px-6 text-right font-mono font-bold text-blue-800">Rp {formatNumber(row.st_eligible)}</td>
                            <td className="py-3 px-6 text-center">
                              <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black border",
                                stAchPercent >= 100 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                  : stAchPercent >= 85 
                                  ? "bg-amber-50 text-amber-700 border-amber-100" 
                                  : "bg-rose-50 text-rose-700 border-rose-100"
                              )}>
                                {stAchPercent}%
                              </span>
                            </td>
                            <td className="py-3 px-6 text-right font-mono font-bold">{row.ao}</td>
                            <td className="py-3 px-6 text-right font-mono text-slate-400">{row.target_ao}</td>
                            <td className="py-3 px-6 text-center">
                              <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black border",
                                aoAchPercent >= 100 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                  : aoAchPercent >= 80 
                                  ? "bg-amber-50 text-amber-700 border-amber-100" 
                                  : "bg-rose-50 text-rose-700 border-rose-100"
                              )}>
                                {aoAchPercent}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination & Rows-Per-Page Control bar */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-semibold">Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-800"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-xs text-slate-400 font-medium">
                  Showing {Math.min(activeTab === "store" ? processedStoreData.length : processedSpvData.length, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(activeTab === "store" ? processedStoreData.length : processedSpvData.length, currentPage * rowsPerPage)} of {activeTab === "store" ? processedStoreData.length : processedSpvData.length} entries
                </span>
              </div>

              {/* Prev/Next buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-black text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SETUP GUIDE MODAL DRAWER */}
      <AnimatePresence>
        {showGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 bg-blue-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={24} />
                  <div>
                    <h3 className="font-black text-lg">Google Apps Script Setup</h3>
                    <p className="text-blue-200 text-xs font-medium">Hubungkan Spreadsheet &ldquo;SKT Product Focus Jun Kal&rdquo;</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowGuide(false)}
                  className="text-white hover:bg-white/10 p-2 rounded-full transition-all"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto text-sm text-slate-600 flex-1">
                <p className="font-medium text-slate-800">
                  Modul ini dirancang agar **berdiri sendiri (modular)** dan menggunakan script terpisah. Ikuti langkah mudah berikut untuk menghubungkan spreadsheet Anda:
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black shrink-0">1</div>
                    <p className="font-semibold text-slate-800">Buka Spreadsheet &ldquo;SKT Product Focus Jun Kal&rdquo;</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black shrink-0">2</div>
                    <p className="font-semibold text-slate-800">Pilih menu **Extensions &gt; Apps Script**</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black shrink-0">3</div>
                    <p className="font-semibold text-slate-800">Salin kodenya di bawah ini dan paste pada editor Apps Script:</p>
                  </div>
                </div>

                <div className="relative pt-2 bg-slate-900 rounded-2xl border border-slate-800 text-slate-200 p-4 font-mono text-xs overflow-x-auto max-h-[220px]">
                  <pre>{appsScriptCode}</pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(appsScriptCode);
                      alert("Apps Script code copied to clipboard!");
                    }}
                    className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider text-[9px] px-3 py-1.5 rounded-lg transition-all"
                  >
                    Copy Code
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black shrink-0">4</div>
                    <p className="font-semibold text-slate-800">
                      Klik tombol **Deploy &gt; New Deployment**
                    </p>
                  </div>
                  <div className="flex gap-3 pl-9">
                    <p className="text-xs text-slate-500 font-medium">
                      Atur konfigurasi: 
                      <br />• Select type: **Web App**
                      <br />• Execute as: **Me (email Anda)**
                      <br />• Who has access: **Anyone**
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black shrink-0">5</div>
                    <p className="font-semibold text-slate-800">
                      Copy **Web App URL** yang dihasilkan, lalu masukkan ke dalam secrets di Dashboard Anda dengan nama: <br />
                      <code className="text-xs font-black bg-slate-100 px-2 py-1 rounded text-blue-800 font-mono">SKU_FOCUS_SCRIPT_URL</code> atau <code className="text-xs font-black bg-slate-100 px-2 py-1 rounded text-blue-800 font-mono">VITE_SKU_FOCUS_SCRIPT_URL</code>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowGuide(false)}
                  className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-blue-800 hover:bg-blue-900 transition-all shadow-md"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
