/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IncentiveSPVData } from "../types";
import { formatNumber } from "../lib/utils";
import { motion } from "motion/react";
import { Award, Target, TrendingUp, Compass, ShoppingCart, Percent } from "lucide-react";

interface IncentivesSPVTableProps {
  data: IncentiveSPVData[];
}

export default function IncentivesSPVTable({ data }: IncentivesSPVTableProps) {
  // Utility for calculating achievement percentages safely
  const calculatePercentage = (ach: number, target: number) => {
    if (!target) return 0;
    return Math.round((ach / target) * 100);
  };

  // Helper for rendering achievement badges with custom colors based on performance
  const renderPercentageBadge = (percent: number) => {
    let colorClass = "bg-rose-50 text-rose-700 border-rose-100";
    if (percent >= 100) {
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
    } else if (percent >= 90) {
      colorClass = "bg-amber-50 text-amber-700 border-amber-100";
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${colorClass}`}>
        {percent}%
      </span>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border border-slate-100">
        <Compass className="text-slate-400 mb-2 animate-bounce animate-duration-1000" size={32} />
        <p className="text-sm font-bold text-slate-500">No data found matching current filter state.</p>
      </div>
    );
  }

  // Calculate totals across the filtered subset for Table summaries
  const totals = data.reduce(
    (acc, row) => {
      acc.target_total_gmv += row.target_total_gmv;
      acc.ach_total_gmv += row.ach_total_gmv;
      acc.target_gmv_sa += row.target_gmv_sa;
      acc.ach_gmv_sa += row.ach_gmv_sa;
      acc.target_gmv_bcd += row.target_gmv_bcd;
      acc.ach_gmv_bcd += row.ach_gmv_bcd;
      acc.target_ao += row.target_ao;
      acc.ach_ao += row.ach_ao;
      acc.target_ec += row.target_ec;
      acc.ach_ec += row.ach_ec;
      acc.target_msl += row.target_msl;
      acc.ach_msl += row.ach_msl;
      acc.incentive_gmv += row.incentive_gmv;
      acc.incentive_ao += row.incentive_ao;
      acc.incentive_msl += row.incentive_msl;
      acc.total_incentives += row.total_incentives;
      return acc;
    },
    {
      target_total_gmv: 0,
      ach_total_gmv: 0,
      target_gmv_sa: 0,
      ach_gmv_sa: 0,
      target_gmv_bcd: 0,
      ach_gmv_bcd: 0,
      target_ao: 0,
      ach_ao: 0,
      target_ec: 0,
      ach_ec: 0,
      target_msl: 0,
      ach_msl: 0,
      incentive_gmv: 0,
      incentive_ao: 0,
      incentive_msl: 0,
      total_incentives: 0,
    }
  );

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12"
    >
      {/* SECTION A: Achievement GMV Total */}
      <motion.div id="table-gmv-total" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">A. Achievement GMV Total</h4>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                <th className="py-3 px-6 text-white font-extrabold">Region</th>
                <th className="py-3 px-6 text-white font-extrabold">ASM</th>
                <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Target - Total GMV</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Ach. (Value) - Total GMV</th>
                <th className="py-3 px-6 text-center text-white font-extrabold">% Ach. Total GMV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, idx) => {
                const percent = calculatePercentage(row.ach_total_gmv, row.target_total_gmv);
                return (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors text-xs font-bold text-slate-600">
                    <td className="py-4 px-6 font-semibold">{row.region}</td>
                    <td className="py-4 px-6">{row.asm}</td>
                    <td className="py-4 px-6 text-slate-800 font-black">{row.supervisor}</td>
                    <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.target_total_gmv)}</td>
                    <td className="py-4 px-6 text-right text-blue-600 font-black">Rp {formatNumber(row.ach_total_gmv)}</td>
                    <td className="py-4 px-6 text-center">{renderPercentageBadge(percent)}</td>
                  </tr>
                );
              })}
              {/* Summary Row */}
              <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                <td className="py-4 px-6 uppercase tracking-wider" colSpan={3}>Grand Total</td>
                <td className="py-4 px-6 text-right">Rp {formatNumber(totals.target_total_gmv)}</td>
                <td className="py-4 px-6 text-right text-blue-700">Rp {formatNumber(totals.ach_total_gmv)}</td>
                <td className="py-4 px-6 text-center">
                  {renderPercentageBadge(calculatePercentage(totals.ach_total_gmv, totals.target_total_gmv))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* SECTION B: Achievement GMV SA */}
      <motion.div id="table-gmv-sa" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
              <Award size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">B. Achievement GMV SA</h4>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                <th className="py-3 px-6 text-white font-extrabold">Region</th>
                <th className="py-3 px-6 text-white font-extrabold">ASM</th>
                <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Target - GMV SA</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Ach. (Value) - GMV SA</th>
                <th className="py-3 px-6 text-center text-white font-extrabold">% Ach. GMV SA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, idx) => {
                const percent = calculatePercentage(row.ach_gmv_sa, row.target_gmv_sa);
                return (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors text-xs font-bold text-slate-600">
                    <td className="py-4 px-6 font-semibold">{row.region}</td>
                    <td className="py-4 px-6">{row.asm}</td>
                    <td className="py-4 px-6 text-slate-800 font-black">{row.supervisor}</td>
                    <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.target_gmv_sa)}</td>
                    <td className="py-4 px-6 text-right text-amber-600 font-black">Rp {formatNumber(row.ach_gmv_sa)}</td>
                    <td className="py-4 px-6 text-center">{renderPercentageBadge(percent)}</td>
                  </tr>
                );
              })}
              {/* Summary Row */}
              <tr className="bg-amber-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                <td className="py-4 px-6 uppercase tracking-wider" colSpan={3}>Grand Total</td>
                <td className="py-4 px-6 text-right">Rp {formatNumber(totals.target_gmv_sa)}</td>
                <td className="py-4 px-6 text-right text-amber-700">Rp {formatNumber(totals.ach_gmv_sa)}</td>
                <td className="py-4 px-6 text-center">
                  {renderPercentageBadge(calculatePercentage(totals.ach_gmv_sa, totals.target_gmv_sa))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* SECTION C: Achievement GMV BCD */}
      <motion.div id="table-gmv-bcd" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">C. Achievement GMV BCD</h4>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                <th className="py-3 px-6 text-white font-extrabold">Region</th>
                <th className="py-3 px-6 text-white font-extrabold">ASM</th>
                <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Target - GMV BCD</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Ach. (Value) - GMV BCD</th>
                <th className="py-3 px-6 text-center text-white font-extrabold">% Ach. GMV BCD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, idx) => {
                const percent = calculatePercentage(row.ach_gmv_bcd, row.target_gmv_bcd);
                return (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors text-xs font-bold text-slate-600">
                    <td className="py-4 px-6 font-semibold">{row.region}</td>
                    <td className="py-4 px-6">{row.asm}</td>
                    <td className="py-4 px-6 text-slate-800 font-black">{row.supervisor}</td>
                    <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.target_gmv_bcd)}</td>
                    <td className="py-4 px-6 text-right text-indigo-600 font-black">Rp {formatNumber(row.ach_gmv_bcd)}</td>
                    <td className="py-4 px-6 text-center">{renderPercentageBadge(percent)}</td>
                  </tr>
                );
              })}
              {/* Summary Row */}
              <tr className="bg-indigo-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                <td className="py-4 px-6 uppercase tracking-wider" colSpan={3}>Grand Total</td>
                <td className="py-4 px-6 text-right">Rp {formatNumber(totals.target_gmv_bcd)}</td>
                <td className="py-4 px-6 text-right text-indigo-700">Rp {formatNumber(totals.ach_gmv_bcd)}</td>
                <td className="py-4 px-6 text-center">
                  {renderPercentageBadge(calculatePercentage(totals.ach_gmv_bcd, totals.target_gmv_bcd))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* SECTION D: Achievement AO */}
      <motion.div id="table-ao" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Target size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">D. Achievement AO</h4>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                <th className="py-3 px-6 text-white font-extrabold">Region</th>
                <th className="py-3 px-6 text-white font-extrabold">ASM</th>
                <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Target AO</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Ach AO</th>
                <th className="py-3 px-6 text-center text-white font-extrabold">% Ach AO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, idx) => {
                const percent = calculatePercentage(row.ach_ao, row.target_ao);
                return (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors text-xs font-bold text-slate-600">
                    <td className="py-4 px-6 font-semibold">{row.region}</td>
                    <td className="py-4 px-6">{row.asm}</td>
                    <td className="py-4 px-6 text-slate-800 font-black">{row.supervisor}</td>
                    <td className="py-4 px-6 text-right text-slate-500">{formatNumber(row.target_ao)}</td>
                    <td className="py-4 px-6 text-right text-emerald-600 font-black">{formatNumber(row.ach_ao)}</td>
                    <td className="py-4 px-6 text-center">{renderPercentageBadge(percent)}</td>
                  </tr>
                );
              })}
              {/* Summary Row */}
              <tr className="bg-emerald-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                <td className="py-4 px-6 uppercase tracking-wider" colSpan={3}>Grand Total</td>
                <td className="py-4 px-6 text-right">{formatNumber(totals.target_ao)}</td>
                <td className="py-4 px-6 text-right text-emerald-700">{formatNumber(totals.ach_ao)}</td>
                <td className="py-4 px-6 text-center">
                  {renderPercentageBadge(calculatePercentage(totals.ach_ao, totals.target_ao))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* SECTION E: Achievement EC */}
      <motion.div id="table-ec" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
              <Percent size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">E. Achievement EC</h4>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                <th className="py-3 px-6 text-white font-extrabold">Region</th>
                <th className="py-3 px-6 text-white font-extrabold">ASM</th>
                <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Target EC</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Ach EC</th>
                <th className="py-3 px-6 text-center text-white font-extrabold">% Ach EC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, idx) => {
                const percent = calculatePercentage(row.ach_ec, row.target_ec);
                return (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors text-xs font-bold text-slate-600">
                    <td className="py-4 px-6 font-semibold">{row.region}</td>
                    <td className="py-4 px-6">{row.asm}</td>
                    <td className="py-4 px-6 text-slate-800 font-black">{row.supervisor}</td>
                    <td className="py-4 px-6 text-right text-slate-500">{formatNumber(row.target_ec)}</td>
                    <td className="py-4 px-6 text-right text-purple-600 font-black">{formatNumber(row.ach_ec)}</td>
                    <td className="py-4 px-6 text-center">{renderPercentageBadge(percent)}</td>
                  </tr>
                );
              })}
              {/* Summary Row */}
              <tr className="bg-purple-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                <td className="py-4 px-6 uppercase tracking-wider" colSpan={3}>Grand Total</td>
                <td className="py-4 px-6 text-right">{formatNumber(totals.target_ec)}</td>
                <td className="py-4 px-6 text-right text-purple-700">{formatNumber(totals.ach_ec)}</td>
                <td className="py-4 px-6 text-center">
                  {renderPercentageBadge(calculatePercentage(totals.ach_ec, totals.target_ec))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* SECTION F: Achievement MSL */}
      <motion.div id="table-msl" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
              <Award size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">F. Achievement MSL</h4>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                <th className="py-3 px-6 text-white font-extrabold">Region</th>
                <th className="py-3 px-6 text-white font-extrabold">ASM</th>
                <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Target MSL</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Ach. (Value) - MSL</th>
                <th className="py-3 px-6 text-center text-white font-extrabold">% Ach MSL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, idx) => {
                const percent = calculatePercentage(row.ach_msl, row.target_msl);
                return (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors text-xs font-bold text-slate-600">
                    <td className="py-4 px-6 font-semibold">{row.region}</td>
                    <td className="py-4 px-6">{row.asm}</td>
                    <td className="py-4 px-6 text-slate-800 font-black">{row.supervisor}</td>
                    <td className="py-4 px-6 text-right text-slate-500">{formatNumber(row.target_msl)}</td>
                    <td className="py-4 px-6 text-right text-teal-600 font-black">{formatNumber(row.ach_msl)}</td>
                    <td className="py-4 px-6 text-center">{renderPercentageBadge(percent)}</td>
                  </tr>
                );
              })}
              {/* Summary Row */}
              <tr className="bg-teal-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-200/60">
                <td className="py-4 px-6 uppercase tracking-wider" colSpan={3}>Grand Total</td>
                <td className="py-4 px-6 text-right">{formatNumber(totals.target_msl)}</td>
                <td className="py-4 px-6 text-right text-teal-700">{formatNumber(totals.ach_msl)}</td>
                <td className="py-4 px-6 text-center">
                  {renderPercentageBadge(calculatePercentage(totals.ach_msl, totals.target_msl))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* SECTION G: Incentives Summary */}
      <motion.div id="table-summary" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Award size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">G. Incentives Summary</h4>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                <th className="py-3 px-6 text-white font-extrabold">Region</th>
                <th className="py-3 px-6 text-white font-extrabold">ASM</th>
                <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Incentives GMV</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Incentives AO</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Incentives MSL</th>
                <th className="py-3 px-6 text-right bg-blue-700 text-white font-extrabold">Total Incentives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, idx) => {
                const rowTotal = row.total_incentives;
                return (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors text-xs font-bold text-slate-600">
                    <td className="py-4 px-6 font-semibold">{row.region}</td>
                    <td className="py-4 px-6">{row.asm}</td>
                    <td className="py-4 px-6 text-slate-800 font-black">{row.supervisor}</td>
                    <td className="py-4 px-6 text-right">Rp {formatNumber(row.incentive_gmv)}</td>
                    <td className="py-4 px-6 text-right">Rp {formatNumber(row.incentive_ao)}</td>
                    <td className="py-4 px-6 text-right">Rp {formatNumber(row.incentive_msl)}</td>
                    <td className="py-4 px-6 text-right text-blue-600 font-black pr-6">
                      Rp {formatNumber(rowTotal)}
                    </td>
                  </tr>
                );
              })}
              {/* Summary Row */}
              <tr className="bg-slate-50 font-black text-xs text-slate-800 border-t-2 border-slate-200">
                <td className="py-4 px-6 uppercase tracking-wider" colSpan={3}>Grand Total</td>
                <td className="py-4 px-6 text-right">Rp {formatNumber(totals.incentive_gmv)}</td>
                <td className="py-4 px-6 text-right">Rp {formatNumber(totals.incentive_ao)}</td>
                <td className="py-4 px-6 text-right">Rp {formatNumber(totals.incentive_msl)}</td>
                <td className="py-4 px-6 text-right text-blue-700 font-extrabold pr-6">
                  Rp {formatNumber(totals.total_incentives)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
