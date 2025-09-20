// app/admin/bags/BagDetailModal.tsx
'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { formatDate, formatDateTime } from '@/app/utils/dateFormat';

interface BagPiece {
  id: number;
  serial_number: string;
  qr_code: string;
  qr_expired_date: string | null;
}

interface Bag {
  id: number;
  qr_code: string;
  production_id: number;
  production: any;
  capacity: number;
  quantity: number;
  packs: number;
  type: string;
  downloaded_at: string | null;
  created_at: string;
  updated_at: string;
  bag_pieces?: BagPiece[];
}

interface BagDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bag: Bag | null;
}

export default function BagDetailModal({ 
  isOpen, 
  onClose, 
  bag 
}: BagDetailModalProps) {
  if (!bag) return null;

  const InfoRow = ({ label, value }: { label: string; value: any }) => (
    <div className="flex justify-between py-3 border-b border-gray-100">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 font-medium">{value || '-'}</dd>
    </div>
  );

  const getTypeName = (type: string) => {
    switch(type.toLowerCase()) {
      case 'b': return 'Bag';
      case 'p': return 'Pack';
      default: return type;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title 
                  as="h3" 
                  className="text-xl font-semibold leading-6 text-gray-900 flex justify-between items-center mb-6"
                >
                  <div className="flex items-center gap-3">
                    <QrCodeIcon className="h-6 w-6 text-emerald-600" />
                    <span>Detail Bag: {bag.qr_code}</span>
                  </div>
                  <button 
                    onClick={onClose} 
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Bag Information */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Informasi Bag</h4>
                      <dl className="space-y-2">
                        <InfoRow label="QR Code" value={bag.qr_code} />
                        <InfoRow label="Tipe" value={getTypeName(bag.type)} />
                        <InfoRow label="Kapasitas" value={`${bag.capacity} kg`} />
                        <InfoRow label="Jumlah Pieces" value={bag.quantity} />
                        <InfoRow label="Jumlah Pack" value={bag.packs} />
                        <InfoRow label="Status Download" value={
                          bag.downloaded_at ? (
                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              Downloaded at {formatDateTime(bag.downloaded_at)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                              Belum Download
                            </span>
                          )
                        } />
                      </dl>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Informasi Produksi</h4>
                      <dl className="space-y-2">
                        <InfoRow label="Produk" value={bag.production?.product?.name} />
                        <InfoRow label="Perusahaan" value={bag.production?.company?.name} />
                        <InfoRow label="Group Number" value={bag.production?.group_number} />
                        <InfoRow label="Lot Number" value={bag.production?.lot_number} />
                        <InfoRow label="Varietas" value={bag.production?.lot_varietas?.name} />
                      </dl>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Audit Trail</h4>
                      <dl className="space-y-2">
                        <InfoRow label="Dibuat" value={formatDateTime(bag.created_at)} />
                        <InfoRow label="Terakhir Update" value={formatDateTime(bag.updated_at)} />
                      </dl>
                    </div>
                  </div>

                  {/* Right Column: Bag Pieces */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Bag Pieces ({bag.bag_pieces?.length || 0} / {bag.quantity})
                      </h4>
                      {bag.bag_pieces && bag.bag_pieces.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {Math.round((bag.bag_pieces.length / bag.quantity) * 100)}% Complete
                        </span>
                      )}
                    </div>

                    {bag.bag_pieces && bag.bag_pieces.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-white sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Serial Number
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                QR Code
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Expired Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {bag.bag_pieces.map((piece, index) => (
                              <tr key={piece.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-xs text-gray-500">
                                  {index + 1}
                                </td>
                                <td className="px-3 py-2 text-xs font-mono text-gray-900">
                                  {piece.serial_number}
                                </td>
                                <td className="px-3 py-2 text-xs font-mono text-gray-600">
                                  {piece.qr_code}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-500">
                                  {piece.qr_expired_date ? formatDate(piece.qr_expired_date) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <QrCodeIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-sm">Belum ada bag pieces yang di-generate</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Tutup
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}