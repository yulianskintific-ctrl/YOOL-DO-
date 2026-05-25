
import React, { useMemo } from 'react';
import { SalesData, SidebarMenu } from '../types';
import { formatNumber, cn } from '../lib/utils';

interface ContributionTableProps {
  data: SalesData[];
  mode?: SidebarMenu;
}

export default function ContributionTable({ data, mode = 'Sell In' }: ContributionTableProps) {
  const tableData = useMemo(() => {
    const regions: Record<string, { 
      total: number; 
      totalIn: number; 
      distributors: Record<string, { val: number; valIn: number }> 
    }> = {};
    let grandTotal = 0;
    let grandTotalIn = 0;

    data.forEach(item => {
      const region = item.region || 'Unknown';
      const dist = item.distributor_name || 'Unknown';
      const val = mode === 'Sell Through' ? (item.sell_through_value || 0) : (item.sell_in_value || 0);
      const valIn = item.sell_in_value || 0;

      if (!regions[region]) {
        regions[region] = { total: 0, totalIn: 0, distributors: {} };
      }
      regions[region].total += val;
      regions[region].totalIn += valIn;
      
      if (!regions[region].distributors[dist]) {
        regions[region].distributors[dist] = { val: 0, valIn: 0 };
      }
      regions[region].distributors[dist].val += val;
      regions[region].distributors[dist].valIn += valIn;
      
      grandTotal += val;
      grandTotalIn += valIn;
    });

    return { regions, grandTotal, grandTotalIn };
  }, [data, mode]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Detailed Contribution Analysis</h3>
        <div className="flex items-center gap-4 text-right">
          {mode === 'Sell Through' && (
            <div className="px-4 border-r border-slate-100">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Grand Total Sell In</p>
              <p className="text-sm font-black text-slate-400">Rp {formatNumber(tableData.grandTotalIn)}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Grand Total {mode}</p>
            <p className="text-sm font-black text-blue-600">Rp {formatNumber(tableData.grandTotal)}</p>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-600">
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Region</th>
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest">Distributor</th>
              {mode === 'Sell Through' && (
                <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-right">Sell In Value</th>
              )}
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-right">{mode} Value</th>
              {mode === 'Sell Through' && (
                <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-right">S/I %</th>
              )}
              <th className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest text-right">% Contrib</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {Object.entries(tableData.regions).map(([regionName, regionData]) => (
              <React.Fragment key={regionName}>
                {Object.entries(regionData.distributors).map(([distName, distValue], idx) => (
                  <tr key={distName} className="group hover:bg-slate-50/50 transition-colors">
                    {idx === 0 && (
                      <td 
                        className="px-6 py-4 font-bold text-slate-900 border-b border-slate-50 bg-white group-hover:bg-slate-50/50 align-top" 
                        rowSpan={Object.keys(regionData.distributors).length}
                      >
                        {regionName}
                      </td>
                    )}
                    <td className="px-6 py-4 text-slate-600 border-b border-slate-50">{distName}</td>
                    {mode === 'Sell Through' && (
                      <td className="px-6 py-4 text-right text-slate-400 border-b border-slate-50 tabular-nums">
                        {formatNumber(distValue.valIn)}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right font-bold text-slate-700 border-b border-slate-50 tabular-nums">
                      {formatNumber(distValue.val)}
                    </td>
                    {mode === 'Sell Through' && (
                      <td className="px-6 py-4 text-right border-b border-slate-50 tabular-nums font-black text-blue-600">
                        {distValue.valIn > 0 ? ((distValue.val / distValue.valIn) * 100).toFixed(0) : '0'}%
                      </td>
                    )}
                    <td className="px-6 py-4 text-right border-b border-slate-50 tabular-nums">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-slate-400 font-medium">
                          {((distValue.val / tableData.grandTotal) * 100).toFixed(0)}%
                        </span>
                        <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${(distValue.val / regionData.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50/30 font-black text-blue-700">
                  <td colSpan={2} className="px-6 py-3 border-b border-slate-100 italic text-[10px]">SUBTOTAL {regionName}</td>
                  {mode === 'Sell Through' && (
                    <td className="px-6 py-3 text-right border-b border-slate-100 tabular-nums opacity-60">
                      {formatNumber(regionData.totalIn)}
                    </td>
                  )}
                  <td className="px-6 py-3 text-right border-b border-slate-100 tabular-nums">
                    {formatNumber(regionData.total)}
                  </td>
                  {mode === 'Sell Through' && (
                    <td className="px-6 py-3 text-right border-b border-slate-100 tabular-nums">
                      {regionData.totalIn > 0 ? ((regionData.total / regionData.totalIn) * 100).toFixed(0) : '0'}%
                    </td>
                  )}
                  <td className="px-6 py-3 text-right border-b border-slate-100 tabular-nums">
                    {((regionData.total / tableData.grandTotal) * 100).toFixed(0)}%
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white font-black">
              <td colSpan={2} className="px-6 py-5 uppercase tracking-widest text-xs">Grand Total</td>
              {mode === 'Sell Through' && (
                <td className="px-6 py-5 text-right text-xs tabular-nums opacity-50">
                  {formatNumber(tableData.grandTotalIn)}
                </td>
              )}
              <td className="px-6 py-5 text-right text-xs tabular-nums">
                Rp {formatNumber(tableData.grandTotal)}
              </td>
              {mode === 'Sell Through' && (
                <td className="px-6 py-5 text-right text-xs tabular-nums text-blue-400">
                   {tableData.grandTotalIn > 0 ? ((tableData.grandTotal / tableData.grandTotalIn) * 100).toFixed(0) : '0'}%
                </td>
              )}
              <td className="px-6 py-5 text-right text-xs">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
