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

    const replacementQty = body.replacement_qty === '' || body.replacement_qty == null
      ? null
      : Number(body.replacement_qty);
    const replacementHybrid = typeof body.replacement_hybrid === 'string'
      ? body.replacement_hybrid.trim()
      : '';
    const hasReplacement = replacementQty !== null || Boolean(
      replacementHybrid
      || body.replacement_product_id
      || body.replacement_destination_type
      || body.replacement_distributor_id
      || body.replacement_destination_name
      || body.replacement_destination_address
    );
    const replacementRequired = body.observation_result === 'Valid';

    if (replacementQty !== null && (!Number.isFinite(replacementQty) || replacementQty <= 0)) {
      return NextResponse.json({ error: 'Qty penggantian harus lebih dari 0 Kg' }, { status: 400 });
    }

    if ((replacementRequired || hasReplacement) && (replacementQty === null || !replacementHybrid || !body.replacement_product_id)) {
      return NextResponse.json({ error: 'Qty dan produk dari daftar master wajib diisi' }, { status: 400 });
    }

    if (replacementRequired || hasReplacement) {
      if (!['distributor', 'retailer'].includes(body.replacement_destination_type)) {
        return NextResponse.json({ error: 'Pilih tujuan penggantian melalui distributor atau retailer/kios' }, { status: 400 });
      }

      if (!body.replacement_destination_name?.trim() || !body.replacement_destination_address?.trim()) {
        return NextResponse.json({ error: 'Nama dan alamat tujuan penggantian wajib diisi' }, { status: 400 });
      }

      if (body.replacement_destination_type === 'distributor' && !body.replacement_distributor_id) {
        return NextResponse.json({ error: 'Distributor penggantian wajib dipilih' }, { status: 400 });
      }
    }

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
      evidence_files: body.evidence_files,

      // Field Replacement & Result
      replacement_qty: replacementQty,
      replacement_product_id: body.replacement_product_id ? Number(body.replacement_product_id) : null,
      replacement_hybrid: replacementHybrid || null,
      replacement_destination_type: body.replacement_destination_type || null,
      replacement_distributor_id: body.replacement_destination_type === 'distributor' && body.replacement_distributor_id
        ? Number(body.replacement_distributor_id)
        : null,
      replacement_destination_name: body.replacement_destination_name?.trim() || null,
      replacement_destination_address: body.replacement_destination_address?.trim() || null,
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