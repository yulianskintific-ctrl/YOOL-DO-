/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sparkles, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { GoogleGenAI } from "@google/genai";
import Markdown from "react-markdown";
import { SalesData, SidebarMenu } from "../types";

interface InsightsProps {
  data: SalesData[];
  isLoading?: boolean;
  mode?: SidebarMenu;
}

export default function Insights({ data, isLoading: dataLoading, mode = 'Sell In' }: InsightsProps) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data.length > 0 && !dataLoading) {
      generateInsights();
    }
  }, [data, dataLoading, mode]);

  const generateInsights = async () => {
    if (data.length === 0) return;

    const valueKey = 'sell_in_value';

    // Create a cache key based on data summary to avoid re-generating for the same state
    const brands = Array.from(new Set(data.map(d => d.brand_of))).sort();
    const totalValue = data.reduce((sum, d: any) => sum + (d[valueKey] || 0), 0);
    const cacheKey = `insight_${mode}_${brands.join('_')}_${data.length}_${totalValue}`;
    
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setInsight(cached);
      return;
    }

    setLoading(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setInsight("Gemini API Key missing. Please configure it in secrets.");
        setLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      // Prepare a summarized version of data for the AI
      const brandPerformance = brands.map(b => ({
        brand: b,
        totalValue: data.filter(d => d.brand_of === b).reduce((sum, d: any) => sum + (d[valueKey] || 0), 0)
      })).sort((a, b) => b.totalValue - a.totalValue);

      const regions = Array.from(new Set(data.map(d => d.region)));
      const regionPerformance = regions.map(r => ({
        region: r,
        totalValue: data.filter(d => d.region === r).reduce((sum, d: any) => sum + (d[valueKey] || 0), 0)
      })).sort((a, b) => b.totalValue - a.totalValue);

      const prompt = `
        As a senior sales analyst for YOOL-DO dashboard, analyze the following ${mode} performance data and provide 4-5 bullet points of high-level insights.
        Keep it professional, data-driven, and concise. Focus on:
        - Highest growing/contributing brands.
        - Regional performance highlights.
        - Distributor efficiency.
        - Actionable recommendations.
        - Identify any anomalies or areas of concern.

        Data Summary for ${mode}:
        - Total Samples: ${data.length}
        - Top Brand: ${brandPerformance[0]?.brand} (${brandPerformance[0]?.totalValue})
        - Top Region: ${regionPerformance[0]?.region} (${regionPerformance[0]?.totalValue})
        - All Brands: ${brands.join(", ")}
        - All Regions: ${regions.join(", ")}

        Format the output in a clean Markdown bullet list. No intro/outro. Reference specific data points.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const text = result.text || "No insights generated.";
      setInsight(text);
      localStorage.setItem(cacheKey, text);
    } catch (error: any) {
      console.error("AI Insight Error:", error);
      
      // Handle the specific 429 error (quota)
      if (error?.message?.includes("429") || error?.message?.includes("quota") || error?.status === 429) {
        setInsight("### AI Analysis at Capacity\nThe YOOL-DO Strategic Intelligence is currently processing a high volume of requests. Please wait a few moments or refresh to try again.\n\n*Note: Manual data analysis is still available in the tables above.*");
      } else {
        setInsight("### Insight Engine Offline\nFailed to synchronize with Neural Analysis. Please check your connection or system logs.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 overflow-hidden relative h-full flex flex-col">
      <div className="absolute -top-12 -right-12 p-8 opacity-[0.03] text-blue-600 pointer-events-none">
        <Sparkles size={240} />
      </div>

      <div className="flex items-center gap-3 mb-8 shrink-0">
        <div className="p-2 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-xs font-black tracking-widest uppercase mb-0.5">Strategic Insights</h3>
          <p className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">AI Powered Intelligence</p>
        </div>
        {(loading || dataLoading) && <Loader2 size={14} className="animate-spin text-blue-600 ml-auto" />}
      </div>

      <div className="markdown-body text-slate-600 text-sm leading-relaxed flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {insight ? (
          <Markdown>{insight}</Markdown>
        ) : (
          <div className="space-y-4">
            <div className="h-4 bg-slate-50 rounded-full w-full animate-pulse" />
            <div className="h-4 bg-slate-50 rounded-full w-5/6 animate-pulse" />
            <div className="h-4 bg-slate-50 rounded-full w-4/6 animate-pulse" />
          </div>
        )}
      </div>
      
      <div className="mt-8 flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Neural Engine Analysis Complete
      </div>
    </div>
  );
}
