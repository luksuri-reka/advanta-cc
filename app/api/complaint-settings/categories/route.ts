// app/api/complaint-settings/categories/route.ts - UPDATED for 3 Level Structure
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

const DEFAULT_CATEGORIES = [
  {
    id: '1',
    name: 'Masalah Pengiriman',
    description: 'Masalah terkait pengiriman dan distribusi produk',
    auto_assign_department: 'customer_service',
    subCategories: [
      {
        id: '1-1',
        name: 'Kerusakan pada Kemasan',
        caseTypes: [
          { id: '1-1-1', name: 'Kemasan Rusak' },
          { id: '1-1-2', name: 'Kemasan Kotor' },
          { id: '1-1-3', name: 'Kerusakan karena Forklift' },
          { id: '1-1-4', name: 'Serangan / Hewan Pengerat' },
          { id: '1-1-5', name: 'Kerusakan karena Tumpukan' },
          { id: '1-1-6', name: 'Kemasan Basah / Lembab' }
        ]
      },
      {
        id: '1-2',
        name: 'Masalah Pengiriman',
        caseTypes: [
          { id: '1-2-1', name: 'Dokumen Hilang / Salah' },
          { id: '1-2-2', name: 'Dikirim ke Alamat yang Salah' },
          { id: '1-2-3', name: 'Pengiriman Tidak Tepat Waktu' },
          { id: '1-2-4', name: 'Kinerja Sopir' },
          { id: '1-2-5', name: 'Kebocoran' },
          { id: '1-2-6', name: 'Kehilangan Sebagian / Seluruhnya saat Pengiriman' },
          { id: '1-2-7', name: 'Kesalahan Pihak Ketiga (vendor)' }
        ]
      },
      {
        id: '1-3',
        name: 'Kesalahan Produk / Jumlah Pengiriman',
        caseTypes: [
          { id: '1-3-1', name: 'Salah Lot' },
          { id: '1-3-2', name: 'Salah Jumlah' },
          { id: '1-3-3', name: 'Salah Ukuran' },
          { id: '1-3-4', name: 'Salah Varietas' }
        ]
      },
      {
        id: '1-4',
        name: 'Kondisi Pengiriman',
        caseTypes: [
          { id: '1-4-1', name: 'Metode Pengiriman Salah' },
          { id: '1-4-2', name: 'Pengiriman Tidak Dipersiapkan dengan Benar' },
          { id: '1-4-3', name: 'Kondisi dari Transportasi' }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Kualitas',
    description: 'Masalah terkait kualitas produk',
    auto_assign_department: 'quality_assurance',
    subCategories: [
      {
        id: '2-1',
        name: 'Masalah Pertumbuhan',
        caseTypes: [
          { id: '2-1-1', name: 'Rebah semai' },
          { id: '2-1-2', name: 'Pertumbuhan Lambat' },
          { id: '2-1-3', name: 'Perbedaan Penugian Pihak Ketiga' },
          { id: '2-1-4', name: 'Keseragaman Jelek' },
          { id: '2-1-5', name: 'Vigor Jelek' },
          { id: '2-1-6', name: 'Yang Tumbuh Terlalu Rendah / Sedikit' }
        ]
      },
      {
        id: '2-2',
        name: 'Faktor Fisiologis Lainnya',
        caseTypes: [
          { id: '2-2-1', name: 'Blind Plants' },
          { id: '2-2-2', name: 'Bibit Cacat' },
          { id: '2-2-3', name: 'Jack Plants' },
          { id: '2-2-4', name: 'Tidak Berkecambah' },
          { id: '2-2-5', name: 'Umur Simpan / Benih lama' }
        ]
      },
      {
        id: '2-3',
        name: 'Kemurnian Produk',
        caseTypes: [
          { id: '2-3-1', name: 'Tongkol' },
          { id: '2-3-2', name: 'Benda / Bahan Lain' },
          { id: '2-3-3', name: 'Ditemukan Tanaman Lainnya' },
          { id: '2-3-4', name: 'Benih Campuran' },
          { id: '2-3-5', name: 'Benih Diganti' },
          { id: '2-3-6', name: 'Batang' },
          { id: '2-3-7', name: 'Benih Gulma' }
        ]
      },
      {
        id: '2-4',
        name: 'Genetik',
        caseTypes: [
          { id: '2-4-1', name: 'Boiler' },
          { id: '2-4-2', name: 'Perbedaan Penugian oleh Pihak Ketiga' },
          { id: '2-4-3', name: 'Inbred' },
          { id: '2-4-4', name: 'Offtype' }
        ]
      },
      {
        id: '2-5',
        name: 'Treatment Benih',
        caseTypes: [
          { id: '2-5-1', name: 'Menggumpal' },
          { id: '2-5-2', name: 'Treatment Lengket' },
          { id: '2-5-3', name: 'Cakupan Treatment' }
        ]
      },
      {
        id: '2-6',
        name: 'Penampilan Produk',
        caseTypes: [
          { id: '2-6-1', name: 'Berdebu' },
          { id: '2-6-2', name: 'Invert matter' },
          { id: '2-6-3', name: 'Rusak oleh Serangga' },
          { id: '2-6-4', name: 'Lembab' },
          { id: '2-6-5', name: 'Berjamir / Pudar / Kotor' },
          { id: '2-6-6', name: 'Sclerotinia' },
          { id: '2-6-7', name: 'Benih tidak Seragam' },
          { id: '2-6-8', name: 'Benih Pecah / Retak / Patah' }
        ]
      },
      {
        id: '2-7',
        name: 'Kesehatan Benih',
        caseTypes: [
          { id: '2-7-1', name: 'Perbedaan Penugian oleh Pihak Ketiga' },
          { id: '2-7-2', name: 'Penyakit pada Tanaman' },
          { id: '2-7-3', name: 'Penyakit pada Benih' },
          { id: '2-7-4', name: 'Gejala Virus' }
        ]
      },
      {
        id: '2-8',
        name: 'Produk Kadaluarsa',
        caseTypes: [
          { id: '2-8-1', name: 'Produk Kadaluarsa' }
        ]
      },
      {
        id: '2-9',
        name: 'Kerusakan karena Herbisida',
        caseTypes: [
          { id: '2-9-1', name: 'Tanaman Terkena Herbisida' }
        ]
      },
      {
        id: '2-10',
        name: 'Performa Produk',
        caseTypes: [
          { id: '2-10-1', name: 'Tanaman Tumbuh di Lapang' }
        ]
      }
    ]
  }
];

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('complaint_system_settings')
      .select('setting_value')
      .eq('setting_key', 'complaint_categories')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data?.setting_value || DEFAULT_CATEGORIES
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

    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Categories must be an array' },
        { status: 400 }
      );
    }

    // Validate 3-level structure
    for (const category of body) {
      if (!category.id || !category.name || !category.description) {
        return NextResponse.json(
          { error: 'Invalid category format: missing required fields (id, name, description)' },
          { status: 400 }
        );
      }

      if (!Array.isArray(category.subCategories)) {
        return NextResponse.json(
          { error: `Category "${category.name}" must have subCategories array` },
          { status: 400 }
        );
      }

      for (const subCat of category.subCategories) {
        if (!subCat.id || !subCat.name || !Array.isArray(subCat.caseTypes)) {
          return NextResponse.json(
            { error: `Invalid sub-category format in "${category.name}"` },
            { status: 400 }
          );
        }

        for (const caseType of subCat.caseTypes) {
          if (!caseType.id || !caseType.name) {
            return NextResponse.json(
              { error: `Invalid case type format in "${subCat.name}"` },
              { status: 400 }
            );
          }
        }
      }
    }

    const { data, error } = await supabase
      .from('complaint_system_settings')
      .upsert({
        setting_key: 'complaint_categories',
        setting_value: body,
        description: 'Complaint categories with 3-level hierarchy (Category → Sub-Category → Case Type)',
        updated_at: new Date().toISOString(),
        updated_by: user.id
      }, {
        onConflict: 'setting_key'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data.setting_value,
      message: 'Categories saved successfully'
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}