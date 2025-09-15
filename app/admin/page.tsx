// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, logout } from '../utils/auth';
import type { User } from '@supabase/supabase-js';
import Navbar from './Navbar'; // Impor Navbar baru
import {
  UsersIcon,
  ArchiveBoxIcon,
  TagIcon,
  BeakerIcon,
  CircleStackIcon,
  BuildingOfficeIcon,
  CubeIcon,
  QrCodeIcon,
  WrenchScrewdriverIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// Tipe data untuk state di komponen ini
interface DisplayUser {
  name: string;
  roles?: string[];
}

// Tipe data untuk kartu dashboard
interface DashboardCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  link: string;
  count?: number;
  countLabel?: string;
}

const Card = ({ icon: Icon, title, description, link, count, countLabel }: DashboardCardProps) => (
  <Link href={link}>
    <div className="group flex flex-col justify-between h-full bg-white rounded-xl shadow-md border border-gray-200/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100 text-emerald-600 mb-4">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
        {typeof count !== 'undefined' && countLabel && (
          <div className="mt-4">
            <span className="text-2xl font-bold text-emerald-600">{count}</span>
            <span className="ml-2 text-sm text-gray-500">{countLabel}</span>
          </div>
        )}
      </div>
      <div className="bg-gray-50 rounded-b-xl px-6 py-3 mt-auto">
        <span className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-500 flex items-center gap-2">
          Kelola Data <ArrowRightIcon className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </div>
  </Link>
);

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DisplayUser | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profile: User | null = await getProfile();
        if (profile) {
          setUser({
            name: profile.user_metadata?.name || 'Admin',
            roles: profile.app_metadata?.roles || ['Superadmin'],
          });
        }
      } catch (err) {
        console.error('Gagal memuat profil:', err);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  const dashboardItems: DashboardCardProps[] = [
    { icon: UsersIcon, title: 'Manajemen Akun', description: 'Kelola pengguna dan peran akses.', link: '/admin/users' },
    { icon: ArchiveBoxIcon, title: 'Katalog Produk', description: 'Atur semua data master produk.', link: '/admin/products' },
    { icon: CircleStackIcon, title: 'Data Produksi', description: 'Lacak dan kelola batch produksi.', link: '/admin/productions' },
    { icon: QrCodeIcon, title: 'Manajemen Kantong', description: 'Lihat dan atur data kantong benih.', link: '/admin/bags' },
    { icon: BuildingOfficeIcon, title: 'Data Perusahaan', description: 'Informasi mengenai perusahaan.', link: '/admin/companies' },
    { icon: WrenchScrewdriverIcon, title: 'Data Master Lain', description: 'Varietas, kelas benih, dll.', link: '/admin/varieties' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main>
        <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
          {/* Header Dashboard */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-md text-gray-600">Selamat datang, <span className="font-semibold text-emerald-600">{user?.name || 'Admin'}</span>! Kelola semua data perusahaan dari sini.</p>
          </div>

          {/* Grid Kartu Dashboard */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardItems.map(item => (
              <Card key={item.title} {...item} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}