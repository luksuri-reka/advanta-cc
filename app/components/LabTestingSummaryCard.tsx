// app/components/LabTestingSummaryCard.tsx
'use client';

import { BeakerIcon } from '@heroicons/react/24/outline';

export default function LabTestingSummaryCard({ data }: { data: any | null }) {
    if (!data) return null;

    const formatDateShort = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const hasMarketSample = !!data.market_result;
    const hasGuardSample = !!data.guard_result;

    return (
        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
                <BeakerIcon className="w-8 h-8 text-sky-600 dark:text-sky-500 flex-shrink-0" />

                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-sky-900 dark:text-sky-200">
                            Hasil Lab Testing
                        </h3>
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300">
                            Laboratorium
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                        {/* Market Sample Result */}
                        <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg border border-sky-100 dark:border-sky-800/50">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 font-medium">Hasil Market Sample</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {hasMarketSample ? data.market_result : <span className="text-gray-400 italic">Belum ada hasil</span>}
                            </p>
                        </div>

                        {/* Guard Sample Result */}
                        <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg border border-sky-100 dark:border-sky-800/50">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1 font-medium">Hasil Guard Sample</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {hasGuardSample ? data.guard_result : <span className="text-gray-400 italic">Belum ada hasil</span>}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4 pt-4 border-t border-sky-200/50 dark:border-sky-800/50">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Teknisi Lab</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{data.lab_technician_name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Terakhir Diupdate</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{formatDateShort(data.updated_at)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Metode Pengujian</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{data.testing_method || '-'}</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
