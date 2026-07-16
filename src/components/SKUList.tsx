/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { SKU_DATABASE, SKUData } from "../services/skuData";
import { 
  Search, 
  Package, 
  Tag, 
  TrendingUp, 
  Info, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Download,
  Activity,
  Coins,
  Store,
  X,
  Database,
  RefreshCw,
  Check,
  AlertCircle,
  Copy,
  Code,
  FileSpreadsheet,
  Loader2
} from "lucide-react";
import { motion } from "motion/react";

// Robust brand string normalization to merge variations like "SKINTIFIC", "skintific", "Skintific" and case variations
export function normalizeBrand(brandStr: string | undefined | null): string {
  if (!brandStr) return "Skintific";
  const trimmed = brandStr.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "skintific") return "Skintific";
  if (lower === "glad2glow") return "Glad2Glow";
  // Fallback to capitalizing each word properly
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function parseIndonesianPrice(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  const str = String(val).trim();
  if (!str) return 0;

  let cleaned = str.replace(/[Rr]p|\s/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
  } else if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    if (parts[1] && parts[1].length === 2) {
      cleaned = cleaned.replace(/,/g, ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(".")) {
    const parts = cleaned.split(".");
    if (parts[parts.length - 1].length === 3) {
      cleaned = cleaned.replace(/\./g, "");
    }
  }
  cleaned = cleaned.replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

// Robust Fuzzy Mapping Engine to translate any Google Spreadsheet / Apps Script headers back to standard catalog fields
function mapFuzzyItem(item: any): SKUData {
  if (!item) return {
    status: "Active",
    productCode: "",
    descriptionProduct: "Unnamed Product",
    brand: "Skintific",
    assortment: "Other SKU",
    category: "Skincare",
    segment: "Face",
    subsegment: "Serum",
    priceSIP: 0,
    priceSTP: 0,
    priceSRP: 0
  };

  const keys = Object.keys(item);
  let status = "Active";
  let productCode = "";
  let descriptionProduct = "";
  let brand = "";
  let assortment = "Other SKU";
  let category = "Skincare";
  let segment = "Face";
  let subsegment = "Serum";
  let priceSIP = 0;
  let priceSTP = 0;
  let priceSRP = 0;

  for (const rawKey of keys) {
    const key = rawKey.toLowerCase().replace(/[\s_-]+/g, "");
    const val = item[rawKey];

    if (key.includes("status")) {
      status = val ? String(val).trim() : "Active";
    } else if (
      key.includes("productcode") || 
      key.includes("skucode") || 
      key.includes("barcode") || 
      key.includes("sku") || 
      key.includes("kode") || 
      key === "code" ||
      key === "no"
    ) {
      if (val !== undefined && val !== null) {
        productCode = String(val).trim();
      }
    } else if (
      key.includes("description") || 
      key.includes("desc") || 
      key.includes("productname") || 
      key.includes("name") || 
      key.includes("nama") || 
      key === "product" || 
      key === "item" || 
      key === "barang"
    ) {
      descriptionProduct = val ? String(val).trim() : "";
    } else if (key.includes("brand") || key.includes("merk")) {
      brand = val ? String(val).trim() : "";
    } else if (key.includes("assort") || key.includes("paket")) {
      assortment = val ? String(val).trim() : "Other SKU";
    } else if (key.includes("category") || key.includes("kategori")) {
      category = val ? String(val).trim() : "Skincare";
    } else if (key.includes("subsegment") || key.includes("sub_segment") || key.includes("sub-segment")) {
      subsegment = val ? String(val).trim() : "Serum";
    } else if (key.includes("segment") && !key.includes("sub")) {
      segment = val ? String(val).trim() : "Face";
    } else if (
      key.includes("pricesip") || 
      key.includes("sip") || 
      key.includes("distri") || 
      key.includes("hargasip") || 
      key.includes("distrib")
    ) {
      priceSIP = parseIndonesianPrice(val);
    } else if (
      key.includes("pricestp") || 
      key.includes("stp") || 
      key.includes("store") || 
      key.includes("hargastp") || 
      key.includes("toko")
    ) {
      priceSTP = parseIndonesianPrice(val);
    } else if (
      key.includes("pricesrp") || 
      key.includes("srp") || 
      key.includes("retail") || 
      key.includes("hargasrp") || 
      key.includes("priceforretail")
    ) {
      priceSRP = parseIndonesianPrice(val);
    }
  }

  // Fallback to explicit keys if fuzzy mapping didn't set values
  const finalCode = productCode || item.productCode || item.sku || item.code || "";
  const finalDesc = descriptionProduct || item.descriptionProduct || item.name || item.product || "Unnamed Product";

  return {
    status: status || "Active",
    productCode: finalCode,
    descriptionProduct: finalDesc,
    brand: normalizeBrand(brand),
    assortment: assortment || "Other SKU",
    category: category || "Skincare",
    segment: segment || "Face",
    subsegment: subsegment || "Serum",
    priceSIP: priceSIP || Number(item.priceSIP) || 0,
    priceSTP: priceSTP || Number(item.priceSTP) || 0,
    priceSRP: priceSRP || Number(item.priceSRP) || 0,
  };
}

// Convert JSON body containing a 2D Array, Array of Objects, or custom envelope into standard SKUData list
function parseJSONDataToSKUList(json: any): SKUData[] {
  if (!json) return [];
  
  let rawRecords: any[] = [];

  if (Array.isArray(json)) {
    rawRecords = json;
  } else if (json && typeof json === "object") {
    // Check key envelopes
    const possibleKeys = ["data", "products", "items", "records", "rows", "catalog", "SKUs", "skus", "sheet"];
    for (const key of possibleKeys) {
      if (Array.isArray(json[key])) {
        rawRecords = json[key];
        break;
      }
    }
    
    // Fallback: lookup any first nested array of length > 0
    if (rawRecords.length === 0) {
      const possibleArrays = Object.values(json).filter(val => Array.isArray(val)) as any[][];
      if (possibleArrays.length > 0) {
        rawRecords = possibleArrays.reduce((max, arr) => arr.length > max.length ? arr : max, possibleArrays[0]);
      }
    }
  }

  if (!rawRecords || rawRecords.length === 0) {
    return [];
  }

  // Detect 2D Matrix (Array of Arrays) format e.g. [["Barcode", "Name"], ["899...", "Serum Cream"]]
  if (Array.isArray(rawRecords[0])) {
    const headers = rawRecords[0].map(h => String(h).trim());
    const dataRows = rawRecords.slice(1);
    
    const formattedObjects = dataRows.map(row => {
      const obj: any = {};
      headers.forEach((header, idx) => {
        if (header) {
          obj[header] = row[idx] !== undefined ? row[idx] : "";
        }
      });
      return obj;
    });
    
    return formattedObjects.map((item: any) => mapFuzzyItem(item))
                            .filter((item: SKUData) => !!item.productCode);
  }

  // Detect and process Array of Objects format
  return rawRecords.map((item: any) => mapFuzzyItem(item))
                  .filter((item: SKUData) => !!item.productCode);
}

export function SKUList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedAssortment, setSelectedAssortment] = useState<string>("All");
  const [selectedSegment, setSelectedSegment] = useState<string>("All");
  
  // Sorting state
  const [sortField, setSortField] = useState<keyof SKUData>("productCode");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Connected google sheets data state (loads from localStorage if present)
  const [skuList, setSkuList] = useState<SKUData[]>(() => {
    try {
      const saved = localStorage.getItem("sku_catalog_custom_database");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            ...item,
            brand: normalizeBrand(item.brand)
          }));
        }
      }
    } catch (e) {
      console.error("Failed to load local storage SKU database, using static fallback:", e);
    }
    return []; // Start empty so there is no simulation data loaded before sheet sync!
  });

  const [initialLoading, setInitialLoading] = useState(() => {
    try {
      const saved = localStorage.getItem("sku_catalog_custom_database");
      if (saved) {
        return false;
      }
    } catch (e) {}
    return true;
  });

  // Sync state selectors
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState("");
  const [copiedScript, setCopiedScript] = useState(false);

  // CSV Parser with double quotes and comma separation safety checks
  const parseCSV = (text: string): SKUData[] => {
    const lines: string[][] = [];
    let row: string[] = [""];
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++; // Skip escape char
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push("");
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        lines.push(row);
        row = [""];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row);
    }
    
    if (lines.length < 2) return [];
    
    const headers = lines[0].map(h => h.toLowerCase().trim());
    const parsedData: SKUData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i];
      if (values.length < headers.length || (values.length === 1 && values[0] === "")) continue;
      
      const item: any = {};
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        if (!header) continue;
        const val = values[j] ? values[j].trim() : "";
        
        if (header.includes("status")) {
          item.status = val;
        } else if (header.includes("code") || header.includes("sku")) {
          item.productCode = val;
        } else if (header.includes("description") || header.includes("name") || header.includes("product")) {
          item.descriptionProduct = val;
        } else if (header.includes("brand")) {
          item.brand = val;
        } else if (header.includes("assortment")) {
          item.assortment = val;
        } else if (header.includes("category")) {
          item.category = val;
        } else if (header.includes("segment") && !header.includes("sub")) {
          item.segment = val;
        } else if (header.includes("subsegment") || header.includes("sub_segment")) {
          item.subsegment = val;
        } else if (header.includes("sip") || header.includes("distri")) {
          item.priceSIP = parseIndonesianPrice(val);
        } else if (header.includes("stp") || header.includes("store")) {
          item.priceSTP = parseIndonesianPrice(val);
        } else if (header.includes("srp") || header.includes("retail")) {
          item.priceSRP = parseIndonesianPrice(val);
        }
      }
      
      if (item.productCode) {
        item.status = item.status || "Active";
        item.descriptionProduct = item.descriptionProduct || "Unnamed Product";
        item.brand = normalizeBrand(item.brand);
        item.assortment = item.assortment || "Other SKU";
        item.category = item.category || "Skincare";
        item.segment = item.segment || "Face";
        item.subsegment = item.subsegment || "Serum";
        item.priceSIP = item.priceSIP || 0;
        item.priceSTP = item.priceSTP || 0;
        item.priceSRP = item.priceSRP || 0;
        parsedData.push(item as SKUData);
      }
    }
    return parsedData;
  };

  // Connect & load from Google Spreadsheet directly (with robust automatic key-mapping)
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus("idle");
    setSyncMessage("Menghubungkan ke Google Sheets...");

    try {
      const defaultUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_PRODUCT_CATALOG_SCRIPT_URL) || "https://script.google.com/macros/s/AKfycbzLG2BPCW7O8PXELCNdIgv1v0MHVspqVtYw5PVaqgULS5BhHHyuoA9PED5uoDla-uIrKw/exec";
      const proxyUrl = `/api/product-catalog?url=${encodeURIComponent(defaultUrl)}&method=gas`;
      let response = await fetch(proxyUrl);
      
      // If we got a status error, or if it has Vercel connection/CORS issues, fallback to direct fetch
      if (!response.ok) {
        console.warn(`[Proxy Warning] Direct proxy returned status ${response.status}. Trying direct browser fetch.`);
        response = await fetch(defaultUrl);
      }
      
      if (!response.ok) {
        throw new Error(`Koneksi ke Google Sheets gagal (Status ${response.status}).`);
      }

      const result = await response.json();
      let json: any = null;

      if (Array.isArray(result)) {
        json = result;
      } else if (result && result.success && Array.isArray(result.data)) {
        json = result.data;
      } else if (result && result.success === false) {
        throw new Error(result.error || "Gagal memproses data dari backend proxy.");
      } else if (result && typeof result === "object") {
        const possibleKeys = ["data", "products", "items", "records", "rows"];
        for (const key of possibleKeys) {
          if (Array.isArray(result[key])) {
            json = result[key];
            break;
          }
        }
      }

      if (!json) {
        // Last-resort fallback: try direct URL
        console.log("[Proxy Fallback] Trying direct fetch as last resort...");
        const fallbackRes = await fetch(defaultUrl);
        if (fallbackRes.ok) {
          const fbJson = await fallbackRes.json();
          if (Array.isArray(fbJson)) {
            json = fbJson;
          } else if (fbJson && fbJson.data && Array.isArray(fbJson.data)) {
            json = fbJson.data;
          }
        }
      }

      if (!json) {
        throw new Error("Format respon tidak dikenal. Pastikan Google Apps Script mengembalikan array JSON.");
      }

      const fetchedData = parseJSONDataToSKUList(json);

      if (fetchedData.length === 0) {
        throw new Error("Format Web App non-standard atau tidak dapat dipetakan. Mohon periksa nama kolom spreadsheet Anda.");
      }

      setSkuList(fetchedData);
      localStorage.setItem("sku_catalog_custom_database", JSON.stringify(fetchedData));

      setSyncStatus("success");
      setSyncMessage(`Sinkronisasi Berhasil! Berhasil memuat ${fetchedData.length} produk dari Google Sheets.`);
      setCurrentPage(1);

      // Dismiss status message after 4.5 seconds
      setTimeout(() => {
        setSyncStatus("idle");
        setSyncMessage("");
      }, 4500);
    } catch (err: any) {
      console.error(err);
      setSyncStatus("error");
      setSyncMessage(err.message || "Gagal menyinkronkan data.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetCatalog = () => {
    if (window.confirm("Apakah Anda yakin ingin mengembalikan katalog standard bawaan? Data spreadsheet saat ini akan dihapus dari penyimpanan lokal.")) {
      setSkuList(SKU_DATABASE);
      localStorage.removeItem("sku_catalog_custom_database");
      setSyncStatus("idle");
      setSyncMessage("");
      setCurrentPage(1);
    }
  };

  // Extract unique filter values for dropdowns based on active data
  const filterOptions = useMemo(() => {
    const brands = ["All", ...Array.from(new Set(skuList.map(item => item.brand || "Skintific").filter(Boolean)))];
    const statuses = ["All", ...Array.from(new Set(skuList.map(item => item.status)))];
    const categories = ["All", ...Array.from(new Set(skuList.map(item => item.category)))];
    const assortments = ["All", ...Array.from(new Set(skuList.map(item => item.assortment)))];
    const segments = ["All", ...Array.from(new Set(skuList.map(item => item.segment)))];
    return { brands, statuses, categories, assortments, segments };
  }, [skuList]);

  // Handle Sort
  const handleSort = (field: keyof SKUData) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Helper to format number as Rupiah currency
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Filter and Search logic
  const filteredSKUs = useMemo(() => {
    return skuList.filter(item => {
      const matchSearch = 
        item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descriptionProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subsegment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchBrand = selectedBrand === "All" || item.brand === selectedBrand;
      const matchStatus = selectedStatus === "All" || item.status === selectedStatus;
      const matchCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchAssortment = selectedAssortment === "All" || item.assortment === selectedAssortment;
      const matchSegment = selectedSegment === "All" || item.segment === selectedSegment;

      return matchSearch && matchBrand && matchStatus && matchCategory && matchAssortment && matchSegment;
    });
  }, [skuList, searchTerm, selectedBrand, selectedStatus, selectedCategory, selectedAssortment, selectedSegment]);

  // Sort logic
  const sortedSKUs = useMemo(() => {
    const sorted = [...filteredSKUs];
    sorted.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return sorted;
  }, [filteredSKUs, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(sortedSKUs.length / itemsPerPage);
  const paginatedSKUs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSKUs.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSKUs, currentPage, itemsPerPage]);

  // Adjust page index when list decreases
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Auto-sync with Google Sheets/Apps Script on mount to keep product catalog dynamically connected
  React.useEffect(() => {
    let active = true;
    const performAutoSync = async () => {
      // Small timeout to allow everything to mount stable
      await new Promise(resolve => setTimeout(resolve, 600));
      if (!active) return;

      const targetUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_PRODUCT_CATALOG_SCRIPT_URL) || "https://script.google.com/macros/s/AKfycbzLG2BPCW7O8PXELCNdIgv1v0MHVspqVtYw5PVaqgULS5BhHHyuoA9PED5uoDla-uIrKw/exec";

      setIsSyncing(true);
      setSyncStatus("idle");
      setSyncMessage("Menyelaraskan data live dengan Google Sheets...");

      try {
        const proxyUrl = `/api/product-catalog?url=${encodeURIComponent(targetUrl)}&method=gas`;
        let res = await fetch(proxyUrl);
        
        // Dynamic fallback in case proxy is unreachable or Vercel static router returns non-200
        if (!res.ok) {
          console.warn(`[AutoSync Proxy Warning] HTTP ${res.status}. Falling back to direct Apps Script fetch.`);
          res = await fetch(targetUrl);
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const result = await res.json();
        if (!active) return;

        let json: any = null;
        if (Array.isArray(result)) {
          json = result;
        } else if (result && result.success && Array.isArray(result.data)) {
          json = result.data;
        } else if (result && typeof result === "object") {
          const possibleKeys = ["data", "products", "items", "records", "rows"];
          for (const key of possibleKeys) {
            if (Array.isArray(result[key])) {
              json = result[key];
              break;
            }
          }
        }

        if (json) {
          const fetchedData = parseJSONDataToSKUList(json);

          if (fetchedData.length > 0) {
            setSkuList(fetchedData);
            setSyncStatus("success");
            setSyncMessage(`Otomatis Sinkron: Berhasil memuat ${fetchedData.length} produk dari Google Sheets!`);
            
            setTimeout(() => {
              if (active) {
                setSyncStatus("idle");
                setSyncMessage("");
              }
            }, 4500);
          } else {
            throw new Error("Data hasil parse kosong.");
          }
        } else {
          throw new Error("Format respon tidak dikenal atau tidak bisa dimapping.");
        }
      } catch (err: any) {
        console.warn("[AutoSync Mount Warning] Could not auto-sync:", err);
        if (active) {
          setSyncStatus("error");
          setSyncMessage("Gagal live sync otomatis dengan Google Sheets.");
          
          setSkuList(prev => {
            if (prev.length === 0) {
              return SKU_DATABASE.map(item => ({
                ...item,
                brand: normalizeBrand(item.brand)
              }));
            }
            return prev;
          });

          setTimeout(() => {
            if (active) {
              setSyncStatus("idle");
              setSyncMessage("");
            }
          }, 4500);
        }
      } finally {
        if (active) {
          setIsSyncing(false);
          setInitialLoading(false);
        }
      }
    };

    performAutoSync();

    return () => {
      active = false;
    };
  }, []);

  // Calculated Metrics
  const metrics = useMemo(() => {
    const totalCount = filteredSKUs.length;
    
    const avgSIP = totalCount > 0 
      ? filteredSKUs.reduce((sum, item) => sum + item.priceSIP, 0) / totalCount 
      : 0;

    const avgSTP = totalCount > 0 
      ? filteredSKUs.reduce((sum, item) => sum + item.priceSTP, 0) / totalCount 
      : 0;

    const avgSRP = totalCount > 0 
      ? filteredSKUs.reduce((sum, item) => sum + (item.priceSRP || 0), 0) / totalCount 
      : 0;
    
    return {
      totalCount,
      avgSIP,
      avgSTP,
      avgSRP
    };
  }, [filteredSKUs]);

  // Download logic mapping to Excel (.xlsx) export
  const exportToExcel = () => {
    const data = filteredSKUs.map(item => ({
      "Status": item.status,
      "Product Code": item.productCode,
      "Description": item.descriptionProduct,
      "Brand": item.brand,
      "Assortment": item.assortment,
      "Category": item.category,
      "Segment": item.segment,
      "Subsegment": item.subsegment,
      "SIP (Distributor Price)": item.priceSIP,
      "STP (Store Price)": item.priceSTP,
      "SRP (Retail Price)": item.priceSRP || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Product Catalog");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Product_Catalog_Database_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white text-blue-600 gap-4">
        <Loader2 className="animate-spin w-10 h-10" />
        <div className="text-center">
          <span className="font-black tracking-[0.3em] text-xs uppercase block mb-1">YOOL-DO! SYSTEMS</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase animate-pulse">Menghubungkan ke Google Sheets Product Catalog...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Top Welcome Title & Subtitle */}
      <header className="pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h2 className="text-4xl font-black tracking-tight text-slate-900">Product Catalog</h2>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            Master repository of regional active product catalog, pricing matrices, and segment assortments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-[10px] tracking-widest uppercase transition-all shadow-sm cursor-pointer ${
              isSyncing
                ? "bg-amber-500 text-white border-amber-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Now"}
          </button>

          <button
            onClick={exportToExcel}
            disabled={filteredSKUs.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold text-[10px] tracking-widest uppercase border border-slate-200 hover:border-blue-400 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel ({filteredSKUs.length})
          </button>
        </div>
      </header>

      {/* Sync Notification Banner */}
      {syncStatus !== "idle" && syncMessage && (
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-sm ${
              syncStatus === "success"
                ? "bg-emerald-50 text-slate-800 border-emerald-200"
                : syncStatus === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {syncStatus === "success" ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : syncStatus === "error" ? (
                <AlertCircle className="w-4 h-4 text-rose-650 shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 animate-spin" />
              )}
              <span className="font-extrabold">
                {syncStatus === "success" ? "Sukses: " : syncStatus === "error" ? "Gagal: " : "Info: "}
              </span>
              <span className="font-medium">{syncMessage}</span>
            </div>
            <button
              onClick={() => {
                setSyncStatus("idle");
                setSyncMessage("");
              }}
              className="p-1.5 hover:bg-black/5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          {/* Detailed Google Apps Script Error Troubleshooting Diagnostic Panel */}
          {syncStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                    PANDUAN SOLUSI: Google Apps Script Error
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Masalah ini terjadi karena ada pemanggilan fungsi <code className="px-1.5 py-0.5 bg-slate-200 text-slate-800 font-mono rounded text-[10px] font-bold">.setHeader()</code> di dalam fungsi <code className="font-bold">doGet(e)</code> pada Google Apps Script Anda. Google Apps Script <strong>tidak mendukung</strong> fungsi custom headers seperti ini secara default dan akan menghasilkan error <code className="font-semibold text-rose-600 text-[10px]">setHeader is not a function</code>.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Tiga Langkah Mudah Mengatasinya (1-Menit):</p>
                <ol className="list-decimal pl-4 text-[11px] text-slate-700 space-y-1.5 font-medium leading-relaxed">
                  <li>
                    Buka Spreadsheet Anda, arahkan ke menu <strong className="text-slate-900">Extensions &gt; Apps Script</strong>.
                  </li>
                  <li>
                    Hapus semua kode pada file Editor <strong className="font-mono text-slate-800">Code.gs</strong> dan ganti dengan kode versi bebas instan-error di bawah ini.
                  </li>
                  <li>
                    Klik tombol <strong className="text-slate-900">Deploy &gt; New Deployment</strong>, set jenis konfigurasi ke <strong className="text-slate-900">Web App</strong>, ubah kolom <em>"Who has access"</em> menjadi <strong className="text-slate-900">Anyone</strong>, klik Deploy. Lalu salin link URL hasil deploy tersebut.
                  </li>
                </ol>
              </div>

              {/* Collapsible/Interactive Copyable Script Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    Copy Script Bebas Error (Code.gs)
                  </span>
                  <button
                    onClick={() => {
                      const appsScriptCode = `/**
 * Google Apps Script for Skintific Product Catalog Connector
 * Paste ini di Spreadsheet Anda pada "Extensions > Apps Script" untuk menghindari error setHeader.
 */
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
    return ContentService.createTextOutput(JSON.stringify({ error: "No data found in your spreadsheet" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Ambil baris pertama sebagai nama header
  var headers = data[0].map(function(h) { 
    return h.toString().toLowerCase().trim().replace(/\\s+/g, '_'); 
  });
  
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var item = {};
    
    // Map header secara dinamis
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      var val = row[j];
      
      if (header.indexOf("status") !== -1) {
        item.status = val || "Active";
      } else if (header.indexOf("code") !== -1 || header.indexOf("sku") !== -1) {
        item.productCode = val ? val.toString().trim() : "";
      } else if (header.indexOf("description") !== -1 || header.indexOf("name") !== -1 || header.indexOf("product") !== -1) {
        item.descriptionProduct = val ? val.toString().trim() : "";
      } else if (header.indexOf("brand") !== -1) {
        item.brand = val ? val.toString().trim() : "Skintific";
      } else if (header.indexOf("assortment") !== -1 || header.indexOf("paket") !== -1) {
        item.assortment = val ? val.toString().trim() : "Other SKU";
      } else if (header.indexOf("category") !== -1 || header.indexOf("kategori") !== -1) {
        item.category = val ? val.toString().trim() : "Skincare";
      } else if (header.indexOf("segment") !== -1 && header.indexOf("sub") === -1) {
        item.segment = val ? val.toString().trim() : "Face";
      } else if (header.indexOf("subsegment") !== -1 || header.indexOf("sub_segment") !== -1) {
        item.subsegment = val ? val.toString().trim() : "Serum";
      } else if (header.indexOf("sip") !== -1 || header.indexOf("distri") !== -1) {
        item.priceSIP = Number(val) || 0;
      } else if (header.indexOf("stp") !== -1 || header.indexOf("store") !== -1) {
        item.priceSTP = Number(val) || 0;
      } else if (header.indexOf("srp") !== -1 || header.indexOf("retail") !== -1) {
        item.priceSRP = Number(val) || 0;
      }
    }
    
    if (item.productCode) {
      if (!item.status) item.status = "Active";
      if (!item.descriptionProduct) item.descriptionProduct = "Unnamed Product";
      if (!item.brand) item.brand = "Skintific";
      if (!item.assortment) item.assortment = "Other SKU";
      if (!item.category) item.category = "Skincare";
      if (!item.segment) item.segment = "Face";
      if (!item.subsegment) item.subsegment = "Serum";
      if (typeof item.priceSIP !== 'number') item.priceSIP = 0;
      if (typeof item.priceSTP !== 'number') item.priceSTP = 0;
      if (typeof item.priceSRP !== 'number') item.priceSRP = 0;
      
      result.push(item);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}`;
                      navigator.clipboard.writeText(appsScriptCode);
                      setCopiedScript(true);
                      setTimeout(() => setCopiedScript(false), 3000);
                    }}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-[9px] tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                      copiedScript
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    {copiedScript ? "Script disalin!" : "Copy Kode Baru"}
                  </button>
                </div>
                <div className="relative">
                  <pre className="text-[10px] font-mono text-slate-700 bg-white border border-slate-200/80 p-3 rounded-xl overflow-auto max-h-[140px] select-all thin-scrollbar">
                    {`function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
    return ContentService.createTextOutput(JSON.stringify({ error: "No data" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // .... (Mapping logic) ....

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON); // <--- HAPUS .setHeader() di bagian ini!
}`}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Total SKUs</span>
            <div className="flex items-baseline gap-0.5 min-w-0">
              <span className="text-xl font-black tracking-tight text-slate-900 truncate" title={metrics.totalCount.toString()}>
                {metrics.totalCount}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
              Filtered View
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Avg. Distri Price (SIP)</span>
            <div className="flex items-baseline gap-0.5 min-w-0">
              <span className="text-sm font-bold opacity-70 text-slate-500 mr-0.5">Rp</span>
              <span className="text-xl font-black tracking-tight text-slate-900 truncate" title={formatRupiah(metrics.avgSIP)}>
                {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(metrics.avgSIP)}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">
              Regular Base Rate
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Avg. Store Price (STP)</span>
            <div className="flex items-baseline gap-0.5 min-w-0">
              <span className="text-sm font-bold opacity-70 text-slate-500 mr-0.5">Rp</span>
              <span className="text-xl font-black tracking-tight text-slate-900 truncate" title={formatRupiah(metrics.avgSTP)}>
                {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(metrics.avgSTP)}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
              Store Base Rate
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Avg. Retail Price (SRP)</span>
            <div className="flex items-baseline gap-0.5 min-w-0">
              <span className="text-sm font-bold opacity-70 text-slate-500 mr-0.5">Rp</span>
              <span className="text-xl font-black tracking-tight text-emerald-700 truncate" title={formatRupiah(metrics.avgSRP)}>
                {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(metrics.avgSRP)}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              Retail Price (SRP)
            </div>
          </div>
        </div>
      </div>

      {/* Bespoke Product Information Filter Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-1 bg-blue-600 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Search and Filtering Matrix</h3>
        </div>

         {/* First Row of Filters: Search & Brand Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Main Search */}
          <div className="lg:col-span-12 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search Code, Name, Subsegment..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 text-xs font-bold bg-slate-50 hover:bg-white border border-slate-200 hover:shadow-sm rounded-xl text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all"
            />
          </div>
        </div>

        {/* Second Row of Filters: Brand, Category, Assortment, Segment & Status dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-1">
          {/* Brand Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 block">
              Product Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-bold bg-slate-50 hover:bg-white border border-slate-200 hover:shadow-sm rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all cursor-pointer"
            >
              <option value="All">All Brands</option>
              {filterOptions.brands.filter(b => b !== "All").map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 block">
              Product Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-bold bg-slate-50 hover:bg-white border border-slate-200 hover:shadow-sm rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all cursor-pointer"
            >
              <option value="All">All Categories</option>
              {filterOptions.categories.filter(cat => cat !== "All").map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Assortment Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 block">
              Segment Assortment
            </label>
            <select
              value={selectedAssortment}
              onChange={(e) => {
                setSelectedAssortment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-bold bg-slate-50 hover:bg-white border border-slate-200 hover:shadow-sm rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all cursor-pointer"
            >
              <option value="All">All Assortments</option>
              {filterOptions.assortments.filter(a => a !== "All").map(assort => (
                <option key={assort} value={assort}>{assort}</option>
              ))}
            </select>
          </div>

          {/* Segment Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 block">
              Application Segment
            </label>
            <select
              value={selectedSegment}
              onChange={(e) => {
                setSelectedSegment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-bold bg-slate-50 hover:bg-white border border-slate-200 hover:shadow-sm rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all cursor-pointer"
            >
              <option value="All">All Segments</option>
              {filterOptions.segments.filter(s => s !== "All").map(seg => (
                <option key={seg} value={seg}>{seg}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 block">
              Release Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-bold bg-slate-50 hover:bg-white border border-slate-200 hover:shadow-sm rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {filterOptions.statuses.filter(st => st !== "All").map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters Reset Panel */}
        {(searchTerm || selectedBrand !== "All" || selectedStatus !== "All" || selectedCategory !== "All" || selectedAssortment !== "All" || selectedSegment !== "All") && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500 border-t border-slate-50 pt-3">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Showing <strong>{filteredSKUs.length}</strong> of <strong>{skuList.length}</strong> catalog items matching current criteria.</span>
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedBrand("All");
                setSelectedStatus("All");
                setSelectedCategory("All");
                setSelectedAssortment("All");
                setSelectedSegment("All");
                setCurrentPage(1);
              }}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-rose-50 group-hover:text-rose-500 transition-all">
                <X size={12} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-rose-600 transition-colors">
                Clear Filters
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table Card wrapper */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="overflow-x-auto min-h-[460px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <table className="w-full min-w-[1200px] text-left border-collapse table-fixed">
            <colgroup>
              <col className="w-[130px]" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
              <col className="w-[270px]" />
              <col className="w-[120px]" />
              <col className="w-[90px]" />
              <col className="w-[90px]" />
              <col className="w-[110px]" />
              <col className="w-[130px]" />
              <col className="w-[130px]" />
              <col className="w-[130px]" />
            </colgroup>
            <thead>
              <tr className="bg-blue-600 text-white font-black text-[10px] tracking-widest uppercase border-b border-blue-700">
                {/* Column 1: Status */}
                <th className="px-4 py-3.5 cursor-pointer select-none hover:bg-blue-700 transition" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1.5 justify-start">
                    Status
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </div>
                </th>
                {/* Column 2: Product Code */}
                <th className="px-4 py-3.5 cursor-pointer select-none hover:bg-blue-700 transition" onClick={() => handleSort("productCode")}>
                  <div className="flex items-center gap-1.5">
                    Product Code
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </div>
                </th>
                {/* Column 3: Brand */}
                <th className="px-4 py-3.5 cursor-pointer select-none hover:bg-blue-700 transition" onClick={() => handleSort("brand")}>
                  <div className="flex items-center gap-1.5">
                    Brand
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </div>
                </th>
                {/* Column 4: Description Product */}
                <th className="px-4 py-3.5 cursor-pointer select-none hover:bg-blue-700 transition" onClick={() => handleSort("descriptionProduct")}>
                  <div className="flex items-center gap-1.5">
                    Description Product
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </div>
                </th>
                {/* Column 5: Assortment */}
                <th className="px-4 py-3.5 cursor-pointer select-none hover:bg-blue-700 transition" onClick={() => handleSort("assortment")}>
                  <div className="flex items-center gap-1.5">
                    Assortment
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </div>
                </th>
                {/* Column 6: Category */}
                <th className="px-4 py-3.5 cursor-pointer select-none hover:bg-blue-700 transition" onClick={() => handleSort("category")}>
                  <div className="flex items-center gap-1.5">
                    Category
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </div>
                </th>
                {/* Column 7: Segment */}
                <th className="px-4 py-3.5 cursor-pointer select-none hover:bg-blue-700 transition" onClick={() => handleSort("segment")}>
                  <div className="flex items-center gap-1.5">
                    Segment
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </div>
                </th>
                {/* Column 8: Subsegment */}
                <th className="px-4 py-3.5 cursor-pointer select-none hover:bg-blue-700 transition" onClick={() => handleSort("subsegment")}>
                  <div className="flex items-center gap-1.5">
                    Subsegment
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </div>
                </th>
                {/* Column 9: Price For Distri (SIP) */}
                <th className="px-4 py-3.5 text-right cursor-pointer select-none hover:bg-blue-700 transition" onClick={() => handleSort("priceSIP")}>
                  <div className="flex items-center gap-1.5 justify-end">
                    Price Distri (SIP)
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </div>
                </th>
                {/* Column 10: Price For Store (STP) */}
                <th className="px-4 py-3.5 text-right cursor-pointer select-none hover:bg-blue-700 transition" onClick={() => handleSort("priceSTP")}>
                  <div className="flex items-center gap-1.5 justify-end">
                    Price Store (STP)
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </div>
                </th>
                {/* Column 11: Price For Retail (SRP) */}
                <th className="px-4 py-3.5 text-right cursor-pointer select-none hover:bg-blue-700 transition" onClick={() => handleSort("priceSRP")}>
                  <div className="flex items-center gap-1.5 justify-end">
                    Price Retail (SRP)
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {paginatedSKUs.length > 0 ? (
                paginatedSKUs.map((item, index) => {
                  // Style colors for assortments beautifully
                  let assortmentBadge = "bg-slate-50 text-slate-650";
                  if (item.assortment === "Must Have SKU") assortmentBadge = "bg-emerald-50 text-emerald-700 border border-emerald-100";
                  else if (item.assortment === "Best Selling SKU") assortmentBadge = "bg-amber-50 text-amber-700 border border-amber-100";
                  else if (item.assortment === "Popular SKU") assortmentBadge = "bg-blue-50 text-blue-700 border border-blue-100";

                  // Style colors for status column (Purple/Violet modern tag)
                  const statusStyle = item.status === "NPD Letter Released"
                    ? "bg-violet-50 text-violet-700 border border-violet-200"
                    : "bg-slate-50 text-slate-650 border border-slate-200";

                  return (
                    <tr 
                      key={item.productCode} 
                      className={`hover:bg-slate-50/50 transition duration-150 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/20"}`}
                    >
                      {/* Column 1: Status */}
                      <td className="px-4 py-2.5 truncate">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg border tracking-wider inline-block ${statusStyle}`}>
                          {item.status}
                        </span>
                      </td>
                      {/* Column 2: Product Code */}
                      <td className="px-4 py-2.5 font-bold text-slate-900 font-mono tracking-tight text-[11px] truncate">
                        {item.productCode}
                      </td>
                      {/* Column 3: Brand */}
                      <td className="px-4 py-2.5 font-bold text-slate-700 truncate">
                        {item.brand || "Skintific"}
                      </td>
                      {/* Column 4: Description Product */}
                      <td className="px-4 py-2.5 font-medium text-slate-800 break-words line-clamp-2 hover:line-clamp-none transition-all duration-200">
                        {item.descriptionProduct}
                      </td>
                      {/* Column 4: Assortment */}
                      <td className="px-4 py-2.5 truncate">
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-full ${assortmentBadge}`}>
                          {item.assortment}
                        </span>
                      </td>
                      {/* Column 5: Category */}
                      <td className="px-4 py-2.5 text-slate-600 font-semibold truncate">{item.category}</td>
                      {/* Column 6: Segment */}
                      <td className="px-4 py-2.5 text-slate-600 font-semibold truncate">{item.segment}</td>
                      {/* Column 7: Subsegment */}
                      <td className="px-4 py-2.5 truncate">
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-700 text-[10px] font-medium rounded-md border border-slate-100">
                          {item.subsegment}
                        </span>
                      </td>
                      {/* Column 8: Price For Distri (SIP) */}
                      <td className="px-4 py-2.5 text-right font-bold text-slate-900 tabular-nums truncate">
                        {formatRupiah(item.priceSIP)}
                      </td>
                      {/* Column 9: Price For Store (STP) */}
                      <td className="px-4 py-2.5 text-right font-black text-blue-700 tabular-nums truncate">
                        {formatRupiah(item.priceSTP)}
                      </td>
                      {/* Column 10: Price For Retail (SRP) */}
                      <td className="px-4 py-2.5 text-right font-black text-emerald-700 tabular-nums truncate">
                        {formatRupiah(item.priceSRP || 0)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="px-4 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 bg-slate-50 text-slate-400 rounded-full">
                        <Package className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-slate-600">No SKUs Match Available Filters</p>
                      <p className="text-xs text-slate-400 max-w-xs">Change your search keywords or reset filter bounds to view standard catalog listings.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Card Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (Total {sortedSKUs.length} items)
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`w-8 h-8 rounded-xl text-xs font-black transition ${
                    currentPage === num 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.05]" 
                      : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-sm"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
