// app/api/complaint-settings/categories/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch categories from complaint_system_settings table
    const { data, error } = await supabase
      .from('complaint_system_settings')
      .select('setting_value')
      .eq('setting_key', 'complaint_categories')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Default categories if not found
    const defaultCategories = [
      {
        id: '1',
        name: 'Cacat Produk',
        description: 'Masalah terkait kualitas atau cacat fisik produk',
        default_priority: 'high',
        auto_assign_department: 'quality_assurance'
      },
      {
        id: '2',
        name: 'Masalah Kemasan',
        description: 'Kemasan rusak atau tidak sesuai',
        default_priority: 'medium',
        auto_assign_department: 'quality_assurance'
      },
      {
        id: '3',
        name: 'Masalah Performa',
        description: 'Performa produk tidak sesuai ekspektasi',
        default_priority: 'high',
        auto_assign_department: 'technical'
      },
      {
        id: '4',
        name: 'Pengiriman',
        description: 'Masalah terkait pengiriman produk',
        default_priority: 'medium',
        auto_assign_department: 'customer_service'
      },
      {
        id: '5',
        name: 'Layanan Pelanggan',
        description: 'Masalah terkait layanan customer service',
        default_priority: 'low',
        auto_assign_department: 'customer_service'
      }
    ];

    return NextResponse.json({
      success: true,
      data: data?.setting_value || defaultCategories
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate that body is an array
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Categories must be an array' },
        { status: 400 }
      );
    }

    // Validate each category
    for (const category of body) {
      if (!category.id || !category.name || !category.description) {
        return NextResponse.json(
          { error: 'Invalid category format' },
          { status: 400 }
        );
      }
    }

    // Upsert categories
    const { data, error } = await supabase
      .from('complaint_system_settings')
      .upsert({
        setting_key: 'complaint_categories',
        setting_value: body,
        description: 'Complaint categories configuration',
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