import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// API route to proxy Sales Data (Sell In and Sell Through)
app.get("/api/sales-data", async (req, res) => {
  try {
    const sheet = req.query.sheet ? String(req.query.sheet) : "Sell In and Through";
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyA83M4VP5R3A0vKEUjwh--HOcOjDwnH7b9CVZVsGd4P_RHGqhLhoJvJNsQm9VVkKIIHA/exec";
    const targetUrl = `${SCRIPT_URL}?sheet=${encodeURIComponent(sheet)}`;
    console.log(`[Proxy] Fetching sales data from GAS: ${targetUrl}`);
    
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Google Apps Script responder returned status: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.error("[Proxy Error] sales data fetch failure:", err);
    res.status(500).json({ error: err.message || "Failed to fetch sales data from script" });
  }
});

// API route to proxy SPV Internal Incentive Records
app.get("/api/incentives-internal", async (req, res) => {
  try {
    const INCENTIVES_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzH7LQQOfKzmIDa0suVLpUOJojLRPZexv0-uTvLcsITDjaaXrwqJZGMs7ZkTuSvSG_J/exec";
    console.log("[Proxy] Fetching internal incentives from GAS");
    
    const response = await fetch(INCENTIVES_SCRIPT_URL);
    if (!response.ok) {
      throw new Error(`Google Apps Script responder returned status: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    console.error("[Proxy Error] internal incentives fetch failure:", err);
    res.status(500).json({ error: err.message || "Failed to fetch internal incentives data from script" });
  }
});

// API route to proxy SPV Exclusive Incentive Records
app.get("/api/incentives-exclusive", async (req, res) => {
  try {
    const EXCLUSIVE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx8W37XlWx_71xdS_-f8JML7HHoDx7iaGxcSxdkYVeSv73o1sQ46AF8lr2i0M6wtE23jw/exec";
    console.log("[Proxy] Fetching exclusive incentives from GAS");
    
    const response = await fetch(EXCLUSIVE_SCRIPT_URL);
    
    // Check for 403 Forbidden directly
    if (response.status === 403) {
      console.warn("[Proxy Warning] SPV Exclusive Google Apps Script returned status 403 (Forbidden). Access issues.");
      return res.json({
        success: false,
        errorType: "403_FORBIDDEN",
        message: "Google Apps Script returned status 403. Please deployed with 'Who has access: Anyone' and 'Execute as: Me'.",
        data: []
      });
    }

    if (!response.ok) {
      throw new Error(`Google Apps Script responder returned status: ${response.status}`);
    }
    const data = await response.json();
    res.json({
      success: true,
      data: data
    });
  } catch (err: any) {
    console.warn("[Proxy Warning] Graceful exclusive incentives fallback due to fetch failure:", err.message || err);
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
  try {
    const SE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxG2DoKUduwDP3h-XAD1VXJ1icBfOYwJoOTRj_LTh93Q5tnMqkad7tjCJsj7eAuy-JzPA/exec";
    console.log("[Proxy] Fetching SE incentives from GAS");

    const response = await fetch(SE_SCRIPT_URL);
    
    // Check for 403 Forbidden
    if (response.status === 403) {
      console.warn("[Proxy Warning] SE Incentives Google Apps Script returned status 403 (Forbidden).");
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
    res.json({
      success: true,
      data: data
    });
  } catch (err: any) {
    console.warn("[Proxy Warning] Graceful SE incentives fallback due to fetch failure:", err.message || err);
    res.json({
      success: false,
      errorType: "FETCH_FAILURE",
      message: err.message || "Failed to fetch SE incentives data from script",
      data: []
    });
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
