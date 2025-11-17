// app/api/public/complaint-categories/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // TIDAK PERLU AUTH CHECK - ini endpoint public untuk form customer

    // Ambil semua kategori dengan sub-kategori dan case types
    const { data: categories, error: catError } = await supabase
      .from('complaint_categories')
      .select('*')
      .order('id', { ascending: true });

    if (catError) {
      console.error('Error fetching categories:', catError);
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }

    // Untuk setiap kategori, ambil sub-kategorinya
    const categoriesWithSubs = await Promise.all(
      (categories || []).map(async (cat) => {
        const { data: subCategories, error: subError } = await supabase
          .from('complaint_sub_categories')
          .select('*')
          .eq('category_id', cat.id)
          .order('id', { ascending: true });

        if (subError) {
          console.error('Error fetching sub-categories:', subError);
          return { ...cat, subCategories: [] };
        }

        // Untuk setiap sub-kategori, ambil case types
        const subCategoriesWithCaseTypes = await Promise.all(
          (subCategories || []).map(async (sub) => {
            const { data: caseTypes, error: caseError } = await supabase
              .from('complaint_case_types')
              .select('*')
              .eq('sub_category_id', sub.id)
              .order('id', { ascending: true });

            if (caseError) {
              console.error('Error fetching case types:', caseError);
              return { ...sub, caseTypes: [] };
            }

            return {
              ...sub,
              caseTypes: caseTypes || []
            };
          })
        );

        return {
          ...cat,
          subCategories: subCategoriesWithCaseTypes
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: categoriesWithSubs
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}