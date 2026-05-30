/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { SellOutData } from "../types";
import { formatNumber } from "../lib/utils";
import ContributionTable from "./ContributionTable";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Layers, 
  MapPin, 
  Compass, 
  Search, 
  Sparkles,
  ArrowUpRight, 
  Info,
  DollarSign,
  AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  ScatterChart,
  Scatter
} from "recharts";

interface SellOutDashboardProps {
  data: SellOutData[];
}

export default function SellOutDashboard({ data }: SellOutDashboardProps) {
  // If no data matches, show a graceful fallback state
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
        <Info className="text-slate-400 w-12 h-12 mb-4 animate-bounce" />
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">No Data Available</h3>
        <p className="text-xs text-slate-400 max-w-sm">No sales records match the selected filters. Please adjust your criteria above.</p>
      </div>
    );
  }

  // Define brand color palette
  const getPaletteColor = (index: number) => {
    const colors = ["#2563eb", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
    return colors[index % colors.length];
  };

  // Safe growth calculation helper
  const calculateGrowth = (current: number, previous: number): number => {
    if (!previous || previous === 0) return 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
  };

  // ==========================================
  // SECTION 1: EXEC SUMMARY (KPIs)
  // ==========================================
  const metrics = useMemo(() => {
    // 1. Grand totals
    const totalSellOut = data.reduce((sum, item) => sum + (item.sell_out_value || 0), 0);
    const totalSellThrough = data.reduce((sum, item) => sum + (item.sell_through_value || 0), 0);

    // Parse dates to find the latest month & year represented in the ACTIVE filtered dataset
    const dates = data.map(item => new Date(item.calendar_date)).filter(d => !isNaN(d.getTime()));
    if (dates.length === 0) {
      return {
        totalSellOut,
        totalSellThrough,
        soMoM: 0,
        soYoY: 0,
        stMoM: 0,
        stYoY: 0,
        currentSoMtd: 0,
        currentStMtd: 0
      };
    }

    const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const latestMonth = latestDate.getMonth();
    const latestYear = latestDate.getFullYear();

    // MTD data (Current month + year)
    const currentMtdData = data.filter(item => {
      const d = new Date(item.calendar_date);
      return d.getMonth() === latestMonth && d.getFullYear() === latestYear;
    });

    // MoM previous period (Previous month, same year / wrap to Dec previous year)
    const lastMonth = latestMonth === 0 ? 11 : latestMonth - 1;
    const lastMonthYear = latestMonth === 0 ? latestYear - 1 : latestYear;
    const prevMonthData = data.filter(item => {
      const d = new Date(item.calendar_date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    // YoY previous period (Same month, previous year)
    const prevYearData = data.filter(item => {
      const d = new Date(item.calendar_date);
      return d.getMonth() === latestMonth && d.getFullYear() === latestYear - 1;
    });

    const currentSoMtd = currentMtdData.reduce((sum, item) => sum + (item.sell_out_value || 0), 0);
    const prevSoMtd = prevMonthData.reduce((sum, item) => sum + (item.sell_out_value || 0), 0);
    const prevSoYearMtd = prevYearData.reduce((sum, item) => sum + (item.sell_out_value || 0), 0);

    const currentStMtd = currentMtdData.reduce((sum, item) => sum + (item.sell_through_value || 0), 0);
    const prevStMtd = prevMonthData.reduce((sum, item) => sum + (item.sell_through_value || 0), 0);
    const prevStYearMtd = prevYearData.reduce((sum, item) => sum + (item.sell_through_value || 0), 0);

    const soMoM = calculateGrowth(currentSoMtd, prevSoMtd);
    const soYoY = calculateGrowth(currentSoMtd, prevSoYearMtd);
    const stMoM = calculateGrowth(currentStMtd, prevStMtd);
    const stYoY = calculateGrowth(currentStMtd, prevStYearMtd);

    return {
      totalSellOut,
      totalSellThrough,
      soMoM,
      soYoY,
      stMoM,
      stYoY,
      currentSoMtd,
      currentStMtd
    };
  }, [data]);

  // ==========================================
  // SECTION 2: TREND ANALYSIS
  // ==========================================
  const trendData = useMemo(() => {
    // Group values by Month-Year
    const monthsMap: Record<string, { dateObj: Date; label: string; sellOut: number; sellThrough: number }> = {};
    
    data.forEach(item => {
      const date = new Date(item.calendar_date);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      
      if (!monthsMap[key]) {
        monthsMap[key] = {
          dateObj: date,
          label: label,
          sellOut: 0,
          sellThrough: 0
        };
      }
      monthsMap[key].sellOut += (item.sell_out_value || 0);
      monthsMap[key].sellThrough += (item.sell_through_value || 0);
    });

    // Sort by chronological order
    return Object.values(monthsMap)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .map(m => ({
        date: m.label,
        "Sell Out": m.sellOut,
        "Sell Through": m.sellThrough
      }));
  }, [data]);

  // ==========================================
  // SECTION 3: REGIONAL & CHANNEL PERFORMANCE
  // ==========================================
  const regionPerformance = useMemo(() => {
    const regionMap: Record<string, { name: string; sellOutCurrentMtd: number; sellOutPrevMtd: number; totalSellOut: number; totalSellThrough: number }> = {};
    
    // Determine latest dates inside each region for MoM calculation
    const dates = data.map(item => new Date(item.calendar_date)).filter(d => !isNaN(d.getTime()));
    const latestDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
    const latestMonth = latestDate.getMonth();
    const latestYear = latestDate.getFullYear();
    const lastMonth = latestMonth === 0 ? 11 : latestMonth - 1;
    const lastMonthYear = latestMonth === 0 ? latestYear - 1 : latestYear;

    data.forEach(item => {
      const region = item.region || "Unknown Region";
      if (!regionMap[region]) {
        regionMap[region] = { name: region, sellOutCurrentMtd: 0, sellOutPrevMtd: 0, totalSellOut: 0, totalSellThrough: 0 };
      }
      regionMap[region].totalSellOut += (item.sell_out_value || 0);
      regionMap[region].totalSellThrough += (item.sell_through_value || 0);

      const d = new Date(item.calendar_date);
      if (!isNaN(d.getTime())) {
        if (d.getMonth() === latestMonth && d.getFullYear() === latestYear) {
          regionMap[region].sellOutCurrentMtd += (item.sell_out_value || 0);
        } else if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
          regionMap[region].sellOutPrevMtd += (item.sell_out_value || 0);
        }
      }
    });

    const totalSOAll = Object.values(regionMap).reduce((sum, r) => sum + r.totalSellOut, 0);

    return Object.values(regionMap).map(r => {
      const growthPct = calculateGrowth(r.sellOutCurrentMtd, r.sellOutPrevMtd);
      const contributionPct = totalSOAll > 0 ? parseFloat(((r.totalSellOut / totalSOAll) * 100).toFixed(1)) : 0;
      return {
        name: r.name,
        sellOut: r.totalSellOut,
        sellThrough: r.totalSellThrough,
        growthPct,
        contributionPct
      };
    }).sort((a, b) => b.sellOut - a.sellOut);
  }, [data]);

  // ==========================================
  // SECTION 4: PRODUCT PERFORMANCE
  // ==========================================
  const productPerformance = useMemo(() => {
    const categoryMap: Record<string, { value: number }> = {};
    const segmentMap: Record<string, {
      region: string;
      name: string;
      sellOutCurrentMtd: number;
      sellOutPrevMtd: number;
      totalSellOut: number;
      sellThroughCurrentMtd: number;
      sellThroughPrevMtd: number;
      totalSellThrough: number;
    }> = {};

    const dates = data.map(item => new Date(item.calendar_date)).filter(d => !isNaN(d.getTime()));
    const latestDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
    const latestMonth = latestDate.getMonth();
    const latestYear = latestDate.getFullYear();
    const lastMonth = latestMonth === 0 ? 11 : latestMonth - 1;
    const lastMonthYear = latestMonth === 0 ? latestYear - 1 : latestYear;

    data.forEach(item => {
      const category = item.category || "Others";
      categoryMap[category] = categoryMap[category] || { value: 0 };
      categoryMap[category].value += (item.sell_out_value || 0);

      const region = item.region || "Unknown Region";
      const segment = item.segment || "General";
      const key = `${region}_${segment}`;

      if (!segmentMap[key]) {
        segmentMap[key] = {
          region,
          name: segment,
          sellOutCurrentMtd: 0,
          sellOutPrevMtd: 0,
          totalSellOut: 0,
          sellThroughCurrentMtd: 0,
          sellThroughPrevMtd: 0,
          totalSellThrough: 0
        };
      }
      segmentMap[key].totalSellOut += (item.sell_out_value || 0);
      segmentMap[key].totalSellThrough += (item.sell_through_value || 0);

      const d = new Date(item.calendar_date);
      if (!isNaN(d.getTime())) {
        if (d.getMonth() === latestMonth && d.getFullYear() === latestYear) {
          segmentMap[key].sellOutCurrentMtd += (item.sell_out_value || 0);
          segmentMap[key].sellThroughCurrentMtd += (item.sell_through_value || 0);
        } else if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
          segmentMap[key].sellOutPrevMtd += (item.sell_out_value || 0);
          segmentMap[key].sellThroughPrevMtd += (item.sell_through_value || 0);
        }
      }
    });

    const totalSOAll = Object.values(segmentMap).reduce((sum, s) => sum + s.totalSellOut, 0);

    const categoriesList = Object.entries(categoryMap).map(([name, obj]) => ({
      name,
      value: obj.value,
      pct: totalSOAll > 0 ? parseFloat(((obj.value / totalSOAll) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.value - a.value);

    const segmentsList = Object.values(segmentMap).map(s => {
      const growthPct = calculateGrowth(s.sellOutCurrentMtd, s.sellOutPrevMtd);
      const contributionPct = totalSOAll > 0 ? parseFloat(((s.totalSellOut / totalSOAll) * 100).toFixed(1)) : 0;
      const soVsStPct = s.totalSellThrough > 0 ? parseFloat(((s.totalSellOut / s.totalSellThrough) * 100).toFixed(1)) : 0;
      return {
        region: s.region,
        name: s.name,
        sellOut: s.totalSellOut,
        sellThrough: s.totalSellThrough,
        soVsStPct,
        growthPct,
        contributionPct
      };
    }).sort((a, b) => b.sellOut - a.sellOut);

    // Grouping segments by region to structure subtotals and sort by Region's total sell out descending
    const regionGroupMap: Record<string, {
      regionName: string;
      segments: Array<{
        region: string;
        name: string;
        sellOut: number;
        sellThrough: number;
        soVsStPct: number;
        growthPct: number;
        contributionPct: number;
      }>;
      totalSellOut: number;
      totalSellThrough: number;
      sellOutCurrentMtd: number;
      sellOutPrevMtd: number;
    }> = {};

    Object.values(segmentMap).forEach(s => {
      const r = s.region;
      if (!regionGroupMap[r]) {
        regionGroupMap[r] = {
          regionName: r,
          segments: [],
          totalSellOut: 0,
          totalSellThrough: 0,
          sellOutCurrentMtd: 0,
          sellOutPrevMtd: 0,
        };
      }
      regionGroupMap[r].totalSellOut += s.totalSellOut;
      regionGroupMap[r].totalSellThrough += s.totalSellThrough;
      regionGroupMap[r].sellOutCurrentMtd += s.sellOutCurrentMtd;
      regionGroupMap[r].sellOutPrevMtd += s.sellOutPrevMtd;

      const growthPct = calculateGrowth(s.sellOutCurrentMtd, s.sellOutPrevMtd);
      const contributionPct = totalSOAll > 0 ? parseFloat(((s.totalSellOut / totalSOAll) * 100).toFixed(1)) : 0;
      const soVsStPct = s.totalSellThrough > 0 ? parseFloat(((s.totalSellOut / s.totalSellThrough) * 100).toFixed(1)) : 0;

      regionGroupMap[r].segments.push({
        region: s.region,
        name: s.name,
        sellOut: s.totalSellOut,
        sellThrough: s.totalSellThrough,
        soVsStPct,
        growthPct,
        contributionPct
      });
    });

    // Make list of grouped regions and sort regions descending by their total sell out
    const sortedRegionsList = Object.values(regionGroupMap).map(r => {
      // Sort segments inside the region descending by totalSellOut as well
      r.segments.sort((a, b) => b.sellOut - a.sellOut);

      const growthPct = calculateGrowth(r.sellOutCurrentMtd, r.sellOutPrevMtd);
      const contributionPct = totalSOAll > 0 ? parseFloat(((r.totalSellOut / totalSOAll) * 100).toFixed(1)) : 0;
      const subtotalSoVsStPct = r.totalSellThrough > 0 ? parseFloat(((r.totalSellOut / r.totalSellThrough) * 100).toFixed(1)) : 0;

      return {
        regionName: r.regionName,
        segments: r.segments,
        subtotal: {
          sellOut: r.totalSellOut,
          sellThrough: r.totalSellThrough,
          soVsStPct: subtotalSoVsStPct,
          growthPct,
          contributionPct
        }
      };
    }).sort((a, b) => b.subtotal.sellOut - a.subtotal.sellOut);

    // Compute Grand Total
    const grandTotalCurrentMtd = Object.values(regionGroupMap).reduce((sum, r) => sum + r.sellOutCurrentMtd, 0);
    const grandTotalPrevMtd = Object.values(regionGroupMap).reduce((sum, r) => sum + r.sellOutPrevMtd, 0);
    const grandTotalGrowthPct = calculateGrowth(grandTotalCurrentMtd, grandTotalPrevMtd);
    const grandTotalSellThrough = Object.values(regionGroupMap).reduce((sum, r) => sum + r.totalSellThrough, 0);
    const grandTotalSoVsStPct = grandTotalSellThrough > 0 ? parseFloat(((totalSOAll / grandTotalSellThrough) * 100).toFixed(1)) : 0;

    const grandTotal = {
      sellOut: totalSOAll,
      sellThrough: grandTotalSellThrough,
      soVsStPct: grandTotalSoVsStPct,
      growthPct: grandTotalGrowthPct,
      contributionPct: totalSOAll > 0 ? 100 : 0
    };

    return {
      categories: categoriesList,
      segments: segmentsList,
      regions: sortedRegionsList,
      grandTotal
    };
  }, [data]);

  // ==========================================
  // SECTION 5: SALES EFFECTIVENESS
  // ==========================================
  // Scatter Plot: Aggregate by Region & Channel & Month to create comparative points
  const effectivenessData = useMemo(() => {
    const mapKeys: Record<string, { region: string; channel: string; sellOut: number; sellThrough: number }> = {};
    
    data.forEach(item => {
      const r = item.region || "Unknown";
      const c = item.channel || "Unknown";
      const d = new Date(item.calendar_date);
      const mStr = d.getMonth() + "_" + d.getFullYear();
      const comb = r + " | " + c + " (" + mStr + ")";

      if (!mapKeys[comb]) {
        mapKeys[comb] = { region: r, channel: c, sellOut: 0, sellThrough: 0 };
      }
      mapKeys[comb].sellOut += (item.sell_out_value || 0);
      mapKeys[comb].sellThrough += (item.sell_through_value || 0);
    });

    return Object.values(mapKeys).map(obj => ({
      ...obj,
      ratio: obj.sellOut > 0 ? parseFloat((obj.sellThrough / obj.sellOut).toFixed(2)) : 0
    }));
  }, [data]);

  // ST/SO ratio by region
  const regionRatios = useMemo(() => {
    return regionPerformance.map(val => {
      const rRatio = val.sellOut > 0 ? parseFloat((val.sellThrough / val.sellOut).toFixed(2)) : 0;
      return {
        name: val.name,
        sellThrough: val.sellThrough,
        sellOut: val.sellOut,
        ratio: rRatio
      };
    });
  }, [regionPerformance]);

  // ==========================================
  // SECTION 6: OPPORTUNITY INSIGHTS (HEATMAP & BCG)
  // ==========================================
  const heatmapData = useMemo(() => {
    const rMap: Record<string, string[]> = {};
    data.forEach(item => {
      const r = item.region || "General Region";
      const b = item.brand_of || "Unknown Brand";
      if (!rMap[r]) {
        rMap[r] = [];
      }
      if (!rMap[r].includes(b)) {
        rMap[r].push(b);
      }
    });

    const sortedRegions = Object.keys(rMap).sort();
    return sortedRegions.map(r => {
      return {
        regionName: r,
        brands: rMap[r].sort()
      };
    });
  }, [data]);

  const rawUniqueRegions = useMemo(() => Array.from(new Set(data.map(d => d.region || "General Region"))).sort(), [data]);
  const rawUniqueSegments = useMemo(() => Array.from(new Set(data.map(d => d.segment || "General Segment"))).sort(), [data]);

  // Fill in heatmap grid
  const heatmapGrid = useMemo(() => {
    const grid: Record<string, Record<string, Record<string, number>>> = {};
    heatmapData.forEach(regObj => {
      const r = regObj.regionName;
      grid[r] = {};
      regObj.brands.forEach(b => {
        grid[r][b] = {};
        rawUniqueSegments.forEach(s => {
          grid[r][b][s] = 0;
        });
      });
    });

    data.forEach(item => {
      const r = item.region || "General Region";
      const b = item.brand_of || "Unknown Brand";
      const s = item.segment || "General Segment";
      if (grid[r] && grid[r][b] && grid[r][b][s] !== undefined) {
        grid[r][b][s] += (item.sell_out_value || 0);
      }
    });

    // Find min / max for visual interpolation scaling
    let maxVal = 1;
    let minVal = Infinity;
    heatmapData.forEach(regObj => {
      const r = regObj.regionName;
      regObj.brands.forEach(b => {
        rawUniqueSegments.forEach(s => {
          const v = grid[r][b][s];
          if (v > maxVal) maxVal = v;
          if (v < minVal) minVal = v;
        });
      });
    });

    return { grid, maxVal, minVal };
  }, [data, heatmapData, rawUniqueSegments]);


  // Matrix quadrants division (BCG Style Matrix)
  // Average benchmark metrics
  const matrixSegments = useMemo(() => {
    const list = productPerformance.segments;
    if (list.length === 0) return [];
    
    const avgGrowth = list.reduce((sum, item) => sum + item.growthPct, 0) / list.length;
    const avgContribution = list.reduce((sum, item) => sum + item.contributionPct, 0) / list.length;

    return list.map(item => {
      // Divide into quadrants
      // Quadrant 1: High Growth, High Contribution (Stars)
      // Quadrant 2: High Growth, Low Contribution (Untapped Opportunity / Question Mark)
      // Quadrant 3: Low Growth, High Contribution (Cash Cow)
      // Quadrant 4: Low Growth, Low Contribution (Underperforming)
      const isHighGrowth = item.growthPct >= avgGrowth;
      const isHighContribution = item.contributionPct >= avgContribution;

      let quadrant = "";
      let category = "";
      let color = "";

      if (isHighGrowth && isHighContribution) {
        quadrant = "Stars";
        category = "High Growth, High Contribution";
        color = "bg-emerald-50 text-emerald-700 border-emerald-100";
      } else if (isHighGrowth && !isHighContribution) {
        quadrant = "Untapped Opportunity";
        category = "High Growth, Low Contribution";
        color = "bg-sky-50 text-sky-700 border-sky-100";
      } else if (!isHighGrowth && isHighContribution) {
        quadrant = "Cash Cows";
        category = "Low Growth, High Contribution";
        color = "bg-amber-50 text-amber-700 border-amber-100";
      } else {
        quadrant = "Underperforming / Requires Attention";
        category = "Low Growth, Low Contribution";
        color = "bg-rose-50 text-rose-700 border-rose-100";
      }

      return {
        ...item,
        quadrant,
        category,
        color,
        avgGrowth,
        avgContribution
      };
    });
  }, [productPerformance]);

  const starsList = matrixSegments.filter(s => s.quadrant === "Stars");
  const opportunitiesList = matrixSegments.filter(s => s.quadrant === "Untapped Opportunity");
  const cowsList = matrixSegments.filter(s => s.quadrant === "Cash Cows");
  const attentionList = matrixSegments.filter(s => s.quadrant === "Underperforming / Requires Attention");

  const soVsStPct = metrics.totalSellThrough > 0 ? (metrics.totalSellOut / metrics.totalSellThrough) * 100 : 0;

  const starRegion = regionPerformance && regionPerformance.length > 0 ? regionPerformance[0] : null;
  const starRegionName = starRegion ? starRegion.name : "N/A";
  const starRegionContribution = starRegion ? starRegion.contributionPct : 0;

  return (
    <div className="space-y-12">
      
      {/* ========================================== */}
      {/* SECTION 1: EXECUTIVE SUMMARY (KPIs) */}
      {/* ========================================== */}
      <section>
        
        {/* Row 1: Volume & Conversion Rates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Total Sell Out */}
          <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Total Sell Out</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-sm font-bold opacity-70 text-slate-500">Rp</span>
                <span className="text-xl font-black tracking-tight truncate text-slate-900" title={formatNumber(metrics.totalSellOut)}>
                  {formatNumber(metrics.totalSellOut)}
                </span>
              </div>
            </div>
          </div>
 
          {/* Total Sell Through */}
          <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Total Sell Through</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-sm font-bold opacity-70 text-slate-500">Rp</span>
                <span className="text-xl font-black tracking-tight truncate text-slate-900" title={formatNumber(metrics.totalSellThrough)}>
                  {formatNumber(metrics.totalSellThrough)}
                </span>
              </div>
            </div>
          </div>
 
          {/* Sell Out vs Sell Through (Conversion) */}
          <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Sell Out vs Sell Through</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  {soVsStPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
 
        {/* Row 2: Performance Growth Rates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {/* Sell Out Growth MoM */}
          <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Sell Out MoM</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  {metrics.soMoM > 0 ? `+${metrics.soMoM}` : metrics.soMoM}%
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <div className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${metrics.soMoM >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                {metrics.soMoM >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(metrics.soMoM)}%
              </div>
              <span className="text-[9px] font-semibold text-slate-400">vs prev month</span>
            </div>
          </div>
 
          {/* Sell Out Growth YoY */}
          <div className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1 truncate text-slate-400">Sell Out YoY</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  {metrics.soYoY > 0 ? `+${metrics.soYoY}` : metrics.soYoY}%
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <div className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${metrics.soYoY >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                {metrics.soYoY >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(metrics.soYoY)}%
              </div>
              <span className="text-[9px] font-semibold text-slate-400">vs last year</span>
            </div>
          </div>

          {/* Star Performer by Region */}
          <div className="p-5 rounded-2xl border border-blue-700 bg-blue-600 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest mb-1 truncate text-blue-100">Star Performer by Region</span>
              <div className="flex items-baseline gap-0.5 min-w-0">
                <span className="text-xl font-black tracking-tight text-white truncate" title={starRegionName}>
                  {starRegionName}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/25 text-white">
                {starRegionContribution}%
              </div>
              <span className="text-[9px] font-bold text-blue-100">Contribution</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* SECTION 2: TREND ANALYSIS */}
      {/* ========================================== */}
      <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 h-[450px] flex flex-col">
        <div className="mb-10 shrink-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-1 bg-blue-600 rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Sell Through vs Sell Out Trend</h3>
          </div>
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Sell Out Velocity</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Historical monthly comparison</p>
        </div>

        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 800 }} 
                interval={0}
                padding={{ left: 30, right: 30 }}
                dy={15} 
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}M`}
                tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 800 }} 
                width={60}
              />
              <Tooltip 
                contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", padding: "12px" }}
                itemStyle={{ fontSize: "11px", fontWeight: 800 }}
                labelStyle={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}
                formatter={(val: any) => [formatNumber(val), ""]}
              />
              <Legend 
                iconType="circle"
                wrapperStyle={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", paddingTop: "40px" }}
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

      {/* ========================================== */}
      {/* SECTION 3: REGIONAL & CHANNEL PERFORMANCE */}
      {/* ========================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Region Ranking and Growth Table */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Region Ranking & Growth</h3>
            </div>

            <div className="space-y-6">
              {regionPerformance.map((room, idx) => (
                <div key={room.name} className="flex flex-col gap-1.5 p-3 rounded-2xl hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-blue-500 bg-blue-50 w-5 h-5 rounded-full flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {room.name}
                    </span>
                    <span className="font-black text-slate-900">Rp {formatNumber(room.sellOut)}</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${Math.min(room.contributionPct * 2.5, 100)}%` }} // Scaled relative
                    />
                  </div>

                  <div className="flex text-[10px] font-bold text-slate-400 justify-between items-center mt-0.5">
                    <span className="flex items-center gap-1">
                      Contrib: <span className="text-slate-600 font-black">{room.contributionPct}%</span>
                    </span>
                    <span className="flex items-center gap-2">
                      ST: <span className="text-slate-600 font-extrabold">Rp {formatNumber(room.sellThrough)}</span>
                      <span className={`flex items-center gap-0.5 font-black px-1.5 py-0.5 rounded-full ${room.growthPct >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                        {room.growthPct >= 0 ? "+" : ""}{room.growthPct}% MoM
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sell Out by Category */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Sell Out by Category</h3>
            </div>

            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productPerformance.categories}
                  margin={{ top: 10, right: 10, left: 0, bottom: 15 }}
                >
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 9, fill: "#64748b", fontWeight: 700 }} 
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => {
                      if (val >= 1000000000) {
                        return `Rp ${(val / 1000000000).toFixed(1)}B`;
                      }
                      if (val >= 1000000) {
                        return `Rp ${(val / 1000000).toFixed(0)}M`;
                      }
                      if (val >= 1000) {
                        return `Rp ${(val / 1000).toFixed(0)}k`;
                      }
                      return `Rp ${val}`;
                    }}
                    tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 800 }}
                    width={70}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", padding: "12px" }}
                    itemStyle={{ fontSize: "11px", fontWeight: 800 }}
                    labelStyle={{ fontSize: "10px", color: "#64748b", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}
                    formatter={(val: any, name: any, props: any) => {
                      const dataPayload = props.payload;
                      const percentage = dataPayload?.pct || "0.0";
                      return [`Rp ${formatNumber(val)} (${percentage}%)`, "Sell Out"];
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Sell Out" 
                    radius={[6, 6, 0, 0]} 
                  >
                    {productPerformance.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getPaletteColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </section>

      {/* ========================================== */}
      {/* REGION × SEGMENT OPPORTUNITY HEATMAP */}
      {/* ========================================== */}
      <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-1 bg-blue-600 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Region × Segment Opportunity Heatmap</h3>
        </div>

        <div className="overflow-x-auto border border-slate-100/70 rounded-2xl">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-4 py-3.5 text-left font-bold text-white uppercase tracking-widest text-[10px] pl-6">Region</th>
                <th className="px-4 py-3.5 text-left font-bold text-white uppercase tracking-widest text-[10px] border-l border-white/20">Brand</th>
                {rawUniqueSegments.map(s => (
                  <th key={s} className="px-4 py-3.5 font-bold text-white uppercase tracking-widest text-[10px] min-w-[120px]">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map(regObj => (
                <React.Fragment key={regObj.regionName}>
                  {regObj.brands.map((b, idx) => (
                    <tr key={`${regObj.regionName}_${b}`} className="border-b border-slate-50 hover:bg-slate-50/20">
                      {idx === 0 && (
                        <td 
                          className="px-4 py-3.5 font-bold text-slate-900 border-r border-slate-100 text-left text-[11px] font-sans pl-6 bg-white align-top uppercase" 
                          rowSpan={regObj.brands.length}
                        >
                          {regObj.regionName}
                        </td>
                      )}
                      <td className="px-4 py-3.5 font-bold text-slate-700 border-r border-slate-100 text-left text-[10px] font-sans uppercase">
                        {b}
                      </td>
                      {rawUniqueSegments.map(s => {
                        const val = (heatmapGrid.grid[regObj.regionName]?.[b]?.[s]) || 0;
                        // Calculate intensity ratio
                        const ratio = heatmapGrid.maxVal > 0 ? (val / heatmapGrid.maxVal) : 0;
                        
                        // Assign spectrum colors with high dynamic contrast from red (low) to dark blue (high)
                        let bgClass = "bg-white text-slate-400";
                        let styleTag = {};
                        if (val > 0) {
                          // ratio > 0.55 will get white text for excellent contrast against dark teal/blue
                          bgClass = ratio > 0.55 ? "text-white font-black drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.3)]" : "text-slate-900 font-black";
                          
                          // Interpolate spectrum background: Red (ratio -> 0) to Dark Blue (ratio -> 1)
                          // hue range: 0 (red) -> 240 (blue)
                          const hue = Math.round(ratio * 240);
                          // lightness range: 62% (for vibrant warm red/yellow/green) down to 35% (for deep blue)
                          const lightness = Math.round(62 - (ratio * 27));
                          styleTag = { 
                            backgroundColor: `hsl(${hue}, 92%, ${lightness}%)` 
                          };
                        }

                        return (
                          <td 
                            key={s} 
                            className={`px-4 py-4 text-[10px] transition-all relative ${bgClass}`}
                            style={styleTag}
                          >
                            <span className="font-mono text-[10px]">Rp {formatNumber(val)}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================== */}
      {/* SECTION 4: SEGMENT PERFORMANCE */}
      {/* ========================================== */}
      <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-1 bg-blue-600 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Segment Performance</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

          {/* Top Segment Ranking & Growth Table */}
          <div className="lg:col-span-3 border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600">
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Region</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Segment</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-right">Sell Through</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-right">Sell Out</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-right">Sell Out vs Sell Through</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-right">MoM Growth</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-right">Contribution</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {productPerformance.regions.map((reg) => (
                    <React.Fragment key={reg.regionName}>
                      {/* Individual segment rows of the region */}
                      {reg.segments.map((seg, idx) => (
                        <tr key={`${reg.regionName}_${seg.name}_${idx}`} className="group hover:bg-slate-50/50 transition-colors">
                          {idx === 0 && (
                            <td 
                              className="px-6 py-4 font-bold text-slate-900 border-b border-slate-50 bg-white group-hover:bg-slate-50/50 align-top" 
                              rowSpan={reg.segments.length}
                            >
                              {reg.regionName}
                            </td>
                          )}
                          <td className="px-6 py-4 text-slate-600 border-b border-slate-50 font-bold">
                            {seg.name}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-400 border-b border-slate-50 tabular-nums">Rp {formatNumber(seg.sellThrough)}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-700 border-b border-slate-50 tabular-nums">Rp {formatNumber(seg.sellOut)}</td>
                          <td className="px-6 py-4 text-right border-b border-slate-50 tabular-nums font-black text-blue-600">{seg.soVsStPct}%</td>
                          <td className="px-6 py-4 text-right border-b border-slate-50 tabular-nums">
                            <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] inline-block ${seg.growthPct >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                              {seg.growthPct >= 0 ? "+" : ""}{seg.growthPct}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right border-b border-slate-50 tabular-nums">
                            <div className="flex items-center justify-end gap-3">
                              <span className="text-slate-400 font-medium">
                                {seg.contributionPct}%
                              </span>
                              <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 rounded-full" 
                                  style={{ width: `${seg.contributionPct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {/* Subtotal row for the region */}
                      <tr className="bg-blue-50/30 font-black text-blue-700">
                        <td colSpan={2} className="px-6 py-3 border-b border-slate-100 italic text-[10px]">SUBTOTAL {reg.regionName}</td>
                        <td className="px-6 py-3 text-right border-b border-slate-100 tabular-nums opacity-60">Rp {formatNumber(reg.subtotal.sellThrough)}</td>
                        <td className="px-6 py-3 text-right border-b border-slate-100 tabular-nums">Rp {formatNumber(reg.subtotal.sellOut)}</td>
                        <td className="px-6 py-3 text-right border-b border-slate-100 tabular-nums">{reg.subtotal.soVsStPct}%</td>
                        <td className="px-6 py-3 text-right border-b border-slate-100 tabular-nums">
                          <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] inline-block ${reg.subtotal.growthPct >= 0 ? "bg-emerald-100/70 text-emerald-700" : "bg-rose-100/70 text-rose-700"}`}>
                            {reg.subtotal.growthPct >= 0 ? "+" : ""}{reg.subtotal.growthPct}%
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right border-b border-slate-100 tabular-nums">{reg.subtotal.contributionPct}%</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black">
                    <td colSpan={2} className="px-6 py-5 uppercase tracking-widest text-xs">Grand Total</td>
                    <td className="px-6 py-5 text-right text-xs tabular-nums opacity-50">Rp {formatNumber(productPerformance.grandTotal.sellThrough)}</td>
                    <td className="px-6 py-5 text-right text-xs tabular-nums">Rp {formatNumber(productPerformance.grandTotal.sellOut)}</td>
                    <td className="px-6 py-5 text-right text-xs tabular-nums text-blue-400">{productPerformance.grandTotal.soVsStPct}%</td>
                    <td className="px-6 py-5 text-right text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] inline-block ${productPerformance.grandTotal.growthPct >= 0 ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
                        {productPerformance.grandTotal.growthPct >= 0 ? "+" : ""}{productPerformance.grandTotal.growthPct}%
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right text-xs">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
