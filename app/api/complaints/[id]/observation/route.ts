// app/api/complaints/[id]/observation/route.ts
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
      .from('complaint_observations')
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

    const observationData = {
      complaint_id: id,
      observer_id: user?.id,
      
      // --- FIELD BARU (Data Penanaman & Pembelian) ---
      planting_date: body.planting_date,
      label_expired_date: body.label_expired_date,
      purchase_date: body.purchase_date,
      purchase_place: body.purchase_place,
      purchase_address: body.purchase_address,
      // ----------------------------------------------

      // Field Observer
      observer_name: body.observer_name,
      observer_position: body.observer_position,
      observation_date: body.observation_date,
      
      // Field Germinasi
      is_germination_issue: body.is_germination_issue,
      germination_below_85: body.germination_below_85,
      seed_not_found: body.seed_not_found,
      seed_not_grow_soil: body.seed_not_grow_soil,
      seed_damaged_chemical: body.seed_damaged_chemical,
      seed_damaged_insect: body.seed_damaged_insect,
      fungal_infection: body.fungal_infection,
      seed_excavated: body.seed_excavated,
      additional_seed_treatment: body.additional_seed_treatment,
      seed_soaking: body.seed_soaking,
      planting_depth_over_7cm: body.planting_depth_over_7cm,
      
      // Field Bukti
      has_purchase_proof: body.has_purchase_proof,
      has_packaging_evidence: body.has_packaging_evidence,
      
      // Field Replacement & Result
      replacement_qty: body.replacement_qty ? parseInt(body.replacement_qty) : null,
      replacement_hybrid: body.replacement_hybrid,
      observation_result: body.observation_result,
      general_notes: body.general_notes,
      
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabase
      .from('complaint_observations')
      .select('id')
      .eq('complaint_id', id)
      .single();

    let result;

    if (existing) {
      result = await supabase
        .from('complaint_observations')
        .update(observationData)
        .eq('complaint_id', id);
    } else {
      result = await supabase
        .from('complaint_observations')
        .insert(observationData);
    }

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, message: 'Data saved' });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}