// app/api/complaint-settings/categories/[id]/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoryId = parseInt(params.id); // Gunakan ID dari URL
    const category = await request.json();

    console.log('PUT Request:', { categoryId, categoryName: category.name });

    // Validasi
    if (!category.name || !category.description) {
      return NextResponse.json(
        { error: 'Nama dan deskripsi kategori wajib diisi' },
        { status: 400 }
      );
    }

    // 1. Update kategori utama
    const { error: categoryError } = await supabase
      .from('complaint_categories')
      .update({
        name: category.name,
        description: category.description,
        auto_assign_department: category.auto_assign_department || 'customer_service',
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId);

    if (categoryError) {
      console.error('Error updating category:', categoryError);
      return NextResponse.json({ error: categoryError.message }, { status: 500 });
    }

    // 2. Hapus semua sub-kategori lama beserta case types (cascade)
    const { data: existingSubCats } = await supabase
      .from('complaint_sub_categories')
      .select('id')
      .eq('category_id', categoryId);

    if (existingSubCats && existingSubCats.length > 0) {
      const subCatIds = existingSubCats.map(sub => sub.id);
      
      // Hapus case types dari sub-kategori ini
      await supabase
        .from('complaint_case_types')
        .delete()
        .in('sub_category_id', subCatIds);
    }

    // Hapus sub-kategori
    await supabase
      .from('complaint_sub_categories')
      .delete()
      .eq('category_id', categoryId);

    // 3. Insert sub-kategori baru
    if (category.subCategories && category.subCategories.length > 0) {
      for (let subIdx = 0; subIdx < category.subCategories.length; subIdx++) {
        const subCat = category.subCategories[subIdx];
        const subCatId = `${categoryId}-${subIdx + 1}`;
        
        const { error: subCatError } = await supabase
          .from('complaint_sub_categories')
          .insert({
            id: subCatId,
            category_id: categoryId,
            name: subCat.name
          });

        if (subCatError) {
          console.error('Error inserting sub-category:', subCatError);
          return NextResponse.json({ error: subCatError.message }, { status: 500 });
        }

        // 4. Insert case types
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
            return NextResponse.json({ error: caseTypesError.message }, { status: 500 });
          }
        }
      }
    }

    console.log('Category updated successfully:', categoryId);

    return NextResponse.json({
      success: true,
      message: 'Kategori berhasil diupdate'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoryId = params.id;

    // 1. Ambil semua sub-kategori dari kategori ini
    const { data: subCategories, error: subCatFetchError } = await supabase
      .from('complaint_sub_categories')
      .select('id')
      .eq('category_id', categoryId);

    if (subCatFetchError) {
      console.error('Error fetching sub-categories:', subCatFetchError);
      return NextResponse.json({ error: subCatFetchError.message }, { status: 500 });
    }

    // 2. Hapus case types dari semua sub-kategori
    if (subCategories && subCategories.length > 0) {
      const subCatIds = subCategories.map(sub => sub.id);
      
      const { error: caseTypesDeleteError } = await supabase
        .from('complaint_case_types')
        .delete()
        .in('sub_category_id', subCatIds);

      if (caseTypesDeleteError) {
        console.error('Error deleting case types:', caseTypesDeleteError);
        return NextResponse.json({ error: caseTypesDeleteError.message }, { status: 500 });
      }
    }

    // 3. Hapus sub-kategori
    const { error: subCatDeleteError } = await supabase
      .from('complaint_sub_categories')
      .delete()
      .eq('category_id', categoryId);

    if (subCatDeleteError) {
      console.error('Error deleting sub-categories:', subCatDeleteError);
      return NextResponse.json({ error: subCatDeleteError.message }, { status: 500 });
    }

    // 4. Hapus kategori utama
    const { error: categoryDeleteError } = await supabase
      .from('complaint_categories')
      .delete()
      .eq('id', categoryId);

    if (categoryDeleteError) {
      console.error('Error deleting category:', categoryDeleteError);
      return NextResponse.json({ error: categoryDeleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Kategori berhasil dihapus'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}