// app/admin/roles/RoleForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Tambahkan initialData ke interface
interface RoleFormProps {
  initialData?: {
    id?: number;
    name: string;
    guard_name: string;
    permissions: string[];
  };
}

export default function RoleForm({ initialData }: RoleFormProps) {
  const router = useRouter();
  const isEditMode = !!initialData?.id;

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    guard_name: initialData?.guard_name || 'web',
    permissions: initialData?.permissions || [],
  });

  const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load permissions dari API
  useEffect(() => {
    async function loadPermissions() {
      try {
        const res = await fetch('/api/permissions');
        if (res.ok) {
          const data = await res.json();
          setAvailablePermissions(data);
        }
      } catch (err) {
        console.error('Failed to load permissions:', err);
      }
    }
    loadPermissions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEditMode 
        ? `/api/roles/${initialData.id}` 
        : '/api/roles';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyimpan role');
      }

      router.push('/admin/roles');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {isEditMode ? 'Edit Peran' : 'Tambah Peran Baru'}
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Peran
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Masukkan nama peran"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guard Name
              </label>
              <input
                type="text"
                value={formData.guard_name}
                onChange={(e) => setFormData({ ...formData, guard_name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="web"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Permissions
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4">
                {availablePermissions.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(String(perm.id))}
                      onChange={() => togglePermission(String(perm.id))}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">{perm.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Menyimpan...' : isEditMode ? 'Update Peran' : 'Simpan Peran'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}