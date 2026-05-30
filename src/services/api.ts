/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SalesData, IncentiveSPVData, IncentiveSPVExclusiveData, IncentiveSEData, SellOutData } from "../types";

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

const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

export async function fetchSalesData(forceRefresh = false, sheetName = "Sell In and Through"): Promise<SalesData[]> {
  if (!SCRIPT_URL) return generateMockSalesData();

  const now = Date.now();
  if (!forceRefresh && cachedData[sheetName] && (now - lastFetchTime[sheetName] < CACHE_DURATION)) {
    console.log(`Returning cached data for ${sheetName}`);
    return cachedData[sheetName];
  }

  try {
    const response = await fetch(`/api/sales-data?sheet=${encodeURIComponent(sheetName)}`);
    if (!response.ok) throw new Error("Failed to fetch data from GAS");
    const rawData = await response.json();
    
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

  try {
    const response = await fetch(`/api/incentives-internal`);
    if (!response.ok) throw new Error("Failed to fetch incentive records from GAS");
    const rawData = await response.json();
    
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

  try {
    const response = await fetch(`/api/incentives-exclusive`);
    if (!response.ok) throw new Error("Failed to fetch exclusive incentive records from GAS");
    const rawData = await response.json();
    
    // Check if proxy returned graceful failure (e.g. 403 Forbidden or fetch failure)
    if (rawData && rawData.success === false) {
      console.warn("GAS execution failed or was forbidden, using fallback dataset:", rawData.message || rawData.errorType);
      const mockResult = generateMockIncentiveSPVExclusiveData();
      const mappedWithFallback = mockResult.map(item => ({
        ...item,
        _isFallback: true,
        _errorType: rawData.errorType || "PROXY_ERROR",
        _errorMessage: rawData.message || "Google Apps Script error"
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

  try {
    const response = await fetch(`/api/incentives-se`);
    if (!response.ok) throw new Error("Failed to fetch SE incentive records from GAS proxy");
    const rawData = await response.json();
    
    // Check if proxy returned graceful failure (e.g. not configured, 403 Forbidden or fetch failure)
    if (rawData && rawData.success === false) {
      console.warn("GAS execution for SE failed or was not configured, using fallback dataset:", rawData.message || rawData.errorType);
      const mockResult = generateMockIncentiveSEData();
      const mappedWithFallback = mockResult.map(item => ({
        ...item,
        _isFallback: true,
        _errorType: rawData.errorType || "PROXY_ERROR",
        _errorMessage: rawData.message || "Google Apps Script error for SE"
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
        incentive_st_focus: findValue(["INCENTIVES ST FOCUS", "incentive_st_focus", "incentive st focus", "incentives st focus", "bonus st focus"]),
        incentive_ao_focus: findValue(["INCENTIVES AO FOCUS", "incentive_ao_focus", "incentive ao focus", "incentives ao focus", "bonus ao focus"]),
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
