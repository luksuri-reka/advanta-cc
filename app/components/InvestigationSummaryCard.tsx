// app/components/InvestigationSummaryCard.tsx
'use client';

import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const colorMaps = {
    emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-900 dark:text-emerald-200',
        subText: 'text-emerald-700 dark:text-emerald-300',
        icon: 'text-emerald-600 dark:text-emerald-500'
    },
    red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-900 dark:text-red-200',
        subText: 'text-red-700 dark:text-red-300',
        icon: 'text-red-600 dark:text-red-500'
    },
    gray: {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        border: 'border-gray-200 dark:border-gray-800',
        text: 'text-gray-900 dark:text-gray-200',
        subText: 'text-gray-700 dark:text-gray-300',
        icon: 'text-gray-600 dark:text-gray-500'
    }
};

export default function InvestigationSummaryCard({ data }: { data: any | null }) {
    if (!data) return null;

    const isValid = data.is_valid;
    const statusColor = isValid === true ? 'emerald' : isValid === false ? 'red' : 'gray';
    const statusLabel = isValid === true ? 'Investigasi Valid' : isValid === false ? 'Investigasi Tidak Valid' : 'Menunggu Keputusan';
    const StatusIcon = isValid === true ? CheckCircleIcon : isValid === false ? XCircleIcon : ClockIcon;

    const colors = colorMaps[statusColor];

    const formatDateShort = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className={`${colors.bg} border ${colors.border} rounded-xl p-6`}>
            <div className="flex items-start gap-4">
                <StatusIcon className={`w-8 h-8 ${colors.icon} flex-shrink-0`} />

                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className={`font-bold text-lg ${colors.text}`}>
                            {statusLabel}
                        </h3>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isValid === true ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30' :
                                isValid === false ? 'bg-red-100 text-red-800 dark:bg-red-900/30' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30'
                            }`}>
                            Investigasi
                        </span>
                    </div>

                    <p className={`text-sm ${colors.subText} mb-4 font-medium`}>
                        {data.investigation_conclusion || 'Kesimpulan investigasi belum diisi.'}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Investigator</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{data.investigator_name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Tanggal Investigasi</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{formatDateShort(data.investigation_date)}</p>
                        </div>
                        {data.root_cause_determination && (
                            <div className="md:col-span-2">
                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Akar Masalah (Root Cause)</p>
                                <p className="font-semibold text-gray-900 dark:text-white line-clamp-2">{data.root_cause_determination}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
