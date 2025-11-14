// app/admin/users/UserForm.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
// ++ ICON DITAMBAHKAN ++
import { XMarkIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { createUser, updateUser, UserFormData } from './actions';
import { complaintPermissions, ComplaintPermissionKey, departments } from './permissions';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  complaint_permissions?: Record<string | number | symbol, boolean>;
}

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  availableRoles: string[];
  userToEdit?: User | null;
}

function formatDepartmentLabel(key: string): string {
  if (!key) return '';
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function UserForm({ isOpen, onClose, availableRoles, userToEdit }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: '',
    password: '',
    department: 'customer_service',
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
          complaint_permissions: (userToEdit.complaint_permissions as Record<ComplaintPermissionKey, boolean>) || {},
        });
        setConfirmPassword('');
      } else {
        setFormData({
          name: '',
          email: '',
          role: availableRoles.length > 0 ? availableRoles[0] : '',
          password: '',
          department: 'customer_service',
          complaint_permissions: {},
        });
        setConfirmPassword('');
      }
      setShowPassword(false);
      setShowConfirmPassword(false);
      setIsSubmitting(false);
    }
  }, [isOpen, userToEdit, isEditMode, availableRoles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (key: ComplaintPermissionKey) => {
    setFormData(prev => ({
      ...prev,
      complaint_permissions: {
        ...prev.complaint_permissions,
        [key]: !prev.complaint_permissions[key],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditMode && formData.password !== confirmPassword) {
      toast.error('Password dan konfirmasi password tidak cocok.');
      return;
    }
    if (isEditMode && formData.password && formData.password !== confirmPassword) {
      toast.error('Password dan konfirmasi password tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(isEditMode ? 'Memperbarui user...' : 'Membuat user...');

    try {
      if (isEditMode && userToEdit) {
        await updateUser(userToEdit.id, formData);
        toast.success('User berhasil diperbarui.', { id: toastId });
      } else {
        await createUser(formData);
        toast.success('User berhasil dibuat.', { id: toastId });
      }
      onClose();
      window.location.reload(); 
    } catch (error: any) {
      toast.error(`Gagal: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const inputClass = "mt-2 block w-full rounded-xl border-0 py-3 px-4 dark:bg-slate-700 text-zinc-900 dark:text-slate-100 ring-1 ring-inset ring-zinc-300 dark:ring-slate-600 placeholder:text-zinc-400 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:focus:ring-emerald-500 sm:text-sm transition-colors";

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 dark:bg-black/70 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-400 hover:text-gray-500 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="divide-y divide-gray-200 dark:divide-slate-700">
                  <div className="px-6 pt-6 pb-8">
                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900 dark:text-slate-100 mb-6">
                      {isEditMode ? 'Edit User' : 'Tambah User Baru'}
                    </Dialog.Title>
                    
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                          Nama Lengkap
                        </label>
                        <input 
                          type="text" 
                          name="name" 
                          id="name" 
                          value={formData.name} 
                          onChange={handleChange} 
                          required 
                          className={inputClass}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                          Email
                        </label>
                        <input 
                          type="email" 
                          name="email" 
                          id="email" 
                          value={formData.email} 
                          onChange={handleChange} 
                          required 
                          className={inputClass}
                        />
                      </div>

                      <div className="relative">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                          Password
                        </label>
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          name="password" 
                          id="password" 
                          value={formData.password} 
                          onChange={handleChange} 
                          required={!isEditMode}
                          placeholder={isEditMode ? '(Kosongkan jika tidak ganti)' : 'Minimal 8 karakter'}
                          minLength={8}
                          className={inputClass}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-10 text-gray-400 dark:text-slate-400 hover:text-gray-500 dark:hover:text-slate-300">
                          {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                      </div>

                      <div className="relative">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                          Konfirmasi Password
                        </label>
                        <input 
                          type={showConfirmPassword ? 'text' : 'password'} 
                          name="confirmPassword" 
                          id="confirmPassword" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          required={!isEditMode || (isEditMode && !!formData.password)}
                          placeholder="Ulangi password"
                          minLength={8}
                          className={inputClass}
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-10 text-gray-400 dark:text-slate-400 hover:text-gray-500 dark:hover:text-slate-300">
                          {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                      </div>

                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                          Role
                        </label>
                        <select 
                          name="role" 
                          id="role" 
                          value={formData.role} 
                          onChange={handleChange} 
                          required 
                          className={inputClass}
                        >
                          {availableRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                          Departemen
                        </label>
                        <select 
                          name="department" 
                          id="department" 
                          value={formData.department} 
                          onChange={handleChange} 
                          required 
                          className={inputClass}
                        >
                          {departments.map(dept => (
                            <option key={dept} value={dept}>
                              {formatDepartmentLabel(dept)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-6">
                      <legend className="text-sm font-semibold leading-6 text-gray-900 dark:text-slate-100">
                        Hak Akses Keluhan
                      </legend>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {(Object.keys(complaintPermissions) as ComplaintPermissionKey[]).map((key) => (
                          <div key={key} className="relative flex items-start">
                            <div className="flex h-6 items-center">
                              <input
                                id={key}
                                name={key}
                                type="checkbox"
                                checked={!!formData.complaint_permissions?.[key]}
                                onChange={() => handlePermissionChange(key)}
                                className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-600 text-emerald-600 focus:ring-emerald-600 dark:focus:ring-emerald-500 dark:focus:ring-offset-slate-800"
                              />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                              <label htmlFor={key} className="font-medium text-gray-900 dark:text-slate-100">
                                {complaintPermissions[key]}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* ... Tombol Form ... */}
                  {/* ++ STYLING TOMBOL DISESUAIKAN ++ */}
                  <div className="mt-8 pt-5 flex justify-end gap-x-4 border-t border-gray-200 dark:border-slate-700 px-6 py-4 bg-gray-50 dark:bg-slate-800/50">
                    <button 
                      type="button" 
                      onClick={onClose} 
                      className="rounded-md bg-white dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600"
                    >
                      Tutup
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Menyimpan...' : (
                        <>
                          <CheckCircleIcon className="h-5 w-5" />
                          <span>Simpan</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}