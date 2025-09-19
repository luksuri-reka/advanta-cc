// app/admin/roles/RoleForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import { createRole, updateRole } from './actions';

// Definisikan struktur grup dan izin sesuai dengan database
const permissionGroups = [
    {
        groupName: 'Manajemen Akun',
        permissions: [
            { id: '2', name: 'account.role.view', label: 'Lihat Peran' },
            { id: '1', name: 'account.role.manage', label: 'Kelola Peran (tambah, edit, & hapus)' },
            { id: '4', name: 'account.user.view', label: 'Lihat Pengguna' },
            { id: '3', name: 'account.user.manage', label: 'Kelola Pengguna (tambah, edit, & hapus)' },
        ]
    },
    {
        groupName: 'Katalog Produk',
        permissions: [
            { id: '6', name: 'catalog.jenis_tanaman.view', label: 'Lihat Jenis Tanaman' },
            { id: '5', name: 'catalog.jenis_tanaman.manage', label: 'Kelola Jenis Tanaman' },
            { id: '8', name: 'catalog.kelas_benih.view', label: 'Lihat Kelas Benih' },
            { id: '7', name: 'catalog.kelas_benih.manage', label: 'Kelola Kelas Benih' },
            { id: '10', name: 'catalog.varietas.view', label: 'Lihat Varietas' },
            { id: '9', name: 'catalog.varietas.manage', label: 'Kelola Varietas' },
            { id: '12', name: 'catalog.bahan_aktif.view', label: 'Lihat Bahan Aktif' },
            { id: '11', name: 'catalog.bahan_aktif.manage', label: 'Kelola Bahan Aktif' },
            { id: '14', name: 'catalog.data_produk.view', label: 'Lihat Data Produk' },
            { id: '13', name: 'catalog.data_produk.manage', label: 'Kelola Data Produk' },
        ]
    },
    {
        groupName: 'Manajemen Produksi',
        permissions: [
            { id: '18', name: 'production.view', label: 'Lihat Produksi' },
            { id: '17', name: 'production.manage', label: 'Kelola Produksi' },
            { id: '19', name: 'production.download', label: 'Download Produksi' },
            { id: '20', name: 'production.upload_qr', label: 'Upload Kode QR' },
            { id: '21', name: 'production.download_qr', label: 'Download Kode QR' },
            { id: '23', name: 'bag.view', label: 'Lihat Kantong' },
            { id: '22', name: 'bag.manage', label: 'Kelola Kantong' },
            { id: '24', name: 'bag.download_qr', label: 'Download QR Kantong' },
        ]
    },
    {
        groupName: 'Perusahaan',
        permissions: [
            { id: '16', name: 'company.view', label: 'Lihat Perusahaan' },
            { id: '15', name: 'company.manage', label: 'Kelola Perusahaan' },
        ]
    }
];

// Tipe data untuk properti komponen
interface RoleWithPermissions {
    id: number;
    name: string;
    description: string;
    permissions: string[];
}
interface RoleFormProps {
    initialData?: RoleWithPermissions;
}

export default function RoleForm({ initialData }: RoleFormProps) {
    const { user } = useAuth();
    const router = useRouter();

    const [roleName, setRoleName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditMode = !!initialData;

    useEffect(() => {
        if (initialData) {
            setRoleName(initialData.name);
            setDescription(initialData.description);
            setSelectedPermissions(initialData.permissions);
        }
    }, [initialData]);

    const handlePermissionChange = (permissionId: string, isChecked: boolean) => {
        setSelectedPermissions(prev => 
            isChecked ? [...prev, permissionId] : prev.filter(p => p !== permissionId)
        );
    };

    // BARU: Fungsi untuk menangani "Pilih Semua" per grup
    const handleGroupChange = (groupPermissions: {id: string}[], isChecked: boolean) => {
        const groupPermissionIds = groupPermissions.map(p => p.id);
        if (isChecked) {
            setSelectedPermissions(prev => [...new Set([...prev, ...groupPermissionIds])]);
        } else {
            setSelectedPermissions(prev => prev.filter(p => !groupPermissionIds.includes(p)));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleName || !description) {
            toast.error('Nama Peran dan Deskripsi wajib diisi.');
            return;
        }
        setIsSubmitting(true);

        const actionPromise = isEditMode && initialData
            ? updateRole(initialData.id, { name: roleName, description }, selectedPermissions)
            : createRole({ name: roleName, description }, selectedPermissions);

        toast.promise(actionPromise, {
            loading: 'Menyimpan data peran...',
            success: (result) => {
                if (result.error) throw new Error(result.error.message);
                router.push('/admin/roles');
                return `Peran berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`;
            },
            error: (err) => `Gagal: ${err.message || 'Terjadi kesalahan'}`,
        });

        // Set submitting ke false setelah toast selesai
        actionPromise.finally(() => setIsSubmitting(false));
    };
    
    const handleLogout = () => { /* TODO: Implement logout logic */ };

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-center" reverseOrder={false} />
            <Navbar user={user ? { name: user.user_metadata?.name || 'Admin' } : null} onLogout={handleLogout} />
            
            <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
                <form onSubmit={handleSubmit}>
                    {/* Header Halaman */}
                    <div className="md:flex md:items-center md:justify-between pb-6 border-b border-gray-200 mb-8">
                        <div className="min-w-0 flex-1">
                            <Link href="/admin/roles" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-2">
                                <ArrowLeftIcon className="h-4 w-4" />
                                Kembali ke Daftar Peran
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900">{isEditMode ? 'Edit Peran' : 'Tambah Peran Baru'}</h1>
                            <p className="mt-1 text-md text-gray-600">Isi detail peran dan pilih hak akses yang sesuai di bawah ini.</p>
                        </div>
                    </div>

                    {/* Konten Utama dengan Layout Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        
                        {/* Kolom Kiri: Detail Peran */}
                        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                            <div className="bg-white rounded-2xl shadow-xl border border-white/60">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">Detail Peran</h2>
                                </div>
                                <div className="p-6 space-y-5">
                                    <div>
                                        <label htmlFor="role-name" className="block text-sm font-medium text-zinc-700">Nama Peran *</label>
                                        <input 
                                            type="text" 
                                            name="role-name" 
                                            id="role-name" 
                                            value={roleName} 
                                            onChange={e => setRoleName(e.target.value)} 
                                            required 
                                            className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors" 
                                            placeholder="Contoh: Manajer Gudang" 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-zinc-700">Deskripsi *</label>
                                        <textarea 
                                            id="description" 
                                            name="description" 
                                            rows={4} 
                                            value={description} 
                                            onChange={e => setDescription(e.target.value)} 
                                            required 
                                            className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors" 
                                            placeholder="Jelaskan secara singkat fungsi dari peran ini"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan: Hak Akses */}
                        <div className="lg:col-span-2 space-y-6">
                            {permissionGroups.map(group => {
                                // Cek apakah semua izin di grup ini sudah terpilih
                                const isAllSelected = group.permissions.every(p => selectedPermissions.includes(p.id));
                                return (
                                    <div key={group.groupName} className="bg-white rounded-2xl shadow-xl border border-white/60">
                                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                                            <h3 className="text-md font-semibold text-gray-800">{group.groupName}</h3>
                                            <div className="relative flex items-start">
                                                <div className="flex h-6 items-center">
                                                    <input id={`select-all-${group.groupName}`} type="checkbox"
                                                        checked={isAllSelected}
                                                        onChange={e => handleGroupChange(group.permissions, e.target.checked)}
                                                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                                                    />
                                                </div>
                                                <div className="ml-3 text-sm leading-6">
                                                    <label htmlFor={`select-all-${group.groupName}`} className="font-medium text-gray-700">Pilih Semua</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                            {group.permissions.map(permission => (
                                                <div key={permission.id} className="relative flex items-start">
                                                    <div className="flex h-6 items-center">
                                                        <input id={permission.id} name={permission.id} type="checkbox"
                                                            checked={selectedPermissions.includes(permission.id)}
                                                            onChange={e => handlePermissionChange(permission.id, e.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                                                        />
                                                    </div>
                                                    <div className="ml-3 text-sm leading-6">
                                                        <label htmlFor={permission.id} className="font-medium text-gray-900">{permission.label}</label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-end gap-x-4">
                        <Link href="/admin/roles" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                            Batal
                        </Link>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Menyimpan...' : (
                                <>
                                    <CheckCircleIcon className="h-5 w-5" />
                                    <span>Simpan Peran</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}