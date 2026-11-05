// app/admin/roles/RoleForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

import { createRole, updateRole } from './actions';
import type { RolePermission } from './permissions';

const permissionGroupLabels: Record<string, string> = {
    account: 'Manajemen Akun',
    catalog: 'Katalog Produk',
    production: 'Manajemen Produksi',
};

interface RoleFormProps {
    role?: {
        id: number;
        name: string;
        description: string | null;
        permissionIds: number[];
    };
    permissions: RolePermission[];
}

export default function RoleForm({ role, permissions }: RoleFormProps) {
    const router = useRouter();
    const [roleName, setRoleName] = useState(role?.name ?? '');
    const [roleDescription, setRoleDescription] = useState(role?.description ?? '');
    const [selectedPermissions, setSelectedPermissions] = useState(() => new Set(role?.permissionIds));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!role;

    const permissionGroups = new Map<string, RolePermission[]>();
    for (const permission of permissions) {
        const group = permission.name.split('.')[0];
        const groupPermissions = permissionGroups.get(group) ?? [];
        groupPermissions.push(permission);
        permissionGroups.set(group, groupPermissions);
    }

    const handlePermissionChange = (permissionId: number) => {
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
        const permissionIds = Array.from(selectedPermissions); 

        try {
            let result;
            if (isEditMode && role) {
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
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                    Nama Peran
                                </label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    id="name" 
                                    readOnly={role?.name.toLowerCase() === 'superadmin'}
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
                            {[...permissionGroups].map(([groupName, groupPermissions], groupIndex) => (
                                <div key={groupName} className={groupIndex > 0 ? "border-t border-gray-200 dark:border-slate-700 pt-8" : ""}>
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                                        {permissionGroupLabels[groupName] ?? groupName}
                                    </h3>
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {groupPermissions.map((perm) => {
                                            return (
                                                <div key={perm.id} className="relative flex items-start">
                                                    <div className="flex h-6 items-center">
                                                        <input
                                                            id={`perm-${perm.id}`}
                                                            name={`perm-${perm.id}`}
                                                            type="checkbox"
                                                            checked={selectedPermissions.has(perm.id)}
                                                            onChange={() => handlePermissionChange(perm.id)}
                                                            className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-600 text-emerald-600 focus:ring-emerald-600 dark:focus:ring-emerald-500 dark:focus:ring-offset-slate-800"
                                                        />
                                                    </div>
                                                    <div className="ml-3 text-sm leading-6">
                                                        <label htmlFor={`perm-${perm.id}`} className="font-medium text-gray-900 dark:text-slate-200">
                                                            {perm.description || perm.name}
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