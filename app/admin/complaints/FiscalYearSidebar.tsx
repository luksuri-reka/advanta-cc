import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface FiscalYearData {
  id: string;
  label: string;
  hasUnresolved: boolean;
  metrics: {
    pending: number;
    inProgress: number;
    resolved: number;
    total: number;
  };
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

interface ComplaintLite {
  id: number;
  status: string;
  created_at: string;
}

interface Props {
  complaints: ComplaintLite[];
  selectedFY: string | null;
  selectedQuarter: string | null;
  selectedStatus: string | null; // 'Pending', 'In Progress', 'Resolved'
  onFilterChange: (fy: string | null, quarter: string | null, status: string | null) => void;
}

export default function FiscalYearSidebar({
  complaints,
  selectedFY,
  selectedQuarter,
  selectedStatus,
  onFilterChange
}: Props) {
  const fiscalYearsData = useMemo(() => {
    const fyMap = new Map<string, FiscalYearData>();

    complaints.forEach((c) => {
      if (!c.created_at) return;
      const date = new Date(c.created_at);
      if (isNaN(date.getTime())) return;
      
      const year = date.getFullYear();
      const month = date.getMonth(); // 0 is Jan, 3 is Apr
      const isFYNext = month >= 3; 
      const baseYear = isFYNext ? year : year - 1;
      const fyLabel = `FY${baseYear.toString().slice(-2)}`;
      
      const labelFull = `FY ${baseYear + 1} (Apr '${baseYear.toString().slice(-2)} - Mar '${(baseYear + 1).toString().slice(-2)})`;

      if (!fyMap.has(fyLabel)) {
        fyMap.set(fyLabel, {
          id: fyLabel,
          label: labelFull,
          hasUnresolved: false,
          metrics: { pending: 0, inProgress: 0, resolved: 0, total: 0 }
        });
      }

      const fyEntry = fyMap.get(fyLabel)!;
      fyEntry.metrics.total++;

      const pendingStatuses = ['submitted', 'pending_response'];
      const inProgressStatuses = ['acknowledged', 'observation', 'investigating', 'investigation', 'decision'];
      const resolvedStatuses = ['resolved', 'closed'];

      if (pendingStatuses.includes(c.status)) {
        fyEntry.metrics.pending++;
        fyEntry.hasUnresolved = true;
      } else if (inProgressStatuses.includes(c.status)) {
        fyEntry.metrics.inProgress++;
        fyEntry.hasUnresolved = true;
      } else if (resolvedStatuses.includes(c.status)) {
        fyEntry.metrics.resolved++;
      }
    });

    return Array.from(fyMap.values()).sort((a, b) => b.id.localeCompare(a.id));
  }, [complaints]);

  const [expandedFY, setExpandedFY] = useState<string | null>(selectedFY);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Set default expanded FY AND actually apply the filter when data loads if nothing is selected
  useEffect(() => {
    if (!hasInitialized && fiscalYearsData.length > 0) {
      setHasInitialized(true);
      if (!selectedFY) {
        setExpandedFY(fiscalYearsData[0].id);
        
        // Use a small timeout to ensure parent component is ready before dispatching the filter
        setTimeout(() => {
          onFilterChange(fiscalYearsData[0].id, null, null);
        }, 0);
      }
    }
  }, [fiscalYearsData, hasInitialized, selectedFY, onFilterChange]);

  const toggleFY = (fyId: string) => {
    if (expandedFY === fyId) {
      setExpandedFY(null);
      // Optional: clear filters if closing the FY
      if (selectedFY === fyId) {
         onFilterChange(null, null, null);
      }
    } else {
      setExpandedFY(fyId);
      onFilterChange(fyId, null, null);
    }
  };

  const handleStatusClick = (fyId: string, status: string) => {
    if (selectedFY === fyId && selectedStatus === status) {
      onFilterChange(fyId, selectedQuarter, null); // toggle off
    } else {
      onFilterChange(fyId, selectedQuarter, status);
    }
  };

  const handleQuarterClick = (fyId: string, quarter: string) => {
    if (selectedFY === fyId && selectedQuarter === quarter) {
      onFilterChange(fyId, null, selectedStatus); // toggle off
    } else {
      onFilterChange(fyId, quarter, selectedStatus);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-6">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
          Fiscal Year Filter
        </h2>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {fiscalYearsData.map((fy: FiscalYearData) => {
          const isExpanded = expandedFY === fy.id;
          const isActiveFY = selectedFY === fy.id;

          return (
            <div key={fy.id} className="flex flex-col">
              {/* Accordion Header */}
              <div 
                className={`flex items-center justify-between p-4 cursor-pointer transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 
                  ${isExpanded ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
                onClick={() => toggleFY(fy.id)}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isActiveFY ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {fy.label}
                  </span>
                  {fy.hasUnresolved && !isExpanded && (
                    <span className="flex h-2 w-2 rounded-full bg-red-400"></span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                )}
              </div>

              {/* Accordion Content */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="p-4 pt-0 space-y-4">
                  {/* Metric Cards 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                     <div 
                       onClick={() => handleStatusClick(fy.id, 'Pending')}
                       className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all
                         ${selectedStatus === 'Pending' && isActiveFY 
                           ? 'border-red-400 bg-red-50 dark:bg-red-900/20' 
                           : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                         }`}
                     >
                        <div className="flex items-center gap-1.5"><span className="text-[10px]">🔴</span><span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Pending</span></div>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{fy.metrics.pending}</span>
                     </div>
                     <div 
                       onClick={() => handleStatusClick(fy.id, 'In Progress')}
                       className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all
                         ${selectedStatus === 'In Progress' && isActiveFY 
                           ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' 
                           : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                         }`}
                     >
                        <div className="flex items-center gap-1.5"><span className="text-[10px]">🟡</span><span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Progress</span></div>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{fy.metrics.inProgress}</span>
                     </div>
                     <div 
                       onClick={() => handleStatusClick(fy.id, 'Resolved')}
                       className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all col-span-2
                         ${selectedStatus === 'Resolved' && isActiveFY 
                           ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
                           : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                         }`}
                     >
                        <div className="flex items-center gap-1.5"><span className="text-[10px]">🟢</span><span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Resolved / Closed</span></div>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{fy.metrics.resolved}</span>
                     </div>
                  </div>

                  {/* Quarter Pills */}
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Filter By Quarter</h3>
                    <div className="flex flex-wrap gap-2">
                       {QUARTERS.map(q => (
                         <button
                           key={q}
                           onClick={() => handleQuarterClick(fy.id, q)}
                           className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                             ${selectedQuarter === q && isActiveFY
                               ? 'bg-emerald-600 text-white border border-emerald-600 shadow-sm'
                               : 'bg-white dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                             }
                           `}
                         >
                           {q}
                         </button>
                       ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
