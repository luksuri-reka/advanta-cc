// app/admin/varietas/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import VarietyClient from './VarietyClient';

async function fetchVarieties() {
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
    .from('varietas')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) {
    console.error('Error fetching varieties:', error);
    return [];
  }
  
  return data;
}

export default async function VarietiesPage() {
  const varieties = await fetchVarieties();
  return <VarietyClient initialVarieties={varieties} />;
}