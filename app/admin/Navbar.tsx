// app/admin/Navbar.tsx - With Dark Mode Support
'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon, 
  PowerIcon,
  BellIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  HomeIcon,
  Squares2X2Icon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ChartBarSquareIcon,
  CheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useComplaintNotifications } from './hooks/useComplaintNotifications';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface DisplayUser {
  name: string;
  roles?: string[];
  complaint_permissions?: Record<string, boolean>;
}

interface NavItem {
  name: string;
  href?: string;
  icon?: React.ElementType;
  children?: NavItem[];
  badge?: number;
  requiresPermission?: string;
}

export default function Navbar({ user, onLogout }: { user: DisplayUser | null; onLogout: () => void }) {
  const pathname = usePathname();

  const hasComplaintPermission = (permission: string) => {
    if (user?.roles?.includes('Superadmin') || user?.roles?.includes('superadmin')) {
      return true;
    }
    return user?.complaint_permissions?.[permission] === true;
  };

  const { stats, markAllAsRead } = useComplaintNotifications(hasComplaintPermission('canViewComplaints'));
  
  const totalNotifications = stats.unreadCount;
  const customerCareBadge = stats.unreadCount > 0 ? stats.unreadCount : undefined;

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
      ],
    },
    {
      name: 'Customer Care',
      icon: ChatBubbleLeftRightIcon,
      badge: customerCareBadge,
      children: [
        { 
          name: 'Dashboard Komplain', 
          href: '/admin/complaints', 
          icon: ExclamationTriangleIcon,
          requiresPermission: 'canViewComplaints',
          badge: stats.unreadCount > 0 ? stats.unreadCount : undefined
        },
        { 
          name: 'Survey Analytics', 
          href: '/admin/surveys', 
          icon: DocumentTextIcon,
          requiresPermission: 'canViewComplaints'
        },
        { 
          name: 'Analytics & Reports', 
          href: '/admin/analytics', 
          icon: ChartBarSquareIcon,
          requiresPermission: 'canViewComplaintAnalytics'
        },
        { 
          name: 'Complaint Team', 
          href: '/admin/complaint-users', 
          icon: UserGroupIcon,
          requiresPermission: 'canManageComplaintUsers'
        },
        { 
          name: 'Pengaturan Komplain', 
          href: '/admin/settings/complaints', 
          icon: CogIcon,
          requiresPermission: 'canConfigureComplaintSystem'
        }
      ].filter(item => !item.requiresPermission || hasComplaintPermission(item.requiresPermission)),
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
    <Disclosure as="nav" className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-lg border-b border-gray-200/50 dark:border-slate-700/50 sticky top-0 z-50">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
            <div className="flex h-16 lg:h-20 justify-between items-center">
              
              {/* Logo & Brand */}
              <div className="flex items-center min-w-0 flex-shrink">
                <Link href="/admin" className="flex items-center group gap-2 lg:gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img
                      className="h-6 sm:h-7 lg:h-8 w-auto drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
                      src="/advanta-logo.png"
                      alt="Advanta Logo"
                    />
                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      <span className="text-sm lg:text-base font-bold bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-slate-100 dark:to-emerald-400 bg-clip-text text-transparent truncate">
                        Admin Console
                      </span>
                      <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-xs font-bold text-emerald-800 dark:text-emerald-300 flex-shrink-0">
                        <ShieldCheckIcon className="w-2.5 h-2.5" />
                        <span className="hidden lg:inline">SECURE</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 hidden lg:block truncate">Advanta Seeds</p>
                  </div>
                </Link>
                
                {/* Desktop Navigation */}
                <div className="hidden xl:flex xl:items-center xl:space-x-1 xl:ml-6">
                  {navigation.map((item) =>
                    item.href ? (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          pathname === item.href
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                            : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100',
                          'relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-all duration-200 rounded-lg group'
                        )}
                      >
                        {item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
                        <span className="truncate">{item.name}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-sm flex-shrink-0 animate-pulse">
                            {item.badge}
                          </span>
                        )}
                        {pathname === item.href && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-emerald-500 dark:bg-emerald-400 rounded-full"></div>
                        )}
                      </Link>
                    ) : (
                      <Menu as="div" key={item.name} className="relative">
                        <Menu.Button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 transition-all duration-200 rounded-lg group">
                          {item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
                          <span className="truncate">{item.name}</span>
                          {item.badge && item.badge > 0 && (
                            <span className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-sm animate-pulse flex-shrink-0">
                              {item.badge}
                            </span>
                          )}
                          <ChevronDownIcon className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180 flex-shrink-0" />
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
                          <Menu.Items className="absolute top-full left-0 mt-2 w-56 origin-top-left rounded-xl bg-white dark:bg-slate-800 py-2 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none border border-gray-200 dark:border-slate-700 z-50">
                            <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-700">
                              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                {item.icon && <item.icon className="h-3 w-3" />}
                                <span className="truncate">{item.name}</span>
                                {item.badge && item.badge > 0 && (
                                  <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs px-1.5 py-0.5 rounded-full font-bold ml-auto flex-shrink-0">
                                    {item.badge} baru
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="py-1">
                              {item.children?.map((child) => (
                                <Menu.Item key={child.name}>
                                  {({ active }) => (
                                    <Link
                                      href={child.href || '#'}
                                      className={classNames(
                                        active ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-slate-300',
                                        'flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-150 mx-1.5 rounded-lg'
                                      )}
                                    >
                                      {child.icon && <child.icon className="h-4 w-4 flex-shrink-0" />}
                                      <span className="truncate flex-1">{child.name}</span>
                                      {child.badge && child.badge > 0 && (
                                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                                          {child.badge}
                                        </span>
                                      )}
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

              {/* Right Actions */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Notification Bell */}
                {hasComplaintPermission('canViewComplaints') && totalNotifications > 0 && (
                  <Menu as="div" className="relative">
                    <Menu.Button className="relative p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
                      <BellIcon className="h-5 w-5" />
                      <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                        {totalNotifications > 9 ? '9+' : totalNotifications}
                      </span>
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
                      <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl bg-white dark:bg-slate-800 py-2 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none border border-gray-200 dark:border-slate-700 z-50">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Notifikasi</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              {totalNotifications} komplain belum dibaca
                            </p>
                          </div>
                          {totalNotifications > 0 && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                markAllAsRead();
                              }}
                              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-semibold flex items-center gap-1"
                            >
                              <CheckIcon className="h-3 w-3" />
                              Tandai Semua
                            </button>
                          )}
                        </div>
                        
                        <div className="py-1 max-h-96 overflow-y-auto">
                          {stats.criticalCount > 0 && (
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  href="/admin/complaints?priority=critical"
                                  className={classNames(
                                    active ? 'bg-red-50 dark:bg-red-900/20' : '',
                                    'flex items-start gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                                  )}
                                >
                                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                      {stats.criticalCount} Komplain Kritis
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                      Memerlukan tindakan segera
                                    </p>
                                  </div>
                                  <span className="text-xs text-red-600 dark:text-red-400 font-bold flex-shrink-0">
                                    {stats.criticalCount}
                                  </span>
                                </Link>
                              )}
                            </Menu.Item>
                          )}
                          
                          {stats.pendingCount > 0 && (
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  href="/admin/complaints?status=submitted"
                                  className={classNames(
                                    active ? 'bg-yellow-50 dark:bg-yellow-900/20' : '',
                                    'flex items-start gap-3 px-4 py-3 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors'
                                  )}
                                >
                                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
                                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                      {stats.pendingCount} Komplain Pending
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                      Menunggu review
                                    </p>
                                  </div>
                                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-bold flex-shrink-0">
                                    {stats.pendingCount}
                                  </span>
                                </Link>
                              )}
                            </Menu.Item>
                          )}
                        </div>
                        
                        <div className="border-t border-gray-100 dark:border-slate-700 px-4 py-2">
                          <Link
                            href="/admin/complaints"
                            className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-500 dark:hover:text-emerald-300 flex items-center justify-center gap-1"
                          >
                            Lihat Semua Komplain
                          </Link>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                )}

                {/* Profile Menu */}
                <Menu as="div" className="relative flex-shrink-0">
                  <div>
                    <Menu.Button className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200/50 dark:border-slate-700/50 px-2 sm:px-3 py-1.5 sm:py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all duration-200 group max-w-[200px] sm:max-w-none">
                      <div className="h-6 w-6 sm:h-7 sm:w-7 bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg group-hover:shadow-emerald-500/25 dark:group-hover:shadow-emerald-400/25 transition-shadow flex-shrink-0">
                        {user?.name?.charAt(0) || 'A'}
                      </div>
                      <div className="text-left hidden sm:block min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-slate-100 text-xs sm:text-sm truncate">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                          {user?.roles?.[0] || 'Admin'}
                        </p>
                      </div>
                      <ChevronDownIcon className="h-3 w-3 text-gray-400 dark:text-slate-500 group-hover:rotate-180 transition-transform duration-200 flex-shrink-0 hidden sm:block" />
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
                    <Menu.Items className="absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-xl bg-white dark:bg-slate-800 py-2 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none border border-gray-200 dark:border-slate-700">
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-lg flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                            {user?.name?.charAt(0) || 'A'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{user?.name || 'Administrator'}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                              {user?.roles?.join(', ') || 'Superadmin'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin/profile"
                              className={classNames(
                                active ? 'bg-gray-50 dark:bg-slate-700' : '',
                                'flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-150'
                              )}
                            >
                              <UserCircleIcon className="h-4 w-4 flex-shrink-0" />
                              <span>Profil Saya</span>
                            </Link>
                          )}
                        </Menu.Item>
                        
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin/settings"
                              className={classNames(
                                active ? 'bg-gray-50 dark:bg-slate-700' : '',
                                'flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-150'
                              )}
                            >
                              <CogIcon className="h-4 w-4 flex-shrink-0" />
                              <span>Pengaturan</span>
                            </Link>
                          )}
                        </Menu.Item>
                        
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin/help"
                              className={classNames(
                                active ? 'bg-gray-50 dark:bg-slate-700' : '',
                                'flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-150'
                              )}
                            >
                              <QuestionMarkCircleIcon className="h-4 w-4 flex-shrink-0" />
                              <span>Bantuan</span>
                            </Link>
                          )}
                        </Menu.Item>
                      </div>
                      
                      <div className="border-t border-gray-100 dark:border-slate-700 mt-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={onLogout}
                              className={classNames(
                                active ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-slate-300',
                                'w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 transition-colors duration-150'
                              )}
                            >
                              <PowerIcon className="h-4 w-4 flex-shrink-0" />
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
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 transition-all duration-200">
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

          {/* Mobile Menu Panel */}
          <Disclosure.Panel className="xl:hidden border-t border-gray-200/50 dark:border-slate-700/50">
            <div className="bg-white dark:bg-slate-900 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="px-3 py-3 space-y-1">
                {navigation.map((item) => (
                  item.href ? (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100',
                        'flex items-center gap-2 py-2.5 px-3 text-sm font-medium rounded-lg transition-all duration-150'
                      )}
                    >
                      {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
                      <span className="flex-1">{item.name}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </Disclosure.Button>
                  ) : (
                    <div key={item.name} className="py-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
                        {item.icon && <item.icon className="h-5 w-5 text-gray-500 dark:text-slate-400 flex-shrink-0" />}
                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wide flex-1">{item.name}</p>
                        {item.badge && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 animate-pulse">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="ml-9 space-y-0.5">
                        {item.children?.map(child => (
                          <Disclosure.Button
                            key={child.name}
                            as={Link}
                            href={child.href || '#'}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors duration-150"
                          >
                            {child.icon && <child.icon className="h-4 w-4 flex-shrink-0" />}
                            <span className="flex-1">{child.name}</span>
                            {child.badge && child.badge > 0 && (
                              <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                                {child.badge}
                              </span>
                            )}
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