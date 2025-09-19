// app/admin/kelas-benih/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import SeedClassClient from './SeedClassClient';

async function fetchSeedClasses() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );
  
  const { data, error } = await supabase
    .from('kelas_benih')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) {
    console.error('Error fetching seed classes:', error);
    return [];
  }
  
  return data;
}

export default async function SeedClassesPage() {
  const seedClasses = await fetchSeedClasses();
  return <SeedClassClient initialSeedClasses={seedClasses} />;
}