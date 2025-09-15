// app/admin/users/UserForm.tsx
'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { createUser, updateUser, UserFormData } from './actions';

// Tipe data untuk user yang akan diedit
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  availableRoles: string[];
  userToEdit?: User | null;
}

export default function UserForm({ isOpen, onClose, availableRoles, userToEdit }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({ name: '', email: '', role: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!userToEdit;

  useEffect(() => {
    if (isEditMode && userToEdit) {
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        password: '',
      });
      setConfirmPassword('');
    } else {
      setFormData({ name: '', email: '', role: '', password: '' });
      setConfirmPassword('');
    }
  }, [isOpen, userToEdit, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== confirmPassword) {
      setError('Password dan Ulangi Password harus sama.');
      return;
    }
    if (!isEditMode && !formData.password) {
        setError('Password wajib diisi untuk pengguna baru.');
        return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
        let result;
        if (isEditMode && userToEdit) {
            result = await updateUser(userToEdit.id, formData);
        } else {
            result = await createUser(formData);
        }
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        onClose(); // Tutup modal jika berhasil
    } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                  <span>{isEditMode ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}</span>
                  <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><XMarkIcon className="h-5 w-5" /></button>
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {/* ... (Form fields below) ... */}
                  {/* Name, Email, Role, Password, Confirm Password fields go here */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Pengguna *</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Perusahaan *</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required disabled={isEditMode} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm disabled:bg-gray-100" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Peran *</label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm">
                        <option value="" disabled>Pilih Peran</option>
                        {availableRoles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </div>
                   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">{isEditMode ? 'Password Baru (Opsional)' : 'Password *'}</label>
                            <div className="relative mt-1">
                                <input type={showPassword ? 'text' : 'password'} name="password" id="password" value={formData.password} onChange={handleChange} required={!isEditMode} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        {/* Confirm Password */}
                        <div>
                             <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">{isEditMode ? 'Ulangi Password Baru' : 'Ulangi Password *'}</label>
                             <div className="relative mt-1">
                                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required={!isEditMode} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                   </div>
                  
                  {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
                  
                  <div className="mt-6 flex justify-end gap-x-4">
                    <button type="button" onClick={onClose} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Tutup</button>
                    <button type="submit" disabled={isSubmitting} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50">
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