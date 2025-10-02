// app/admin/users/UserForm.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { createUser, updateUser, UserFormData } from './actions';
import { complaintPermissions, ComplaintPermissionKey, departments } from './permissions';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  complaint_permissions?: Record<ComplaintPermissionKey, boolean>;
}

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  availableRoles: string[];
  userToEdit?: User | null;
}

export default function UserForm({ isOpen, onClose, availableRoles, userToEdit }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: '',
    password: '',
    department: 'customer_service', // Default departemen
    complaint_permissions: {},
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!userToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditMode && userToEdit) {
            setFormData({
                name: userToEdit.name,
                email: userToEdit.email,
                role: userToEdit.role,
                password: '',
                department: userToEdit.department || 'customer_service',
                complaint_permissions: userToEdit.complaint_permissions || {},
            });
        } else {
            setFormData({
              name: '',
              email: '',
              role: '',
              password: '',
              department: 'customer_service',
              complaint_permissions: {},
            });
        }
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    }
  }, [isOpen, userToEdit, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permission: ComplaintPermissionKey) => {
    setFormData(prev => ({
      ...prev,
      complaint_permissions: {
        ...prev.complaint_permissions,
        [permission]: !prev.complaint_permissions?.[permission],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== confirmPassword) {
      toast.error('Password dan Ulangi Password harus sama.');
      return;
    }
    if (!isEditMode && !formData.password) {
      toast.error('Password wajib diisi untuk pengguna baru.');
      return;
    }

    setIsSubmitting(true);

    const actionPromise = isEditMode && userToEdit
        ? updateUser(userToEdit.id, formData)
        : createUser(formData);

    toast.promise(actionPromise, {
        loading: 'Menyimpan data...',
        success: (result) => {
            if (result.error) throw new Error(result.error.message);
            onClose();
            return `Data pengguna berhasil ${isEditMode ? 'diperbarui' : 'dibuat'}!`;
        },
        error: (err) => `Gagal menyimpan: ${err.message}`,
    });

    actionPromise.finally(() => setIsSubmitting(false));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                  <span>{isEditMode ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}</span>
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button>
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">Nama Pengguna *</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors" />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email Perusahaan *</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required disabled={isEditMode} className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors disabled:bg-gray-100" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-zinc-700">Peran *</label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange} required className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors">
                        <option value="" disabled>Pilih Peran</option>
                        {availableRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                     <div>
                        <label htmlFor="department" className="block text-sm font-medium text-zinc-700">Departemen *</label>
                        <select id="department" name="department" value={formData.department} onChange={handleChange} required className="mt-2 block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors">
                            {departments.map(dep => <option key={dep} value={dep}>{dep.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                        </select>
                    </div>
                  </div>
                   <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">{isEditMode ? 'Password Baru (Opsional)' : 'Password *'}</label>
                            <div className="relative mt-2">
                                <input type={showPassword ? 'text' : 'password'} name="password" id="password" value={formData.password} onChange={handleChange} required={!isEditMode} className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <div>
                             <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700">{isEditMode ? 'Ulangi Password Baru' : 'Ulangi Password *'}</label>
                             <div className="relative mt-2">
                                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required={!isEditMode || !!formData.password} className="block w-full rounded-xl border-0 py-3 px-4 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm transition-colors" />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                   </div>
                   
                  <div>
                    <h4 className="text-md font-medium text-gray-800 border-t pt-4 mt-4">Izin Sistem Komplain</h4>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(complaintPermissions).map(([key, label]) => (
                        <div key={key} className="relative flex items-start">
                          <div className="flex h-6 items-center">
                            <input
                              id={key}
                              name={key}
                              type="checkbox"
                              checked={!!formData.complaint_permissions?.[key as ComplaintPermissionKey]}
                              onChange={() => handlePermissionChange(key as ComplaintPermissionKey)}
                              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                            />
                          </div>
                          <div className="ml-3 text-sm leading-6">
                            <label htmlFor={key} className="font-medium text-gray-900">{label}</label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end gap-x-4">
                    <button type="button" onClick={onClose} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Tutup</button>
                    <button type="submit" disabled={isSubmitting} className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50">
                      {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}