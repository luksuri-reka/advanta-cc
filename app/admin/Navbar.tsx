// app/admin/Navbar.tsx
'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon, 
  PowerIcon,
  BellIcon,
  MagnifyingGlassIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  HomeIcon,
  Squares2X2Icon,
  ChartBarIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface DisplayUser {
  name: string;
  roles?: string[];
}

interface NavItem {
  name: string;
  href?: string;
  icon?: React.ElementType;
  children?: NavItem[];
  badge?: string;
}

export default function Navbar({ user, onLogout }: { user: DisplayUser | null; onLogout: () => void }) {
  const pathname = usePathname();
  const [notificationCount] = useState(3);

  // Simplified navigation dengan grouping yang lebih strategic
  const navigation: NavItem[] = [
    { 
      name: 'Dashboard', 
      href: '/admin',
      icon: HomeIcon
    },
    {
      name: 'Manajemen',
      icon: Squares2X2Icon,
      children: [
        { name: 'Pengguna & Akun', href: '/admin/users' },
        { name: 'Peran & Izin', href: '/admin/roles' },
        { name: 'Data Produk', href: '/admin/products' },
        { name: 'Data Produksi', href: '/admin/productions' },
        { name: 'Manajemen Kantong', href: '/admin/bags' },
        { name: 'Generate QR Code', href: '/admin/qr-bags' },
      ],
    },
    {
      name: 'Master Data',
      icon: ChartBarIcon,
      children: [
        { name: 'Jenis Tanaman', href: '/admin/jenis-tanaman' },
        { name: 'Kelas Benih', href: '/admin/kelas-benih' },
        { name: 'Varietas', href: '/admin/varietas' },
        { name: 'Bahan Aktif', href: '/admin/bahan-aktif' },
        { name: 'Data Perusahaan', href: '/admin/companies' },
      ],
    },
  ];
  
  return (
    <Disclosure as="nav" className="bg-white/95 backdrop-blur-2xl shadow-xl border-b border-gray-200/30 sticky top-0 z-50">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 justify-between items-center">
              
              {/* Logo & Brand - Enhanced */}
              <div className="flex items-center">
                <Link href="/admin" className="flex flex-shrink-0 items-center group">
                  <div className="relative">
                    <img
                      className="h-8 w-auto drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
                      src="/advanta-logo.png"
                      alt="Advanta Logo"
                    />
                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="ml-3 hidden lg:block">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-emerald-800 bg-clip-text text-transparent">
                        Admin Console
                      </span>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 rounded-full text-xs font-bold text-emerald-800">
                        <ShieldCheckIcon className="w-3 h-3" />
                        <span>SECURE</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Advanta Seeds Indonesia</p>
                  </div>
                </Link>
                
                {/* Simplified Desktop Navigation */}
                <div className="hidden xl:ml-8 xl:flex xl:items-center xl:space-x-2">
                  {navigation.map((item) =>
                    item.href ? (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          pathname === item.href
                            ? 'bg-emerald-50 text-emerald-700 shadow-md'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                          'relative inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-300 rounded-xl group'
                        )}
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                            {item.badge}
                          </span>
                        )}
                        {pathname === item.href && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-emerald-500 rounded-full"></div>
                        )}
                      </Link>
                    ) : (
                      <Menu as="div" key={item.name} className="relative">
                        <Menu.Button className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-300 rounded-xl group">
                          {item.icon && <item.icon className="h-4 w-4" />}
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                              {item.badge}
                            </span>
                          )}
                          <ChevronDownIcon className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
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
                          <Menu.Items className="absolute top-full left-0 mt-3 w-56 origin-top-left rounded-2xl bg-white/95 backdrop-blur-2xl py-3 shadow-2xl ring-1 ring-black/5 focus:outline-none border border-gray-200/50">
                            <div className="px-4 py-2 border-b border-gray-100/80">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                {item.icon && <item.icon className="h-3 w-3" />}
                                {item.name}
                              </p>
                            </div>
                            <div className="py-1">
                              {item.children?.map((child) => (
                                <Menu.Item key={child.name}>
                                  {({ active }) => (
                                    <Link
                                      href={child.href || '#'}
                                      className={classNames(
                                        active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700',
                                        'block px-4 py-3 text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200 mx-2 rounded-xl'
                                      )}
                                    >
                                      {child.name}
                                    </Link>
                                  )}
                                </Menu.Item>
                              ))}
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    )
                  )}
                </div>
              </div>

              {/* Right Actions - Optimized */}
              <div className="flex items-center space-x-2">

                {/* Compact Profile Menu */}
                <Menu as="div" className="relative">
                  <div>
                    <Menu.Button className="flex items-center gap-2 rounded-xl bg-white border border-gray-200/50 px-3 py-2 text-sm hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 group">
                      <div className="h-7 w-7 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:shadow-emerald-500/25 transition-shadow">
                        {user?.name?.charAt(0) || 'A'}
                      </div>
                      <div className="text-left hidden sm:block">
                        <p className="font-semibold text-gray-900 text-sm">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-gray-500">{user?.roles?.[0] || 'Administrator'}</p>
                      </div>
                      <ChevronDownIcon className="h-3 w-3 text-gray-400 group-hover:rotate-180 transition-transform duration-200" />
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
                    <Menu.Items className="absolute right-0 z-10 mt-3 w-52 origin-top-right rounded-2xl bg-white/95 backdrop-blur-2xl py-3 shadow-2xl ring-1 ring-black/5 focus:outline-none border border-gray-200/50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                            {user?.name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Administrator'}</p>
                            <p className="text-xs text-gray-500">{user?.roles?.join(', ') || 'Superadmin'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin/profile"
                              className={classNames(
                                active ? 'bg-gray-50' : '',
                                'flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200'
                              )}
                            >
                              <UserCircleIcon className="h-4 w-4" />
                              <span>Profil Saya</span>
                            </Link>
                          )}
                        </Menu.Item>
                        
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin/settings"
                              className={classNames(
                                active ? 'bg-gray-50' : '',
                                'flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200'
                              )}
                            >
                              <CogIcon className="h-4 w-4" />
                              <span>Pengaturan</span>
                            </Link>
                          )}
                        </Menu.Item>
                        
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin/help"
                              className={classNames(
                                active ? 'bg-gray-50' : '',
                                'flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200'
                              )}
                            >
                              <QuestionMarkCircleIcon className="h-4 w-4" />
                              <span>Bantuan</span>
                            </Link>
                          )}
                        </Menu.Item>
                      </div>
                      
                      <div className="border-t border-gray-100 mt-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={onLogout}
                              className={classNames(
                                active ? 'bg-red-50 text-red-700' : 'text-gray-700',
                                'w-full text-left flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-50 hover:text-red-700 transition-colors duration-200'
                              )}
                            >
                              <PowerIcon className="h-4 w-4" />
                              <span>Keluar</span>
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>

                {/* Mobile Menu Button */}
                <div className="xl:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-2xl p-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500/20 transition-all duration-300">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-5 w-5" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Mobile Menu Panel */}
          <Disclosure.Panel className="xl:hidden border-t border-gray-200/50">
            <div className="bg-white/95 backdrop-blur-2xl">
              {/* Mobile Navigation */}
              <div className="px-4 py-4 space-y-2">
                {navigation.map((item) => (
                  item.href ? (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? 'bg-emerald-50 text-emerald-700 shadow-md'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'flex items-center gap-3 py-3 px-4 text-sm font-medium rounded-2xl transition-all duration-200'
                      )}
                    >
                      {item.icon && <item.icon className="h-5 w-5" />}
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Disclosure.Button>
                  ) : (
                    <div key={item.name} className="py-2">
                      <div className="flex items-center gap-3 px-4 py-2 mb-2">
                        {item.icon && <item.icon className="h-5 w-5 text-gray-500" />}
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">{item.name}</p>
                        {item.badge && (
                          <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="ml-12 space-y-1">
                        {item.children?.map(child => (
                          <Disclosure.Button
                            key={child.name}
                            as={Link}
                            href={child.href || '#'}
                            className="block rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200"
                          >
                            {child.name}
                          </Disclosure.Button>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}