/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IncentiveSPVExclusiveData } from "../types";
import { formatNumber } from "../lib/utils";
import { motion } from "motion/react";
import { Award, Target, TrendingUp, Compass, ShoppingCart, Percent, AlertTriangle, ExternalLink } from "lucide-react";

interface IncentivesSPVExclusiveTableProps {
  data: IncentiveSPVExclusiveData[];
}

export default function IncentivesSPVExclusiveTable({ data }: IncentivesSPVExclusiveTableProps) {
  // Safe percentage calculator
  const calculatePercentage = (ach: number, target: number) => {
    if (!target) return 0;
    return Math.round((ach / target) * 100);
  };

  // Status-colored performance indicator badge
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

  // Calculate totals for grand summary row
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
      total_incentives: 0
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

  const hasFallback = data.some(row => row._isFallback);
  const is403 = data.some(row => row._errorType === "403_FORBIDDEN");

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-12"
    >
      {/* Troubleshooting Banner for Google Apps Script 403 Forbidden Access */}
      {hasFallback && (
        <motion.div 
          variants={itemVariants}
          className="bg-amber-50/50 border border-amber-200/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 shadow-sm"
        >
          <div className="p-3 bg-amber-100/80 text-amber-700 rounded-2xl w-fit h-fit self-start md:self-center shrink-0">
            <AlertTriangle size={24} className="animate-pulse" />
          </div>
          <div className="space-y-3 flex-1">
            <div>
              <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-3 py-1 rounded-full uppercase tracking-wider">
                {is403 ? "Google Apps Script: Akses Terbatas (403)" : "Google Apps Script: Koneksi Terputus"}
              </span>
              <h3 className="text-lg font-black text-slate-800 mt-2">Panduan Penautan Data Incentives SPV Exclusive</h3>
            </div>
            
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              {is403 
                ? "Aplikasi mendeteksi error akses terbatas (403 Forbidden) saat mencoba mengunduh data target & incentives SPV Exclusive dari Google Apps Script Anda. Saat ini aplikasi menampilkan data simulasi (fallback) agar Anda tetap bisa melihat struktur dashboard."
                : "Aplikasi gagal terhubung dengan Google Apps Script Anda. Saat ini aplikasi beralih ke data simulasi (fallback) agar Anda tetap dapat melihat struktur dashboard yang lengkap."}
            </p>

            <div className="bg-white border border-amber-150 rounded-2xl p-5 space-y-4 text-xs font-bold text-slate-700 shadow-xs">
              <h4 className="text-slate-900 font-extrabold uppercase tracking-wide flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 bg-amber-500 text-white rounded-full text-[10px]">!</span>
                Langkah Cepat Memperbaiki Izin Di Google Sheet / Apps Script:
              </h4>
              <ol className="list-decimal list-inside space-y-2 pl-1 leading-relaxed text-slate-600 font-semibold">
                <li>Buka editor <strong>Google Apps Script</strong> yang terhubung ke lembar kerja Spreadsheet Anda.</li>
                <li>Klik tombol <strong className="text-blue-600">Deploy</strong> di pojok kanan atas, lalu pilih <strong className="text-blue-600">Manage deployments</strong> (atau <strong className="text-blue-600">New deployment</strong>).</li>
                <li>Pastikan konfigurasi penyebaran (deployment) Anda diatur dengan parameter wajib berikut:
                  <ul className="list-disc list-inside pl-5 mt-1 space-y-1 text-slate-500 font-medium">
                    <li><strong>Execute as:</strong> Ubah ke <code className="bg-slate-50 px-1 py-0.5 rounded border text-rose-600 font-mono">"Me" (Email Anda)</code></li>
                    <li><strong>Who has access:</strong> Ubah ke <code className="bg-slate-50 px-1 py-0.5 rounded border text-rose-600 font-mono">"Anyone" (Siapa saja, bahkan anonim)</code></li>
                  </ul>
                </li>
                <li>Klik tombol <strong className="text-blue-600 font-extrabold">Deploy</strong>, lalu salin URL Web App baru yang diberikan.</li>
                <li>Perbarui konstanta penautan <code className="bg-slate-50 px-1.5 py-0.5 rounded border text-blue-600 font-mono">EXCLUSIVE_SCRIPT_URL</code> dengan URL baru tersebut.</li>
              </ol>
            </div>
            
            <div className="text-[11px] text-amber-800/80 font-semibold flex items-center gap-1.5 pt-1">
              <span>💡</span>
              <span><strong>Catatan Penting:</strong> Perubahan di atas tidak akan mempengaruhi integrasi data untuk Sell In, Sell Through, maupun Incentives SPV Internal Anda yang sudah berjalan sukses.</span>
            </div>
          </div>
        </motion.div>
      )}

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
                <th className="py-3 px-6 text-white font-extrabold">Distributor Company</th>
                <th className="py-3 px-6 text-white font-extrabold">Distributor Branch</th>
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
                    <td className="py-4 px-6">{row.distributor_company}</td>
                    <td className="py-4 px-6">{row.distributor_branch}</td>
                    <td className="py-4 px-6 text-slate-800 font-black">{row.supervisor}</td>
                    <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.target_total_gmv)}</td>
                    <td className="py-4 px-6 text-right text-blue-600 font-black">Rp {formatNumber(row.ach_total_gmv)}</td>
                    <td className="py-4 px-6 text-center">{renderPercentageBadge(percent)}</td>
                  </tr>
                );
              })}
              {/* Summary Row */}
              <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-150">
                <td className="py-4 px-6 uppercase tracking-wider" colSpan={5}>Grand Total</td>
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
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <ShoppingCart size={20} />
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
                <th className="py-3 px-6 text-white font-extrabold">Distributor Company</th>
                <th className="py-3 px-6 text-white font-extrabold">Distributor Branch</th>
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
                    <td className="py-4 px-6">{row.distributor_company}</td>
                    <td className="py-4 px-6">{row.distributor_branch}</td>
                    <td className="py-4 px-6 text-slate-800 font-black">{row.supervisor}</td>
                    <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.target_gmv_sa)}</td>
                    <td className="py-4 px-6 text-right text-blue-600 font-black">Rp {formatNumber(row.ach_gmv_sa)}</td>
                    <td className="py-4 px-6 text-center">{renderPercentageBadge(percent)}</td>
                  </tr>
                );
              })}
              {/* Summary Row */}
              <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-150">
                <td className="py-4 px-6 uppercase tracking-wider" colSpan={5}>Grand Total</td>
                <td className="py-4 px-6 text-right">Rp {formatNumber(totals.target_gmv_sa)}</td>
                <td className="py-4 px-6 text-right text-blue-700">Rp {formatNumber(totals.ach_gmv_sa)}</td>
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
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Percent size={20} />
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
                <th className="py-3 px-6 text-white font-extrabold">Distributor Company</th>
                <th className="py-3 px-6 text-white font-extrabold">Distributor Branch</th>
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
                    <td className="py-4 px-6">{row.distributor_company}</td>
                    <td className="py-4 px-6">{row.distributor_branch}</td>
                    <td className="py-4 px-6 text-slate-800 font-black">{row.supervisor}</td>
                    <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.target_gmv_bcd)}</td>
                    <td className="py-4 px-6 text-right text-blue-600 font-black">Rp {formatNumber(row.ach_gmv_bcd)}</td>
                    <td className="py-4 px-6 text-center">{renderPercentageBadge(percent)}</td>
                  </tr>
                );
              })}
              {/* Summary Row */}
              <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-150">
                <td className="py-4 px-6 uppercase tracking-wider" colSpan={5}>Grand Total</td>
                <td className="py-4 px-6 text-right">Rp {formatNumber(totals.target_gmv_bcd)}</td>
                <td className="py-4 px-6 text-right text-blue-700">Rp {formatNumber(totals.ach_gmv_bcd)}</td>
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
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Target size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">D. Achievement AO & EC</h4>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                <th className="py-3 px-6 text-white font-extrabold">Region</th>
                <th className="py-3 px-6 text-white font-extrabold">ASM</th>
                <th className="py-3 px-6 text-white font-extrabold">Distributor Company</th>
                <th className="py-3 px-6 text-white font-extrabold">Distributor Branch</th>
                <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                <th className="py-3 px-4 text-right text-white font-extrabold">Target AO</th>
                <th className="py-3 px-4 text-right text-white font-extrabold">Ach AO</th>
                <th className="py-3 px-4 text-center text-white font-extrabold">% AO</th>
                <th className="py-3 px-4 text-right text-white font-extrabold">Target EC</th>
                <th className="py-3 px-4 text-right text-white font-extrabold">Ach EC</th>
                <th className="py-3 px-4 text-center text-white font-extrabold">% EC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, idx) => {
                const percentAO = calculatePercentage(row.ach_ao, row.target_ao);
                const percentEC = calculatePercentage(row.ach_ec, row.target_ec);
                return (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors text-xs font-bold text-slate-600">
                    <td className="py-4 px-6 font-semibold">{row.region}</td>
                    <td className="py-4 px-6">{row.asm}</td>
                    <td className="py-4 px-6">{row.distributor_company}</td>
                    <td className="py-4 px-6">{row.distributor_branch}</td>
                    <td className="py-4 px-6 text-slate-800 font-black">{row.supervisor}</td>
                    <td className="py-4 px-4 text-right text-slate-500">{formatNumber(row.target_ao)}</td>
                    <td className="py-4 px-4 text-right text-blue-600 font-black">{formatNumber(row.ach_ao)}</td>
                    <td className="py-4 px-4 text-center">{renderPercentageBadge(percentAO)}</td>
                    <td className="py-4 px-4 text-right text-slate-500">{formatNumber(row.target_ec)}</td>
                    <td className="py-4 px-4 text-right text-blue-600 font-black">{formatNumber(row.ach_ec)}</td>
                    <td className="py-4 px-4 text-center">{renderPercentageBadge(percentEC)}</td>
                  </tr>
                );
              })}
              {/* Summary Row */}
              <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-150">
                <td className="py-4 px-6 uppercase tracking-wider" colSpan={5}>Grand Total</td>
                <td className="py-4 px-4 text-right">{formatNumber(totals.target_ao)}</td>
                <td className="py-4 px-4 text-right text-blue-700">{formatNumber(totals.ach_ao)}</td>
                <td className="py-4 px-4 text-center">
                  {renderPercentageBadge(calculatePercentage(totals.ach_ao, totals.target_ao))}
                </td>
                <td className="py-4 px-4 text-right">{formatNumber(totals.target_ec)}</td>
                <td className="py-4 px-4 text-right text-blue-700">{formatNumber(totals.ach_ec)}</td>
                <td className="py-4 px-4 text-center">
                  {renderPercentageBadge(calculatePercentage(totals.ach_ec, totals.target_ec))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* SECTION E: Achievement MSL */}
      <motion.div id="table-msl" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Award size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">E. Achievement MSL</h4>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                <th className="py-3 px-6 text-white font-extrabold">Region</th>
                <th className="py-3 px-6 text-white font-extrabold">ASM</th>
                <th className="py-3 px-6 text-white font-extrabold">Distributor Company</th>
                <th className="py-3 px-6 text-white font-extrabold">Distributor Branch</th>
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
                    <td className="py-4 px-6">{row.distributor_company}</td>
                    <td className="py-4 px-6">{row.distributor_branch}</td>
                    <td className="py-4 px-6 text-slate-800 font-black">{row.supervisor}</td>
                    <td className="py-4 px-6 text-right text-slate-500">Rp {formatNumber(row.target_msl || 0)}</td>
                    <td className="py-4 px-6 text-right text-blue-600 font-black">Rp {formatNumber(row.ach_msl || 0)}</td>
                    <td className="py-4 px-6 text-center">{renderPercentageBadge(percent)}</td>
                  </tr>
                );
              })}
              {/* Summary Row */}
              <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-150">
                <td className="py-4 px-6 uppercase tracking-wider" colSpan={5}>Grand Total</td>
                <td className="py-4 px-6 text-right">Rp {formatNumber(totals.target_msl)}</td>
                <td className="py-4 px-6 text-right text-blue-700">Rp {formatNumber(totals.ach_msl)}</td>
                <td className="py-4 px-6 text-center">
                  {renderPercentageBadge(calculatePercentage(totals.ach_msl, totals.target_msl))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* SECTION F: Incentives Summary */}
      <motion.div id="table-summary" variants={itemVariants} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Award size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">F. Incentives Summary</h4>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-[10.5px] font-black text-white uppercase tracking-wider">
                <th className="py-3 px-6 text-white font-extrabold">Region</th>
                <th className="py-3 px-6 text-white font-extrabold">ASM</th>
                <th className="py-3 px-6 text-white font-extrabold">Distributor Company</th>
                <th className="py-3 px-6 text-white font-extrabold">Distributor Branch</th>
                <th className="py-3 px-6 text-white font-extrabold">Supervisor</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Incentives GMV</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Incentives AO</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Incentives MSL</th>
                <th className="py-3 px-6 text-right text-white font-extrabold">Total Incentives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((row, idx) => {
                const rowTotal = row.incentive_gmv + row.incentive_ao + row.incentive_msl;
                return (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors text-xs font-bold text-slate-600">
                    <td className="py-4 px-6 font-semibold">{row.region}</td>
                    <td className="py-4 px-6">{row.asm}</td>
                    <td className="py-4 px-6">{row.distributor_company}</td>
                    <td className="py-4 px-6">{row.distributor_branch}</td>
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
              {/* Grand Totals */}
              <tr className="bg-blue-50/30 font-black text-xs text-slate-800 border-t-2 border-slate-150">
                <td className="py-4 px-6 uppercase tracking-wider" colSpan={5}>Grand Total</td>
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
