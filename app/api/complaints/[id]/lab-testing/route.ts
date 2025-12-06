// app/api/complaints/[id]/lab-testing/route.ts
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('complaint_lab_testing')
      .select('*')
      .eq('complaint_id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();

    const labTestingData = {
      complaint_id: id,
      technician_id: user?.id,
      
      // Market Sample
      market_sample_received_date: body.market_sample_received_date,
      market_germination_result_date: body.market_germination_result_date,
      market_vigour_result_date: body.market_vigour_result_date,
      market_germination_percent: body.market_germination_percent,
      market_vigour_percent: body.market_vigour_percent,
      market_physical_purity_percent: body.market_physical_purity_percent,
      market_mc_percent: body.market_mc_percent,
      market_genetic_purity_percent: body.market_genetic_purity_percent,
      market_result: body.market_result,
      
      // Guard Sample
      guard_sample_received_date: body.guard_sample_received_date,
      guard_germination_result_date: body.guard_germination_result_date,
      guard_vigour_result_date: body.guard_vigour_result_date,
      guard_germination_percent: body.guard_germination_percent,
      guard_vigour_percent: body.guard_vigour_percent,
      guard_physical_purity_percent: body.guard_physical_purity_percent,
      guard_mc_percent: body.guard_mc_percent,
      guard_genetic_purity_percent: body.guard_genetic_purity_percent,
      guard_result: body.guard_result,
      
      // Additional
      lab_technician_name: body.lab_technician_name,
      testing_method: body.testing_method,
      notes: body.notes,
      
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabase
      .from('complaint_lab_testing')
      .select('id')
      .eq('complaint_id', id)
      .single();

    let result;

    if (existing) {
      result = await supabase
        .from('complaint_lab_testing')
        .update(labTestingData)
        .eq('complaint_id', id);
    } else {
      result = await supabase
        .from('complaint_lab_testing')
        .insert(labTestingData);
    }

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, message: 'Lab testing berhasil disimpan' });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}