// app/api/complaints/[id]/validity/route.ts
import { authorizeComplaint } from '@/app/admin/complaintAccess';
import {
  COMPLAINT_VALIDITY_LABELS,
  ComplaintValidity,
  isValidComplaintValidity,
  normalizeComplaintValidity,
} from '@/app/utils/complaintStatus';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/app/utils/supabase/service';

async function handleUpdateValidity(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await authorizeComplaint(id, 'canEditComplaints');
    if (access.denied) return access.denied;
    const { actor: user } = access;
    const supabase = createServiceClient();


    const body = await request.json();
    const requestedValidity = normalizeComplaintValidity(body.complaint_validity);
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

    if (!isValidComplaintValidity(requestedValidity)) {
      return NextResponse.json({
        error: `Validitas komplain tidak valid: ${body.complaint_validity}`
      }, { status: 400 });
    }

    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .select('id, complaint_number, complaint_validity, status')
      .eq('id', id)
      .single();

    if (complaintError || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const oldValidity = complaint.complaint_validity as ComplaintValidity | null;
    const oldLabel = oldValidity ? COMPLAINT_VALIDITY_LABELS[oldValidity] : 'Belum ditentukan';
    const newLabel = COMPLAINT_VALIDITY_LABELS[requestedValidity as ComplaintValidity];

    const { error: updateError } = await supabase
      .from('complaints')
      .update({
        complaint_validity: requestedValidity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Update validity error:', updateError);
      return NextResponse.json({ error: 'Failed to update validity' }, { status: 500 });
    }

    // Log riwayat internal ke complaint_responses
    const logMessage = `Validitas komplain diubah dari "${oldLabel}" menjadi "${newLabel}".${notes ? ` Catatan: ${notes}` : ''}`;
    await supabase
      .from('complaint_responses')
      .insert({
        complaint_id: parseInt(id),
        message: logMessage,
        admin_name: user.name,
        admin_id: user.id,
        is_internal: true
      });

    return NextResponse.json({
      success: true,
      message: 'Validitas komplain berhasil diperbarui',
      data: {
        old_validity: oldValidity,
        new_validity: requestedValidity
      }
    });

  } catch (error: any) {
    console.error('Update Validity API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const PATCH = handleUpdateValidity;
export const POST = handleUpdateValidity;
