'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  REPLACEMENT_SHIPMENT_LABELS,
  REPLACEMENT_SHIPMENT_OPTIONS,
  formatShipmentDate,
  getReplacementShipmentLabel,
  validateReplacementShipment,
  type ReplacementShipment,
  type ReplacementShipmentStatus,
} from '@/app/utils/replacementShipment';

interface Props {
  complaint: ReplacementShipment & { id: number };
  canEdit: boolean;
  onSaved: () => void;
}

export default function ReplacementShipmentFields({ complaint, canEdit, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<ReplacementShipmentStatus | ''>('');
  const [date, setDate] = useState('');

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateReplacementShipment(status, date);
    if (validationError) return toast.error(validationError);
    setSaving(true);
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/replacement-shipment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replacement_shipment_status: status,
          replacement_shipped_date: status === 'shipped' ? date : null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan pengiriman');
      toast.success('Pengiriman benih pengganti berhasil diperbarui');
      setEditing(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan pengiriman');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status Pengiriman Benih Pengganti</h4>
        {canEdit && !editing && (
          <button type="button" onClick={() => {
            setStatus(complaint.replacement_shipment_status || '');
            setDate(complaint.replacement_shipped_date || '');
            setEditing(true);
          }} className="shrink-0 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg">
            {complaint.replacement_shipment_status ? 'Ubah' : 'Tentukan'}
          </button>
        )}
      </div>
      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <div>
            <label htmlFor="replacement-shipment-status" className="sr-only">Status Pengiriman Benih Pengganti</label>
            <select id="replacement-shipment-status" value={status} required disabled={saving}
              onChange={event => {
                const nextStatus = event.target.value as ReplacementShipmentStatus | '';
                setStatus(nextStatus);
                if (nextStatus !== 'shipped') setDate('');
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="" disabled>Pilih status pengiriman</option>
              {REPLACEMENT_SHIPMENT_OPTIONS.map(option => (
                <option key={option} value={option}>{REPLACEMENT_SHIPMENT_LABELS[option]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="replacement-shipped-date" className="block mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Tanggal Pengiriman Benih Pengganti</label>
            <input id="replacement-shipped-date" type="date" value={date} required={status === 'shipped'}
              disabled={saving || status !== 'shipped'} onChange={event => setDate(event.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50" />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {status === 'shipped' ? `Tanggal pengiriman: ${formatShipmentDate(date)} (DD/MM/YYYY)` : 'Tanggal diisi saat status pengiriman Sudah.'}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" disabled={saving} onClick={() => setEditing(false)} className="px-3 py-2 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">Batal</button>
            <button type="submit" disabled={saving || !status} className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      ) : (
        <dl className="space-y-3">
          <div>
            <dt className="sr-only">Status Pengiriman Benih Pengganti</dt>
            <dd className="text-sm font-semibold text-gray-900 dark:text-white">{getReplacementShipmentLabel(complaint.replacement_shipment_status)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tanggal Pengiriman Benih Pengganti</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{complaint.replacement_shipment_status === 'shipped' ? formatShipmentDate(complaint.replacement_shipped_date) : '-'}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
