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
    // ... permissionGroups lainnya ...
    {
        groupName: 'Katalog Produk',
        permissions: [
            { id: '6', name: 'catalog.jenis_tanaman.view', label: 'Lihat Jenis Tanaman' },
            { id: '5', name: 'catalog.jenis_tanaman.manage', label: 'Kelola Jenis Tanaman' },
            { id: '8', name: 'catalog.kelas_benih.view', label: 'Lihat Kelas Benih' },
            { id: '7', name: 'catalog.kelas_benih.manage', label: 'Kelola Kelas Benih' },
            { id: '10', name: 'catalog.varietas.view', label: 'Lihat Varietas' },
            { id: '9', name: 'catalog.varietas.manage', label: 'Kelola Varietas' },
            { id: '12', name: 'catalog.perusahaan.view', label: 'Lihat Perusahaan' },
            { id: '11', name: 'catalog.perusahaan.manage', label: 'Kelola Perusahaan' },
            { id: '14', name: 'catalog.bahan_aktif.view', label: 'Lihat Bahan Aktif' },
            { id: '13', name: 'catalog.bahan_aktif.manage', label: 'Kelola Bahan Aktif' },
            { id: '16', name: 'catalog.produk.view', label: 'Lihat Produk' },
            { id: '15', name: 'catalog.produk.manage', label: 'Kelola Produk' },
        ]
    },
    {
        groupName: 'Manajemen Produksi',
        permissions: [
            { id: '18', name: 'production.batch.view', label: 'Lihat Batch Produksi' },
            { id: '17', name: 'production.batch.manage', label: 'Kelola Batch Produksi' },
            { id: '20', name: 'production.register.view', label: 'Lihat Registrasi Kantong' },
            { id: '19', name: 'production.register.manage', label: 'Kelola Registrasi Kantong' },
        ]
    }
];

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

interface RoleFormProps {
    role?: {
        id: number;
        name: string;
        description: string;
        permissions: number[]; // Prop 'permissions' adalah number[]
    } | null;
}

export default function RoleForm({ role }: RoleFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [roleName, setRoleName] = useState('');
    const [roleDescription, setRoleDescription] = useState('');
    // ++ FIX 1: Ubah state untuk menyimpan Set<string> ++
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditMode = !!role;

    const displayUser: DisplayUser | null = user
      ? {
          name: user.user_metadata?.name || 'Admin',
          roles: user.app_metadata?.roles || [],
        }
      : null;
      
    const handleLogout = () => { /* ... */ };

    useEffect(() => {
        if (isEditMode && role) {
            setRoleName(role.name);
            setRoleDescription(role.description);
            // ++ FIX 2: Konversi prop number[] menjadi Set<string> ++
            setSelectedPermissions(new Set(role.permissions.map(String)));
        }
    }, [isEditMode, role]);

    // ++ FIX 3: Ubah fungsi untuk menerima permissionId sebagai string ++
    const handlePermissionChange = (permissionId: string) => {
        setSelectedPermissions(prev => {
            const next = new Set(prev);
            if (next.has(permissionId)) {
                next.delete(permissionId);
            } else {
                next.add(permissionId);
            }
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading(isEditMode ? 'Memperbarui peran...' : 'Menyimpan peran...');

        const roleData = {
            name: roleName,
            description: roleDescription,
        };
        // ++ FIX 4: Array.from(selectedPermissions) sekarang akan menghasilkan string[] ++
        const permissionIds = Array.from(selectedPermissions); 

        try {
            let result;
            if (isEditMode && role) {
                // Tipe argumen (number, RoleData, string[]) sekarang cocok
                result = await updateRole(role.id, roleData, permissionIds);
            } else {
                // Tipe argumen (RoleData, string[]) sekarang cocok
                result = await createRole(roleData, permissionIds);
            }

            if (result.error) {
                toast.error(`Gagal: ${result.error.message}`, { id: toastId });
            } else {
                toast.success(`Peran berhasil ${isEditMode ? 'diperbarui' : 'dibuat'}.`, { id: toastId });
                router.push('/admin/roles');
                router.refresh(); 
            }
        } catch (error: any) {
            toast.error(`Terjadi kesalahan: ${error.message}`, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
            <Toaster position="top-center" reverseOrder={false} />
            <Navbar user={displayUser} onLogout={handleLogout} />

            <main className="mx-auto max-w-4xl py-10 px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link href="/admin/roles" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Kembali ke Daftar Peran
                    </Link>
                </div>
                
                <form 
                    onSubmit={handleSubmit} 
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50"
                >
                    <div className="px-6 py-6 sm:px-8">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
                            {isEditMode ? 'Edit Peran' : 'Tambah Peran Baru'}
                        </h1>
                        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                            Atur nama, deskripsi, dan hak akses untuk peran ini.
                        </p>

                        <div className="mt-8 grid grid-cols-1 gap-y-6">
                            {/* ... Input Nama dan Deskripsi (tidak berubah) ... */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                    Nama Peran
                                </label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    id="name" 
                                    value={roleName} 
                                    onChange={(e) => setRoleName(e.target.value)} 
                                    required 
                                    className="mt-2 block w-full rounded-xl border-0 py-3 px-4 dark:bg-slate-700 text-zinc-900 dark:text-slate-100 ring-1 ring-inset ring-zinc-300 dark:ring-slate-600 placeholder:text-zinc-400 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:focus:ring-emerald-500 sm:text-sm transition-colors"
                                    placeholder="cth: Supervisor" 
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                    Deskripsi
                                </label>
                                <textarea 
                                    name="description" 
                                    id="description" 
                                    value={roleDescription} 
                                    onChange={(e) => setRoleDescription(e.target.value)} 
                                    rows={3} 
                                    className="mt-2 block w-full rounded-xl border-0 py-3 px-4 dark:bg-slate-700 text-zinc-900 dark:text-slate-100 ring-1 ring-inset ring-zinc-300 dark:ring-slate-600 placeholder:text-zinc-400 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:focus:ring-emerald-500 sm:text-sm transition-colors"
                                    placeholder="Deskripsi singkat mengenai peran ini..."
                                ></textarea>
                            </div>
                        </div>

                        {/* Izin (Permissions) */}
                        <div className="mt-8 space-y-8">
                            {permissionGroups.map((group, groupIndex) => (
                                <div key={group.groupName} className={groupIndex > 0 ? "border-t border-gray-200 dark:border-slate-700 pt-8" : ""}>
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                                        {group.groupName}
                                    </h3>
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {group.permissions.map((perm) => {
                                            // ++ FIX 5: Gunakan perm.id (string) secara langsung ++
                                            const permId = perm.id; 
                                            return (
                                                <div key={perm.id} className="relative flex items-start">
                                                    <div className="flex h-6 items-center">
                                                        <input
                                                            id={`perm-${perm.id}`}
                                                            name={`perm-${perm.id}`}
                                                            type="checkbox"
                                                            checked={selectedPermissions.has(permId)}
                                                            onChange={() => handlePermissionChange(permId)}
                                                            className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-600 text-emerald-600 focus:ring-emerald-600 dark:focus:ring-emerald-500 dark:focus:ring-offset-slate-800"
                                                        />
                                                    </div>
                                                    <div className="ml-3 text-sm leading-6">
                                                        <label htmlFor={`perm-${perm.id}`} className="font-medium text-gray-900 dark:text-slate-200">
                                                            {perm.label}
                                                        </label>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tombol Aksi (tidak berubah) */}
                    <div className="mt-8 px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-x-4 rounded-b-2xl">
                        <Link 
                            href="/admin/roles" 
                            className="rounded-md bg-white dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600"
                        >
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