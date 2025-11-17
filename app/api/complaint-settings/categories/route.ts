// app/api/complaint-settings/categories/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const category = await request.json();

    // Validasi struktur kategori
    if (!category.name || !category.description) {
      return NextResponse.json(
        { error: 'Nama dan deskripsi kategori wajib diisi' },
        { status: 400 }
      );
    }

    // 1. Insert kategori utama (ID auto-increment dari sequence)
    const { data: insertedCategory, error: categoryError } = await supabase
      .from('complaint_categories')
      .insert({
        name: category.name,
        description: category.description,
        auto_assign_department: category.auto_assign_department || 'customer_service'
      })
      .select()
      .single();

    if (categoryError) {
      console.error('Error inserting category:', categoryError);
      return NextResponse.json({ error: categoryError.message }, { status: 500 });
    }

    const categoryId = insertedCategory.id;

    // 2. Insert sub-kategori jika ada
    if (category.subCategories && category.subCategories.length > 0) {
      for (let subIdx = 0; subIdx < category.subCategories.length; subIdx++) {
        const subCat = category.subCategories[subIdx];
        const subCatId = `${categoryId}-${subIdx + 1}`;
        
        const { data: insertedSubCat, error: subCatError } = await supabase
          .from('complaint_sub_categories')
          .insert({
            id: subCatId,
            category_id: categoryId,
            name: subCat.name
          })
          .select()
          .single();

        if (subCatError) {
          console.error('Error inserting sub-category:', subCatError);
          // Rollback kategori jika gagal
          await supabase.from('complaint_categories').delete().eq('id', categoryId);
          return NextResponse.json({ error: subCatError.message }, { status: 500 });
        }

        // 3. Insert case types jika ada
        if (subCat.caseTypes && subCat.caseTypes.length > 0) {
          const caseTypesData = subCat.caseTypes.map((caseType: any, caseIdx: number) => ({
            id: `${subCatId}-${caseIdx + 1}`,
            sub_category_id: subCatId,
            name: caseType.name
          }));

          const { error: caseTypesError } = await supabase
            .from('complaint_case_types')
            .insert(caseTypesData);

          if (caseTypesError) {
            console.error('Error inserting case types:', caseTypesError);
            // Rollback
            await supabase.from('complaint_sub_categories').delete().eq('category_id', categoryId);
            await supabase.from('complaint_categories').delete().eq('id', categoryId);
            return NextResponse.json({ error: caseTypesError.message }, { status: 500 });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { ...insertedCategory, subCategories: category.subCategories },
      message: 'Kategori berhasil disimpan'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}