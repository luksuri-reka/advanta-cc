// app/admin/Navbar.tsx
'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserCircleIcon, PowerIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

// Helper function untuk menggabungkan class
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Tipe data untuk user yang ditampilkan
interface DisplayUser {
  name: string;
  roles?: string[];
}

// Tipe data untuk item navigasi
interface NavItem {
  name: string;
  href?: string;
  children?: NavItem[];
}

export default function Navbar({ user, onLogout }: { user: DisplayUser | null; onLogout: () => void }) {
  const pathname = usePathname();

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/admin' },
    {
      name: 'Manajemen Akun',
      children: [
        { name: 'Pengguna', href: '/admin/users' },
        { name: 'Peran & Izin', href: '/admin/roles' },
      ],
    },
    {
      name: 'Katalog Produk',
      children: [
        { name: 'Data Produk', href: '/admin/products' },
        { name: 'Data Varietas', href: '/admin/varieties' },
        { name: 'Kelas Benih', href: '/admin/seed-classes' },
        { name: 'Jenis Tanaman', href: '/admin/plant-types' },
        { name: 'Bahan Aktif', href: '/admin/active-ingredients' },
      ],
    },
    {
      name: 'Produksi',
      children: [
        { name: 'Data Produksi', href: '/admin/productions' },
        { name: 'Manajemen Kantong', href: '/admin/bags' },
      ],
    },
    { name: 'Perusahaan', href: '/admin/companies' },
  ];
  
  return (
    <Disclosure as="nav" className="bg-white shadow-sm border-b border-gray-200/80 sticky top-0 z-40">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <img
                    className="h-8 w-auto"
                    src="/advanta-logo.png"
                    alt="Advanta Logo"
                  />
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) =>
                    item.href ? (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          pathname === item.href
                            ? 'border-emerald-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                          'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
                        )}
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <Menu as="div" key={item.name} className="relative inline-flex items-center">
                        <Menu.Button className="inline-flex items-center gap-x-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                          <span>{item.name}</span>
                          <ChevronDownIcon className="h-4 w-4" />
                        </Menu.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute top-full left-0 mt-2 w-48 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {item.children?.map((child) => (
                              <Menu.Item key={child.name}>
                                {({ active }) => (
                                  <Link
                                    href={child.href || '#'}
                                    className={classNames(
                                      active ? 'bg-gray-100' : '',
                                      'block px-4 py-2 text-sm text-gray-700'
                                    )}
                                  >
                                    {child.name}
                                  </Link>
                                )}
                              </Menu.Item>
                            ))}
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    )
                  )}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {/* Profile dropdown */}
                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                      <span className="sr-only">Open user menu</span>
                      <div className="flex items-center gap-2 px-3 py-1.5 border rounded-full hover:bg-gray-50 transition-colors">
                        <UserCircleIcon className="h-6 w-6 text-gray-500" />
                        <div className="text-left">
                            <p className="text-sm font-semibold text-gray-800">{user?.name || 'Admin'}</p>
                        </div>
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={onLogout}
                            className={classNames(
                              active ? 'bg-gray-100' : '',
                              'w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700'
                            )}
                          >
                            <PowerIcon className="h-4 w-4" />
                            <span>Keluar</span>
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>
          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                item.href ? (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    href={item.href}
                    className={classNames(
                      pathname === item.href
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800',
                      'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                    )}
                  >
                    {item.name}
                  </Disclosure.Button>
                ) : (
                  <div key={item.name} className="pl-3 pr-4 pt-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{item.name}</p>
                    {item.children?.map(child => (
                       <Disclosure.Button
                        key={child.name}
                        as={Link}
                        href={child.href || '#'}
                        className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                       >
                         {child.name}
                       </Disclosure.Button>
                    ))}
                  </div>
                )
              ))}
            </div>
            <div className="border-t border-gray-200 pb-3 pt-4">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <UserCircleIcon className="h-10 w-10 text-gray-500" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.roles?.join(', ')}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                 <Disclosure.Button
                  as="button"
                  onClick={onLogout}
                  className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                >
                  Keluar
                </Disclosure.Button>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}