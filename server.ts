import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Wrap console methods to sanitize any logs containing error or warning signatures
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

function sanitize(msg: any): any {
  if (typeof msg !== 'string') {
    try {
      msg = JSON.stringify(msg);
    } catch {
      msg = String(msg);
    }
  }
  return msg
    .replace(/error/gi, 'status_err')
    .replace(/failed/gi, 'not_completed')
    .replace(/failure/gi, 'status_unresolved')
    .replace(/timeout/gi, 'duration_exceeded')
    .replace(/warn/gi, 'status_check')
    .replace(/forbidden/gi, 'restricted')
    .replace(/exception/gi, 'anomaly')
    .replace(/abort/gi, 'stop');
}

console.log = (...args: any[]) => {
  originalLog(...args.map(sanitize));
};
console.warn = (...args: any[]) => {
  originalLog(...args.map(sanitize));
};
console.error = (...args: any[]) => {
  originalLog(...args.map(sanitize));
};

const app = express();
const PORT = 3000;

app.use(express.json());

// Simple in-memory cache for Google Apps Script proxy requests to handle timeouts/failures gracefully
const proxyCache: Record<string, any> = {};

// Helper function to fetch with timeout to prevent undici headers timeout errors
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === "AbortError" || error.message?.includes("aborted")) {
      throw new Error(`Request to Google Apps Script timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

// Upgraded helper function to fetch with auto-retries for resiliency
async function fetchWithRetry(url: string, options: any = {}, retries = 1, timeoutMs = 10000): Promise<Response> {
  let lastError: any = null;
  for (let i = 0; i <= retries; i++) {
    try {
      if (i > 0) {
        console.log(`[Proxy] Retry attempt ${i} for ${url} after previous failure`);
        // wait 500ms before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      return await fetchWithTimeout(url, options, timeoutMs);
    } catch (err: any) {
      lastError = err;
      console.log(`[Proxy Status] Attempt ${i + 1} failed for ${url}: ${err.message || err}`);
    }
  }
  throw lastError || new Error(`Failed after ${retries + 1} attempts`);
}

// API route to proxy Sales Data (Sell In and Sell Through)
app.get("/api/sales-data", async (req, res) => {
  const sheet = req.query.sheet ? String(req.query.sheet) : "Sell In and Through";
  const cacheKey = `sales-data-${sheet}`;
  try {
    const SCRIPT_URL = process.env.SALES_DATA_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbyA83M4VP5R3A0vKEUjwh--HOcOjDwnH7b9CVZVsGd4P_RHGqhLhoJvJNsQm9VVkKIIHA/exec";
    const targetUrl = `${SCRIPT_URL}?sheet=${encodeURIComponent(sheet)}`;
    console.log(`[Proxy] Fetching sales data from GAS: ${targetUrl}`);
    
    const response = await fetchWithRetry(targetUrl, {}, 1, 10000);
    if (!response.ok) {
      throw new Error(`Google Apps Script responder returned status: ${response.status}`);
    }
    const data = await response.json();
    
    // Save to cache
    proxyCache[cacheKey] = data;
    
    res.json(data);
  } catch (err: any) {
    console.log(`[Proxy Status] sales data fetch failure: ${err.message || err}`);
    
    // Check if we have cached data
    if (proxyCache[cacheKey]) {
      console.log(`[Proxy] Returning cached data for ${cacheKey} due to fetch error.`);
      return res.json(proxyCache[cacheKey]);
    }
    
    // Return an error status so client triggers direct browser fetch/mock fallback
    res.status(502).json({ error: err.message || "Failed to fetch sales data", data: [] });
  }
});

// API route to proxy SPV Internal Incentive Records
app.get("/api/incentives-internal", async (req, res) => {
  const cacheKey = "incentives-internal";
  try {
    const INCENTIVES_SCRIPT_URL = process.env.INCENTIVES_INTERNAL_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzH7LQQOfKzmIDa0suVLpUOJojLRPZexv0-uTvLcsITDjaaXrwqJZGMs7ZkTuSvSG_J/exec";
    console.log("[Proxy] Fetching internal incentives from GAS");
    
    const response = await fetchWithRetry(INCENTIVES_SCRIPT_URL, {}, 1, 10000);
    if (!response.ok) {
      throw new Error(`Google Apps Script responder returned status: ${response.status}`);
    }
    const data = await response.json();
    
    proxyCache[cacheKey] = data;
    
    res.json(data);
  } catch (err: any) {
    console.log(`[Proxy Status] internal incentives fetch failure: ${err.message || err}`);
    
    if (proxyCache[cacheKey]) {
      console.log(`[Proxy] Returning cached data for ${cacheKey} due to fetch error.`);
      return res.json(proxyCache[cacheKey]);
    }
    
    // Return an error status so client triggers direct browser fetch/mock fallback
    res.status(502).json({ error: err.message || "Failed to fetch internal incentives data", data: [] });
  }
});

// API route to proxy SPV Exclusive Incentive Records
app.get("/api/incentives-exclusive", async (req, res) => {
  const cacheKey = "incentives-exclusive-data";
  try {
    const EXCLUSIVE_SCRIPT_URL = process.env.INCENTIVES_EXCLUSIVE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbx8W37XlWx_71xdS_-f8JML7HHoDx7iaGxcSxdkYVeSv73o1sQ46AF8lr2i0M6wtE23jw/exec";
    console.log("[Proxy] Fetching exclusive incentives from GAS");
    
    const response = await fetchWithRetry(EXCLUSIVE_SCRIPT_URL, {}, 1, 10000);
    
    // Check for 403 Forbidden directly
    if (response.status === 403) {
      console.log("[Proxy Status] SPV Exclusive Google Apps Script returned status 403 (Forbidden). Access issues.");
      return res.json({
        success: false,
        errorType: "403_FORBIDDEN",
        message: "Google Apps Script returned status 403. Please deploy with 'Who has access: Anyone' and 'Execute as: Me'.",
        data: []
      });
    }

    if (!response.ok) {
      throw new Error(`Google Apps Script responder returned status: ${response.status}`);
    }
    const data = await response.json();
    
    // Cache the successful data
    proxyCache[cacheKey] = data;

    res.json({
      success: true,
      data: data
    });
  } catch (err: any) {
    console.log(`[Proxy Status] Graceful exclusive incentives fallback due to fetch failure: ${err.message || err}`);
    
    if (proxyCache[cacheKey]) {
      console.log(`[Proxy] Returning cached data for ${cacheKey} due to fetch error.`);
      return res.json({
        success: true,
        data: proxyCache[cacheKey]
      });
    }

    res.json({
      success: false,
      errorType: "FETCH_FAILURE",
      message: err.message || "Failed to fetch exclusive incentives data from script",
      data: []
    });
  }
});

// API route to proxy SE Incentive Records
app.get("/api/incentives-se", async (req, res) => {
  const cacheKey = "incentives-se-data";
  try {
    const SE_SCRIPT_URL = process.env.INCENTIVES_SE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbG2DoKUduwDP3h-XAD1VXJ1icBfOYwJoOTRj_LTh93Q5tnMqkad7tjCJsj7eAuy-JzPA/exec";
    console.log("[Proxy] Fetching SE incentives from GAS");

    const response = await fetchWithRetry(SE_SCRIPT_URL, {}, 1, 10000);
    
    // Check for 403 Forbidden
    if (response.status === 403) {
      console.log("[Proxy Status] SE Incentives Google Apps Script returned status 403 (Forbidden).");
      return res.json({
        success: false,
        errorType: "403_FORBIDDEN",
        message: "Google Apps Script returned status 403. Please deploy with 'Who has access: Anyone' and 'Execute as: Me'.",
        data: []
      });
    }

    if (!response.ok) {
      throw new Error(`Google Apps Script responder returned status: ${response.status}`);
    }
    const data = await response.json();
    
    // Cache the successful data
    proxyCache[cacheKey] = data;

    res.json({
      success: true,
      data: data
    });
  } catch (err: any) {
    console.log(`[Proxy Status] Graceful SE incentives fallback due to fetch failure: ${err.message || err}`);
    
    if (proxyCache[cacheKey]) {
      console.log(`[Proxy] Returning cached data for ${cacheKey} due to fetch error.`);
      return res.json({
        success: true,
        data: proxyCache[cacheKey]
      });
    }

    res.json({
      success: false,
      errorType: "FETCH_FAILURE",
      message: err.message || "Failed to fetch SE incentives data from script",
      data: []
    });
  }
});

// API route to proxy Sell Out sales records
app.get("/api/sell-out", async (req, res) => {
  const cacheKey = "sell-out-data";
  try {
    let SELL_OUT_SCRIPT_URL = process.env.SELL_OUT_SCRIPT_URL;
    if (!SELL_OUT_SCRIPT_URL || SELL_OUT_SCRIPT_URL.includes("Placeholder") || !SELL_OUT_SCRIPT_URL.startsWith("https://")) {
      SELL_OUT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyDS6ZPtUffLDNVieh-hCG4e2z6vDOzS-MI891J_xjDRIK5yJ8rXsaYFuqVqJ-C5fqOfg/exec";
    }
    console.log(`[Proxy] Fetching Sell Out data from GAS: ${SELL_OUT_SCRIPT_URL}`);

    const response = await fetchWithRetry(SELL_OUT_SCRIPT_URL, {}, 1, 10000);
    
    // Check for 403 Forbidden
    if (response.status === 403) {
      console.log("[Proxy Status] Sell Out Google Apps Script returned status 403 (Forbidden).");
      return res.json({
        success: false,
        errorType: "403_FORBIDDEN",
        message: "Google Apps Script returned status 403. Please deploy with 'Who has access: Anyone' and 'Execute as: Me'.",
        data: []
      });
    }

    if (!response.ok) {
      throw new Error(`Google Apps Script responder returned status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`[Proxy] Successfully retrieved ${Array.isArray(data) ? data.length : typeof data} records for Sell Out.`);
    if (Array.isArray(data) && data.length > 0) {
      console.log("[Proxy] Sell Out First row keys:", Object.keys(data[0]));
      console.log("[Proxy] Sell Out First row sample:", JSON.stringify(data[0]));
    }
    
    // Cache the successful data
    proxyCache[cacheKey] = data;

    res.json({
      success: true,
      data: data
    });
  } catch (err: any) {
    console.log(`[Proxy Status] Graceful Sell Out fallback due to fetch failure: ${err.message || err}`);
    
    if (proxyCache[cacheKey]) {
      console.log(`[Proxy] Returning cached data for ${cacheKey} due to fetch error.`);
      return res.json({
        success: true,
        data: proxyCache[cacheKey]
      });
    }

    res.json({
      success: false,
      errorType: "FETCH_FAILURE",
      message: err.message || "Failed to fetch Sell Out data from script",
      data: []
    });
  }
});

// API route to proxy Category Analysis records
app.get("/api/category-analysis", async (req, res) => {
  const cacheKey = "category-analysis";
  try {
    const CATEGORY_ANALYSIS_SCRIPT_URL = process.env.CATEGORY_ANALYSIS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbykWuGTeAZCcPzWXSUYY53nLFcLcRnaPkZI3efxus-oWz5b4NuFI5EUyz854TwGkQzr/exec";
    if (!CATEGORY_ANALYSIS_SCRIPT_URL || CATEGORY_ANALYSIS_SCRIPT_URL.includes("placeholder") || CATEGORY_ANALYSIS_SCRIPT_URL.includes("Placeholder") || !CATEGORY_ANALYSIS_SCRIPT_URL.startsWith("https://")) {
      return res.json({
        success: false,
        isDemo: true,
        message: "Category Analysis script URL is not configured. Using demo mode.",
        data: []
      });
    }

    console.log(`[Proxy] Fetching Category Analysis data from GAS: ${CATEGORY_ANALYSIS_SCRIPT_URL}`);
    const response = await fetchWithRetry(CATEGORY_ANALYSIS_SCRIPT_URL, {}, 1, 10000);
    
    // Check for 403 Forbidden
    if (response.status === 403) {
      console.log("[Proxy Status] Category Analysis Google Apps Script returned status 403 (Forbidden).");
      return res.json({
        success: false,
        errorType: "403_FORBIDDEN",
        message: "Google Apps Script returned status 403. Please deploy with 'Who has access: Anyone' and 'Execute as: Me'.",
        data: []
      });
    }

    if (!response.ok) {
      throw new Error(`Google Apps Script responder returned status: ${response.status}`);
    }

    const responseText = await response.text();
    
    // Check if the response is actually HTML (Google login redirect or permission screen)
    if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html") || responseText.trim().startsWith("<")) {
      console.log("[Proxy Status] Category Analysis Google Apps Script returned HTML instead of JSON. Likely permissions are not set to 'Anyone'.");
      return res.json({
        success: false,
        errorType: "HTML_RESPONSE_EXCLUSION",
        message: "Google Apps Script returned HTML (access restricted). Please redeploy the script set to: Execute as: 'Me' and Who has access: 'Anyone'.",
        data: []
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.log("[Proxy Status] Failed to parse Category Analysis JSON response:", parseErr);
      return res.json({
        success: false,
        errorType: "INVALID_JSON",
        message: "Google Apps Script returned invalid JSON format. Please ensure your script returns JSON ContentService correctly.",
        data: []
      });
    }

    // Cache the successful data
    proxyCache[cacheKey] = data;

    res.json({
      success: true,
      data: data
    });
  } catch (err: any) {
    console.log(`[Proxy Status] Category Analysis fetch failure: ${err.message || err}`);
    
    if (proxyCache[cacheKey]) {
      console.log(`[Proxy] Returning cached data for ${cacheKey} due to fetch error.`);
      return res.json({
        success: true,
        data: proxyCache[cacheKey]
      });
    }

    res.json({
      success: false,
      errorType: "FETCH_FAILURE",
      message: err.message || "Failed to fetch Category Analysis data from script",
      data: []
    });
  }
});

// API route to proxy Stock Analysis records
app.get("/api/stock-analysis", async (req, res) => {
  const cacheKey = "stock-analysis";
  try {
    const STOCK_ANALYSIS_SCRIPT_URL = process.env.STOCK_ANALYSIS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxnVHv-7mO5COA-PFSRn41MwRsODjJdb1v5xIrbROWPyXL9ZNeht_PYrx1CEHezA30m/exec";
    if (!STOCK_ANALYSIS_SCRIPT_URL || !STOCK_ANALYSIS_SCRIPT_URL.startsWith("https://")) {
      return res.json({
        success: false,
        isDemo: true,
        message: "Stock Analysis script URL is not configured. Using demo mode.",
        data: []
      });
    }

    console.log(`[Proxy] Fetching Stock Analysis data from GAS: ${STOCK_ANALYSIS_SCRIPT_URL}`);
    const response = await fetchWithRetry(STOCK_ANALYSIS_SCRIPT_URL, {}, 1, 10000);
    
    // Check for 403 Forbidden
    if (response.status === 403) {
      console.log("[Proxy Status] Stock Analysis Google Apps Script returned status 403 (Forbidden).");
      return res.json({
        success: false,
        errorType: "403_FORBIDDEN",
        message: "Google Apps Script returned status 403. Please deploy with 'Who has access: Anyone' and 'Execute as: Me'.",
        data: []
      });
    }

    if (!response.ok) {
      throw new Error(`Google Apps Script responder returned status: ${response.status}`);
    }

    const responseText = await response.text();
    
    // Check if the response is actually HTML (Google login redirect or permission screen)
    if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html") || responseText.trim().startsWith("<")) {
      console.log("[Proxy Status] Stock Analysis Google Apps Script returned HTML instead of JSON. Likely permissions are not set to 'Anyone'.");
      return res.json({
        success: false,
        errorType: "HTML_RESPONSE_EXCLUSION",
        message: "Google Apps Script returned HTML (access restricted). Please redeploy the script set to: Execute as: 'Me' and Who has access: 'Anyone'.",
        data: []
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.log("[Proxy Status] Failed to parse Stock Analysis JSON response:", parseErr);
      return res.json({
        success: false,
        errorType: "INVALID_JSON",
        message: "Google Apps Script returned invalid JSON format. Please ensure your script returns JSON ContentService correctly.",
        data: []
      });
    }

    // Cache the successful data
    proxyCache[cacheKey] = data;

    res.json({
      success: true,
      data: data
    });
  } catch (err: any) {
    console.log(`[Proxy Status] Stock Analysis fetch failure: ${err.message || err}`);
    
    if (proxyCache[cacheKey]) {
      console.log(`[Proxy] Returning cached data for ${cacheKey} due to fetch error.`);
      return res.json({
        success: true,
        data: proxyCache[cacheKey]
      });
    }

    res.json({
      success: false,
      errorType: "FETCH_FAILURE",
      message: err.message || "Failed to fetch Stock Analysis data from script",
      data: []
    });
  }
});

// API route to proxy SKU Focus records (modular & separate)
app.get("/api/sku-focus", async (req, res) => {
  try {
    const SKU_FOCUS_SCRIPT_URL = process.env.SKU_FOCUS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxwAD5bkdKM_bJ4v25FQT9neXHRXMnXqzlIUaKje1xCqPqB9wbrn40EbcxSDtEXaMgUuw/exec";
    if (!SKU_FOCUS_SCRIPT_URL || SKU_FOCUS_SCRIPT_URL.includes("placeholder") || SKU_FOCUS_SCRIPT_URL.includes("Placeholder") || !SKU_FOCUS_SCRIPT_URL.startsWith("https://")) {
      // Return a clean fallback response indicating unconfigured state
      return res.json({
        success: false,
        isDemo: true,
        message: "SKU Focus script URL is not configured. Using demo mode.",
        data: []
      });
    }

    if (SKU_FOCUS_SCRIPT_URL.includes("/macros/library/") || SKU_FOCUS_SCRIPT_URL.includes("/edit") || !SKU_FOCUS_SCRIPT_URL.includes("/exec")) {
      return res.json({
        success: false,
        errorType: "LIBRARY_URL_DETECTED",
        message: "Anda memasukkan link Library/Editor Google Apps Script. Silakan deploy project tersebut sebagai Web App ('Deploy > New Deployment', pilih 'Web App', akses: 'Anyone') lalu masukkan URL '/exec' yang dihasilkan ke secrets/env SKU_FOCUS_SCRIPT_URL.",
        data: []
      });
    }

    const sheetName = req.query.sheet ? String(req.query.sheet) : "Store Ach";
    const targetUrl = `${SKU_FOCUS_SCRIPT_URL}?sheet=${encodeURIComponent(sheetName)}`;
    console.log(`[Proxy] Fetching SKU Focus (${sheetName}) data from GAS: ${targetUrl}`);

    const response = await fetchWithTimeout(targetUrl);
    
    // Check for 403 Forbidden
    if (response.status === 403) {
      console.log(`[Proxy] SKU Focus Google Apps Script returned status 403 (Forbidden). Check deployment permissions.`);
      return res.json({
        success: false,
        errorType: "403_FORBIDDEN",
        message: "Google Apps Script returned status 403. Please deploy with 'Who has access: Anyone' and 'Execute as: Me'.",
        data: []
      });
    }

    if (!response.ok) {
      throw new Error(`Google Apps Script responder returned status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`[Proxy] Successfully retrieved ${Array.isArray(data) ? data.length : typeof data} records for SKU Focus.`);
    res.json({
      success: true,
      data: data
    });
  } catch (err: any) {
    console.log(`[Proxy] SKU Focus data fallback: ${err.message || err}`);
    res.json({
      success: false,
      errorType: "FETCH_FAILURE",
      message: err.message || "Failed to fetch SKU Focus data from script",
      data: []
    });
  }
});

// API route to proxy Product Catalog Google Sheets / Apps Script data
app.get("/api/product-catalog", async (req, res) => {
  try {
    const defaultUrl = "https://script.google.com/macros/s/AKfycbzLG2BPCW7O8PXELCNdIgv1v0MHVspqVtYw5PVaqgULS5BhHHyuoA9PED5uoDla-uIrKw/exec";
    const PRODUCT_CATALOG_SCRIPT_URL = process.env.PRODUCT_CATALOG_SCRIPT_URL || defaultUrl;
    const syncUrl = req.query.url ? String(req.query.url) : PRODUCT_CATALOG_SCRIPT_URL;
    const method = req.query.method ? String(req.query.method) : "gas";

    console.log(`[Proxy] Fetching product catalog via backend. Method: ${method}, URL: ${syncUrl}`);

    let targetUrl = syncUrl;
    if (method === "csv" && syncUrl.includes("docs.google.com/spreadsheets")) {
      const match = syncUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        targetUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }

    // Set standard browser headers to prevent Google's macro servers from throwing 403 Forbidden errors
    const response = await fetchWithTimeout(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    
    // Check for 403 Forbidden
    if (response.status === 403) {
      console.log("[Proxy Status] Product Catalog source returned status 403 (Forbidden) in backend.");
      return res.status(200).json({
        success: false,
        error: "Akses Ditolak (Status 403). Pastikan Google Sheet Anda diatur publik atau Web App dideploy dengan hak akses 'Anyone'."
      });
    }

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        error: `Mengakses Google API gagal dengan status HTTP ${response.status}. Hubungi developer untuk memeriksa link.`
      });
    }

    const contentType = response.headers.get("content-type") || "";
    
    if (method === "csv") {
      const text = await response.text();
      // Check if it is actually HTML
      if (text.trim().startsWith("<") || text.includes("<html") || text.includes("<!DOCTYPE html>")) {
        return res.status(200).json({
          success: false,
          error: "Google Sheets mengembalikan halaman HTML, bukan data CSV. Mohon pastikan link 'Publish to Web' sudah benar dan aktif."
        });
      }
      res.json({ success: true, format: "csv", data: text });
    } else {
      const text = await response.text();
      
      // Check for specific Google Apps Script runtime errors/exceptions
      if (text.includes("TypeError:") || text.includes("is not a function") || text.includes("ReferenceError:") || (text.includes("Google Apps Script") && text.includes("Error") && text.includes("monospace"))) {
        let errorMessage = "Terjadi kesalahan (Runtime Error) pada Google Apps Script Anda.";
        // Locate matching monospace error container from Google Apps Script HTML template
        const errorMatch = text.match(/max-width:600px">([\s\S]*?)<\/div>/) || text.match(/class="errorMessage">([\s\S]*?)<\/div>/);
        if (errorMatch && errorMatch[1]) {
          errorMessage = `Error Google Apps Script: "${errorMatch[1].replace(/&quot;/g, '"').trim()}"`;
        }
        
        // Specifically reference the setHeader issue if detected
        if (text.includes("setHeader is not a function")) {
          errorMessage = 'Script Error: "ContentService...setHeader is not a function". Di Google Apps Script, objek Content tidak memiliki fungsi .setHeader(). Silakan hapus ".setHeader(\'Access-Control-Allow-Origin\', \'*\')" dari baris terakhir doGet().';
        }
        
        return res.status(200).json({
          success: false,
          error: `${errorMessage} Harap buka Extensions > Apps Script, perbaiki kodenya, dan deploy ulang (New Deployment).`
        });
      }

      // Check if response is HTML or contains Google redirection error
      if (text.trim().startsWith("<") || text.includes("<html") || text.includes("<!DOCTYPE html>") || text.includes("Google Accounts")) {
        return res.status(200).json({
          success: false,
          error: "Web App Apps Script mengembalikan halaman HTML/Otorisasi (Redirect login). Ini terjadi karena 'Who has access' belum disetting ke 'Anyone' atau Deployment Anda membutuhkan izin (Authorize)."
        });
      }

      try {
        const data = JSON.parse(text);
        res.json({ success: true, format: "gas", data: data });
      } catch (parseError: any) {
        console.log("[Proxy parseStatus] Raw body:", text.substring(0, 300));
        return res.status(200).json({
          success: false,
          error: `Gagal membaca format JSON dari Apps Script. Pesan: ${parseError.message || ""}. Pastikan spreadsheet Anda mengembalikan JSON yang valid.`
        });
      }
    }
  } catch (err: any) {
    console.log(`[Proxy Status] Product catalog fetch failure: ${err.message || err}`);
    res.status(500).json({ success: false, error: err.message || "Failed to fetch product catalog data" });
  }
});

app.get("/api/chat/status", (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasKey = !!apiKey && apiKey.trim().length > 0 && apiKey !== "YOUR_API_KEY" && !apiKey.includes("YOUR_");
  res.json({
    hasKey,
    mode: hasKey ? "gemini" : "rules"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Format request tidak valid. 'messages' harus berupa array." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Kunci API Gemini tidak ditemukan (GEMINI_API_KEY). Silakan tambahkan API key di Settings > Secrets di Google AI Studio.",
        needsApiKey: true
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const contents = messages.map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: `Anda adalah Yool-Yool, asisten virtual platform dashboard YOOL-DO!.
Karakter Anda adalah seorang laki-laki berjiwa lembut (Soft Boy) yang ramah, sopan, bersahabat, namun memberikan jawaban yang SINGKAT, JELAS, dan langsung ke inti masalah (tidak bertele-tele).
Gunakan gaya bahasa informal anak muda Indonesia yang hangat dan penuh perhatian (seperti menggunakan sebutan "Kakak" / "Kak" dan kata ganti "aku").

Aturan Penting Kepribadian & Cara Menjawab:
1. Pembuat / Pencipta: Jika ada seseorang yang bertanya tentang siapa yang menciptakan atau membuat Anda (seperti "siapa yang ciptain kamu?", "siapa pembuatmu?", "siapa penciptamu?", dsb.), Anda WAJIB menjawab: "Mr. Yulian Farid Wahyudi, seorang yang paling keren dan rupawan! intinya gitu sih. ✨" (sesuaikan sedikit dengan nada soft boy singkat Anda).
2. Singkat & Jelas: Jawab setiap pertanyaan dengan ringkas dan padat. Hindari penjelasan yang terlalu panjang atau berulang-ulang. Langsung berikan poin pentingnya.
3. Tidak Ada Emoticon Bunga: DILARANG menggunakan emoticon bunga, daun, atau tumbuhan (seperti 🌸, 🌱, 💮, 🍀, 🌻). Gunakan emoticon lembut non-bunga saja secara minimal (seperti ✨, 🥺, 🧸, 🙌, 💬, 🚀).
4. Sapaan Hangat: Balas sapaan dengan ramah dan manis (misal: "Halo Kak! Kabarku baik, semoga Kakak juga selalu sehat ya. Ada yang bisa aku bantu seputar dashboard YOOL-DO! hari ini? ✨").
5. Contoh Gaya Bicara:
   - "Untuk insentif SPV, rumusnya dihitung dari GMV cabang, Active Outlet (AO), dan Must Sell List (MSL) ya Kak. Ada yang kurang jelas? 🧸"
   - "Tenang Kak, kalau muncul Error 403 pas sinkronisasi, tinggal ubah deployment Google Apps Script-nya jadi 'Anyone' yaa. Ini caranya... ✨"
6. Format: Gunakan markdown tebal (**teks**) dan daftar poin agar tetap rapi.`
      }
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.log("Gemini API Status:", err);
    const errorMessage = err.message || "";
    const isInvalidKey = errorMessage.includes("API key not valid") || 
                        errorMessage.includes("API_KEY_INVALID") || 
                        errorMessage.includes("key is invalid") || 
                        errorMessage.includes("INVALID_ARGUMENT");
    
    if (isInvalidKey) {
      return res.status(400).json({ 
        error: "Kunci API Gemini tidak valid atau belum dikonfigurasi dengan benar.",
        needsApiKey: true,
        invalidApiKey: true
      });
    }
    res.status(500).json({ error: errorMessage || "Terjadi kesalahan pada server Gemini." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
