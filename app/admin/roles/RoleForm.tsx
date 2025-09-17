// app/admin/roles/RoleForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import { useAuth } from '@/app/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { createRole, updateRole } from './actions';

// Definisikan struktur grup dan izin
const permissionGroups = [
    {
        groupName: 'Manajemen Akun',
        permissions: [
            { name: 'view roles', label: 'Lihat Halaman Peran' },
            { name: 'manage roles', label: 'Kelola Peran (Tambah, Edit, Hapus)' },
            { name: 'view users', label: 'Lihat Halaman Pengguna' },
            { name: 'manage users', label: 'Kelola Pengguna (Tambah, Edit, Hapus)' },
        ]
    },
    {
        groupName: 'Katalog',
        permissions: [
            { name: 'view plant_types', label: 'Lihat Jenis Tanaman' },
            { name: 'manage plant_types', label: 'Kelola Jenis Tanaman' },
            { name: 'view seed_classes', label: 'Lihat Kelas Benih' },
            { name: 'manage seed_classes', label: 'Kelola Kelas Benih' },
            { name: 'view varieties', label: 'Lihat Varietas' },
            { name: 'manage varieties', label: 'Kelola Varietas' },
            { name: 'view active_ingredients', label: 'Lihat Bahan Aktif' },
            { name: 'manage active_ingredients', label: 'Kelola Bahan Aktif' },
            { name: 'view products', label: 'Lihat Data Produk' },
            { name: 'manage products', label: 'Kelola Data Produk' },
        ]
    },
    {
        groupName: 'Produksi',
        permissions: [
            { name: 'view productions', label: 'Lihat Produksi' },
            { name: 'manage productions', label: 'Kelola Produksi' },
            { name: 'download productions', label: 'Download Produksi' },
            { name: 'upload qr_productions', label: 'Upload Kode QR' },
            { name: 'download qr_productions', label: 'Download Kode QR' },
            { name: 'view bags', label: 'Lihat Kantong' },
            { name: 'manage bags', label: 'Kelola Kantong' },
            { name: 'download qr_bags', label: 'Download QR Kantong' },
        ]
    },
    {
        groupName: 'Perusahaan',
        permissions: [
            { name: 'view companies', label: 'Lihat Perusahaan' },
            { name: 'manage companies', label: 'Kelola Perusahaan' },
        ]
    }
];

// BARU: Tipe data untuk properti komponen
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
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // BARU: useEffect untuk mengisi form jika ada initialData (mode edit)
    useEffect(() => {
        if (initialData) {
            setRoleName(initialData.name);
            setDescription(initialData.description);
            setSelectedPermissions(initialData.permissions);
        }
    }, [initialData]);
    
    const isEditMode = !!initialData;

    const handlePermissionChange = (permissionName: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedPermissions(prev => [...prev, permissionName]);
        } else {
            setSelectedPermissions(prev => prev.filter(p => p !== permissionName));
        }
    };

    const handleGroupChange = (groupPermissions: {name: string}[], isChecked: boolean) => {
        const groupPermissionNames = groupPermissions.map(p => p.name);
        if (isChecked) {
            setSelectedPermissions(prev => [...new Set([...prev, ...groupPermissionNames])]);
        } else {
            setSelectedPermissions(prev => prev.filter(p => !groupPermissionNames.includes(p)));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
        if (isEditMode && initialData) {
            // Logika untuk UPDATE
            await updateRole(initialData.id, { name: roleName, description }, selectedPermissions);
        } else {
            // Logika untuk CREATE
            await createRole({ name: roleName, description }, selectedPermissions);
        }
        // Redirect ke halaman daftar setelah berhasil
        router.push('/admin/roles');
        } catch (err: any) {
        console.error("Gagal menyimpan peran:", err);
        setError(err.message || 'Terjadi kesalahan saat menyimpan.');
        } finally {
        setSubmitting(false);
        }
    };

    const handleLogout = () => { /* TODO: Implement logout logic */ };

    return (
         <div className="min-h-screen bg-gray-50">
            <Navbar user={user ? { name: user.user_metadata.name || 'Admin' } : null} onLogout={handleLogout} />
            <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
                 <div className="mb-6">
                    <Link href="/admin/roles" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Kembali ke Daftar Peran
                    </Link>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-12">
                        <div className="border-b border-gray-900/10 pb-12">
                            <h2 className="text-2xl font-semibold leading-7 text-gray-900">Tambah Peran Baru</h2>
                            <p className="mt-1 text-sm leading-6 text-gray-600">Isi detail peran dan pilih hak akses yang sesuai di bawah ini.</p>
                            
                            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                <div className="sm:col-span-4">
                                    <label htmlFor="role-name" className="block text-sm font-medium leading-6 text-gray-900">Nama Peran *</label>
                                    <div className="mt-2">
                                        <input type="text" name="role-name" id="role-name" value={roleName} onChange={e => setRoleName(e.target.value)} required className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6" placeholder="Contoh: Manajer Gudang" />
                                    </div>
                                </div>
                                <div className="col-span-full">
                                    <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">Deskripsi *</label>
                                    <div className="mt-2">
                                        <textarea id="description" name="description" rows={3} value={description} onChange={e => setDescription(e.target.value)} required className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6" placeholder="Jelaskan secara singkat fungsi dari peran ini"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-gray-900/10 pb-12">
                            <h2 className="text-base font-semibold leading-7 text-gray-900">Kelola Hak Akses</h2>
                            <div className="mt-6 space-y-8">
                                {permissionGroups.map(group => (
                                    <fieldset key={group.groupName}>
                                        <legend className="text-sm font-semibold leading-6 text-gray-900">{group.groupName}</legend>
                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {group.permissions.map(permission => (
                                                <div key={permission.name} className="relative flex items-start">
                                                    <div className="flex h-6 items-center">
                                                        <input id={permission.name} name={permission.name} type="checkbox" checked={selectedPermissions.includes(permission.name)} onChange={e => handlePermissionChange(permission.name, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600" />
                                                    </div>
                                                    <div className="ml-3 text-sm leading-6">
                                                        <label htmlFor={permission.name} className="font-medium text-gray-900">{permission.label}</label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </fieldset>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-end gap-x-6">
                        <Link href="/admin/roles" type="button" className="text-sm font-semibold leading-6 text-gray-900">Batal</Link>
                        <button type="submit" disabled={submitting} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50">
                            {submitting ? 'Menyimpan...' : 'Simpan Peran'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}