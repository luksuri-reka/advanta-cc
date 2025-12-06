// components/ObservationSummaryCard.tsx
'use client';

import { generateObservationSummary, ObservationData } from '@/app/utils/observationSummary';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function ObservationSummaryCard({ data }: { data: ObservationData | null }) {
  const summary = generateObservationSummary(data);
  
  const StatusIcon = summary.status === 'Valid' ? CheckCircleIcon 
    : summary.status === 'Invalid' ? XCircleIcon 
    : ClockIcon;

  return (
    <div className={`bg-${summary.statusColor}-50 dark:bg-${summary.statusColor}-900/20 border border-${summary.statusColor}-200 dark:border-${summary.statusColor}-800 rounded-xl p-6`}>
      <div className="flex items-start gap-4">
        <StatusIcon className={`w-8 h-8 text-${summary.statusColor}-600 flex-shrink-0`} />
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`font-bold text-lg text-${summary.statusColor}-900 dark:text-${summary.statusColor}-200`}>
              {summary.statusLabel}
            </h3>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${summary.badgeColor}`}>
              {summary.status === 'Pending' ? 'Pending' : summary.issueCategory}
            </span>
            {summary.isExpired && (
              <span className="text-xs px-2.5 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full font-medium">
                ⚠️ Expired
              </span>
            )}
          </div>
          
          <p className={`text-sm text-${summary.statusColor}-700 dark:text-${summary.statusColor}-300 mb-4`}>
            {summary.shortSummary}
          </p>
          
          {summary.status !== 'Pending' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <p className="text-gray-500 dark:text-gray-400">Observer</p>
                    <p className="font-medium text-gray-900 dark:text-white">{summary.observerName}</p>
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400">Tanggal Observasi</p>
                    <p className="font-medium text-gray-900 dark:text-white">{summary.observationDate}</p>
                </div>
                {summary.totalIssuesFound > 0 && (
                    <div>
                    <p className="text-gray-500 dark:text-gray-400">Masalah Ditemukan</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                        {summary.totalIssuesFound} kriteria
                    </p>
                    </div>
                )}
                {/* 🔥 HANYA tampilkan jika Valid DAN ada proposal */}
                {summary.status === 'Valid' && summary.replacementProposal && (
                    <div>
                    <p className="text-gray-500 dark:text-gray-400">Usulan Penggantian</p>
                    <p className="font-medium text-gray-900 dark:text-white">{summary.replacementProposal}</p>
                    </div>
                )}
            </div>
          )}
          
          {summary.issuesList.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                TEMUAN MASALAH:
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                {summary.issuesList.slice(0, 3).map((issue, i) => (
                  <li key={i}>• {issue}</li>
                ))}
                {summary.issuesList.length > 3 && (
                  <li className="text-gray-500 italic">+ {summary.issuesList.length - 3} masalah lainnya</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}