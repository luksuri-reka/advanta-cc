// app/admin/productions/ProgressModal.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { getProgress } from './actions';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  lotNumber?: string;
}

interface ProgressData {
  currentBatch: number;
  totalBatches: number;
  totalInserted: number;
  totalRecords: number;
  status: 'processing' | 'completed' | 'error';
  percentage?: number;
  estimatedTimeRemaining?: number;
  error?: string;
  lotNumber?: string;
}

export default function ProgressModal({ 
  isOpen, 
  onClose, 
  jobId,
  lotNumber 
}: ProgressModalProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!jobId || !isOpen) {
      setProgress(null);
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    // Poll progress dari server action
    const pollProgress = async () => {
      try {
        const data = await getProgress(jobId);
        
        if (data) {
          setProgress(data);
          
          // Auto close on completion
          if (data.status === 'completed') {
            setIsPolling(false);
            setTimeout(() => {
              onClose();
              window.location.reload();
            }, 2000);
          }
          
          // Stop polling on error
          if (data.status === 'error') {
            setIsPolling(false);
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    };

    // Initial poll
    pollProgress();

    // Setup interval for continuous polling
    const pollInterval = setInterval(pollProgress, 300); // Poll every 300ms

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [jobId, isOpen, onClose]);

  const formatTime = (seconds: number) => {
    if (!seconds || seconds < 0) return '...';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                <div className="p-6">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <Dialog.Title className="text-xl font-bold text-gray-900">
                      Generating Registers
                    </Dialog.Title>
                    {lotNumber && (
                      <p className="text-sm text-gray-500 mt-1">
                        Lot: {lotNumber}
                      </p>
                    )}
                  </div>

                  {progress ? (
                    <>
                      {/* Status Icon */}
                      <div className="flex justify-center mb-6">
                        {progress.status === 'processing' && (
                          <div className="relative">
                            <div className="w-24 h-24 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-lg font-bold text-emerald-600">
                                {progress.percentage || 0}%
                              </span>
                            </div>
                          </div>
                        )}
                        {progress.status === 'completed' && (
                          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                            <CheckCircleIcon className="h-16 w-16 text-emerald-600" />
                          </div>
                        )}
                        {progress.status === 'error' && (
                          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircleIcon className="h-16 w-16 text-red-600" />
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span className="font-semibold">
                            Batch {progress.currentBatch} / {progress.totalBatches}
                          </span>
                          <span className="font-semibold">
                            {progress.totalInserted.toLocaleString()} / {progress.totalRecords.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-blue-500 transition-all duration-500 ease-out rounded-full relative overflow-hidden"
                            style={{ width: `${progress.percentage || 0}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer-progress"></div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                          <div className="text-3xl font-bold text-blue-600 mb-1">
                            {progress.totalInserted.toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-700 font-medium">Records Inserted</div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200 shadow-sm">
                          <div className="text-3xl font-bold text-emerald-600 mb-1">
                            {progress.status === 'processing' && progress.estimatedTimeRemaining
                              ? formatTime(progress.estimatedTimeRemaining)
                              : progress.status === 'completed'
                              ? '✓'
                              : '...'
                            }
                          </div>
                          <div className="text-xs text-emerald-700 font-medium">
                            {progress.status === 'completed' ? 'Completed' : 'Time Remaining'}
                          </div>
                        </div>
                      </div>

                      {/* Status Message */}
                      <div className={`p-4 rounded-xl mb-4 ${
                        progress.status === 'processing' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200' :
                        progress.status === 'completed' ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200' :
                        'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
                      }`}>
                        <p className={`text-sm font-semibold ${
                          progress.status === 'processing' ? 'text-blue-800' :
                          progress.status === 'completed' ? 'text-emerald-800' :
                          'text-red-800'
                        }`}>
                          {progress.status === 'processing' && (
                            <>
                              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
                              Processing batch {progress.currentBatch} of {progress.totalBatches}...
                            </>
                          )}
                          {progress.status === 'completed' && (
                            <>
                              <CheckCircleIcon className="inline-block h-5 w-5 mr-2" />
                              All registers generated successfully!
                            </>
                          )}
                          {progress.status === 'error' && (
                            <>
                              <XCircleIcon className="inline-block h-5 w-5 mr-2" />
                              Error: {progress.error}
                            </>
                          )}
                        </p>
                      </div>

                      {/* Performance Info */}
                      {progress.status === 'processing' && (
                        <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 font-medium">Batch Size (Auto-optimized):</span>
                            <span className="font-mono font-bold text-gray-800">
                              {progress.totalRecords > 50000 ? '2,000' :
                               progress.totalRecords > 20000 ? '1,000' :
                               progress.totalRecords < 100 ? '50' : '500'} records/batch
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Close Button */}
                      {progress.status !== 'processing' && (
                        <div className="mt-6">
                          <button
                            onClick={onClose}
                            className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            {progress.status === 'completed' ? '✓ Done' : 'Close'}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">Initializing generation process...</p>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}