/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SalesData, IncentiveSPVData, IncentiveSPVExclusiveData, IncentiveSEData, SellOutData, SKUFocusStoreData, SKUFocusSPVData, CategoryAnalysisData, StockAnalysisData } from "../types";

/**
 * SALIN & TEMPEL KODE INI KE GOOGLE APPS SCRIPT:
 * 
 * function doGet(e) {
 *   const ss = SpreadsheetApp.getActiveSpreadsheet();
 *   const sheetName = e.parameter.sheet || "Sell In"; 
 *   const sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
 *   const data = sheet.getDataRange().getValues();
 *   const headers = data[0];
 *   const rows = data.slice(1);
 *   
 *   const result = rows.map(row => {
 *     let obj = {};
 *     headers.forEach((header, i) => {
 *       let key = header.toString().toLowerCase().trim().replace(/\s+/g, '_');
 *       
 *       // Mapping/Normalisasi
 *       if (key.includes('brand')) key = 'brand_of';
 *       if (key.includes('date')) key = 'calendar_date';
 *       if (key.includes('distributor')) key = 'distributor_name';
 *       if (key.includes('supervisor')) key = 'supervisor';
 *       if (key.includes('sell_in')) key = 'sell_in_value';
 *       if (key.includes('sell_through')) key = 'sell_through_value';
 *       
 *       let val = row[i];
 *       if (val instanceof Date) {
 *         val = Utilities.formatDate(val, ss.getSpreadsheetTimeZone(), "MM/dd/yyyy");
 *       }
 *       
 *       obj[key] = val;
 *     });
 *     return obj;
 *   });
 *   
 *   return ContentService.createTextOutput(JSON.stringify(result))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 */

// GANTI DENGAN URL DEPLOYMENT GOOGLE APPS SCRIPT ANDA
const SCRIPT_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_SCRIPT_URL) || "https://script.google.com/macros/s/AKfycbyA83M4VP5R3A0vKEUjwh--HOcOjDwnH7b9CVZVsGd4P_RHGqhLhoJvJNsQm9VVkKIIHA/exec"; 

// URL DEPLOYMENT GOOGLE APPS SCRIPT BARU UNTUK INCENTIVES SPV INTERNAL UNTUK GOOGLE SHEET YANG BERBEDA
export const INCENTIVES_SCRIPT_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_INCENTIVES_INTERNAL_SCRIPT_URL) || "https://script.google.com/macros/s/AKfycbzH7LQQOfKzmIDa0suVLpUOJojLRPZexv0-uTvLcsITDjaaXrwqJZGMs7ZkTuSvSG_J/exec"; 

// URL DEPLOYMENT GOOGLE APPS SCRIPT BARU UNTUK INCENTIVES SPV EXCLUSIVE (MENGGUNAKAN SCRIPT & GOOGLE SHEET YANG BERBEDA)
export const EXCLUSIVE_SCRIPT_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_INCENTIVES_EXCLUSIVE_SCRIPT_URL) || "https://script.google.com/macros/s/AKfycbx8W37XlWx_71xdS_-f8JML7HHoDx7iaGxcSxdkYVeSv73o1sQ46AF8lr2i0M6wtE23jw/exec"; 

let cachedData: Record<string, SalesData[]> = {};
let lastFetchTime: Record<string, number> = {};
let cachedIncentivesData: IncentiveSPVData[] | null = null;
let lastIncentivesFetchTime = 0;
let cachedExclusiveData: IncentiveSPVExclusiveData[] | null = null;
let lastExclusiveFetchTime = 0;

// URL DEPLOYMENT GOOGLE APPS SCRIPT BARU UNTUK INCENTIVES SE (MENGGUNAKAN SCRIPT & GOOGLE SHEET YANG BERBEDA)
export const SE_SCRIPT_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_INCENTIVES_SE_SCRIPT_URL) || "https://script.google.com/macros/s/AKfycbxG2DoKUduwDP3h-XAD1VXJ1icBfOYwJoOTRj_LTh93Q5tnMqkad7tjCJsj7eAuy-JzPA/exec";
let cachedSEData: IncentiveSEData[] | null = null;
let lastSEFetchTime = 0;

// URL DEPLOYMENT GOOGLE APPS SCRIPT BARU UNTUK SELL OUT (MENGGUNAKAN SCRIPT & GOOGLE SHEET YANG BERBEDA)
export const SELL_OUT_SCRIPT_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_SELL_OUT_SCRIPT_URL) || "https://script.google.com/macros/s/AKfycbyDS6ZPtUffLDNVieh-hCG4e2z6vDOzS-MI891J_xjDRIK5yJ8rXsaYFuqVqJ-C5fqOfg/exec";
let cachedSellOutData: SellOutData[] | null = null;
let lastSellOutFetchTime = 0;

// URL DEPLOYMENT GOOGLE APPS SCRIPT BARU UNTUK SKU FOCUS (MENGGUNAKAN SCRIPT & GOOGLE SHEET YANG BERBEDA)
export const SKU_FOCUS_SCRIPT_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_SKU_FOCUS_SCRIPT_URL) || "https://script.google.com/macros/s/AKfycbxwAD5bkdKM_bJ4v25FQT9neXHRXMnXqzlIUaKje1xCqPqB9wbrn40EbcxSDtEXaMgUuw/exec";
let cachedSKUStoreData: SKUFocusStoreData[] | null = null;
let lastSKUStoreFetchTime = 0;
let cachedSKUSPVData: SKUFocusSPVData[] | null = null;
let lastSKUSPVFetchTime = 0;

const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

export async function fetchSalesData(forceRefresh = false, sheetName = "Sell In and Through"): Promise<SalesData[]> {
  if (!SCRIPT_URL) return generateMockSalesData();

  const now = Date.now();
  if (!forceRefresh && cachedData[sheetName] && (now - lastFetchTime[sheetName] < CACHE_DURATION)) {
    console.log(`Returning cached data for ${sheetName}`);
    return cachedData[sheetName];
  }

  let rawData: any = null;

  // 1. Attempt local proxy
  try {
    const response = await fetch(`/api/sales-data?sheet=${encodeURIComponent(sheetName)}`);
    if (response.ok) {
      const text = await response.text();
      // Check if it is HTML or redirect rather than JSON
      if (text.trim().startsWith("<") || text.includes("<html") || text.includes("<!DOCTYPE html>") || text.includes("Google Accounts")) {
        console.warn("Local proxy returned HTML/redirect instead of JSON for sales data. Trying direct fetch.");
      } else {
        rawData = JSON.parse(text);
      }
    } else {
      console.warn(`Local proxy returned status ${response.status} for sales-data. Trying direct browser fetch.`);
    }
  } catch (proxyError) {
    console.warn("Proxy fetch nested error for sales-data:", proxyError);
  }

  // 2. Fallback to direct client-side fetch from the browser (bypasses Vercel routing / timeout constraints)
  if (!rawData && SCRIPT_URL) {
    try {
      console.log(`Attempting direct browser fetch for ${sheetName} from:`, SCRIPT_URL);
      const targetUrl = `${SCRIPT_URL}?sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(targetUrl);
      if (response.ok) {
        const text = await response.text();
        if (text.trim().startsWith("<") || text.includes("<html") || text.includes("<!DOCTYPE html>") || text.includes("Google Accounts")) {
          console.warn("Direct browser fetch returned HTML instead of JSON for sales data.");
        } else {
          rawData = JSON.parse(text);
          console.log(`Direct browser fetch for ${sheetName} succeeded!`);
        }
      } else {
        throw new Error(`Direct fetch returned status: ${response.status}`);
      }
    } catch (directError) {
      console.error(`Direct browser fetch for ${sheetName} failed:`, directError);
    }
  }

  try {
    if (!rawData) {
      console.warn(`Both proxy and direct fetch failed for ${sheetName}. Using local fallback mockup data.`);
      if (cachedData[sheetName]) return cachedData[sheetName];
      return generateMockSalesData();
    }

    if (!Array.isArray(rawData)) {
      console.error("Sales data did not return an array. Received:", rawData);
      throw new Error("API response is not a valid JSON array");
    }
    
    const mappedData = rawData.map((item: any) => ({
      brand_of: item.brand_of || "Unknown",
      region: item.region || "Unknown",
      calendar_date: item.calendar_date || new Date().toLocaleDateString(),
      distributor_name: item.distributor_name || "Unknown",
      asm: item.asm || "Unknown",
      supervisor: item.supervisor || "Unknown",
      sell_in_value: Number(item.sell_in_value || 0),
      sell_through_value: Number(item.sell_through_value || 0)
    }));

    cachedData[sheetName] = mappedData;
    lastFetchTime[sheetName] = now;
    return mappedData;
  } catch (error) {
    console.error(`Fetch ${sheetName} Error:`, error);
    if (cachedData[sheetName]) return cachedData[sheetName];
    return generateMockSalesData();
  }
}

export function generateMockSalesData(): SalesData[] {
  const brands = ["FACERINNA", "SKINTIFIC", "GLAD2GLOW", "TIMEPHORIA"];
  const regions = ["East Kalimantan", "West Kalimantan", "North Kalimantan", "South Kalimantan"];
  const asms = ["Endini Tetrasari Silaban", "Budi Santoso", "Siti Aminah"];
  const supervisors = ["Supv 1", "Supv 2", "Supv 3"];
  const distributors = ["PT TRIJAYA ABADI - SAMARINDA", "PT TRIJAYA ABADI - BALIKPAPAN", "PT TRIJAYA ABADI - TARAKAN"];
  
  const data: SalesData[] = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);
  
  for (let m = 0; m < 12; m++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(startDate.getMonth() + m);
    const dateStr = `${currentDate.getMonth() + 1}/01/${currentDate.getFullYear()}`;

    for (let brand of brands) {
      for (let region of regions) {
        const distIndex = Math.floor(Math.random() * distributors.length);
        const sellIn = Math.floor(Math.random() * 50000000) + 10000000;
        data.push({
          brand_of: brand,
          region: region,
          calendar_date: dateStr,
          distributor_name: distributors[distIndex],
          asm: asms[distIndex % asms.length],
          supervisor: supervisors[distIndex % supervisors.length],
          sell_in_value: sellIn,
          sell_through_value: Math.floor(sellIn * (0.6 + Math.random() * 0.4)) // 60-100% of sell in
        });
      }
    }
  }
  
  return data;
}

export async function fetchIncentiveSPVData(forceRefresh = false): Promise<IncentiveSPVData[]> {
  if (!INCENTIVES_SCRIPT_URL) {
    console.log("No INCENTIVES_SCRIPT_URL specified. Returning mockup data.");
    return generateMockIncentiveSPVData();
  }

  const now = Date.now();
  if (!forceRefresh && cachedIncentivesData && (now - lastIncentivesFetchTime < CACHE_DURATION)) {
    console.log("Returning cached incentives data");
    return cachedIncentivesData;
  }

  let rawData: any = null;

  // 1. Attempt local proxy
  try {
    const response = await fetch(`/api/incentives-internal`);
    if (response.ok) {
      rawData = await response.json();
    } else {
      console.warn(`Local proxy returned status ${response.status} for SPV Internal Incentives. Trying direct browser fetch.`);
    }
  } catch (proxyError) {
    console.warn("Proxy fetch nested error for SPV Internal Incentives:", proxyError);
  }

  // 2. Fallback to direct client-side fetch from the browser (bypasses Vercel routing / timeout constraints)
  if (!rawData && INCENTIVES_SCRIPT_URL) {
    try {
      console.log("Attempting direct browser fetch for SPV Internal Incentives from:", INCENTIVES_SCRIPT_URL);
      const response = await fetch(INCENTIVES_SCRIPT_URL);
      if (response.ok) {
        rawData = await response.json();
        console.log("Direct browser fetch for SPV Internal Incentives succeeded!");
      } else {
        throw new Error(`Direct fetch returned status: ${response.status}`);
      }
    } catch (directError) {
      console.error("Direct browser fetch for SPV Internal Incentives failed:", directError);
    }
  }

  try {
    if (!rawData) {
      throw new Error("Gagal mengambil data SPV Internal dari proxy dan direct fetch");
    }
    
    if (!Array.isArray(rawData)) {
      console.error("Incentives API did not return an array. Received:", rawData);
      throw new Error("API response is not a valid JSON array");
    }

    console.log("Fetched Incentives records:", rawData.length);
    if (rawData.length > 0) {
      console.log("First item keys:", Object.keys(rawData[0]));
    }

    const mappedData = rawData.map((item: any) => {
      // Helper function to find clean string values using flexible keywords
      const findString = (listKeywords: string[][], defaultValue = "Unknown"): string => {
        for (const keywords of listKeywords) {
          for (const k of Object.keys(item)) {
            const lowerK = k.toLowerCase().replace(/[\s_\-\.\(\)]/g, '');
            const normalizedKeywords = keywords.map(kw => kw.toLowerCase().replace(/[\s_\-\.\(\)]/g, ''));
            if (normalizedKeywords.every(kw => lowerK.includes(kw))) {
              return String(item[k] || "").trim() || defaultValue;
            }
          }
        }
        return defaultValue;
      };

      // Helper function to find clean numeric values using flexible keywords
      const findValue = (listKeywords: string[][], defaultValue = 0): number => {
        for (const keywords of listKeywords) {
          for (const k of Object.keys(item)) {
            const lowerK = k.toLowerCase().replace(/[\s_\-\.\(\)]/g, '');
            const normalizedKeywords = keywords.map(kw => kw.toLowerCase().replace(/[\s_\-\.\(\)]/g, ''));
            if (normalizedKeywords.every(kw => lowerK.includes(kw))) {
              const val = item[k];
              if (val === null || val === undefined) continue;
              if (typeof val === 'string') {
                // Remove currency symbols & thousands separator dots, adjust commas to dots for float parsing
                const cleaned = val.replace(/Rp|\s/gi, '').replace(/\./g, '').replace(/,/g, '.');
                return Number(cleaned) || defaultValue;
              }
              return Number(val) || defaultValue;
            }
          }
        }
        return defaultValue;
      };

      return {
        region: findString([['region']]),
        asm: findString([['asm']]),
        supervisor: findString([['supervisor'], ['spv']]),
        target_total_gmv: findValue([['target', 'total', 'gmv'], ['target', 'gmv', 'total'], ['target', 'total'], ['total_gmv_target']]),
        ach_total_gmv: findValue([['ach', 'total', 'gmv'], ['ach', 'gmv', 'total'], ['ach', 'total_gmv'], ['total_gmv_ach'], ['ach_total_gmv'], ['value', 'total', 'gmv']]),
        target_gmv_sa: findValue([['target', 'sa'], ['target', 'gmv', 'sa'], ['target_sa'], ['target_gmv_sa']]),
        ach_gmv_sa: findValue([['ach', 'sa'], ['ach', 'gmv', 'sa'], ['ach_sa'], ['ach_gmv_sa'], ['value', 'sa'], ['value', 'gmv', 'sa']]),
        target_gmv_bcd: findValue([['target', 'bcd'], ['target', 'gmv', 'bcd'], ['target_bcd'], ['target_gmv_bcd']]),
        ach_gmv_bcd: findValue([['ach', 'bcd'], ['ach', 'gmv', 'bcd'], ['ach_bcd'], ['ach_gmv_bcd'], ['value', 'bcd'], ['value', 'gmv', 'bcd']]),
        target_ao: findValue([['target', 'ao'], ['target_ao'], ['target_active', 'outlet']]),
        ach_ao: findValue([['ach', 'ao'], ['ach_ao'], ['ach_active', 'outlet'], ['active', 'outlet', 'ach']]),
        target_ec: findValue([['target', 'ec'], ['target_ec'], ['target_effective', 'call']]),
        ach_ec: findValue([['ach', 'ec'], ['ach_ec'], ['ach_effective', 'call'], ['effective', 'call', 'ach']]),
        target_msl: findValue([['target', 'msl']]),
        ach_msl: findValue([['ach', 'msl'], ['value', 'msl']]),
        incentive_gmv: findValue([['incentive', 'gmv'], ['incentives', 'gmv'], ['inc', 'gmv'], ['bonus', 'gmv']]),
        incentive_ao: findValue([['incentive', 'ao'], ['incentives', 'ao'], ['inc', 'ao'], ['bonus', 'ao']]),
        incentive_msl: findValue([['incentive', 'msl'], ['incentives', 'msl'], ['inc', 'msl'], ['bonus', 'msl']]),
        total_incentives: findValue([['total', 'incentive'], ['total', 'incentives']])
      };
    });

    cachedIncentivesData = mappedData;
    lastIncentivesFetchTime = now;
    return mappedData;
  } catch (error) {
    console.error("Fetch Incentives Error:", error);
    if (cachedIncentivesData) return cachedIncentivesData;
    return generateMockIncentiveSPVData();
  }
}

export function generateMockIncentiveSPVData(): IncentiveSPVData[] {
  const regions = [
    { name: "East Kalimantan", asm: "Endini Tetrasari Silaban", supervisors: ["Supv Balikpapan", "Supv Samarinda"] },
    { name: "West Kalimantan", asm: "Siti Aminah", supervisors: ["Supv Pontianak", "Supv Singkawang"] },
    { name: "South Kalimantan", asm: "Budi Santoso", supervisors: ["Supv Banjarmasin", "Supv Banjarbaru"] },
    { name: "North Kalimantan", asm: "Siti Aminah", supervisors: ["Supv Tarakan"] }
  ];

  const data: IncentiveSPVData[] = [];

  for (let reg of regions) {
    for (let sup of reg.supervisors) {
      // GMV Total
      const targetTotal = Math.floor(Math.random() * 600000000) + 400000000; // Rp 400M - 1B
      const achPercent = 0.82 + Math.random() * 0.3; // 82% - 112%
      const achTotal = Math.floor(targetTotal * achPercent);

      // GMV SA
      const targetSA = Math.floor(targetTotal * 0.4); // 40% of targetTotal
      const achPercentSA = 0.8 + Math.random() * 0.28;
      const achSA = Math.floor(targetSA * achPercentSA);

      // GMV BCD
      const targetBCD = targetTotal - targetSA;
      const achPercentBCD = 0.85 + Math.random() * 0.25;
      const achBCD = Math.floor(targetBCD * achPercentBCD);

      // AO
      const targetAO = Math.floor(Math.random() * 150) + 100; // 100 - 250
      const achAO = Math.floor(targetAO * (0.75 + Math.random() * 0.35));

      // EC
      const targetEC = Math.floor(targetAO * 0.8);
      const achEC = Math.floor(targetEC * (0.8 + Math.random() * 0.3));

      // MSL
      const targetMSL = Math.floor(Math.random() * 1500) + 800;
      const achMSL = Math.floor(targetMSL * (0.85 + Math.random() * 0.25));

      // Incentives calculation based on achievements
      const incGMV = Math.floor(achTotal * 0.01); // 1% of total GMV achieved
      const incAO = achAO >= targetAO ? 4500000 : Math.floor(4500000 * (achAO / targetAO));
      const incMSL = achPercent >= 1.0 ? 3000000 : 0; // Bonus for meeting target
      const totalIncentives = incGMV + incAO + incMSL;

      data.push({
        region: reg.name,
        asm: reg.asm,
        supervisor: sup,
        target_total_gmv: targetTotal,
        ach_total_gmv: achTotal,
        target_gmv_sa: targetSA,
        ach_gmv_sa: achSA,
        target_gmv_bcd: targetBCD,
        ach_gmv_bcd: achBCD,
        target_ao: targetAO,
        ach_ao: achAO,
        target_ec: targetEC,
        ach_ec: achEC,
        target_msl: targetMSL,
        ach_msl: achMSL,
        incentive_gmv: incGMV,
        incentive_ao: incAO,
        incentive_msl: incMSL,
        total_incentives: totalIncentives
      });
    }
  }

  return data;
}

export async function fetchIncentiveSPVExclusiveData(forceRefresh = false): Promise<IncentiveSPVExclusiveData[]> {
  if (!EXCLUSIVE_SCRIPT_URL) {
    console.log("No EXCLUSIVE_SCRIPT_URL specified. Returning exclusive mockup data.");
    return generateMockIncentiveSPVExclusiveData();
  }

  const now = Date.now();
  if (!forceRefresh && cachedExclusiveData && (now - lastExclusiveFetchTime < CACHE_DURATION)) {
    console.log("Returning cached exclusive incentives data");
    return cachedExclusiveData;
  }

  let rawData: any = null;

  // 1. Attempt local proxy
  try {
    const response = await fetch(`/api/incentives-exclusive`);
    if (response.ok) {
      const json = await response.json();
      if (json && json.success !== false) {
        rawData = json;
      } else {
        console.warn("GAS proxy returned success: false or invalid response for exclusive:", json?.message);
      }
    } else {
      console.warn(`Local proxy returned status ${response.status} for exclusive incentives. Trying direct browser fetch.`);
    }
  } catch (proxyError) {
    console.warn("Proxy fetch nested error for exclusive incentives:", proxyError);
  }

  // 2. Fallback to direct client-side fetch from the browser (bypasses Vercel routing / timeout constraints)
  if (!rawData && EXCLUSIVE_SCRIPT_URL) {
    try {
      console.log("Attempting direct browser fetch for exclusive incentives from:", EXCLUSIVE_SCRIPT_URL);
      const response = await fetch(EXCLUSIVE_SCRIPT_URL);
      if (response.ok) {
        rawData = await response.json();
        console.log("Direct browser fetch for exclusive incentives succeeded!");
      } else {
        throw new Error(`Direct fetch returned status: ${response.status}`);
      }
    } catch (directError) {
      console.error("Direct browser fetch for exclusive incentives failed:", directError);
    }
  }

  try {
    if (!rawData) {
      console.warn("Both proxy and direct fetch for exclusive incentives failed. Using local mockup fallback.");
      const mockResult = generateMockIncentiveSPVExclusiveData();
      const mappedWithFallback = mockResult.map(item => ({
        ...item,
        _isFallback: true,
        _errorType: "FETCH_FAILURE",
        _errorMessage: "Gagal memuat data SPV Eksklusif dari server dan direct API."
      }));
      cachedExclusiveData = mappedWithFallback;
      lastExclusiveFetchTime = now;
      return mappedWithFallback;
    }

    const payloadObj = (rawData && rawData.success === true && rawData.data) ? rawData.data : rawData;

    let arrayData: any[] = [];
    if (Array.isArray(payloadObj)) {
      arrayData = payloadObj;
    } else if (payloadObj && typeof payloadObj === 'object') {
      if (Array.isArray(payloadObj.data)) {
        arrayData = payloadObj.data;
      } else if (Array.isArray(payloadObj.rows)) {
        arrayData = payloadObj.rows;
      } else if (Array.isArray(payloadObj.records)) {
        arrayData = payloadObj.records;
      } else {
        const possibleArray = Object.values(payloadObj).find(val => Array.isArray(val)) as any[];
        if (possibleArray) {
          arrayData = possibleArray;
        } else {
          console.error("Exclusive incentives script returned an object but no recognizable array of rows was found:", rawData);
          throw new Error("No array found in Google Apps Script response");
        }
      }
    } else {
      console.error("Exclusive Incentives API did not return readable JSON. Received:", rawData);
      throw new Error("API response is not a valid JSON array or object");
    }

    console.log("Fetched exclusive Incentives records:", arrayData.length);

    const mappedData = arrayData.map((item: any) => {
      // Create a lowercase key index of the item, replacing symbols to have uniform lookup
      const itemNormalized: Record<string, any> = {};
      for (const k of Object.keys(item)) {
        const cleanK = k.toLowerCase().replace(/[\s_\-\.\(\)]/g, '');
        itemNormalized[cleanK] = item[k];
      }

      const findString = (exactAndAliases: string[], defaultValue = "Unknown"): string => {
        // 1. Try Exact or exact normalized match
        for (const key of exactAndAliases) {
          const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, '');
          if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
            return String(itemNormalized[cleanK]).trim() || defaultValue;
          }
        }
        
        // 2. Try substring match on any keys
        for (const key of exactAndAliases) {
          const lowerKey = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, '');
          for (const rawK of Object.keys(itemNormalized)) {
            if (rawK.includes(lowerKey) || lowerKey.includes(rawK)) {
              return String(itemNormalized[rawK]).trim() || defaultValue;
            }
          }
        }
        return defaultValue;
      };

      const findValue = (exactAndAliases: string[], defaultValue = 0): number => {
        // 1. Try Exact or exact normalized match
        for (const key of exactAndAliases) {
          const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, '');
          if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
            const val = itemNormalized[cleanK];
            if (typeof val === 'number') return val;
            const cleaned = String(val).replace(/Rp|\s/gi, '').replace(/\./g, '').replace(/,/g, '.');
            const num = Number(cleaned);
            return isNaN(num) ? defaultValue : num;
          }
        }

        // 2. Try substring match on any keys
        for (const key of exactAndAliases) {
          const lowerKey = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, '');
          for (const rawK of Object.keys(itemNormalized)) {
            if (rawK.includes(lowerKey) || lowerKey.includes(rawK)) {
              const val = itemNormalized[rawK];
              if (typeof val === 'number') return val;
              const cleaned = String(val).replace(/Rp|\s/gi, '').replace(/\./g, '').replace(/,/g, '.');
              const num = Number(cleaned);
              return isNaN(num) ? defaultValue : num;
            }
          }
        }
        return defaultValue;
      };

      return {
        region: findString(["Region", "region"]),
        asm: findString(["ASM", "asm"]),
        distributor_company: findString(["Distributor Company", "distributor_company", "distributor company", "distributor_name", "company", "dist company"]),
        distributor_branch: findString(["Distributor Branch", "distributor_branch", "distributor branch", "branch", "dist branch"]),
        supervisor: findString(["Supervisor", "supervisor", "spv"]),
        
        target_total_gmv: findValue(["Target - Total GMV", "target_total_gmv", "target total gmv", "target total", "total_gmv_target"]),
        ach_total_gmv: findValue(["Ach. (Value) - Total GMV", "ach. (Value) - Total GMV", "ach_total_gmv", "ach total gmv", "total_gmv_ach", "ach. total gmv", "ach total"]),
        
        target_gmv_sa: findValue(["Target - GMV SA", "target_gmv_sa", "target gmv sa", "target sa", "target_sa"]),
        ach_gmv_sa: findValue(["Ach. (Value) - GMV SA", "ach. (Value) - GMV SA", "ach_gmv_sa", "ach gmv sa", "sa_ach", "ach. gmv sa", "ach sa"]),
        
        target_gmv_bcd: findValue(["Target - GMV BCD", "target_gmv_bcd", "target gmv bcd", "target bcd", "target_bcd"]),
        ach_gmv_bcd: findValue(["Ach. (Value) - GMV BCD", "ach_gmv_bcd", "ach gmv bcd", "bcd_ach", "ach. gmv bcd", "ach bcd"]),
        
        target_ao: findValue(["Target AO", "target_ao", "target ao"]),
        ach_ao: findValue(["Ach AO", "ach_ao", "ach ao"]),
        
        target_ec: findValue(["Target EC", "target_ec", "target ec"]),
        ach_ec: findValue(["Ach EC", "ach_ec", "ach ec"]),
        
        target_msl: findValue(["Target MSL", "target_msl", "target msl"]),
        ach_msl: findValue(["Ach. (Value) - MSL", "ach_msl", "ach msl", "ach. (Value) - MSL"]),
        
        incentive_gmv: findValue(["Incentives GMV", "incentive_gmv", "incentive gmv", "incentives gmv", "bonus gmv"]),
        incentive_ao: findValue(["Incentives AO", "incentive_ao", "incentive ao", "incentives ao", "bonus ao"]),
        incentive_msl: findValue(["Incentives MSL", "incentive_msl", "incentive msl", "incentives msl", "bonus msl"]),
        total_incentives: findValue(["Total Incentives", "total_incentives", "total incentives"]),
        _isFallback: false
      };
    });

    cachedExclusiveData = mappedData;
    lastExclusiveFetchTime = now;
    return mappedData;
  } catch (error) {
    console.warn("Fetch Exclusive Incentives Error, using fallback:", error);
    if (cachedExclusiveData) return cachedExclusiveData;
    const mockResult = generateMockIncentiveSPVExclusiveData();
    return mockResult.map(item => ({
      ...item,
      _isFallback: true,
      _errorType: "FETCH_FAILURE",
      _errorMessage: error instanceof Error ? error.message : String(error)
    }));
  }
}

export function generateMockIncentiveSPVExclusiveData(): IncentiveSPVExclusiveData[] {
  const regions = [
    { name: "East Kalimantan", asm: "Endini Tetrasari Silaban", cpies: [
      { company: "PT ASIA BEAUTY MAKMUR", branch: "Samarinda Branch", supervisors: ["Supv Samarinda Elite", "Supv Samarinda Premium"] },
      { company: "PT BORNEO KOSMETIK UTAMA", branch: "Balikpapan Branch", supervisors: ["Supv Balikpapan Exclusive"] }
    ]},
    { name: "West Kalimantan", asm: "Siti Aminah", cpies: [
      { company: "PT EQUATOR DISTRIBUSI", branch: "Pontianak HQ", supervisors: ["Supv Pontianak Luxury"] },
      { company: "PT EQUATOR DISTRIBUSI", branch: "Singkawang Branch", supervisors: ["Supv Singkawang Elite"] }
    ]},
    { name: "South Kalimantan", asm: "Budi Santoso", cpies: [
      { company: "PT BARITO INDAH LESTARI", branch: "Banjarmasin Central", supervisors: ["Supv Banjarmasin Exclusive"] }
    ]}
  ];

  const data: IncentiveSPVExclusiveData[] = [];

  for (let reg of regions) {
    for (let cpy of reg.cpies) {
      for (let sup of cpy.supervisors) {
        // GMV Total
        const targetTotal = Math.floor(Math.random() * 800000000) + 600000000; // 600M - 1.4B
        const achPercent = 0.85 + Math.random() * 0.28; // 85% - 113%
        const achTotal = Math.floor(targetTotal * achPercent);

        // GMV SA
        const targetSA = Math.floor(targetTotal * 0.45);
        const achPercentSA = 0.8 + Math.random() * 0.3;
        const achSA = Math.floor(targetSA * achPercentSA);

        // GMV BCD
        const targetBCD = targetTotal - targetSA;
        const achPercentBCD = 0.85 + Math.random() * 0.25;
        const achBCD = Math.floor(targetBCD * achPercentBCD);

        // AO
        const targetAO = Math.floor(Math.random() * 60) + 40;
        const achAO = Math.floor(targetAO * (0.8 + Math.random() * 0.25));

        // EC (Active Outlets table requires Target EC / Ach EC metric for exclusive)
        const targetEC = Math.floor(Math.random() * 200) + 120;
        const achEC = Math.floor(targetEC * (0.8 + Math.random() * 0.28));

        // MSL
        const targetMSL = 40000000;
        const achMSL = Math.floor(targetMSL * (0.85 + Math.random() * 0.2));

        // Incentives
        const incGMV = Math.floor(achTotal * 0.012); // Premium rate
        const incAO = achEC >= targetEC ? 6000000 : Math.floor(6000000 * (achEC / targetEC));
        const incMSL = achPercent >= 1.0 ? 4000000 : 0;
        const totalIncentives = incGMV + incAO + incMSL;

        data.push({
          region: reg.name,
          asm: reg.asm,
          distributor_company: cpy.company,
          distributor_branch: cpy.branch,
          supervisor: sup,
          target_total_gmv: targetTotal,
          ach_total_gmv: achTotal,
          target_gmv_sa: targetSA,
          ach_gmv_sa: achSA,
          target_gmv_bcd: targetBCD,
          ach_gmv_bcd: achBCD,
          target_ao: targetAO,
          ach_ao: achAO,
          target_ec: targetEC,
          ach_ec: achEC,
          target_msl: targetMSL,
          ach_msl: achMSL,
          incentive_gmv: incGMV,
          incentive_ao: incAO,
          incentive_msl: incMSL,
          total_incentives: totalIncentives
        });
      }
    }
  }

  return data;
}

export async function fetchIncentiveSEData(forceRefresh = false): Promise<IncentiveSEData[]> {
  if (!SE_SCRIPT_URL) {
    console.log("No SE_SCRIPT_URL specified. Returning SE mockup data.");
    return generateMockIncentiveSEData();
  }

  const now = Date.now();
  if (!forceRefresh && cachedSEData && (now - lastSEFetchTime < CACHE_DURATION)) {
    console.log("Returning cached SE incentives data");
    return cachedSEData;
  }

  let rawData: any = null;

  // 1. Attempt local proxy
  try {
    const response = await fetch(`/api/incentives-se`);
    if (response.ok) {
      const json = await response.json();
      if (json && json.success !== false) {
        rawData = json;
      } else {
        console.warn("GAS proxy returned success: false or invalid response for SE:", json?.message);
      }
    } else {
      console.warn(`Local proxy returned status ${response.status} for SE Incentives. Trying direct browser fetch.`);
    }
  } catch (proxyError) {
    console.warn("Proxy fetch nested error for SE Incentives:", proxyError);
  }

  // 2. Fallback to direct client-side fetch from the browser (bypasses Vercel routing / timeout constraints)
  if (!rawData && SE_SCRIPT_URL) {
    try {
      console.log("Attempting direct browser fetch for SE Incentives from:", SE_SCRIPT_URL);
      const response = await fetch(SE_SCRIPT_URL);
      if (response.ok) {
        rawData = await response.json();
        console.log("Direct browser fetch for SE Incentives succeeded!");
      } else {
        throw new Error(`Direct fetch returned status: ${response.status}`);
      }
    } catch (directError) {
      console.error("Direct browser fetch for SE Incentives failed:", directError);
    }
  }

  try {
    if (!rawData) {
      console.warn("Both proxy and direct fetch for SE Incentives failed. Using local mockup fallback.");
      const mockResult = generateMockIncentiveSEData();
      const mappedWithFallback = mockResult.map(item => ({
        ...item,
        _isFallback: true,
        _errorType: "FETCH_FAILURE",
        _errorMessage: "Gagal memuat data SE dari server dan direct API."
      }));
      cachedSEData = mappedWithFallback;
      lastSEFetchTime = now;
      return mappedWithFallback;
    }

    const payloadObj = (rawData && rawData.success === true && rawData.data) ? rawData.data : rawData;

    let arrayData: any[] = [];
    if (Array.isArray(payloadObj)) {
      arrayData = payloadObj;
    } else if (payloadObj && typeof payloadObj === 'object') {
      if (Array.isArray(payloadObj.data)) {
        arrayData = payloadObj.data;
      } else if (Array.isArray(payloadObj.rows)) {
        arrayData = payloadObj.rows;
      } else if (Array.isArray(payloadObj.records)) {
        arrayData = payloadObj.records;
      } else {
        const possibleArray = Object.values(payloadObj).find(val => Array.isArray(val)) as any[];
        if (possibleArray) {
          arrayData = possibleArray;
        } else {
          console.error("SE incentives script returned an object but no recognizable array of rows was found:", rawData);
          throw new Error("No array found in Google Apps Script response for SE");
        }
      }
    } else {
      console.error("SE Incentives API did not return readable JSON. Received:", rawData);
      throw new Error("API response is not a valid JSON array or object for SE");
    }

    console.log("Fetched SE Incentives records:", arrayData.length);

    const mappedData = arrayData.map((item: any) => {
      // Create a lowercase key index of the item, replacing symbols to have uniform lookup
      const itemNormalized: Record<string, any> = {};
      for (const k of Object.keys(item)) {
        const cleanK = k.toLowerCase().replace(/[\s_\-\.\(\)]/g, '');
        itemNormalized[cleanK] = item[k];
      }

      const findString = (exactAndAliases: string[], defaultValue = "Unknown"): string => {
        // 1. Try Exact or exact normalized match
        for (const key of exactAndAliases) {
          const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, '');
          if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
            return String(itemNormalized[cleanK]).trim() || defaultValue;
          }
        }
        
        // 2. Try substring match on any keys
        for (const key of exactAndAliases) {
          const lowerKey = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, '');
          for (const rawK of Object.keys(itemNormalized)) {
            if (rawK.includes(lowerKey) || lowerKey.includes(rawK)) {
              return String(itemNormalized[rawK]).trim() || defaultValue;
            }
          }
        }
        return defaultValue;
      };

      const findValue = (exactAndAliases: string[], defaultValue = 0): number => {
        // 1. Try Exact or exact normalized match
        for (const key of exactAndAliases) {
          const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, '');
          if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
            const val = itemNormalized[cleanK];
            if (typeof val === 'number') return val;
            const cleaned = String(val).replace(/Rp|\s/gi, '').replace(/\./g, '').replace(/,/g, '.');
            const num = Number(cleaned);
            return isNaN(num) ? defaultValue : num;
          }
        }

        // 2. Try substring match on any keys
        for (const key of exactAndAliases) {
          const lowerKey = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, '');
          for (const rawK of Object.keys(itemNormalized)) {
            if (rawK.includes(lowerKey) || lowerKey.includes(rawK)) {
              const val = itemNormalized[rawK];
              if (typeof val === 'number') return val;
              const cleaned = String(val).replace(/Rp|\s/gi, '').replace(/\./g, '').replace(/,/g, '.');
              const num = Number(cleaned);
              return isNaN(num) ? defaultValue : num;
            }
          }
        }
        return defaultValue;
      };

      return {
        region: findString(["Region", "region"]),
        distributor: findString(["Distributor", "distributor", "distributor_name", "distributor_company", "company"]),
        supervisor: findString(["Supervisor", "supervisor", "spv"]),
        distributor_se: findString(["Distributor SE", "distributor_se", "se_name", "se", "sales_executive", "sales executive"]),
        
        target_total_gmv: findValue(["Target - Total GMV", "target_total_gmv", "target total gmv", "target total", "total_gmv_target"]),
        ach_total_gmv: findValue(["ACH. (VALUE) - TOTAL GMV", "Ach. (Value) - Total GMV", "ach_total_gmv", "ach total gmv", "total_gmv_ach", "ach. total gmv", "ach total", "ach value total gmv"]),
        
        target_gmv_sa: findValue(["TARGET - GMV SA", "target_gmv_sa", "target gmv sa", "target sa", "target_sa"]),
        ach_gmv_sa: findValue(["ACH. (VALUE) - GMV SA", "Ach. (Value) - GMV SA", "ach_gmv_sa", "ach gmv sa", "sa_ach", "ach. gmv sa", "ach sa", "ach value gmv sa"]),
        
        target_gmv_bcd: findValue(["TARGET - GMV BCD", "target_gmv_bcd", "target gmv bcd", "target bcd", "target_bcd"]),
        ach_gmv_bcd: findValue(["ACH. (VALUE) - GMV BCD", "ach_gmv_bcd", "ach gmv bcd", "bcd_ach", "ach. gmv bcd", "ach bcd", "ach value gmv bcd"]),
        
        target_ao: findValue(["TARGET AO", "target_ao", "target ao"]),
        ach_ao: findValue(["ACH AO", "ach_ao", "ach ao"]),
        
        target_ec: findValue(["TARGET EC", "target_ec", "target ec"]),
        ach_ec: findValue(["ACH EC", "ach_ec", "ach ec"]),
        
        target_st_product_focus: findValue(["TARGET ST PRODUCT FOCUS", "target_st_product_focus", "target st product focus", "target st focus"]),
        ach_st_product_focus: findValue(["ACH ST PRODUCT FOCUS", "ach_st_product_focus", "ach st product focus", "ach st focus"]),
        
        target_ao_product_focus: findValue(["TARGET AO PRODUCT FOCUS", "target_ao_product_focus", "target ao product focus", "target ao focus"]),
        ach_ao_product_focus: findValue(["ACH AO PRODUCT FOCUS", "ach_ao_product_focus", "ach ao product focus", "ach ao focus"]),
        
        incentive_gmv: findValue(["INCENTIVES GMV", "incentive_gmv", "incentive gmv", "incentives gmv", "bonus gmv"]),
        incentive_ao: findValue(["INCENTIVES AO", "incentive_ao", "incentive ao", "incentives ao", "bonus ao"]),
        incentive_st_focus: findValue(["INCENTIVES ST PRODUCT FOCUS", "incentive st product focus", "incentives st product focus", "bonus st product focus", "INCENTIVES ST FOCUS", "incentive_st_focus", "incentive st focus", "incentives st focus", "bonus st focus"]),
        incentive_ao_focus: findValue(["INCENTIVES AO PRODUCT FOCUS", "incentive ao product focus", "incentives ao product focus", "bonus ao product focus", "INCENTIVES AO FOCUS", "incentive_ao_focus", "incentive ao focus", "incentives ao focus", "bonus ao focus"]),
        total_incentives: findValue(["TOTAL INCENTIVES", "total_incentives", "total incentives"]),
        _isFallback: false
      };
    });

    cachedSEData = mappedData;
    lastSEFetchTime = now;
    return mappedData;
  } catch (error) {
    console.warn("Fetch SE Incentives Error, using fallback:", error);
    if (cachedSEData) return cachedSEData;
    const mockResult = generateMockIncentiveSEData();
    return mockResult.map(item => ({
      ...item,
      _isFallback: true,
      _errorType: "FETCH_FAILURE",
      _errorMessage: error instanceof Error ? error.message : String(error)
    }));
  }
}

export function generateMockIncentiveSEData(): IncentiveSEData[] {
  const branches = [
    { region: "East Kalimantan", distributor: "PT ASIA BEAUTY MAKMUR", supervisor: "Supv Samarinda Elite", ses: ["SE Samarinda 01", "SE Samarinda 02"] },
    { region: "East Kalimantan", distributor: "PT BORNEO KOSMETIK UTAMA", supervisor: "Supv Balikpapan Exclusive", ses: ["SE Balikpapan 01"] },
    { region: "West Kalimantan", distributor: "PT EQUATOR DISTRIBUSI", supervisor: "Supv Pontianak Luxury", ses: ["SE Pontianak 01", "SE Pontianak 02"] },
    { region: "West Kalimantan", distributor: "PT EQUATOR DISTRIBUSI", supervisor: "Supv Singkawang Elite", ses: ["SE Singkawang 01"] },
    { region: "South Kalimantan", distributor: "PT BARITO INDAH LESTARI", supervisor: "Supv Banjarmasin Exclusive", ses: ["SE Banjarmasin 01"] }
  ];

  const data: IncentiveSEData[] = [];

  for (let b of branches) {
    for (let seName of b.ses) {
      // GMV Total
      const targetTotal = Math.floor(Math.random() * 250000000) + 250000000; // 250M - 500M
      const achPercent = 0.82 + Math.random() * 0.32; // 82% - 114%
      const achTotal = Math.floor(targetTotal * achPercent);

      // GMV SA
      const targetSA = Math.floor(targetTotal * 0.4);
      const achPercentSA = 0.8 + Math.random() * 0.3;
      const achSA = Math.floor(targetSA * achPercentSA);

      // GMV BCD
      const targetBCD = targetTotal - targetSA;
      const achPercentBCD = 0.85 + Math.random() * 0.25;
      const achBCD = Math.floor(targetBCD * achPercentBCD);

      // Target/Ach AO
      const targetAO = Math.floor(Math.random() * 25) + 20;
      const achAO = Math.floor(targetAO * (0.8 + Math.random() * 0.3));

      // Target/Ach EC
      const targetEC = Math.floor(Math.random() * 80) + 50;
      const achEC = Math.floor(targetEC * (0.8 + Math.random() * 0.3));

      // ST Product Focus
      const targetSTFocus = Math.floor(Math.random() * 10000000) + 15000000; // 15M - 25M
      const achPercentSTFocus = 0.75 + Math.random() * 0.45;
      const achSTFocus = Math.floor(targetSTFocus * achPercentSTFocus);

      // AO Product Focus
      const targetAOFocus = Math.floor(Math.random() * 10) + 8;
      const achAOFocus = Math.floor(targetAOFocus * (0.7 + Math.random() * 0.5));

      // Calculate Incentives based on rules
      const incGMV = Math.floor(achTotal * 0.006); // SE level lower rate
      const incAO = achAO >= targetAO ? 1500000 : 0;
      const incSTFocus = achSTFocus >= targetSTFocus ? 1000000 : 0;
      const incAOFocus = achAOFocus >= targetAOFocus ? 1000000 : 0;
      const totalIncentives = incGMV + incAO + incSTFocus + incAOFocus;

      data.push({
        region: b.region,
        distributor: b.distributor,
        supervisor: b.supervisor,
        distributor_se: seName,
        target_total_gmv: targetTotal,
        ach_total_gmv: achTotal,
        target_gmv_sa: targetSA,
        ach_gmv_sa: achSA,
        target_gmv_bcd: targetBCD,
        ach_gmv_bcd: achBCD,
        target_ao: targetAO,
        ach_ao: achAO,
        target_ec: targetEC,
        ach_ec: achEC,
        target_st_product_focus: targetSTFocus,
        ach_st_product_focus: achSTFocus,
        target_ao_product_focus: targetAOFocus,
        ach_ao_product_focus: achAOFocus,
        incentive_gmv: incGMV,
        incentive_ao: incAO,
        incentive_st_focus: incSTFocus,
        incentive_ao_focus: incAOFocus,
        total_incentives: totalIncentives
      });
    }
  }

  return data;
}

export async function fetchSellOutData(forceRefresh = false): Promise<SellOutData[]> {
  const now = Date.now();
  if (!forceRefresh && cachedSellOutData && (now - lastSellOutFetchTime < CACHE_DURATION)) {
    console.log("Returning cached Sell Out data");
    return cachedSellOutData;
  }

  let rawData: any = null;

  // 1. First attempt: fetch via the local Node/Express proxy route /api/sell-out
  try {
    const response = await fetch(`/api/sell-out`);
    if (response.ok) {
      const json = await response.json();
      if (json && json.success !== false) {
        rawData = json;
      } else {
        console.warn("GAS proxy returned success: false or invalid response for Sell Out. Will try direct browser fetch.");
      }
    } else {
      console.warn(`Local proxy returned status ${response.status} for Sell Out. Will try direct browser fetch.`);
    }
  } catch (proxyError) {
    console.warn("Proxy fetch nested error for Sell Out:", proxyError);
  }

  // 2. Second attempt: Direct fetch to GAS from the browser (perfect for Vercel/Static CDNs without active Express daemons)
  if (!rawData && SELL_OUT_SCRIPT_URL) {
    try {
      console.log("Attempting direct browser fetch for Sell Out from:", SELL_OUT_SCRIPT_URL);
      const response = await fetch(SELL_OUT_SCRIPT_URL);
      if (response.ok) {
        rawData = await response.json();
        console.log("Direct browser fetch for Sell Out succeeded!");
      } else {
        throw new Error(`Direct fetch returned status: ${response.status}`);
      }
    } catch (directError) {
      console.error("Direct browser fetch for Sell Out failed:", directError);
    }
  }

  // 3. Process and map retrieved raw JSON payload if successful
  if (rawData) {
    try {
      const payloadObj = (rawData && rawData.success === true && rawData.data) ? rawData.data : rawData;

      let arrayData: any[] = [];
      if (Array.isArray(payloadObj)) {
        arrayData = payloadObj;
      } else if (payloadObj && typeof payloadObj === "object") {
        if (Array.isArray(payloadObj.data)) {
          arrayData = payloadObj.data;
        } else if (Array.isArray(payloadObj.rows)) {
          arrayData = payloadObj.rows;
        } else if (Array.isArray(payloadObj.records)) {
          arrayData = payloadObj.records;
        } else {
          const possibleArray = Object.values(payloadObj).find(val => Array.isArray(val)) as any[];
          if (possibleArray) {
            arrayData = possibleArray;
          } else {
            console.error("Sell Out script returned an object but no recognizable array of rows was found:", rawData);
            throw new Error("No array found in Google Apps Script response for Sell Out");
          }
        }
      } else {
        console.error("Sell Out API did not return readable JSON. Received:", rawData);
        throw new Error("API response is not a valid JSON array or object for Sell Out");
      }

      console.log("Fetched Sell Out records:", arrayData.length);

      const mappedData = arrayData.map((item: any) => {
        const itemNormalized: Record<string, any> = {};
        for (const k of Object.keys(item)) {
          const cleanK = k.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
          itemNormalized[cleanK] = item[k];
        }

        const findString = (exactAndAliases: string[], defaultValue = "Unknown"): string => {
          for (const key of exactAndAliases) {
            const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
            if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
              return String(itemNormalized[cleanK]).trim() || defaultValue;
            }
          }
          for (const key of exactAndAliases) {
            const lowerKey = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
            for (const rawK of Object.keys(itemNormalized)) {
              if (rawK.includes(lowerKey) || lowerKey.includes(rawK)) {
                return String(itemNormalized[rawK]).trim() || defaultValue;
              }
            }
          }
          return defaultValue;
        };

        const findValue = (exactAndAliases: string[], defaultValue = 0): number => {
          for (const key of exactAndAliases) {
            const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
            if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
              const val = itemNormalized[cleanK];
              if (typeof val === "number") return val;
              const cleaned = String(val).replace(/Rp|\s/gi, "").replace(/\./g, "").replace(/,/g, ".");
              const num = Number(cleaned);
              return isNaN(num) ? defaultValue : num;
            }
          }
          for (const key of exactAndAliases) {
            const lowerKey = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
            for (const rawK of Object.keys(itemNormalized)) {
              if (rawK.includes(lowerKey) || lowerKey.includes(rawK)) {
                const val = itemNormalized[rawK];
                if (typeof val === "number") return val;
                const cleaned = String(val).replace(/Rp|\s/gi, "").replace(/\./g, "").replace(/,/g, ".");
                const num = Number(cleaned);
                return isNaN(num) ? defaultValue : num;
              }
            }
          }
          return defaultValue;
        };

        return {
          calendar_date: findString(["date", "calendar_date", "tanggal"]),
          channel: findString(["channel", "saluran"]),
          brand_of: findString(["brand", "brand_of"]),
          region: findString(["region", "wilayah"]),
          category: findString(["category", "kategori"]),
          segment: findString(["segment", "segmen"]),
          sell_through_value: findValue(["sell_through_value", "sum_of_sell_through_value", "sum of sell_through_value", "sell_through", "sell through", "sum of sell through value"]),
          sell_out_value: findValue(["sell_out", "sell_out_value", "value", "sell out", "sell out value", "sum_of_sell_out_value", "sum of sell_out_value", "sum of sell out value"]),
          ba_store_non_ba_store: findString(["ba_store_non_ba_store", "ba_store", "ba store", "ba vs non ba", "ba_non_ba", "ba_store_non_ba_store"]),
          _isFallback: false
        };
      });

      cachedSellOutData = mappedData;
      lastSellOutFetchTime = now;
      return mappedData;
    } catch (mappingError) {
      console.error("Error parsing or mapping Sell Out keys:", mappingError);
    }
  }

  // 4. Last fallback if both connection steps failed
  if (cachedSellOutData) return cachedSellOutData;
  console.warn("Both local API proxy and direct browser fetch failed for Sell Out; using mapped mockup data.");
  const fallback = generateMockSellOutData();
  const mappedWithFallback = fallback.map(item => ({
    ...item,
    _isFallback: true,
    _errorType: "FETCH_FAILURE",
    _errorMessage: "Failed to connect to both Google Apps Script API proxy and direct browser endpoints."
  }));
  cachedSellOutData = mappedWithFallback;
  lastSellOutFetchTime = now;
  return mappedWithFallback;
}

export function generateMockSellOutData(): SellOutData[] {
  const brands = ["SKINTIFIC", "GLAD2GLOW"];
  const regions = ["East Kalimantan", "South Kalimantan", "West Kalimantan"];
  const channels = ["GT", "MTI"];
  const categoriesMap: Record<string, string[]> = {
    "Makeup": ["Base Makeup", "Makeup Removal"],
    "Skincare": ["Face", "Sunscreen", "Eyes"],
    "Others": ["Others"]
  };
  
  const data: SellOutData[] = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 11);
  
  for (let m = 0; m < 12; m++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(startDate.getMonth() + m);
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const year = currentDate.getFullYear();
    const dateStr = `${month}/01/${year}`;

    for (let brand of brands) {
      for (let region of regions) {
        for (let channel of channels) {
          for (const [category, segments] of Object.entries(categoriesMap)) {
            for (let segment of segments) {
              const sellThrough = Math.floor(Math.random() * 25000000) + 2000000;
              const sellOut = Math.floor(Math.random() * 20000000) + 1000000;
              const ba_store_non_ba_store = Math.random() > 0.45 ? "BA Store" : "Non BA Store";
              data.push({
                calendar_date: dateStr,
                channel: channel,
                brand_of: brand,
                region: region,
                category: category,
                segment: segment,
                sell_through_value: sellThrough,
                sell_out_value: sellOut,
                ba_store_non_ba_store,
                _isFallback: true
              });
            }
          }
        }
      }
    }
  }
  
  return data;
}

export async function fetchSKUFocusStoreData(forceRefresh = false): Promise<SKUFocusStoreData[]> {
  const now = Date.now();
  if (!forceRefresh && cachedSKUStoreData && (now - lastSKUStoreFetchTime < CACHE_DURATION)) {
    console.log("Returning cached SKU Focus Store data");
    return cachedSKUStoreData;
  }

  let rawData: any = null;

  // 1. Attempt local proxy
  try {
    const response = await fetch(`/api/sku-focus?sheet=Store%20Ach`);
    if (response.ok) {
      const json = await response.json();
      if (json && json.success === false && json.errorType === "LIBRARY_URL_DETECTED") {
        throw new Error(`LIBRARY_URL_DETECTED: ${json.message}`);
      }
      if (json && json.success !== false) {
        rawData = json;
      } else {
        console.warn("GAS proxy returned success: false or invalid response for SKU Focus Store.");
      }
    } else {
      console.warn(`Local proxy returned status ${response.status} for SKU Focus Store. Trying direct fetch.`);
    }
  } catch (proxyError: any) {
    if (proxyError.message && proxyError.message.startsWith("LIBRARY_URL_DETECTED:")) {
      throw proxyError;
    }
    console.warn("Proxy fetch nested error for SKU Focus Store:", proxyError);
  }

  // 2. Fallback to direct client-side fetch from browser
  if (!rawData && SKU_FOCUS_SCRIPT_URL) {
    try {
      const targetUrl = `${SKU_FOCUS_SCRIPT_URL}?sheet=${encodeURIComponent("Store Ach")}`;
      console.log("Attempting direct browser fetch for SKU Focus Store from:", targetUrl);
      const response = await fetch(targetUrl);
      if (response.ok) {
        rawData = await response.json();
        console.log("Direct browser fetch for SKU Focus Store succeeded!");
      } else {
        throw new Error(`Direct fetch returned status: ${response.status}`);
      }
    } catch (directError) {
      console.error("Direct browser fetch for SKU Focus Store failed:", directError);
    }
  }

  // 3. Process and map retrieved raw JSON payload if successful
  if (rawData) {
    try {
      const payloadObj = (rawData && rawData.success === true && rawData.data) ? rawData.data : rawData;

      let arrayData: any[] = [];
      if (Array.isArray(payloadObj)) {
        arrayData = payloadObj;
      } else if (payloadObj && typeof payloadObj === "object") {
        if (Array.isArray(payloadObj.data)) {
          arrayData = payloadObj.data;
        } else if (Array.isArray(payloadObj.rows)) {
          arrayData = payloadObj.rows;
        } else if (Array.isArray(payloadObj.records)) {
          arrayData = payloadObj.records;
        } else {
          const possibleArray = Object.values(payloadObj).find(val => Array.isArray(val)) as any[];
          if (possibleArray) {
            arrayData = possibleArray;
          }
        }
      }

      if (arrayData && arrayData.length > 0) {
        const mappedData = arrayData.map((item: any) => {
          const itemNormalized: Record<string, any> = {};
          for (const k of Object.keys(item)) {
            const cleanK = k.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
            itemNormalized[cleanK] = item[k];
          }

          const findString = (exactAndAliases: string[], defaultValue = "Unknown"): string => {
            for (const key of exactAndAliases) {
              const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
              if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
                return String(itemNormalized[cleanK]).trim() || defaultValue;
              }
            }
            return defaultValue;
          };

          const findValue = (exactAndAliases: string[], defaultValue = 0): number => {
            for (const key of exactAndAliases) {
              const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
              if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
                const val = itemNormalized[cleanK];
                if (typeof val === "number") return val;
                const cleaned = String(val).replace(/Rp|\s/gi, "").replace(/\./g, "").replace(/,/g, ".");
                const num = Number(cleaned);
                return isNaN(num) ? defaultValue : num;
              }
            }
            return defaultValue;
          };

          return {
            region: findString(["region", "wilayah", "area"]),
            distributor_name: findString(["distributor_name", "distributor", "nama_distributor"]),
            cust_id: findString(["cust_id", "cust_no", "customer_id", "id_customer", "id_cust", "custid"]),
            cust_name: findString(["cust_name", "customer_name", "nama_customer", "nama_toko", "outlet", "outlet_name"]),
            asm: findString(["asm", "nama_asm", "area_sales_manager"]),
            spv: findString(["spv", "supervisor", "nama_supervisor", "nama_spv"]),
            distributor_se: findString(["distributor_se", "se", "sales_executive", "se_distributor"]),
            sku: findString(["sku", "product", "nama_sku", "product_sku", "item"]),
            qty: findValue(["qty", "quantity", "jumlah_qty", "qty_st"]),
            st: findValue(["st", "sell_through", "sell_out", "value", "st_value"]),
            eligible_st: findValue(["eligible_st", "eligible_st_value", "st_eligible", "eligible_sell_through", "steligible"]),
            eligibility: findString(["eligibility", "status", "eligible", "keterangan"])
          };
        });

        cachedSKUStoreData = mappedData;
        lastSKUStoreFetchTime = now;
        return mappedData;
      }
    } catch (mappingError) {
      console.error("Error parsing or mapping SKU Focus Store keys:", mappingError);
    }
  }

  // 4. Last fallback if both connection steps failed
  if (cachedSKUStoreData) return cachedSKUStoreData;
  console.warn("Both local API proxy and direct browser fetch failed for SKU Focus Store; using mapped mockup data.");
  const fallback = generateMockSKUFocusStoreData();
  const mappedWithFallback = fallback.map(item => ({
    ...item,
    _isFallback: true
  }));
  cachedSKUStoreData = mappedWithFallback;
  lastSKUStoreFetchTime = now;
  return mappedWithFallback;
}

export async function fetchSKUFocusSPVData(forceRefresh = false): Promise<SKUFocusSPVData[]> {
  const now = Date.now();
  if (!forceRefresh && cachedSKUSPVData && (now - lastSKUSPVFetchTime < CACHE_DURATION)) {
    console.log("Returning cached SKU Focus SPV data");
    return cachedSKUSPVData;
  }

  let rawData: any = null;

  // 1. Attempt local proxy
  try {
    const response = await fetch(`/api/sku-focus?sheet=SPV%20Ach`);
    if (response.ok) {
      const json = await response.json();
      if (json && json.success === false && json.errorType === "LIBRARY_URL_DETECTED") {
        throw new Error(`LIBRARY_URL_DETECTED: ${json.message}`);
      }
      if (json && json.success !== false) {
        rawData = json;
      } else {
        console.warn("GAS proxy returned success: false or invalid response for SKU Focus SPV.");
      }
    } else {
      console.warn(`Local proxy returned status ${response.status} for SKU Focus SPV. Trying direct fetch.`);
    }
  } catch (proxyError: any) {
    if (proxyError.message && proxyError.message.startsWith("LIBRARY_URL_DETECTED:")) {
      throw proxyError;
    }
    console.warn("Proxy fetch nested error for SKU Focus SPV:", proxyError);
  }

  // 2. Fallback to direct client-side fetch from browser
  if (!rawData && SKU_FOCUS_SCRIPT_URL) {
    try {
      const targetUrl = `${SKU_FOCUS_SCRIPT_URL}?sheet=${encodeURIComponent("SPV Ach")}`;
      console.log("Attempting direct browser fetch for SKU Focus SPV from:", targetUrl);
      const response = await fetch(targetUrl);
      if (response.ok) {
        rawData = await response.json();
        console.log("Direct browser fetch for SKU Focus SPV succeeded!");
      } else {
        throw new Error(`Direct fetch returned status: ${response.status}`);
      }
    } catch (directError) {
      console.error("Direct browser fetch for SKU Focus SPV failed:", directError);
    }
  }

  // 3. Process and map retrieved raw JSON payload if successful
  if (rawData) {
    try {
      const payloadObj = (rawData && rawData.success === true && rawData.data) ? rawData.data : rawData;

      let arrayData: any[] = [];
      if (Array.isArray(payloadObj)) {
        arrayData = payloadObj;
      } else if (payloadObj && typeof payloadObj === "object") {
        if (Array.isArray(payloadObj.data)) {
          arrayData = payloadObj.data;
        } else if (Array.isArray(payloadObj.rows)) {
          arrayData = payloadObj.rows;
        } else if (Array.isArray(payloadObj.records)) {
          arrayData = payloadObj.records;
        } else {
          const possibleArray = Object.values(payloadObj).find(val => Array.isArray(val)) as any[];
          if (possibleArray) {
            arrayData = possibleArray;
          }
        }
      }

      if (arrayData && arrayData.length > 0) {
        const mappedData = arrayData.map((item: any) => {
          const itemNormalized: Record<string, any> = {};
          for (const k of Object.keys(item)) {
            const cleanK = k.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
            itemNormalized[cleanK] = item[k];
          }

          const findString = (exactAndAliases: string[], defaultValue = "Unknown"): string => {
            for (const key of exactAndAliases) {
              const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
              if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
                return String(itemNormalized[cleanK]).trim() || defaultValue;
              }
            }
            return defaultValue;
          };

          const findValue = (exactAndAliases: string[], defaultValue = 0): number => {
            for (const key of exactAndAliases) {
              const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
              if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
                const val = itemNormalized[cleanK];
                if (typeof val === "number") return val;
                const cleaned = String(val).replace(/Rp|\s/gi, "").replace(/\./g, "").replace(/,/g, ".");
                const num = Number(cleaned);
                return isNaN(num) ? defaultValue : num;
              }
            }
            return defaultValue;
          };

          return {
            region: findString(["region", "wilayah", "area"]),
            distributor_name: findString(["distributor_name", "distributor", "nama_distributor"]),
            asm: findString(["asm", "nama_asm", "area_sales_manager"]),
            spv: findString(["spv", "supervisor", "nama_supervisor", "nama_spv"]),
            distributor_se: findString(["distributor_se", "se", "sales_executive", "se_distributor"]),
            sku: findString(["sku", "product", "nama_sku", "product_sku", "item"]),
            st_eligible: findValue(["st_eligible", "steligible", "eligible_st", "eligible_st_value"]),
            ao: findValue(["ao", "active_outlet", "ach_ao", "ach_active_outlet"]),
            target_ao: findValue(["target_ao", "targetactiveoutlet", "target_active_outlet"]),
            target_st: findValue(["target_st", "target_sell_through", "target_st_value", "targetst"])
          };
        });

        cachedSKUSPVData = mappedData;
        lastSKUSPVFetchTime = now;
        return mappedData;
      }
    } catch (mappingError) {
      console.error("Error parsing or mapping SKU Focus SPV keys:", mappingError);
    }
  }

  // 4. Last fallback if both connection steps failed
  if (cachedSKUSPVData) return cachedSKUSPVData;
  console.warn("Both local API proxy and direct browser fetch failed for SKU Focus SPV; using mapped mockup data.");
  const fallback = generateMockSKUFocusSPVData();
  const mappedWithFallback = fallback.map(item => ({
    ...item,
    _isFallback: true
  }));
  cachedSKUSPVData = mappedWithFallback;
  lastSKUSPVFetchTime = now;
  return mappedWithFallback;
}

export function generateMockSKUFocusStoreData(): SKUFocusStoreData[] {
  const skus = [
    "SKINTIFIC Mugwort Clay Mask 55g",
    "SKINTIFIC 5X Ceramide Barrier Gel 30g",
    "SKINTIFIC Glycolic Peeling Gel 50ml",
    "GLAD2GLOW Blueberry Moisturizer 30g",
    "GLAD2GLOW Centella Gel Cleanser 120ml"
  ];
  const regions = ["East Kalimantan", "South Kalimantan", "West Kalimantan"];
  const distributors = [
    { name: "PT Sinar Baru", region: "East Kalimantan", asm: "Hasan Basri", spvs: ["Andi Wijaya", "Siti Rahma"] },
    { name: "PT Mandiri Abadi", region: "South Kalimantan", asm: "Budi Santoso", spvs: ["Rahmat Hidayat", "Dewi Lestari"] },
    { name: "PT Cahaya Borneo", region: "West Kalimantan", asm: "Yusuf Indra", spvs: ["Eko Prasetyo", "Indah Permata"] }
  ];
  const ses = ["SE Joni", "SE Doni", "SE Clara", "SE Roni", "SE Tina", "SE Linda"];

  const data: SKUFocusStoreData[] = [];

  for (let i = 1; i <= 60; i++) {
    const dist = distributors[i % distributors.length];
    const spv = dist.spvs[i % dist.spvs.length];
    const se = ses[i % ses.length];
    const sku = skus[i % skus.length];
    
    const qty = Math.floor(Math.random() * 80) + 15;
    const price = sku.includes("SKINTIFIC") ? 139000 : 49000;
    const st = qty * price;
    const isEligible = Math.random() > 0.3;
    const eligibility = isEligible ? "Eligible" : "Not Eligible";
    const eligible_st = isEligible ? st : 0;

    data.push({
      region: dist.region,
      distributor_name: dist.name,
      cust_id: `CUST${1000 + i}`,
      cust_name: `Store ${String.fromCharCode(65 + (i % 26))} ${dist.region.split(' ')[0]}`,
      asm: dist.asm,
      spv: spv,
      distributor_se: se,
      sku: sku,
      qty,
      st,
      eligible_st,
      eligibility
    });
  }

  return data;
}

export function generateMockSKUFocusSPVData(): SKUFocusSPVData[] {
  const skus = [
    "SKINTIFIC Mugwort Clay Mask 55g",
    "SKINTIFIC 5X Ceramide Barrier Gel 30g",
    "SKINTIFIC Glycolic Peeling Gel 50ml",
    "GLAD2GLOW Blueberry Moisturizer 30g",
    "GLAD2GLOW Centella Gel Cleanser 120ml"
  ];
  const distributors = [
    { name: "PT Sinar Baru", region: "East Kalimantan", asm: "Hasan Basri", spvs: ["Andi Wijaya", "Siti Rahma"] },
    { name: "PT Mandiri Abadi", region: "South Kalimantan", asm: "Budi Santoso", spvs: ["Rahmat Hidayat", "Dewi Lestari"] },
    { name: "PT Cahaya Borneo", region: "West Kalimantan", asm: "Yusuf Indra", spvs: ["Eko Prasetyo", "Indah Permata"] }
  ];
  const ses = ["SE Joni", "SE Doni", "SE Clara", "SE Roni", "SE Tina", "SE Linda"];

  const data: SKUFocusSPVData[] = [];

  distributors.forEach((dist) => {
    dist.spvs.forEach((spv, spvIdx) => {
      skus.forEach((sku, skuIdx) => {
        const se = ses[(spvIdx + skuIdx) % ses.length];
        const target_st = (sku.includes("SKINTIFIC") ? 10000000 : 4000000) * (Math.floor(Math.random() * 3) + 1);
        const st_eligible = Math.floor(target_st * (0.6 + Math.random() * 0.7));
        const target_ao = Math.floor(Math.random() * 12) + 8;
        const ao = Math.floor(target_ao * (0.5 + Math.random() * 0.6));

        data.push({
          region: dist.region,
          distributor_name: dist.name,
          asm: dist.asm,
          spv: spv,
          distributor_se: se,
          sku: sku,
          st_eligible,
          ao,
          target_ao,
          target_st
        });
      });
    });
  });

  return data;
}

export const CATEGORY_ANALYSIS_SCRIPT_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_CATEGORY_ANALYSIS_SCRIPT_URL) || "https://script.google.com/macros/s/AKfycbykWuGTeAZCcPzWXSUYY53nLFcLcRnaPkZI3efxus-oWz5b4NuFI5EUyz854TwGkQzr/exec";

let cachedCategoryAnalysisData: CategoryAnalysisData[] | null = null;
let lastCategoryAnalysisFetchTime = 0;

export async function fetchCategoryAnalysisData(forceRefresh = false): Promise<CategoryAnalysisData[]> {
  const now = Date.now();
  if (!forceRefresh && cachedCategoryAnalysisData && (now - lastCategoryAnalysisFetchTime < CACHE_DURATION)) {
    console.log("Returning cached Category Analysis data");
    return cachedCategoryAnalysisData;
  }

  let rawData: any = null;
  let lastErrorMessage = "";

  // 1. First attempt: fetch via local Node proxy route
  try {
    const response = await fetch(`/api/category-analysis`);
    if (response.ok) {
      const json = await response.json();
      if (json && json.success !== false) {
        rawData = json;
      } else {
        lastErrorMessage = json?.message || "GAS proxy returned success: false or invalid response.";
        console.warn("GAS proxy returned success: false or invalid response for Category Analysis:", lastErrorMessage);
      }
    } else {
      lastErrorMessage = `Local proxy returned status ${response.status}`;
      console.warn(`Local proxy returned status ${response.status} for Category Analysis. Trying direct browser fetch.`);
    }
  } catch (proxyError: any) {
    lastErrorMessage = proxyError?.message || String(proxyError);
    console.warn("Proxy fetch nested error for Category Analysis:", proxyError);
  }

  // 2. Second attempt: fallback to direct GAS browser fetch
  const scriptUrl = CATEGORY_ANALYSIS_SCRIPT_URL;
  if (!rawData && scriptUrl && scriptUrl.startsWith("https://")) {
    try {
      console.log("Attempting direct browser fetch for Category Analysis from:", scriptUrl);
      const response = await fetch(scriptUrl);
      if (response.ok) {
        rawData = await response.json();
        console.log("Direct browser fetch for Category Analysis succeeded!");
      } else {
        lastErrorMessage = `Direct fetch returned status: ${response.status}`;
        throw new Error(lastErrorMessage);
      }
    } catch (directError: any) {
      lastErrorMessage = directError?.message || String(directError);
      console.error("Direct browser fetch for Category Analysis failed:", directError);
    }
  }

  // 3. Map retrieved JSON payload
  if (rawData) {
    try {
      const payloadObj = (rawData && rawData.success === true && rawData.data) ? rawData.data : rawData;

      let arrayData: any[] = [];
      if (Array.isArray(payloadObj)) {
        arrayData = payloadObj;
      } else if (payloadObj && typeof payloadObj === "object") {
        if (Array.isArray(payloadObj.data)) {
          arrayData = payloadObj.data;
        } else if (Array.isArray(payloadObj.rows)) {
          arrayData = payloadObj.rows;
        } else if (Array.isArray(payloadObj.records)) {
          arrayData = payloadObj.records;
        } else {
          const possibleArray = Object.values(payloadObj).find(val => Array.isArray(val)) as any[];
          if (possibleArray) {
            arrayData = possibleArray;
          } else {
            console.error("No recognizable array found in Google Apps Script response for Category Analysis");
          }
        }
      }

      if (arrayData.length > 0) {
        console.log("Fetched Category Analysis records:", arrayData.length);

        const mappedData = arrayData.map((item: any) => {
          const itemNormalized: Record<string, any> = {};
          for (const k of Object.keys(item)) {
            const cleanK = k.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
            itemNormalized[cleanK] = item[k];
          }

          const findString = (exactAndAliases: string[], defaultValue = "Unknown"): string => {
            for (const key of exactAndAliases) {
              const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
              if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
                return String(itemNormalized[cleanK]).trim() || defaultValue;
              }
            }
            for (const key of exactAndAliases) {
              const lowerKey = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
              for (const rawK of Object.keys(itemNormalized)) {
                if (rawK.includes(lowerKey) || lowerKey.includes(rawK)) {
                  return String(itemNormalized[rawK]).trim() || defaultValue;
                }
              }
            }
            return defaultValue;
          };

          const findValue = (exactAndAliases: string[], defaultValue = 0): number => {
            for (const key of exactAndAliases) {
              const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
              if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
                const val = itemNormalized[cleanK];
                if (typeof val === "number") return val;
                const cleaned = String(val).replace(/Rp|\s/gi, "").replace(/\./g, "").replace(/,/g, ".");
                const num = Number(cleaned);
                return isNaN(num) ? defaultValue : num;
              }
            }
            for (const key of exactAndAliases) {
              const lowerKey = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
              for (const rawK of Object.keys(itemNormalized)) {
                if (rawK.includes(lowerKey) || lowerKey.includes(rawK)) {
                  const val = itemNormalized[rawK];
                  if (typeof val === "number") return val;
                  const cleaned = String(val).replace(/Rp|\s/gi, "").replace(/\./g, "").replace(/,/g, ".");
                  const num = Number(cleaned);
                  return isNaN(num) ? defaultValue : num;
                }
              }
            }
            return defaultValue;
          };

          return {
            source_of: findString(["source_of", "source", "sourceof", "asal_data"]),
            month: findString(["month", "bulan"]),
            region: findString(["region", "wilayah", "daerah"]),
            distributor_name: findString(["distributor", "distributor_name", "distributorname", "nama_distributor"]),
            item_id: findString(["item_id", "itemid", "sku_id", "id_barang"]),
            sku: findString(["sku", "nama_barang", "product"]),
            total_quantity: findValue(["total_quantity", "quantity", "qty", "jumlah_qty"]),
            sell_through_value: findValue(["sell_through_value", "sell_through", "sellthrough"]),
            sell_out_value: findValue(["sell_out_value", "sell_out", "sellout", "value", "nilai_jual"]),
            category: findString(["category", "kategori"]),
            _isFallback: false
          };
        });

        cachedCategoryAnalysisData = mappedData;
        lastCategoryAnalysisFetchTime = now;
        return mappedData;
      }
    } catch (parseErr: any) {
      console.error("Failed to parse retrieved Category Analysis data, falling back to mock:", parseErr);
      if (forceRefresh) {
        throw new Error(`Data parsing error: ${parseErr?.message || parseErr}`);
      }
    }
  }

  if (forceRefresh) {
    throw new Error(lastErrorMessage || "Failed to sync spreadsheet. Connection failed or Google Apps Script returned invalid response.");
  }

  // Fallback to High-Fidelity Mock
  console.log("Using High-Fidelity local mock Category Analysis data");
  const mockData = generateMockCategoryAnalysisData();
  cachedCategoryAnalysisData = mockData;
  lastCategoryAnalysisFetchTime = now;
  return mockData;
}

export function generateMockCategoryAnalysisData(): CategoryAnalysisData[] {
  const regions = [
    { name: "East Kalimantan", distributor: "PT TRIJAYA ADHIRAJA ABADI - BALIKPAPAN" },
    { name: "South Kalimantan", distributor: "PT MULTI PERSADA BORNEO - BANJARMASIN" },
    { name: "West Kalimantan", distributor: "PT BORNEO SENTOSA UTAMA - PONTIANAK" },
    { name: "North Sulawesi", distributor: "PT SULAWESI GLOBAL NIAGA - MANADO" }
  ];

  const baseItems = [
    { item_id: "SKINTIFIC-01", sku: "SKINTIFIC 5X CERAMIDE LOW PH CLEANSER", category: "CLEANSER", qty: 19, sell_out_value: 1448370 },
    { item_id: "SKINTIFIC-02", sku: "SKINTIFIC 4D HYALURONIC ACID TONER", category: "TONER", qty: 11, sell_out_value: 982520 },
    { item_id: "SKINTIFIC-04", sku: "SKINTIFIC 10% NIACINAMIDE BRIGHTENING SERUM", category: "SERUM", qty: 102, sell_out_value: 10917060 },
    { item_id: "SKINTIFIC-05", sku: "SKINTIFIC 5X CERAMIDE BARRIER MOISTURE GEL", category: "MOISTURIZER", qty: 340, sell_out_value: 36390200 },
    { item_id: "SKINTIFIC-06", sku: "SKINTIFIC 5% AHA BHA PHA EXFOLIATING TONER", category: "TONER", qty: 5, sell_out_value: 446600 },
    { item_id: "SKINTIFIC-07", sku: "SKINTIFIC 2% SALICYLIC ACID ANTI ACNE SERUM", category: "SERUM", qty: 27, sell_out_value: 2889810 },
    { item_id: "SKINTIFIC-08", sku: "SKINTIFIC MUGWORT ANTI PORE CLAY MASK", category: "TREATMENT", qty: 12, sell_out_value: 912912 },
    { item_id: "SKINTIFIC-09", sku: "SKINTIFIC 360 CRYSTAL MASSAGE EYE CREAM", category: "TREATMENT", qty: 7, sell_out_value: 910910 },
    { item_id: "SKINTIFIC-10", sku: "LIGHT SERUM SUNSCREEN SPF50", category: "SUNSCREEN", qty: 35, sell_out_value: 2668050 },
    { item_id: "SKINTIFIC-105", sku: "SKINTIFIC TRUFFLE BIOME SKIN CREAM", category: "MOISTURIZER", qty: 9, sell_out_value: 1032570 },
    { item_id: "SKINTIFIC-114", sku: "SKINTIFIC 3X ACID ACNE CARE GEL MOISTURIZER", category: "MOISTURIZER", qty: 44, sell_out_value: 4709320 },
    { item_id: "SKINTIFIC-12", sku: "SKINTIFIC 5X CERAMIDE SOOTHING CREAM", category: "TONER", qty: 35, sell_out_value: 3126200 },
    { item_id: "SKINTIFIC-120", sku: "SKINTIFIC 3X ACID INTENSIVE ACNE SERUM", category: "SERUM", qty: 22, sell_out_value: 1677060 },
    { item_id: "SKINTIFIC-122", sku: "SKINTIFIC AQUA LIGHT DAILY SUNSCREEN", category: "SUNSCREEN", qty: 16, sell_out_value: 973280 },
    { item_id: "SKINTIFIC-123", sku: "SKINTIFIC BRIGHTENING LIP SERUM 01", category: "TREATMENT", qty: 34, sell_out_value: 2876910 },
    { item_id: "SKINTIFIC-1234", sku: "SKINTIFIC BRIGHTENING LIP SERUM 02", category: "TREATMENT", qty: 28, sell_out_value: 2500960 },
    { item_id: "SKINTIFIC-1235", sku: "SKINTIFIC BRIGHTENING LIP SERUM 03", category: "TREATMENT", qty: 12, sell_out_value: 1071840 },
    { item_id: "SKINTIFIC-1236", sku: "SKINTIFIC BRIGHTENING LIP SERUM 04", category: "TREATMENT", qty: 22, sell_out_value: 1965040 },
    { item_id: "SKINTIFIC-128", sku: "SKINTIFIC 5% Panthenol Acne Calming Water Gel", category: "MOISTURIZER", qty: 12, sell_out_value: 2023560 },
    { item_id: "SKINTIFIC-129", sku: "SKINTIFIC 3X ACID ACNE GEL CLEANSER", category: "CLEANSER", qty: 79, sell_out_value: 6022170 },
    { item_id: "SKINTIFIC-13", sku: "SKINTIFIC 5X CERAMIDE BARRIER SERUM", category: "SERUM", qty: 53, sell_out_value: 5264490 },
    { item_id: "SKINTIFIC-1340", sku: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 01", category: "DECORATIVE", qty: 3, sell_out_value: 390390 },
    { item_id: "SKINTIFIC-1341", sku: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 02", category: "DECORATIVE", qty: 14, sell_out_value: 1821820 },
    { item_id: "SKINTIFIC-1342", sku: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 03", category: "DECORATIVE", qty: 41, sell_out_value: 5335330 },
    { item_id: "SKINTIFIC-1343", sku: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 04", category: "DECORATIVE", qty: 43, sell_out_value: 5595590 },
    { item_id: "SKINTIFIC-1343A", sku: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 05", category: "DECORATIVE", qty: 19, sell_out_value: 2472470 },
    { item_id: "SKINTIFIC-1344", sku: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 06", category: "DECORATIVE", qty: 9, sell_out_value: 1171170 },
    { item_id: "SKINTIFIC-1345", sku: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 07", category: "DECORATIVE", qty: 7, sell_out_value: 910910 },
    { item_id: "SKINTIFIC-1346", sku: "SKINTIFIC PERFECT STAY VELVET MATTE CUSHION 08", category: "DECORATIVE", qty: 5, sell_out_value: 650650 }
  ];

  const months = ["Apr-26", "May-26", "Jun-26"];
  const data: CategoryAnalysisData[] = [];

  months.forEach((month, mIdx) => {
    // We can multiply quantities and sell out values slightly based on the month to have varied trends
    const monthMultiplier = 1 + (mIdx * 0.15);

    regions.forEach((region, rIdx) => {
      // Vary slightly per region as well
      const regionMultiplier = 1 + (rIdx * 0.1) - (rIdx === 3 ? 0.35 : 0);

      baseItems.forEach((item) => {
        const total_quantity = Math.round(item.qty * monthMultiplier * regionMultiplier);
        
        // Calculate dynamic sell out value based on quantity to keep logic realistic
        // item.sell_out_value / item.qty is the unit price
        const unitPrice = item.qty > 0 ? item.sell_out_value / item.qty : 95000;
        const sell_out_value = Math.round(total_quantity * unitPrice);

        // For Sell Through, let's make it some realistic percentage of Sell Out (e.g., 70% to 95%)
        // or 0 for Sell Out rows if they are purely Sell Out, but let's make it beautiful and varied
        const sell_through_value = Math.round(sell_out_value * (0.7 + (Math.random() * 0.2)));

        data.push({
          source_of: "SELL OUT",
          month: month,
          region: region.name,
          distributor_name: region.distributor,
          item_id: item.item_id,
          sku: item.sku,
          total_quantity: total_quantity,
          sell_through_value: sell_through_value,
          sell_out_value: sell_out_value,
          category: item.category,
          _isFallback: true
        });
      });
    });
  });

  return data;
}

export const STOCK_ANALYSIS_SCRIPT_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_STOCK_ANALYSIS_SCRIPT_URL) || "https://script.google.com/macros/s/AKfycbxnVHv-7mO5COA-PFSRn41MwRsODjJdb1v5xIrbROWPyXL9ZNeht_PYrx1CEHezA30m/exec";

let cachedStockAnalysisData: StockAnalysisData[] | null = null;
let lastStockAnalysisFetchTime = 0;

export async function fetchStockAnalysisData(forceRefresh = false): Promise<StockAnalysisData[]> {
  const now = Date.now();
  if (!forceRefresh && cachedStockAnalysisData && (now - lastStockAnalysisFetchTime < CACHE_DURATION)) {
    console.log("Returning cached Stock Analysis data");
    return cachedStockAnalysisData;
  }

  let rawData: any = null;
  let lastErrorMessage = "";

  // 1. First attempt: fetch via local Node proxy route
  try {
    const response = await fetch(`/api/stock-analysis`);
    if (response.ok) {
      const json = await response.json();
      if (json && json.success !== false) {
        rawData = json;
      } else {
        lastErrorMessage = json?.message || "GAS proxy returned success: false or invalid response.";
        console.warn("GAS proxy returned success: false or invalid response for Stock Analysis:", lastErrorMessage);
      }
    } else {
      lastErrorMessage = `Local proxy returned status ${response.status}`;
      console.warn(`Local proxy returned status ${response.status} for Stock Analysis. Trying direct browser fetch.`);
    }
  } catch (proxyError: any) {
    lastErrorMessage = proxyError?.message || String(proxyError);
    console.warn("Proxy fetch nested error for Stock Analysis:", proxyError);
  }

  // 2. Second attempt: fallback to direct GAS browser fetch
  const scriptUrl = STOCK_ANALYSIS_SCRIPT_URL;
  if (!rawData && scriptUrl && scriptUrl.startsWith("https://") && !scriptUrl.includes("placeholder")) {
    try {
      console.log("Attempting direct browser fetch for Stock Analysis from:", scriptUrl);
      const response = await fetch(scriptUrl);
      if (response.ok) {
        rawData = await response.json();
        console.log("Direct browser fetch for Stock Analysis succeeded!");
      } else {
        lastErrorMessage = `Direct fetch returned status: ${response.status}`;
        throw new Error(lastErrorMessage);
      }
    } catch (directError: any) {
      lastErrorMessage = directError?.message || String(directError);
      console.error("Direct browser fetch for Stock Analysis failed:", directError);
    }
  }

  // 3. Map retrieved JSON payload
  if (rawData) {
    try {
      const payloadObj = (rawData && rawData.success === true && rawData.data) ? rawData.data : rawData;

      let arrayData: any[] = [];
      if (Array.isArray(payloadObj)) {
        arrayData = payloadObj;
      } else if (payloadObj && typeof payloadObj === "object") {
        if (Array.isArray(payloadObj.data)) {
          arrayData = payloadObj.data;
        } else if (Array.isArray(payloadObj.rows)) {
          arrayData = payloadObj.rows;
        } else if (Array.isArray(payloadObj.records)) {
          arrayData = payloadObj.records;
        } else {
          const possibleArray = Object.values(payloadObj).find(val => Array.isArray(val)) as any[];
          if (possibleArray) {
            arrayData = possibleArray;
          } else {
            console.error("No recognizable array found in Google Apps Script response for Stock Analysis");
          }
        }
      }

      if (arrayData.length > 0) {
        console.log("Fetched Stock Analysis records:", arrayData.length);

        const mappedData = arrayData.map((item: any) => {
          const itemNormalized: Record<string, any> = {};
          for (const k of Object.keys(item)) {
            const cleanK = k.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
            itemNormalized[cleanK] = item[k];
          }

          const findString = (exactAndAliases: string[], defaultValue = ""): string => {
            for (const key of exactAndAliases) {
              const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
              if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
                return String(itemNormalized[cleanK]).trim() || defaultValue;
              }
            }
            return defaultValue;
          };

          const findNumber = (exactAndAliases: string[], defaultValue = 0): number => {
            for (const key of exactAndAliases) {
              const cleanK = key.toLowerCase().replace(/[\s_\-\.\(\)]/g, "");
              if (itemNormalized[cleanK] !== undefined && itemNormalized[cleanK] !== null) {
                const num = parseFloat(String(itemNormalized[cleanK]).replace(/[^0-9\.\-]/g, ""));
                return isNaN(num) ? defaultValue : num;
              }
            }
            return defaultValue;
          };

          return {
            update_date: findString(["updatedate", "update_date", "tanggal", "date"]),
            distributor: findString(["distributor", "distributor_name", "distributorname"]),
            product_code: findString(["productcode", "product_code", "productid", "itemid", "item_id"]),
            item_id: findString(["itemid", "item_id", "productcode", "product_code"]),
            sku: findString(["sku", "skuname", "sku_name", "nama_barang", "product"]),
            soh_qty: findNumber(["sohqty", "soh_qty", "soh", "stock_on_hand"]),
            in_transit_stock_qty: findNumber(["intransitstockqty", "in_transit_stock_qty", "intransit", "in_transit_qty"]),
            total_transit: findNumber(["totaltransit", "total_transit", "transit_total"]),
            avg_am_l3m_qty: findNumber(["avgaml3mqty", "avg_am_l3m_qty", "avg_am"]),
            last_month_st_qty: findNumber(["lastmonthstqty", "last_month_st_qty", "last_month_st"]),
            brand: findString(["brand", "brand_of", "brandname"]),
            avg_st_l3m: findNumber(["avgstl3m", "avg_st_l3m", "avg_st"]),
            stock_total: findNumber(["stocktotal", "stock_total", "total_stock"]),
            woi_st_l3m: findNumber(["woistl3m", "woi_st_l3m", "woi"]),
            death_stock_flag: findString(["deathstockflag", "death_stock_flag", "deadstock"]),
            remarks_woi: findString(["remarkswoi", "remarks_woi", "remarks"]),
            po_remarks: findString(["poremarks", "po_remarks", "po_remark"])
          };
        });

        cachedStockAnalysisData = mappedData;
        lastStockAnalysisFetchTime = now;
        return mappedData;
      }
    } catch (parseErr: any) {
      console.error("Failed to parse retrieved Stock Analysis data, falling back to mock:", parseErr);
      if (forceRefresh) {
        throw new Error(`Data parsing error: ${parseErr?.message || parseErr}`);
      }
    }
  }

  if (forceRefresh) {
    throw new Error(lastErrorMessage || "Failed to sync spreadsheet. Connection failed or Google Apps Script returned invalid response.");
  }

  // Fallback to High-Fidelity Mock
  console.log("Using High-Fidelity local mock Stock Analysis data");
  const mockData = generateMockStockAnalysisData();
  cachedStockAnalysisData = mockData;
  lastStockAnalysisFetchTime = now;
  return mockData;
}

export function generateMockStockAnalysisData(): StockAnalysisData[] {
  return [
    {
      update_date: "7/8/2026",
      distributor: "CV BUANA DISTRIBUSINDO UTAMA",
      product_code: "FJM020001",
      item_id: "FJM020001",
      sku: "FACERINNA 2% NIACINAMIDE POWER BRIGHT CLEANSER",
      soh_qty: 436,
      in_transit_stock_qty: 288,
      total_transit: 288,
      avg_am_l3m_qty: 6,
      last_month_st_qty: 283,
      brand: "FACERINNA",
      avg_st_l3m: 207,
      stock_total: 724,
      woi_st_l3m: 15,
      death_stock_flag: "",
      remarks_woi: "High WOI",
      po_remarks: "Stop PO"
    },
    {
      update_date: "7/8/2026",
      distributor: "CV BUANA DISTRIBUSINDO UTAMA",
      product_code: "FFC001001",
      item_id: "FFC001001",
      sku: "FACERINNA NIACINAMIDE BRIGHTENING SERUM SUNSCREEN SPF 50 PA++++ 50ML",
      soh_qty: 295,
      in_transit_stock_qty: 480,
      total_transit: 480,
      avg_am_l3m_qty: 12,
      last_month_st_qty: 621,
      brand: "FACERINNA",
      avg_st_l3m: 636,
      stock_total: 775,
      woi_st_l3m: 5,
      death_stock_flag: "",
      remarks_woi: "OOS Risk",
      po_remarks: "Available for PO"
    },
    {
      update_date: "7/8/2026",
      distributor: "CV BUANA DISTRIBUSINDO UTAMA",
      product_code: "FJM020002",
      item_id: "FJM020002",
      sku: "FACERINNA 2% NIACINAMIDE POWER BRIGHT CLEANSER",
      soh_qty: 2,
      in_transit_stock_qty: 768,
      total_transit: 768,
      avg_am_l3m_qty: 7,
      last_month_st_qty: 102,
      brand: "FACERINNA",
      avg_st_l3m: 102,
      stock_total: 770,
      woi_st_l3m: 33,
      death_stock_flag: "",
      remarks_woi: "High WOI",
      po_remarks: "Stop PO"
    },
    {
      update_date: "7/8/2026",
      distributor: "CV BUANA DISTRIBUSINDO UTAMA",
      product_code: "FJH018001",
      item_id: "FJH018001",
      sku: "FACERINNA 10% NIACINAMIDE 3% TXA BRIGHT DARK SPOT SERUM",
      soh_qty: 474,
      in_transit_stock_qty: 0,
      total_transit: 0,
      avg_am_l3m_qty: 7,
      last_month_st_qty: 211,
      brand: "FACERINNA",
      avg_st_l3m: 179,
      stock_total: 474,
      woi_st_l3m: 11,
      death_stock_flag: "",
      remarks_woi: "OOS Risk",
      po_remarks: "Available for PO"
    },
    {
      update_date: "7/8/2026",
      distributor: "CV BUANA DISTRIBUSINDO UTAMA",
      product_code: "FJM005002",
      item_id: "FJM005002",
      sku: "FACERINNA SALICYLIC ACID ACNE GEL CLEANSER",
      soh_qty: 469,
      in_transit_stock_qty: 0,
      total_transit: 0,
      avg_am_l3m_qty: 6,
      last_month_st_qty: 124,
      brand: "FACERINNA",
      avg_st_l3m: 119,
      stock_total: 469,
      woi_st_l3m: 17,
      death_stock_flag: "",
      remarks_woi: "High WOI",
      po_remarks: "Stop PO"
    },
    {
      update_date: "7/13/2026",
      distributor: "PT TRIJAYA ADHIRAJA ABADI - BALI",
      product_code: "FMS004001",
      item_id: "FMS004001",
      sku: "FACERINNA CERAMIDE B5 BALANCING MOISTURIZER",
      soh_qty: 172,
      in_transit_stock_qty: 24,
      total_transit: 24,
      avg_am_l3m_qty: 8,
      last_month_st_qty: 90,
      brand: "FACERINNA",
      avg_st_l3m: 83,
      stock_total: 196,
      woi_st_l3m: 10,
      death_stock_flag: "",
      remarks_woi: "High WOI",
      po_remarks: "Stop PO"
    },
    {
      update_date: "7/13/2026",
      distributor: "PT TRIJAYA ADHIRAJA ABADI - TARA",
      product_code: "FJM002003",
      item_id: "FJM002003",
      sku: "FACERINNA LOW PH B5 GEL CLEANSER",
      soh_qty: 11,
      in_transit_stock_qty: 0,
      total_transit: 0,
      avg_am_l3m_qty: 7,
      last_month_st_qty: 0,
      brand: "FACERINNA",
      avg_st_l3m: 14,
      stock_total: 11,
      woi_st_l3m: 4,
      death_stock_flag: "",
      remarks_woi: "OOS Risk",
      po_remarks: "Available for PO"
    },
    {
      update_date: "7/13/2026",
      distributor: "PT TRIJAYA ADHIRAJA ABADI - TARA",
      product_code: "FJM002002",
      item_id: "FJM002002",
      sku: "FACERINNA LOW PH B5 GEL CLEANSER",
      soh_qty: 389,
      in_transit_stock_qty: 0,
      total_transit: 0,
      avg_am_l3m_qty: 6,
      last_month_st_qty: 22,
      brand: "FACERINNA",
      avg_st_l3m: 37,
      stock_total: 389,
      woi_st_l3m: 46,
      death_stock_flag: "",
      remarks_woi: "High WOI",
      po_remarks: "Stop PO"
    },
    {
      update_date: "7/13/2026",
      distributor: "PT TRIJAYA ADHIRAJA ABADI - BERA",
      product_code: "FMS013001",
      item_id: "FMS013001",
      sku: "FACERINNA 5% NIACINAMIDE 1% TXA BRIGHT DARK SPOT MOISTURIZER",
      soh_qty: 47,
      in_transit_stock_qty: 0,
      total_transit: 0,
      avg_am_l3m_qty: 10,
      last_month_st_qty: 8,
      brand: "FACERINNA",
      avg_st_l3m: 14,
      stock_total: 47,
      woi_st_l3m: 14,
      death_stock_flag: "",
      remarks_woi: "High WOI",
      po_remarks: "Stop PO"
    },
    {
      update_date: "7/13/2026",
      distributor: "PT TRIJAYA ADHIRAJA ABADI - GROI",
      product_code: "FJM002002",
      item_id: "FJM002002",
      sku: "FACERINNA LOW PH B5 GEL CLEANSER",
      soh_qty: 21,
      in_transit_stock_qty: 0,
      total_transit: 0,
      avg_am_l3m_qty: 4,
      last_month_st_qty: 18,
      brand: "FACERINNA",
      avg_st_l3m: 12,
      stock_total: 21,
      woi_st_l3m: 8,
      death_stock_flag: "",
      remarks_woi: "High WOI",
      po_remarks: "Stop PO"
    },
    {
      update_date: "7/13/2026",
      distributor: "PT TRIJAYA ADHIRAJA ABADI - BANJ",
      product_code: "FFC001001",
      item_id: "FFC001001",
      sku: "FACERINNA NIACINAMIDE BRIGHTENING SERUM SUNSCREEN SPF 50 PA++++ 50ML",
      soh_qty: 1226,
      in_transit_stock_qty: 0,
      total_transit: 0,
      avg_am_l3m_qty: 9,
      last_month_st_qty: 196,
      brand: "FACERINNA",
      avg_st_l3m: 116,
      stock_total: 1226,
      woi_st_l3m: 46,
      death_stock_flag: "",
      remarks_woi: "High WOI",
      po_remarks: "Stop PO"
    },
    {
      update_date: "7/13/2026",
      distributor: "PT TRIJAYA ADHIRAJA ABADI - BANJ",
      product_code: "FJH018001",
      item_id: "FJH018001",
      sku: "FACERINNA 10% NIACINAMIDE 3% TXA BRIGHT DARK SPOT SERUM",
      soh_qty: 296,
      in_transit_stock_qty: 0,
      total_transit: 0,
      avg_am_l3m_qty: 10,
      last_month_st_qty: 75,
      brand: "FACERINNA",
      avg_st_l3m: 38,
      stock_total: 296,
      woi_st_l3m: 33,
      death_stock_flag: "",
      remarks_woi: "High WOI",
      po_remarks: "Stop PO"
    },
    {
      update_date: "7/13/2026",
      distributor: "PT TRIJAYA ADHIRAJA ABADI - GORON",
      product_code: "FMS112001",
      item_id: "FMS112001",
      sku: "FACERINNA 5% B5 NIACINAMIDE BRIGHT BARRIER CREAM",
      soh_qty: 23,
      in_transit_stock_qty: 0,
      total_transit: 0,
      avg_am_l3m_qty: 1,
      last_month_st_qty: 11,
      brand: "FACERINNA",
      avg_st_l3m: 0,
      stock_total: 23,
      woi_st_l3m: 0,
      death_stock_flag: "Dead Stock",
      remarks_woi: "-",
      po_remarks: "Stop PO"
    },
    {
      update_date: "7/13/2026",
      distributor: "PT TRIJAYA ADHIRAJA ABADI - BERA",
      product_code: "FMS112001",
      item_id: "FMS112001",
      sku: "FACERINNA 5% B5 NIACINAMIDE BRIGHT BARRIER CREAM",
      soh_qty: 60,
      in_transit_stock_qty: 0,
      total_transit: 0,
      avg_am_l3m_qty: 28,
      last_month_st_qty: 72,
      brand: "FACERINNA",
      avg_st_l3m: 0,
      stock_total: 60,
      woi_st_l3m: 0,
      death_stock_flag: "Dead Stock",
      remarks_woi: "-",
      po_remarks: "Stop PO"
    }
  ];
}
