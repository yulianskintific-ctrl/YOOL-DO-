/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SalesData {
  brand_of: string;
  region: string;
  calendar_date: string;
  distributor_name: string;
  asm: string;
  supervisor: string;
  sell_in_value: number;
  sell_through_value: number;
  sell_out_value?: number;
}

export interface SellOutData {
  calendar_date: string;
  channel: string;
  brand_of: string;
  region: string;
  category: string;
  segment: string;
  sell_through_value: number;
  sell_out_value: number;
  ba_store_non_ba_store?: string;
  _isFallback?: boolean;
  _errorType?: string;
  _errorMessage?: string;
}

export interface IncentiveSPVData {
  region: string;
  asm: string;
  supervisor: string;
  target_total_gmv: number;
  ach_total_gmv: number;
  target_gmv_sa: number;
  ach_gmv_sa: number;
  target_gmv_bcd: number;
  ach_gmv_bcd: number;
  target_ao: number;
  ach_ao: number;
  target_ec: number;
  ach_ec: number;
  target_msl: number;
  ach_msl: number;
  incentive_gmv: number;
  incentive_ao: number;
  incentive_msl: number;
  total_incentives: number;
}

export interface IncentiveSPVExclusiveData {
  region: string;
  asm: string;
  distributor_company: string;
  distributor_branch: string;
  supervisor: string;
  target_total_gmv: number;
  ach_total_gmv: number;
  target_gmv_sa: number;
  ach_gmv_sa: number;
  target_gmv_bcd: number;
  ach_gmv_bcd: number;
  target_ao: number;
  ach_ao: number;
  target_ec: number;
  ach_ec: number;
  target_msl: number;
  ach_msl: number;
  incentive_gmv: number;
  incentive_ao: number;
  incentive_msl: number;
  total_incentives: number;
  _isFallback?: boolean;
  _errorType?: string;
  _errorMessage?: string;
}

export interface IncentiveSEData {
  region: string;
  distributor: string;
  supervisor: string;
  distributor_se: string;
  target_total_gmv: number;
  ach_total_gmv: number;
  target_gmv_sa: number;
  ach_gmv_sa: number;
  target_gmv_bcd: number;
  ach_gmv_bcd: number;
  target_ao: number;
  ach_ao: number;
  target_ec: number;
  ach_ec: number;
  target_st_product_focus: number;
  ach_st_product_focus: number;
  target_ao_product_focus: number;
  ach_ao_product_focus: number;
  incentive_gmv: number;
  incentive_ao: number;
  incentive_st_focus: number;
  incentive_ao_focus: number;
  total_incentives: number;
  _isFallback?: boolean;
  _errorType?: string;
  _errorMessage?: string;
}

export interface DashboardMetrics {
  totalValue: number;
  mtdValue: number;
  growthLM: number;
  growthLY: number;
  incentiveSPVInternal: number;
  spvExclusive: number;
  seIncentive: number;
  uniqueDistributors: number;
  topBrand: string;
  topASM: string;
}

export type SidebarMenu = 'KPI Review' | 'Sell In' | 'Sell Through' | 'Sell Out' | 'Incentives SPV Internal' | 'Incentives SPV Exclusive' | 'Incentives SE' | 'Incentives Pertinggal' | 'Distributor Incentives' | 'PO Checker' | 'Program Tracker' | 'Product Catalog' | 'MSL' | 'SKU Focus' | 'Category Analysis' | 'Stock Analysis' | 'Stock National' | 'Stock Cabang';

export interface StockAnalysisData {
  update_date?: string;
  distributor?: string;
  product_code?: string;
  item_id?: string;
  sku?: string;
  soh_qty?: number;
  in_transit_stock_qty?: number;
  total_transit?: number;
  avg_am_l3m_qty?: number;
  last_month_st_qty?: number;
  brand?: string;
  avg_st_l3m?: number;
  stock_total?: number;
  woi_st_l3m?: number;
  death_stock_flag?: string;
  remarks_woi?: string;
  po_remarks?: string;
  _isFallback?: boolean;
}

export interface StockNationalData {
  brand: string;
  sku_number: string;
  sku: string;
  jakarta_wh: number;
  surabaya_wh: number;
  makassar_wh: number;
  kalimantan_wh: number;
  national_stock: number;
  supply_control_status_gt: string;
  remarks: string;
  _isFallback?: boolean;
}

export interface SKUFocusStoreData {
  region: string;
  distributor_name: string;
  cust_id: string;
  cust_name: string;
  asm: string;
  spv: string;
  distributor_se: string;
  sku: string;
  qty: number;
  st: number;
  eligible_st: number;
  eligibility: string;
  _isFallback?: boolean;
}

export interface SKUFocusSPVData {
  region: string;
  distributor_name: string;
  asm: string;
  spv: string;
  distributor_se: string;
  sku: string;
  st_eligible: number;
  ao: number;
  target_ao: number;
  target_st: number;
  _isFallback?: boolean;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  brands: string[];
  regions: string[];
  asms: string[];
  supervisors: string[];
  distributors: string[];
  distributorCompanies: string[];
  distributorBranches: string[];
  channels?: string[];
  categories?: string[];
  segments?: string[];
  baStoreNonBaStores?: string[];
}

export interface CategoryAnalysisData {
  source_of: string;
  month: string;
  region: string;
  distributor_name: string;
  item_id: string;
  sku: string;
  total_quantity: number;
  sell_through_value: number;
  sell_out_value: number;
  category: string;
  _isFallback?: boolean;
}

