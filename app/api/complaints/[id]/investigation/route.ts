// app/api/complaints/[id]/investigation/route.ts
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
      .from('complaint_investigations')
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

    const investigationData = {
      complaint_id: id,
      investigator_id: user?.id,
      investigator_name: body.investigator_name,
      investigator_position: body.investigator_position,
      investigation_date: body.investigation_date,
      initiator_complaint: body.initiator_complaint,
      complaint_location: body.complaint_location,
      farmer_name: body.farmer_name,
      complaint_type: body.complaint_type,
      seed_variety: body.seed_variety,
      lot_number_check: body.lot_number, // ← KEY CHANGE
      problematic_quantity_kg: body.problematic_quantity_kg,
      planting_date: body.planting_date,
      label_expired_date: body.label_expired_date,
      purchase_date: body.purchase_date,
      purchase_place: body.purchase_place,
      purchase_address: body.purchase_address,
      cause_category: body.cause_category,
      packaging_damage: body.packaging_damage,
      product_error: body.product_error,
      delivery_issue: body.delivery_issue,
      delivery_condition: body.delivery_condition,
      growth_issue: body.growth_issue,
      seed_treatment_issue: body.seed_treatment_issue,
      product_appearance: body.product_appearance,
      product_purity: body.product_purity,
      seed_health: body.seed_health,
      physiological_factors: body.physiological_factors,
      genetic_issue: body.genetic_issue,
      herbicide_damage: body.herbicide_damage,
      product_performance: body.product_performance,
      product_expired: body.product_expired,
      problem_description: body.problem_description,
      action_taken: body.action_taken,
      pest_info: body.pest_info,
      agronomic_aspect: body.agronomic_aspect,
      environment_info: body.environment_info,
      plant_performance_phase: body.plant_performance_phase,
      investigation_conclusion: body.investigation_conclusion,
      root_cause_determination: body.root_cause_determination,
      long_term_corrective_action: body.long_term_corrective_action,
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabase
      .from('complaint_investigations')
      .select('id')
      .eq('complaint_id', id)
      .single();

    let result;

    if (existing) {
      result = await supabase
        .from('complaint_investigations')
        .update(investigationData)
        .eq('complaint_id', id);
    } else {
      result = await supabase
        .from('complaint_investigations')
        .insert(investigationData);
    }

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, message: 'Investigasi berhasil disimpan' });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}