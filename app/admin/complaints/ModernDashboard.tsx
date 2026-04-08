// app/admin/complaints/ModernDashboard.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Map, 
  BarChart3, 
  ListTree,
  ChevronDown,
  ChevronRight,
  Target,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  TrendingUp
} from 'lucide-react';
import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer, 
  Treemap, 
  Line
} from 'recharts';

type ViewMode = 'Count' | 'Qty';

// --- MOCK DATA ---
const flowData = [
  { stage: 'Confirmed', count: 120, qty: 5000 },
  { stage: 'Observasi', count: 95, qty: 3800 },
  { stage: 'Investigation', count: 60, qty: 2100 },
  { stage: 'Lab Test', count: 25, qty: 850 },
  { stage: 'Waiting Decision', count: 15, qty: 400 },
  { stage: 'Close', count: 105, qty: 4600 },
];

const statusColumns = [
  { key: 'total', label: 'Total complaint', bg: 'bg-red-200/50 text-red-800' },
  { key: 'confirmed', label: 'Confirmed', bg: 'bg-white dark:bg-slate-800' },
  { key: 'observasi', label: 'Observasi', bg: 'bg-lime-200/40 text-lime-900' },
  { key: 'investigation', label: 'Investigation', bg: 'bg-purple-200/50 text-purple-900' },
  { key: 'labTest', label: 'Lab Test', bg: 'bg-cyan-200/50 text-cyan-900' },
  { key: 'waitingDecision', label: 'Waiting Decision', bg: 'bg-yellow-300/50 text-yellow-900' }
];

const closeColumns = [
  { key: 'closedTotal', label: 'Total Closed Complaint', bg: 'bg-orange-100/50 text-orange-900' },
  { key: 'validMfg', label: 'Valid Manufacturing', bg: 'bg-orange-200/60 text-orange-900' },
  { key: 'validNonMfg', label: 'Valid Non Manufacturing', bg: 'bg-orange-100/50 text-orange-900' },
  { key: 'nonValid', label: 'Non Valid Complaint', bg: 'bg-green-200/50 text-green-900' },
  { key: 'notComplaint', label: 'Not A Complaint', bg: 'bg-purple-200/40 text-purple-900' }
];

const complaintTypesList = ['Germination & Vigor', 'Seed damage', 'Packaging', 'Small Plant', 'Delivery *)'] as const;

const territoryMapping: Record<string, string> = {
  'T1': 'North Sumatera, West Sumatera',
  'T2': 'Lampung, South Sumatera',
  'T3': 'Central Java, West Java',
  'T4': 'East Java',
  'T5': 'South Sulawesi',
  'T6': 'Gorontalo, Central Sulawesi',
  'T7': 'NTB, NTT',
  'T8': 'Kalimantan'
};
// --- END MOCK DATA ---

const CustomizedContent = (props: any) => {
  const { depth, x, y, width, height, payload, name, value, fill } = props;
  
  if (depth === 0) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fill || payload?.fill || '#8884d8',
          stroke: '#fff',
          strokeWidth: 2,
          strokeOpacity: 1,
          transition: 'all 0.3s ease',
        }}
      />
      {width > 60 && height > 30 && (
        <foreignObject x={x} y={y} width={width} height={height}>
          <div className="w-full h-full flex flex-col justify-center items-center text-center text-white px-2 overflow-hidden">
            <span 
              className={`font-bold leading-tight line-clamp-2 ${width > 120 ? 'text-xs' : 'text-[10px]'}`}
              title={name}
            >
              {name}
            </span>
            {height > 50 && (
              <span className="text-[11px] opacity-90 mt-0.5">
                {value}
              </span>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
};

interface DashboardProps {
  filters?: {
    status: string;
    search: string;
    age: string;
    product: string;
  };
  sidebarFilters?: {
    fiscalYear: string | null;
    quarter: string | null;
    status: string | null;
  };
}

export default function ModernDashboard({ filters, sidebarFilters }: DashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('Count');
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // New states for real API data
  const [hybridMatrixData, setHybridMatrixData] = useState<any[]>([]);
  const [conclusionMatrixData, setConclusionMatrixData] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchMatrixData = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        if (sidebarFilters?.fiscalYear) queryParams.append('fy', sidebarFilters.fiscalYear);
        if (sidebarFilters?.quarter) queryParams.append('q', sidebarFilters.quarter);
        if (sidebarFilters?.status) queryParams.append('sbStatus', sidebarFilters.status);
        
        if (filters?.status) queryParams.append('status', filters.status);
        if (filters?.product) queryParams.append('product', filters.product);
        if (filters?.age) queryParams.append('age', filters.age);
        if (filters?.search) queryParams.append('search', filters.search);

        const res = await fetch(`/api/complaints/analytics/matrix?${queryParams.toString()}`);
        const json = await res.json();
        if (json.success) {
          setHybridMatrixData(json.data.hybridMatrixData);
          setConclusionMatrixData(json.data.conclusionMatrixData);
          setLocationData(json.data.locationData);
        }
      } catch (err) {
        console.error('Failed to fetch matrix data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMatrixData();
  }, [filters, sidebarFilters]);

  const getMetric = (obj: any) => viewMode === 'Count' ? obj.count : obj.qty;
  const unit = viewMode === 'Count' ? '' : 'Kg';

  const maxLocationMetric = useMemo(() => {
    let max = 0;
    locationData.forEach(r => {
      Object.values(r.locs || {}).forEach((l: any) => {
        if (getMetric(l) > max) max = getMetric(l);
      });
    });
    return max;
  }, [locationData, viewMode]);

  const getHeatmapColor = (value: number) => {
    if (value === 0) return 'bg-gray-50 dark:bg-gray-800';
    const ratio = value / (maxLocationMetric || 1);
    if (ratio > 0.8) return 'bg-red-500 text-white';
    if (ratio > 0.6) return 'bg-red-400 text-white';
    if (ratio > 0.4) return 'bg-orange-400 text-white';
    if (ratio > 0.2) return 'bg-orange-300 text-gray-800';
    return 'bg-amber-100 text-gray-800 dark:bg-amber-900/30 dark:text-amber-200';
  };

  // Dynamically compute flow/chart data matching the pipeline
  const computeFlowTotal = (key: string) => {
    return hybridMatrixData.reduce((acc, crop) => acc + crop.hybrids.reduce((a: number, h: any) => a + (viewMode === 'Count' ? h.metrics.count[key] : h.metrics.qty[key]), 0), 0);
  };

  const chartData = [
    { name: 'Confirmed', value: computeFlowTotal('confirmed') },
    { name: 'Observasi', value: computeFlowTotal('observasi') },
    { name: 'Investigation', value: computeFlowTotal('investigation') },
    { name: 'Lab Test', value: computeFlowTotal('labTest') },
    { name: 'Waiting Decision', value: computeFlowTotal('waitingDecision') },
    { name: 'Close', value: computeFlowTotal('closedTotal') }
  ];
  
  const fillMap: Record<string, string> = {
    'Valid Manufacturing': '#ef4444',
    'Valid Non Manufacturing': '#f59e0b',
    'Non Valid': '#10b981',
    'Not A Complaint': '#3b82f6',
    'Under Investigation': '#64748b'
  };

  const treemapParsedData = conclusionMatrixData.map(d => {
    const totalCount = Object.values(d.metrics.count).reduce((a: any, b: any) => a + b, 0) as number;
    const totalQty = Object.values(d.metrics.qty).reduce((a: any, b: any) => a + b, 0) as number;
    return {
      name: d.conclusion,
      size: viewMode === 'Count' ? totalCount : totalQty,
      fill: fillMap[d.conclusion] || '#8884d8'
    };
  });

  const tabs = [
    { id: 0, label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 1, label: 'Breakdown by Hybrid', icon: <ListTree className="h-4 w-4" /> },
    { id: 2, label: 'Complaint Analysis', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 3, label: 'Location Distribution', icon: <Map className="h-4 w-4" /> },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-6 flex flex-col">
      {/* Header & Toggle */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Operational Intelligence Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time insights across product lines, regions, and complaint states.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">View by:</span>
          {(['Count', 'Qty'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === mode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {mode} {mode === 'Qty' && '(Kg)'}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-gray-700/30'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="p-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 0 && (
          <div className="space-y-6">
            {/* COMPLAINT PROGRESS STATUS (Single Row Table Banner) */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm custom-scrollbar bg-white dark:bg-slate-900 mb-8 mt-2">
              <table className="w-full text-center text-xs sm:text-sm whitespace-nowrap min-w-[1000px]">
                <thead>
                  <tr>
                    {statusColumns.map(s => (
                      <th key={s.key} rowSpan={2} className={`py-4 px-3 font-bold border-b border-slate-200 dark:border-slate-700 border-r align-middle text-sm whitespace-normal leading-tight mx-auto ${s.bg}`}>
                        {s.label}
                      </th>
                    ))}
                    <th colSpan={closeColumns.length} className="py-2 px-3 font-bold border-b border-slate-200 dark:border-slate-700 align-middle bg-[#dcd2af]/40 text-slate-800 dark:text-slate-200 border-r">Close</th>
                  </tr>
                  <tr>
                    {closeColumns.map((c, i) => (
                      <th key={c.key} className={`py-3 px-2 font-bold border-b border-slate-200 dark:border-slate-700 ${i !== closeColumns.length-1 ? 'border-r' : ''} align-middle text-xs whitespace-normal leading-tight ${c.bg}`}>
                         {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  <tr className="text-xl sm:text-2xl font-bold">
                    {statusColumns.map(s => {
                      const total = hybridMatrixData.reduce((acc, crop) => acc + crop.hybrids.reduce((a: number, h: any) => a + (viewMode === 'Count' ? h.metrics.count : h.metrics.qty as any)[s.key], 0), 0);
                      return (
                        <td key={s.key} className="py-5 px-3 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                          {total}
                          {viewMode === 'Qty' && <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">Kg</span>}
                        </td>
                      );
                    })}
                    {closeColumns.map((c, i) => {
                      const total = hybridMatrixData.reduce((acc, crop) => acc + crop.hybrids.reduce((a: number, h: any) => a + (viewMode === 'Count' ? h.metrics.count : h.metrics.qty as any)[c.key], 0), 0);
                      return (
                        <td key={c.key} className={`py-5 px-3 ${i !== closeColumns.length-1 ? 'border-r' : ''} border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100`}>
                          {total}
                          {viewMode === 'Qty' && <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">Kg</span>}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Funnel/Bar Chart */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800 text-center">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-6 flex justify-center items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Complaint Progress Pipeline
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`${value} ${unit}`, viewMode]} 
                    />
                    <Bar 
                      dataKey="value" 
                      barSize={40} 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BREAKDOWN BY HYBRID */}
        {activeTab === 1 && (
          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm w-max min-w-full">
              <table className="w-full text-center text-xs sm:text-sm whitespace-nowrap">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b-2 border-slate-300 dark:border-slate-600 sticky top-0 z-10">
                  <tr>
                    <th rowSpan={2} className="py-2 px-3 font-bold border-r border-slate-200 dark:border-slate-700 sticky left-0 z-20 bg-slate-100 dark:bg-slate-800">Crop</th>
                    <th rowSpan={2} className="py-2 px-3 font-bold border-r border-slate-200 dark:border-slate-700 sticky left-[4.5rem] md:left-24 z-20 bg-slate-100 dark:bg-slate-800">Hybrid</th>
                    <th rowSpan={2} className="py-2 px-3 font-bold border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80"></th>
                    <th rowSpan={2} className="py-2 px-2 font-bold border-r border-slate-200 dark:border-slate-700 bg-red-200/50 text-red-800">Total complaint</th>
                    <th colSpan={statusColumns.length - 1} className="py-2 px-2 font-bold border-b border-r border-slate-200 dark:border-slate-700">Status</th>
                    <th colSpan={closeColumns.length} className="py-2 px-2 font-bold border-b border-slate-200 dark:border-slate-700 bg-orange-100/30">Close</th>
                  </tr>
                  <tr>
                    {statusColumns.slice(1).map(s => (
                      <th key={s.key} className={`py-2 px-2 font-bold border-r border-slate-200 dark:border-slate-700 ${s.bg} text-slate-700 dark:text-slate-200 text-[11px] whitespace-normal leading-tight text-center align-middle`}>{s.label}</th>
                    ))}
                    {closeColumns.map((c, i) => (
                      <th key={c.key} className={`py-2 px-2 font-bold ${i !== closeColumns.length - 1 ? 'border-r' : ''} border-slate-200 dark:border-slate-700 ${c.bg} text-slate-700 dark:text-slate-200 text-[11px] whitespace-normal leading-tight text-center align-middle`}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300">
                  {hybridMatrixData.map((cropGroup) => (
                    <React.Fragment key={cropGroup.crop}>
                      {cropGroup.hybrids.map((hybrid: any, hybridIdx: number) => (
                        <tr key={hybrid.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          {hybridIdx === 0 && (
                            <td rowSpan={cropGroup.hybrids.length} className="py-2 px-3 font-bold border-r border-b-0 border-slate-200 dark:border-slate-700 align-middle bg-slate-50 dark:bg-slate-900 whitespace-normal text-left sticky left-0 z-10">{cropGroup.crop}</td>
                          )}
                          <td className="py-2 px-3 font-semibold border-r border-slate-200 dark:border-slate-700 align-middle text-left sticky left-[4.5rem] md:left-24 z-10 bg-white dark:bg-slate-900">{hybrid.name}</td>
                          <td className="py-2 px-3 font-medium border-r border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/30 text-left text-[11px] whitespace-nowrap">
                            {viewMode === 'Count' ? 'Jumlah' : 'Qty (Kg)'}
                          </td>
                          <td className={`py-2 px-2 border-r border-slate-200 dark:border-slate-700 font-bold ${viewMode === 'Count' ? 'bg-red-100/40 text-red-700' : 'bg-red-50/30 text-slate-600 dark:text-slate-400'}`}>
                            {viewMode === 'Count' ? (hybrid.metrics.count.total || '') : (hybrid.metrics.qty.total || '')}
                          </td>
                          {statusColumns.slice(1).map(s => (
                            <td key={s.key} className={`py-2 px-2 border-r border-slate-200 dark:border-slate-700 ${viewMode === 'Count' ? 'bg-slate-50/20' : 'text-slate-500'}`}>
                              {(viewMode === 'Count' ? hybrid.metrics.count : hybrid.metrics.qty as any)[s.key] || ''}
                            </td>
                          ))}
                          {closeColumns.map((c, i) => (
                            <td key={c.key} className={`py-2 px-2 ${i !== closeColumns.length - 1 ? 'border-r' : ''} border-slate-200 dark:border-slate-700 ${viewMode === 'Count' ? 'bg-slate-50/20 font-medium' : 'text-slate-500'} ${c.key === 'closedTotal' && viewMode === 'Count' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}>
                              {(viewMode === 'Count' ? hybrid.metrics.count : hybrid.metrics.qty as any)[c.key] || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  
                  {/* Totals Row Dynamic */}
                  <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-t-[3px] border-slate-300 dark:border-slate-600">
                    <td colSpan={2} className="py-2 px-3 text-left border-r border-slate-200 dark:border-slate-700 sticky left-0 z-10 bg-slate-100 dark:bg-slate-800">
                      Total {viewMode === 'Count' ? 'Jumlah' : 'Qty (Kg)'}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-700"></td>
                    <td className="py-2 px-2 text-center border-r border-slate-200 dark:border-slate-700 text-red-700">
                       {hybridMatrixData.reduce((acc, crop) => acc + crop.hybrids.reduce((a: number, h: any) => a + (viewMode === 'Count' ? h.metrics.count.total : h.metrics.qty.total), 0), 0)}
                    </td>
                    {statusColumns.slice(1).map(s => {
                      const total = hybridMatrixData.reduce((acc, crop) => acc + crop.hybrids.reduce((a: number, h: any) => a + (viewMode === 'Count' ? h.metrics.count : h.metrics.qty as any)[s.key], 0), 0);
                      return <td key={s.key} className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">{total}</td>;
                    })}
                    {closeColumns.map((c, i) => {
                      const total = hybridMatrixData.reduce((acc, crop) => acc + crop.hybrids.reduce((a: number, h: any) => a + (viewMode === 'Count' ? h.metrics.count : h.metrics.qty as any)[c.key], 0), 0);
                      return <td key={c.key} className={`py-2 px-2 ${i !== closeColumns.length - 1 ? 'border-r' : ''} border-slate-200 dark:border-slate-700 ${c.key === 'closedTotal' ? 'text-blue-700 dark:text-blue-400 font-bold' : ''}`}>{total}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ANALYSIS TREEMAP */}
        {activeTab === 2 && (
          <div className="flex flex-col gap-6">
            {/* Treemap */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 h-96 flex flex-col">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 pl-1">Conclusion Distribution ({viewMode})</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemapParsedData}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    content={<CustomizedContent />}
                  >
                    <Tooltip 
                      formatter={(value: any) => [`${value} ${unit}`, viewMode]} 
                      itemStyle={{ color: '#333' }}
                      labelStyle={{ display: 'none' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto bg-white dark:bg-slate-900 shadow-sm mt-4">
              <table className="w-full text-center text-xs sm:text-sm whitespace-nowrap">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th rowSpan={2} className="py-2 px-3 font-bold border-b border-r border-slate-200 dark:border-slate-700 align-middle">Complaint Conclusion</th>
                    <th rowSpan={2} className="py-2 px-3 font-bold border-b border-r border-slate-200 dark:border-slate-700 align-middle bg-slate-50 dark:bg-slate-800/80"></th>
                    <th colSpan={complaintTypesList.length} className="py-2 px-3 font-bold border-b border-slate-200 dark:border-slate-700 text-center">Type of Complaint</th>
                  </tr>
                  <tr>
                    {complaintTypesList.map(t => (
                      <th key={t} className="py-2 px-3 font-bold border-b border-l border-slate-200 dark:border-slate-700">{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300">
                  {conclusionMatrixData.map(c => {
                    const color = fillMap[c.conclusion] || '#cbd5e1';
                    return (
                      <React.Fragment key={c.conclusion}>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3 font-semibold border-r border-slate-200 dark:border-slate-700 text-left align-middle whitespace-normal">
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-3 h-3 rounded-sm shadow-sm shrink-0" style={{ backgroundColor: color }} />
                              {c.conclusion.replace('-', ' ')}
                            </div>
                          </td>
                          <td className="py-2 px-3 font-medium border-r border-slate-200 dark:border-slate-700 text-left bg-slate-50/70 dark:bg-slate-800/30 whitespace-nowrap">
                            {viewMode === 'Count' ? 'Jumlah' : 'Qty (Kg)'}
                          </td>
                          {complaintTypesList.map(t => (
                            <td key={t} className={`py-2 px-3 border-l border-slate-200 dark:border-slate-700 ${viewMode === 'Count' ? 'bg-slate-50/70 dark:bg-slate-800/30' : 'text-slate-500'}`}>
                              {(viewMode === 'Count' ? c.metrics?.count : c.metrics?.qty as any)[t] || ''}
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {/* Totals Row Dynamic */}
                  <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-t-[3px] border-slate-300 dark:border-slate-600">
                    <td colSpan={2} className="py-2 px-3 text-left border-r border-slate-200 dark:border-slate-700">
                      Total {viewMode === 'Count' ? 'Jumlah' : 'Qty (Kg)'}
                    </td>
                    {complaintTypesList.map(t => {
                      const total = conclusionMatrixData.reduce((acc, curr) => acc + ((viewMode === 'Count' ? curr.metrics?.count : curr.metrics?.qty as any)[t] || 0), 0);
                      return <td key={t} className="py-2 px-3 border-l border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">{total}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: LOCATION HEATMAP */}
        {activeTab === 3 && (
          <div className="overflow-x-auto">
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden min-w-[700px]">
              <table className="w-full text-center text-sm table-fixed">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-3 px-2 font-bold border-b border-slate-200 dark:border-slate-700 border-r w-24">Crop</th>
                    <th className="py-3 px-2 font-bold border-b border-slate-200 dark:border-slate-700 border-r w-32">Overall {unit}</th>
                    {['T1','T2','T3','T4','T5','T6','T7','T8'].map(t => (
                      <th key={t} className="py-2 px-1 border-b border-slate-200 dark:border-slate-700 text-center align-top w-[11%]">
                        <div className="font-bold text-sm text-slate-700 dark:text-slate-300">{t}</div>
                        <div className="text-[10px] font-normal text-slate-500 whitespace-pre-wrap leading-tight mt-1">{territoryMapping[t].replace(', ', ',\n')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300">
                  {locationData.map((row) => {
                    let totalRegion = 0;
                    Object.values(row.locs).forEach((val: any) => totalRegion += getMetric(val));
                    
                    return (
                      <tr key={row.region}>
                        <td className="py-3 px-2 font-bold border-r border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                          {row.region}
                        </td>
                        <td className="py-3 px-2 font-bold text-blue-600 dark:text-blue-400 border-r border-slate-100 dark:border-slate-700">
                          {totalRegion}
                        </td>
                        {['T1','T2','T3','T4','T5','T6','T7','T8'].map(t => {
                          const val = getMetric((row.locs as any)[t]);
                          const heatClass = getHeatmapColor(val);
                          return (
                            <td key={t} className="p-1">
                              <div className={`w-full h-10 flex items-center justify-center rounded-md font-medium transition-colors ${heatClass}`}>
                                {val}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                <span className="font-semibold">Heatmap Intensity:</span>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-gray-50 dark:bg-gray-800 border" /> Low</div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-amber-100 border" /></div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-orange-300 border" /></div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-red-400 border" /></div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-red-500 border" /> High</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
