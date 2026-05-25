/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { BRAND_COLORS, getBrandColor } from "../constants";
import { formatNumber } from "../lib/utils";

interface BrandDoughnutChartProps {
  data: { name: string; value: number }[];
  title?: string;
  valueLabel?: string;
}

export function BrandDoughnutChart({ data, title = "Brand Contribution", valueLabel = "Revenue" }: BrandDoughnutChartProps) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 h-full flex flex-col min-h-[450px]">
      <div className="mb-4">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-1">{title}</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contribution Analysis</p>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBrandColor(entry.name, index)} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
              itemStyle={{ fontSize: '11px', fontWeight: 800 }}
              formatter={(value: any) => [formatNumber(value), valueLabel]}
            />
            <Legend 
              iconType="circle" 
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              wrapperStyle={{ 
                fontSize: '9px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                paddingTop: '20px',
                width: '100%'
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface MainTrendChartProps {
  data: any[];
  brands: string[];
  title?: string;
  valueLabel?: string;
}

export function MainTrendChart({ data, brands, title = "Sales Velocity", valueLabel = "Value" }: MainTrendChartProps) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 h-[450px] flex flex-col">
      <div className="flex items-center justify-between mb-10 shrink-0">
        <div>
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">{title}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Historical monthly comparison</p>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} 
              interval={0}
              padding={{ left: 30, right: 30 }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }}
              tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`}
              width={60}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
              itemStyle={{ fontSize: '11px', fontWeight: 800 }}
              labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase' }}
              formatter={(value: any) => [formatNumber(value), valueLabel]}
            />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '40px' }} 
            />
            {brands.map((brand, idx) => (
              <Line
                key={brand}
                type="monotone"
                dataKey={brand}
                stroke={getBrandColor(brand, idx)}
                strokeWidth={4}
                dot={{ r: 5, strokeWidth: 3, fill: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 0 }}
                animationDuration={2000}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PerformanceBarChart({ data, title, subtitle, keys = ["value"] }: { data: any[], title: string, subtitle?: string, keys?: string[] }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col h-full min-h-[400px]">
      <div className="mb-8 flex justify-between items-start shrink-0">
        <div>
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">{title}</h3>
          {subtitle && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{subtitle}</p>}
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: -10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }}
              width={140}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px' }}
              itemStyle={{ fontSize: '10px', fontWeight: 800 }}
              formatter={(value: any) => [formatNumber(value), ""]}
            />
            <Legend 
              iconType="circle"
              wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '10px' }}
            />
            {keys.map((key, index) => (
              <Bar key={key} dataKey={key} radius={[0, 4, 4, 0]} barSize={keys.length > 1 ? 10 : 20} fill={index === 0 ? "#1e40af" : "#10b981"}>
                {keys.length === 1 && data.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={getBrandColor(entry.name, idx)} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ComparisonLineChart({ data, title = "Comparison Velocity" }: { data: any[], title?: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 h-[450px] flex flex-col">
      <div className="mb-10 shrink-0">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">{title}</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sell In vs Sell Through Trend</p>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} 
              interval={0}
              padding={{ left: 30, right: 30 }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }}
              tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`}
              width={60}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
              itemStyle={{ fontSize: '11px', fontWeight: 800 }}
              labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase' }}
              formatter={(value: any) => [formatNumber(value), ""]}
            />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '40px' }} 
            />
            <Line
              type="monotone"
              dataKey="Sell In"
              stroke="#1e40af"
              strokeWidth={4}
              dot={{ r: 5, strokeWidth: 3, fill: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="Sell Through"
              stroke="#10b981"
              strokeWidth={4}
              dot={{ r: 5, strokeWidth: 3, fill: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface StackedBarChartProps {
  data: any[];
  keys: string[];
  title: string;
  isPercentage?: boolean;
}

export function StackedBarChart({ data, keys, title, isPercentage = false }: StackedBarChartProps) {
  if (!data || data.length === 0 || !keys || keys.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-2">{title}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No data available for this selection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-col min-h-[500px] h-[500px]">
      <div className="mb-8 shrink-0">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">{title}</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          {isPercentage ? "Distribution by Region (%)" : "Contribution by Region"}
        </p>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={80}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }}
              tickFormatter={(value) => isPercentage ? `${value}%` : formatNumber(value)}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px' }}
              itemStyle={{ fontSize: '10px', fontWeight: 800 }}
              formatter={(value: any, name: string) => [isPercentage ? `${Number(value).toFixed(0)}%` : formatNumber(value), name]}
            />
            <Legend 
              wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', paddingTop: '30px' }}
              verticalAlign="bottom"
            />
            {keys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                stackId="a" 
                fill={getBrandColor(key, index)} 
                radius={index === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
