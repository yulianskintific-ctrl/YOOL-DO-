/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import KPICard from "./components/KPICard";
import Filters from "./components/Filters";
import { MainTrendChart, PerformanceBarChart, ComparisonLineChart, BrandDoughnutChart } from "./components/Charts";
import RankingTable from "./components/RankingTable";
import ContributionTable from "./components/ContributionTable";
import { SalesData, FilterState, SidebarMenu, IncentiveSPVData, IncentiveSPVExclusiveData, IncentiveSEData, SellOutData } from "./types";
import { fetchSalesData, fetchIncentiveSPVData, fetchIncentiveSPVExclusiveData, fetchIncentiveSEData, fetchSellOutData } from "./services/api";
import { formatNumber, cn } from "./lib/utils";
import { parse, format, eachMonthOfInterval } from "date-fns";
import { Loader2, X, RefreshCw } from "lucide-react";
import IncentivesSPVTable from "./components/IncentivesSPVTable";
import IncentivesSPVExclusiveTable from "./components/IncentivesSPVExclusiveTable";
import IncentivesSETable from "./components/IncentivesSETable";
import SellOutDashboard from "./components/SellOutDashboard";
import { SKUList } from "./components/SKUList";

export default function App() {
  const [data, setData] = useState<SalesData[]>([]);
  const [sellOutData, setSellOutData] = useState<SellOutData[]>([]);
  const [incentivesData, setIncentivesData] = useState<IncentiveSPVData[]>([]);
  const [exclusiveIncentivesData, setExclusiveIncentivesData] = useState<IncentiveSPVExclusiveData[]>([]);
  const [seIncentivesData, setSeIncentivesData] = useState<IncentiveSEData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Connecting to Cloud...");
  const [error, setError] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<SidebarMenu>('Sell In');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    brands: [],
    regions: [],
    asms: [],
    supervisors: [],
    distributors: [],
    distributorCompanies: [],
    distributorBranches: [],
    channels: [],
    categories: [],
    segments: [],
    baStoreNonBaStores: []
  });

  useEffect(() => {
    if (activeMenu === 'Incentives SPV Internal') {
      loadIncentivesData();
    } else if (activeMenu === 'Incentives SPV Exclusive') {
      loadExclusiveIncentivesData();
    } else if (activeMenu === 'Incentives SE') {
      loadSeIncentivesData();
    } else if (activeMenu === 'Sell Out') {
      loadSellOutData();
    } else {
      const dashboardMenus: SidebarMenu[] = ['Sell In', 'Sell Through'];
      if (dashboardMenus.includes(activeMenu)) {
        loadDashboardData();
      }
    }
  }, [activeMenu]);

  async function loadSeIncentivesData(force = false) {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      setLoadingStatus("Synchronizing SE Incentive records...");
      const result = await fetchIncentiveSEData(force);
      setSeIncentivesData(result);
    } catch (err) {
      console.error("SE Incentives Load Error:", err);
      setError(`Failed to synchronize ${activeMenu} data. Please check your Script URL.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadIncentivesData(force = false) {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      setLoadingStatus("Synchronizing SPV Incentive records...");
      const result = await fetchIncentiveSPVData(force);
      setIncentivesData(result);
    } catch (err) {
      console.error("Incentives Load Error:", err);
      setError(`Failed to synchronize ${activeMenu} data. Please check your Script URL.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadExclusiveIncentivesData(force = false) {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      setLoadingStatus("Synchronizing SPV Exclusive Incentive records...");
      const result = await fetchIncentiveSPVExclusiveData(force);
      setExclusiveIncentivesData(result);
    } catch (err) {
      console.error("Exclusive Incentives Load Error:", err);
      setError(`Failed to synchronize ${activeMenu} data. Please check your Script URL.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadDashboardData(force = false) {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      setLoadingStatus(`Synchronizing records from Google Sheets...`);
      const result = await fetchSalesData(force, "Sell In and Through");
      setData(result);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
      setError(`Failed to synchronize ${activeMenu} data. Please check your Script URL.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadSellOutData(force = false) {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      setLoadingStatus("Synchronizing Sell Out records from Google Sheets...");
      const result = await fetchSellOutData(force);
      setSellOutData(result);
    } catch (err) {
      console.error("Sell Out Load Error:", err);
      setError(`Failed to synchronize ${activeMenu} data. Please check your Script URL.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleFilterChange = (key: keyof FilterState, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const options = useMemo(() => {
    if (activeMenu === 'Incentives SPV Internal') {
      if (!incentivesData.length) return { brands: [], regions: [], asms: [], supervisors: [], distributors: [] };
      return {
        brands: [],
        regions: Array.from(new Set(incentivesData.map((d) => d.region))).sort(),
        asms: Array.from(new Set(incentivesData.map((d) => d.asm))).sort(),
        supervisors: Array.from(new Set(incentivesData.map((d) => d.supervisor))).sort(),
        distributors: []
      };
    }

    if (activeMenu === 'Incentives SPV Exclusive') {
      if (!exclusiveIncentivesData.length) return { brands: [], regions: [], asms: [], supervisors: [], distributors: [], distributorCompanies: [], distributorBranches: [] };
      return {
        brands: [],
        regions: Array.from(new Set(exclusiveIncentivesData.map((d) => d.region))).sort(),
        asms: Array.from(new Set(exclusiveIncentivesData.map((d) => d.asm))).sort(),
        supervisors: Array.from(new Set(exclusiveIncentivesData.map((d) => d.supervisor))).sort(),
        distributors: [],
        distributorCompanies: Array.from(new Set(exclusiveIncentivesData.map((d) => d.distributor_company))).sort(),
        distributorBranches: Array.from(new Set(exclusiveIncentivesData.map((d) => d.distributor_branch))).sort()
      };
    }

    if (activeMenu === 'Sell Out') {
      if (!sellOutData.length) return { brands: [], regions: [], asms: [], supervisors: [], distributors: [], channels: [], categories: [], segments: [], baStoreNonBaStores: [] };
      return {
        brands: Array.from(new Set(sellOutData.map((d) => d.brand_of))).sort(),
        regions: Array.from(new Set(sellOutData.map((d) => d.region))).sort(),
        asms: [],
        supervisors: [],
        distributors: [],
        channels: Array.from(new Set(sellOutData.map((d) => d.channel))).sort(),
        categories: Array.from(new Set(sellOutData.map((d) => d.category))).sort(),
        segments: Array.from(new Set(sellOutData.map((d) => d.segment))).sort(),
        baStoreNonBaStores: Array.from(new Set(sellOutData.map((d) => d.ba_store_non_ba_store).filter(Boolean) as string[])).sort()
      };
    }

    const currentSalesDataset = data;
    if (!currentSalesDataset.length) return { brands: [], regions: [], asms: [], supervisors: [], distributors: [] };
    
    return {
      brands: Array.from(new Set(currentSalesDataset.map((d) => d.brand_of))).sort(),
      regions: Array.from(new Set(currentSalesDataset.map((d) => d.region))).sort(),
      asms: Array.from(new Set(currentSalesDataset.map((d) => d.asm))).sort(),
      supervisors: Array.from(new Set(currentSalesDataset.map((d) => d.supervisor))).sort(),
      distributors: Array.from(new Set(currentSalesDataset.map((d) => d.distributor_name))).sort()
    };
  }, [data, sellOutData, incentivesData, exclusiveIncentivesData, activeMenu]);

  const filteredIncentivesData = useMemo(() => {
    if (activeMenu !== 'Incentives SPV Internal') return [];
    return incentivesData.filter((d) => {
      if (filters.regions.length > 0 && !filters.regions.includes(d.region)) return false;
      if (filters.asms.length > 0 && !filters.asms.includes(d.asm)) return false;
      if (filters.supervisors.length > 0 && !filters.supervisors.includes(d.supervisor)) return false;
      return true;
    });
  }, [incentivesData, filters, activeMenu]);

  const filteredExclusiveIncentivesData = useMemo(() => {
    if (activeMenu !== 'Incentives SPV Exclusive') return [];
    return exclusiveIncentivesData.filter((d) => {
      if (filters.regions.length > 0 && !filters.regions.includes(d.region)) return false;
      if (filters.asms.length > 0 && !filters.asms.includes(d.asm)) return false;
      if (filters.distributorCompanies.length > 0 && !filters.distributorCompanies.includes(d.distributor_company)) return false;
      if (filters.distributorBranches.length > 0 && !filters.distributorBranches.includes(d.distributor_branch)) return false;
      if (filters.supervisors.length > 0 && !filters.supervisors.includes(d.supervisor)) return false;
      return true;
    });
  }, [exclusiveIncentivesData, filters, activeMenu]);

  const baseFilteredData = useMemo(() => {
    if (activeMenu === 'Sell Out') {
      return sellOutData.filter((d) => {
        if (filters.brands.length > 0 && !filters.brands.includes(d.brand_of)) return false;
        if (filters.regions.length > 0 && !filters.regions.includes(d.region)) return false;
        if (filters.channels && filters.channels.length > 0 && !filters.channels.includes(d.channel)) return false;
        if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(d.category)) return false;
        if (filters.segments && filters.segments.length > 0 && !filters.segments.includes(d.segment)) return false;
        if (filters.baStoreNonBaStores && filters.baStoreNonBaStores.length > 0 && d.ba_store_non_ba_store && !filters.baStoreNonBaStores.includes(d.ba_store_non_ba_store)) return false;
        return true;
      });
    }

    return data.filter((d) => {
      if (filters.brands.length > 0 && !filters.brands.includes(d.brand_of)) return false;
      if (filters.regions.length > 0 && !filters.regions.includes(d.region)) return false;
      if (filters.asms.length > 0 && !filters.asms.includes(d.asm)) return false;
      if (activeMenu === 'Sell Through' && filters.supervisors.length > 0 && !filters.supervisors.includes(d.supervisor)) return false;
      if (filters.distributors.length > 0 && !filters.distributors.includes(d.distributor_name)) return false;
      return true;
    });
  }, [data, sellOutData, filters, activeMenu]);

  const filteredData = useMemo(() => {
    return baseFilteredData.filter((d) => {
      const date = new Date(d.calendar_date);
      if (filters.startDate && date < new Date(filters.startDate)) return false;
      if (filters.endDate && date > new Date(filters.endDate)) return false;
      return true;
    });
  }, [baseFilteredData, filters]);

  const metrics = useMemo(() => {
    if (activeMenu === 'Incentives SPV Internal') {
      const totalIncentives = filteredIncentivesData.reduce((sum, d) => sum + d.total_incentives, 0);
      return { totalValue: totalIncentives, mtdValue: 0, growthLM: 0, growthLY: 0, incentiveSPVInternal: totalIncentives, spvExclusive: 0, seIncentive: 0, uniqueDistributors: 0, topBrand: 'N/A', topASM: 'N/A' };
    }

    if (activeMenu === 'Incentives SPV Exclusive') {
      const totalIncentives = filteredExclusiveIncentivesData.reduce((sum, d) => sum + d.total_incentives, 0);
      return { totalValue: totalIncentives, mtdValue: 0, growthLM: 0, growthLY: 0, incentiveSPVInternal: 0, spvExclusive: totalIncentives, seIncentive: 0, uniqueDistributors: 0, topBrand: 'N/A', topASM: 'N/A' };
    }

    const valueKey = (activeMenu === 'Sell In' || activeMenu === 'PO Checker') 
      ? 'sell_in_value' 
      : (activeMenu === 'Sell Out' ? 'sell_out_value' : 'sell_through_value');
    const totalValue = filteredData.reduce((sum, d) => sum + ((d as any)[valueKey] || 0), 0);
    const uniqueDistributors = activeMenu === 'Sell Out'
      ? new Set(filteredData.map((d) => (d as any).segment)).size
      : new Set(filteredData.map((d) => (d as any).distributor_name)).size;
    
    const brandPerf: Record<string, number> = {};
    const asmPerf: Record<string, number> = {};
    
    filteredData.forEach((d) => {
      brandPerf[d.brand_of] = (brandPerf[d.brand_of] || 0) + ((d as any)[valueKey] || 0);
      if (activeMenu === 'Sell Out') {
        asmPerf[(d as any).category || 'N/A'] = (asmPerf[(d as any).category || 'N/A'] || 0) + ((d as any)[valueKey] || 0);
      } else {
        asmPerf[(d as any).asm] = (asmPerf[(d as any).asm] || 0) + ((d as any)[valueKey] || 0);
      }
    });

    const topBrand = Object.entries(brandPerf).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const topASM = Object.entries(asmPerf).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    let mtdValue = 0;
    let growthLM = 0;
    let growthLY = 0;

    const isSalesMenu = activeMenu === 'Sell In' || activeMenu === 'Sell Through' || activeMenu === 'Sell Out';

    if (isSalesMenu) {
      const sortedData = [...filteredData].sort((a, b) => new Date(b.calendar_date).getTime() - new Date(a.calendar_date).getTime());
      
      if (sortedData.length > 0) {
        const latestDate = new Date(sortedData[0].calendar_date);
        const latestMonth = latestDate.getMonth();
        const latestYear = latestDate.getFullYear();
        
        const currentMonthData = filteredData.filter((d) => {
          const dDate = new Date(d.calendar_date);
          return dDate.getMonth() === latestMonth && dDate.getFullYear() === latestYear;
        });
        
        const lastMonthData = baseFilteredData.filter((d) => {
          const dDate = new Date(d.calendar_date);
          let tM = latestMonth - 1, tY = latestYear;
          if (tM < 0) { tM = 11; tY--; }
          return dDate.getMonth() === tM && dDate.getFullYear() === tY;
        });

        const lastYearData = baseFilteredData.filter((d) => {
          const dDate = new Date(d.calendar_date);
          return dDate.getMonth() === latestMonth && dDate.getFullYear() === latestYear - 1;
        });

        mtdValue = currentMonthData.reduce((sum, d) => sum + (d as any)[valueKey], 0);
        const lmValue = lastMonthData.reduce((sum, d) => sum + (d as any)[valueKey], 0);
        const lyValue = lastYearData.reduce((sum, d) => sum + (d as any)[valueKey], 0);

        growthLM = lmValue ? parseFloat(((mtdValue - lmValue) / lmValue * 100).toFixed(0)) : 0;
        growthLY = lyValue ? parseFloat(((mtdValue - lyValue) / lyValue * 100).toFixed(0)) : 0;
      }
    }

    // Incentive calculations (Keep "empty" or minimal for now as requested)
    const incentiveSPVInternal = 0;
    const spvExclusive = 0;
    const seIncentive = activeMenu === 'Incentives SE' ? totalValue * 0.003 : 0;

    return { totalValue, mtdValue, growthLM, growthLY, incentiveSPVInternal, spvExclusive, seIncentive, uniqueDistributors, topBrand, topASM };
  }, [filteredData, baseFilteredData, activeMenu, filteredIncentivesData, filteredExclusiveIncentivesData]);

  const chartData = useMemo(() => {
    if (!filteredData.length) return [];
    
    const currentSalesDataset = activeMenu === 'Sell Out' ? sellOutData : data;
    const brands = Array.from(new Set(currentSalesDataset.map((d) => d.brand_of)));
    
    // Find min and max date from data to create all months in range
    const dates = filteredData.map(d => new Date(d.calendar_date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const allMonthsRange = eachMonthOfInterval({
      start: minDate,
      end: maxDate
    });

    const monthly: Record<string, any> = {};
    
    // Pre-initialize all months with zeros
    allMonthsRange.forEach(date => {
      const monthStr = format(date, 'MMM yyyy');
      monthly[monthStr] = { date: monthStr };
      if (activeMenu === 'Sell Through') {
        monthly[monthStr]['Sell In'] = 0;
        monthly[monthStr]['Sell Through'] = 0;
      } else {
        brands.forEach(b => monthly[monthStr][b] = 0);
      }
    });

    filteredData.forEach((d) => {
      const month = format(new Date(d.calendar_date), 'MMM yyyy');
      if (activeMenu === 'Sell Through') {
        monthly[month]['Sell In'] += (d as any).sell_in_value;
        monthly[month]['Sell Through'] += (d as any).sell_through_value;
      } else {
        const val = activeMenu === 'Sell Out' ? ((d as any).sell_out_value || 0) : (d as any).sell_in_value;
        if (monthly[month] && monthly[month][d.brand_of] !== undefined) {
          monthly[month][d.brand_of] += val;
        }
      }
    });

    return Object.values(monthly).sort((a, b) => {
      return parse(a.date, 'MMM yyyy', new Date()).getTime() - parse(b.date, 'MMM yyyy', new Date()).getTime();
    });
  }, [filteredData, data, sellOutData, activeMenu]);

  const regionData = useMemo(() => {
    const perf: Record<string, any> = {};
    filteredData.forEach((d) => {
      if (!perf[d.region]) {
        perf[d.region] = { 
          name: d.region, 
          value: 0,
          "Sell In": 0,
          "Sell Through": 0,
          "Sell Out": 0
        };
      }
      
      if (activeMenu === 'Sell Through') {
        perf[d.region]["Sell In"] += (d as any).sell_in_value;
        perf[d.region]["Sell Through"] += (d as any).sell_through_value;
        perf[d.region].value = perf[d.region]["Sell Through"]; // Base for default sorting
      } else if (activeMenu === 'Sell Out') {
        perf[d.region]["Sell Out"] += (d as any).sell_out_value || 0;
        perf[d.region].value = perf[d.region]["Sell Out"];
      } else {
        perf[d.region].value += (d as any).sell_in_value;
      }
    });
    return Object.values(perf).sort((a: any, b: any) => b.value - a.value);
  }, [filteredData, activeMenu]);

  const topDistributors = useMemo(() => {
    const valueKey = activeMenu === 'Sell Through' ? 'sell_through_value' : (activeMenu === 'Sell Out' ? 'sell_out_value' : 'sell_in_value');
    const perf: Record<string, number> = {};
    filteredData.forEach((d) => {
      const name = activeMenu === 'Sell Out' ? ((d as any).channel || 'Unknown') : ((d as any).distributor_name || 'Unknown');
      perf[name] = (perf[name] || 0) + ((d as any)[valueKey] || 0);
    });
    return Object.entries(perf)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredData, activeMenu]);

  const asmRanking = useMemo(() => {
    const valueKey = activeMenu === 'Sell Through' ? 'sell_through_value' : (activeMenu === 'Sell Out' ? 'sell_out_value' : 'sell_in_value');
    const perf: Record<string, number> = {};
    filteredData.forEach((d) => {
      const name = activeMenu === 'Sell Out' ? ((d as any).category || 'Unknown') : ((d as any).asm || 'Unknown');
      perf[name] = (perf[name] || 0) + ((d as any)[valueKey] || 0);
    });
    return Object.entries(perf)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData, activeMenu]);

  const supervisorRanking = useMemo(() => {
    if (activeMenu !== 'Sell Through' && activeMenu !== 'Sell Out') return [];
    
    const valueKey = activeMenu === 'Sell Out' ? 'sell_out_value' : 'sell_through_value';
    const perf: Record<string, number> = {};
    filteredData.forEach((d) => {
      const name = activeMenu === 'Sell Out' ? ((d as any).segment || 'Unknown') : ((d as any).supervisor || 'Unknown');
      perf[name] = (perf[name] || 0) + ((d as any)[valueKey] || 0);
    });
    return Object.entries(perf)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData, activeMenu]);

  const handleSync = (force = true) => {
    if (activeMenu === 'Incentives SPV Internal') {
      loadIncentivesData(force);
    } else if (activeMenu === 'Incentives SPV Exclusive') {
      loadExclusiveIncentivesData(force);
    } else if (activeMenu === 'Incentives SE') {
      loadSeIncentivesData(force);
    } else if (activeMenu === 'Sell Out') {
      loadSellOutData(force);
    } else {
      loadDashboardData(force);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white text-blue-600 gap-4">
        <Loader2 className="animate-spin w-10 h-10" />
        <div className="text-center">
          <span className="font-black tracking-[0.3em] text-xs uppercase block mb-1">YOOL-DO! SYSTEMS</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase animate-pulse">{loadingStatus}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white p-6 text-center">
        <X className="text-rose-500 mb-4" size={40} />
        <h2 className="text-xl font-black text-slate-900 mb-2">Sync Connection Failure</h2>
        <p className="text-slate-500 text-sm max-w-md mb-8">{error}</p>
        <button onClick={() => handleSync(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl hover:bg-blue-700 transition-all">Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans">
      <Sidebar 
        activeMenu={activeMenu} 
        onMenuChange={setActiveMenu} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={cn("transition-all duration-500 p-8 max-w-[1500px] mx-auto", isSidebarCollapsed ? "pl-28" : "pl-72")}>
        {activeMenu === 'Product Catalog' ? (
          <SKUList />
        ) : (
          <>
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-50">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-1">{activeMenu} Dashboard</h2>
            <p className="text-slate-400 text-sm font-medium">Strategic performance insights by YOOL-DO!</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleSync(true)}
              disabled={refreshing}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                refreshing 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 shadow-sm"
              )}
            >
              <RefreshCw size={14} className={cn(refreshing && "animate-spin")} />
              {refreshing ? "Syncing..." : "Sync Now"}
            </button>
            <div className="text-[10px] font-bold text-blue-500 bg-blue-50 px-4 py-2 rounded-full uppercase tracking-wider">Live Cloud Sync</div>
          </div>
        </header>

        {activeMenu !== 'Incentives SE' && <Filters activeMenu={activeMenu} filters={filters} onFilterChange={handleFilterChange} options={options} />}

        {activeMenu !== 'Incentives SPV Internal' && activeMenu !== 'Incentives SPV Exclusive' && activeMenu !== 'Incentives SE' && activeMenu !== 'Sell Out' && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KPICard index={0} label={`Total ${activeMenu}`} value={formatNumber(metrics.totalValue)} prefix="Rp" />
            {(activeMenu === 'Sell In' || activeMenu === 'Sell Through') ? (
              <>
                <KPICard index={1} label="MTD Performance" value={formatNumber(metrics.mtdValue)} prefix="Rp" />
                <KPICard index={2} label="Growth vs LM" value={`${metrics.growthLM}%`} subValue={metrics.growthLM} isPositive={metrics.growthLM >= 0} />
                <KPICard index={3} label="Growth vs LY" value={`${metrics.growthLY}%`} subValue={metrics.growthLY} isPositive={metrics.growthLY >= 0} />
              </>
            ) : (
              <>
                <KPICard index={1} label="Target vs Actual" value="0%" subValue={0} />
                <KPICard index={2} label="Incentives SE" value={formatNumber(metrics.seIncentive)} prefix="Rp" className="bg-slate-50 text-amber-500" />
                <KPICard index={3} label="Status" value="Under Development" className="bg-slate-50 text-slate-400" />
              </>
            )}
          </section>
        )}

        {activeMenu === 'Sell Out' && (
          <div className="mt-8">
            <SellOutDashboard data={filteredData as SellOutData[]} />
          </div>
        )}

        {(activeMenu === 'Sell In' || activeMenu === 'Sell Through') ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <KPICard index={4} label="Distributor Count" value={metrics.uniqueDistributors} />
              <KPICard index={5} label="Market Leader" value={metrics.topBrand} className="bg-blue-600 text-white" />
              <KPICard index={6} label="Star Performer" value={metrics.topASM} className="bg-blue-50 border-blue-100 text-blue-700" />
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-1 bg-blue-600 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {activeMenu === 'Sell Through' ? "Sell In vs Sell Through Trend" : "Main Trend Analysis"}
                </h3>
              </div>
              {activeMenu === 'Sell Through' ? (
                <ComparisonLineChart 
                  data={chartData} 
                  title="Sell Through Velocity" 
                />
              ) : (
                <MainTrendChart 
                  data={chartData} 
                  brands={options.brands} 
                  title={`${activeMenu} Velocity`}
                  valueLabel={`${activeMenu} Value`}
                />
              )}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 items-stretch">
              <div className="space-y-8">
                <PerformanceBarChart 
                  data={regionData} 
                  title={activeMenu === 'Sell Through' ? "Sell Through vs Sell In by Region" : `${activeMenu} by Region`} 
                  keys={activeMenu === 'Sell Through' ? ["Sell In", "Sell Through"] : ["value"]}
                />
              </div>
              <div className="space-y-8">
                {activeMenu === 'Sell Through' ? (
                  <BrandDoughnutChart 
                    data={regionData.map(r => ({ name: r.name, value: r["Sell Through"] }))} 
                    title="Regional Contribution Analysis"
                    valueLabel="Sell Through"
                  />
                ) : (
                  <RankingTable data={asmRanking} title="ASM Performance Ranking" />
                )}
              </div>
            </section>

            {activeMenu === 'Sell Through' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <RankingTable data={asmRanking} title={`ASM Ranking (By ${activeMenu})`} />
                <RankingTable data={supervisorRanking} title={`Supervisor Ranking (By ${activeMenu})`} />
              </div>
            )}

            <section className="mb-10">
              <RankingTable data={topDistributors} title={`Top 10 Distributors by ${activeMenu}`} />
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-1 bg-blue-600 rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Detailed Contribution Analysis</h3>
              </div>
              <ContributionTable data={filteredData} mode={activeMenu} />
            </section>
          </>
        ) : activeMenu === 'Incentives SPV Internal' ? (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Incentives SPV Internal Performance</h3>
            </div>
            <IncentivesSPVTable data={filteredIncentivesData} />
          </div>
        ) : activeMenu === 'Incentives SPV Exclusive' ? (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Incentives SPV Exclusive Performance</h3>
            </div>
            <IncentivesSPVExclusiveTable data={filteredExclusiveIncentivesData} />
          </div>
        ) : activeMenu === 'Incentives SE' ? (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 bg-blue-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Incentives SE Performance</h3>
            </div>
            <IncentivesSETable data={seIncentivesData} />
          </div>
        ) : activeMenu === 'Sell Out' ? null : (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">{activeMenu} Menu</h3>
            <p className="text-slate-500 text-sm max-w-sm text-center">
              Module is currently being configured to synchronize specific targets and performance structures.
            </p>
          </div>
        )}
          </>
        )}

        <footer className="mt-16 -mx-8 px-8 py-8 bg-blue-600 text-white/90">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-[10px] font-black tracking-[0.3em] uppercase">
              YOOL-DO! — Built by Yool
            </div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase opacity-60">
              Good Luck Beating the Numbers
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
