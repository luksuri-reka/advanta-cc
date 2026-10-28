import { createClient } from '@/app/utils/supabase/server';
import { canUpdateReplacementShipment, validateReplacementShipment } from '@/app/utils/replacementShipment';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json({ error: 'ID komplain tidak valid' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('user_complaint_profiles')
      .select('complaint_permissions, is_active').eq('user_id', user.id).maybeSingle();
    if (!canUpdateReplacementShipment(user.app_metadata?.roles, profile)) {
      return NextResponse.json({ error: 'Anda tidak memiliki hak untuk memperbarui pengiriman' }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 });
    }
    const status = body?.replacement_shipment_status;
    const date = body?.replacement_shipped_date;
    const validationError = validateReplacementShipment(status, date);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    // The database trigger records the internal history in the same transaction.
    const { data, error } = await supabase.from('complaints').update({
      replacement_shipment_status: status,
      replacement_shipped_date: status === 'shipped' ? date : null,
      updated_at: new Date().toISOString(),
    }).eq('id', id).select('id, replacement_shipment_status, replacement_shipped_date, updated_at').maybeSingle();

    if (error) {
      console.error('Update replacement shipment error:', error);
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Anda tidak memiliki hak untuk memperbarui pengiriman' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Gagal menyimpan pengiriman benih pengganti' }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Komplain tidak ditemukan atau tidak dapat diakses' }, { status: 404 });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Replacement shipment API error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengiriman benih pengganti' }, { status: 500 });
  }
}
