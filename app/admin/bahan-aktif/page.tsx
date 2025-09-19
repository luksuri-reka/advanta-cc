// app/admin/bahan-aktif/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import ActiveIngredientClient from './ActiveIngredientClient';

async function fetchActiveIngredients() {
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
    .from('bahan_aktif')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) {
    console.error('Error fetching active ingredients:', error);
    return [];
  }
  
  return data;
}

export default async function ActiveIngredientsPage() {
  const activeIngredients = await fetchActiveIngredients();
  return <ActiveIngredientClient initialActiveIngredients={activeIngredients} />;
}