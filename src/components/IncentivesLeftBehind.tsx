/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ExternalLink, FileSpreadsheet, ArrowUpRight, Award, ShieldAlert, Users } from "lucide-react";
import { motion } from "motion/react";

interface LinkItem {
  title: string;
  url: string;
  description?: string;
  region: "BDU" | "TAA East & North" | "TAA South & Central";
}

export default function IncentivesLeftBehind() {
  const spvInternalLinks: LinkItem[] = [
    {
      title: "BDU Incentives SPV Internal",
      url: "https://docs.google.com/spreadsheets/d/1SzgJQROP-ediuZik7kkz80j2Dm3H6t7iBEMLNGm8UNo/edit?gid=2033940234#gid=2033940234",
      region: "BDU",
    },
    {
      title: "TAA East & North SPV Internal",
      url: "https://docs.google.com/spreadsheets/d/1UGorXXyPF66hQlKWeSRguy14SWS-Yz8t2tCeeLr9dn0/edit?gid=1961441502#gid=1961441502",
      region: "TAA East & North",
    },
    {
      title: "TAA South & Central SPV Internal",
      url: "https://docs.google.com/spreadsheets/d/1vms258YUFnWT2umjlm2fIo-Cn8SMSVgy5uUdCy5fKkU/edit?gid=440778041#gid=440778041",
      region: "TAA South & Central",
    },
  ];

  const seExclusiveLinks: LinkItem[] = [
    {
      title: "BDU Incentives SE & SPV Exclusive",
      url: "https://docs.google.com/spreadsheets/d/1S0IXKJMbH4vJOrel-XXUWyncQAuL6vhTElr4Moc2a5g/edit?gid=1990350666#gid=1990350666",
      region: "BDU",
    },
    {
      title: "TAA East & North Incentives SE & SPV Exclusive",
      url: "https://docs.google.com/spreadsheets/d/1sw8IXNy2qPBjUCx9QGCfMiUyVrnYCk-pL6qqconm51w/edit?gid=1890388733#gid=1890388733",
      region: "TAA East & North",
    },
    {
      title: "TAA South & Central Incentives SE & SPV Exclusive",
      url: "https://docs.google.com/spreadsheets/d/1Nh7gMhvzxzCbur1vRi4bIjPiW_idUCHFAmQ0vmoqLrA/edit?gid=1688708527#gid=1688708527",
      region: "TAA South & Central",
    },
  ];

  const renderCard = (item: LinkItem, index: number) => {
    // Determine gradient/color theme based on region
    const getThemeColor = (region: string) => {
      switch (region) {
        case "BDU":
          return {
            bg: "from-blue-50 to-indigo-50/50 hover:border-blue-300",
            badge: "bg-blue-100 text-blue-800 border-blue-200",
            button: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100",
            iconBg: "bg-blue-100 text-blue-600"
          };
        case "TAA East & North":
          return {
            bg: "from-emerald-50 to-teal-50/50 hover:border-emerald-300",
            badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
            button: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100",
            iconBg: "bg-emerald-100 text-emerald-600"
          };
        case "TAA South & Central":
          return {
            bg: "from-violet-50 to-fuchsia-50/50 hover:border-violet-300",
            badge: "bg-violet-100 text-violet-800 border-violet-200",
            button: "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-100",
            iconBg: "bg-violet-100 text-violet-600"
          };
        default:
          return {
            bg: "from-slate-50 to-slate-100 hover:border-slate-300",
            badge: "bg-slate-100 text-slate-800 border-slate-200",
            button: "bg-slate-700 hover:bg-slate-800 text-white shadow-slate-100",
            iconBg: "bg-slate-100 text-slate-600"
          };
      }
    };

    const theme = getThemeColor(item.region);

    return (
      <motion.div
        key={item.title}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        id={`card-${item.title.replace(/\s+/g, '-').toLowerCase()}`}
        className={`group bg-gradient-to-br ${theme.bg} border border-slate-100 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${theme.badge}`}>
              {item.region}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${theme.iconBg}`}>
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
          </div>
          <h4 className="text-base font-black text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors mb-2 line-clamp-1">
            {item.title}
          </h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
            {item.description || ""}
          </p>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          id={`link-btn-${item.title.replace(/\s+/g, '-').toLowerCase()}`}
          className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-sm ${theme.button}`}
        >
          Open
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </motion.div>
    );
  };

  return (
    <div id="incentives-left-behind-container" className="space-y-12">
      {/* Section 1: SPV Internal */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-1 bg-blue-600 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            Incentives SPV Internal
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spvInternalLinks.map((item, idx) => renderCard(item, idx))}
        </div>
      </div>

      {/* Section 2: SE & SPV Exclusive */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-1 bg-emerald-600 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            Incentives SE & SPV Exclusive
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seExclusiveLinks.map((item, idx) => renderCard(item, idx + 3))}
        </div>
      </div>
    </div>
  );
}
